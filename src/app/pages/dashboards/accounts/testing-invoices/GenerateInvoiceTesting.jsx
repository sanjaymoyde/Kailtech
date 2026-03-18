import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import toast from "react-hot-toast";

// ── helpers ──────────────────────────────────────────────────────────────────

function calcTotals({ items, potype, disctype, discnumber, witnessnumber, witnesstype,
  mobilisation, freight, samplehandling, sampleprep, cgstper, sgstper, igstper, sgst }) {

  const f = (v) => parseFloat(v) || 0;

  // subtotal: for Normal → sum(meter * rate), for Fix Cost → use first item rate directly
  let subtotal = 0;
  if (potype === "Normal") {
    items.forEach((item) => {
      const rate = f(item.rate);
      const meter = f(item.meter);
      subtotal += meter !== 0 ? meter * rate : rate;
    });
  } else {
    subtotal = f(items[0]?.rate);
  }

  // discount
  let discountamount = 0;
  if (disctype === "%") {
    discountamount = (subtotal / 100) * f(discnumber);
  } else {
    discountamount = f(discnumber);
  }

  // witness
  let witnesscharges = 0;
  if (witnesstype === "%") {
    witnesscharges = (subtotal / 100) * f(witnessnumber);
  } else {
    witnesscharges = f(witnessnumber);
  }

  const mob = f(mobilisation);
  const frt = f(freight);
  const sh = f(samplehandling);
  const sp = f(sampleprep);

  const subtotal2 = subtotal - discountamount + frt + mob + witnesscharges + sh + sp;

  let cgstamount = 0, sgstamount = 0, igstamount = 0;
  if (sgst == 1) {
    cgstamount = parseFloat(((subtotal2 / 100) * f(cgstper)).toFixed(2));
    sgstamount = parseFloat(((subtotal2 / 100) * f(sgstper)).toFixed(2));
  } else {
    igstamount = parseFloat(((subtotal2 / 100) * f(igstper)).toFixed(2));
  }

  const total = parseFloat((subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2));
  const finaltotal = Math.round(total);
  const roundoff = parseFloat((finaltotal - total).toFixed(2));

  return {
    subtotal: subtotal.toFixed(2),
    discount: discountamount.toFixed(2),
    witnesscharges: witnesscharges.toFixed(2),
    subtotal2: subtotal2.toFixed(2),
    cgstamount: cgstamount.toFixed(2),
    sgstamount: sgstamount.toFixed(2),
    igstamount: igstamount.toFixed(2),
    total: total.toFixed(2),
    roundoff: roundoff.toFixed(2),
    finaltotal: String(finaltotal),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function GenerateInvoiceTesting() {
  const navigate = useNavigate();

  // form state
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [potype, setPotype] = useState("Normal");
  const [poList, setPoList] = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardList, setInwardList] = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);
  const [items, setItems] = useState([]);
  const [brnnos, setBrnnos] = useState("");
  const [remark, setRemark] = useState("");
  const [sgst, setSgst] = useState(0);

  // totals / charges
  const [disctype, setDisctype] = useState("%");
  const [discnumber, setDiscnumber] = useState("0");
  const [witnesstype, setWitnesstype] = useState("%");
  const [witnessnumber, setWitnessnumber] = useState("0");
  const [mobilisation, setMobilisation] = useState("0");
  const [freight, setFreight] = useState("0");
  const [samplehandling, setSamplehandling] = useState("0");
  const [sampleprep, setSampleprep] = useState("0");
  const [cgstper, setCgstper] = useState("9");
  const [sgstper, setSgstper] = useState("9");
  const [igstper, setIgstper] = useState("18");
  const [totals, setTotals] = useState({
    subtotal: "0", discount: "0", witnesscharges: "0", subtotal2: "0",
    cgstamount: "0", sgstamount: "0", igstamount: "0",
    total: "0", roundoff: "0", finaltotal: "0",
  });

  const [submitting, setSubmitting] = useState(false);

  // recalculate whenever relevant fields change
  const recalc = useCallback((overrides = {}) => {
    const params = {
      items, potype, disctype, discnumber, witnessnumber, witnesstype,
      mobilisation, freight, samplehandling, sampleprep,
      cgstper, sgstper, igstper, sgst, ...overrides,
    };
    setTotals(calcTotals(params));
  }, [items, potype, disctype, discnumber, witnessnumber, witnesstype,
    mobilisation, freight, samplehandling, sampleprep, cgstper, sgstper, igstper, sgst]);

  useEffect(() => { recalc(); }, [recalc]);

  // load customers
  useEffect(() => {
    axios.get("/customers")
      .then((res) => setCustomers(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);
  }, []);

  // load PO list when customer or potype changes
  useEffect(() => {
    if (!customerid) { setPoList([]); setSelectedPo(""); setInwardList([]); setItems([]); return; }
    axios.get(`/po-details?customerid=${customerid}&potype=${potype}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setPoList(data);
        setSelectedPo("");
        setInwardList([]);
        setItems([]);
        setBrnnos("");
        // derive sgst from customer statecode
        const cust = customers.find((c) => String(c.id) === String(customerid));
        setSgst(cust?.statecode == 23 ? 1 : 0);
      })
      .catch(console.error);
  }, [customerid, potype, customers]);

  // load inward entries when PO selected
  useEffect(() => {
    if (!selectedPo || !customerid) { setInwardList([]); setItems([]); return; }
    axios.get(`/inward-entries?customerid=${customerid}&ponumber=${selectedPo}&potype=${potype}`)
      .then((res) => setInwardList(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);
  }, [selectedPo, customerid, potype]);

  // load items + BRN nos when inward selection changes
  useEffect(() => {
    if (!selectedInwards.length) { setItems([]); setBrnnos(""); return; }
    const params = new URLSearchParams({
      customerid, ponumber: selectedPo, potype,
      inwardid: selectedInwards.join(","),
    });
    axios.get(`/invoice-items?${params}`)
      .then((res) => setItems(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);

    axios.get(`/brn-nos?inwardid=${selectedInwards.join(",")}`)
      .then((res) => setBrnnos(res.data?.brnnos ?? res.data ?? ""))
      .catch(console.error);
  }, [selectedInwards, customerid, selectedPo, potype]);

  const handleInwardChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedInwards(selected);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post("/testing-invoices", {
        customerid, potype, ponumber: selectedPo,
        inwardids: selectedInwards,
        items, remark, brnnos,
        disctype, discnumber, witnesstype, witnessnumber,
        mobilisation, freight, samplehandling, sampleprep,
        cgstper, sgstper, igstper, sgst,
        ...totals,
      });
      toast.success("Invoice added");
      navigate("/dashboards/accounts/testing-invoices");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";
  const readonlyCls = `${inputCls} bg-gray-100 dark:bg-dark-700`;
  const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200";

  return (
    <Page title="Add Testing Invoice">
      <div className="px-(--margin-x) py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Inward Entry Form
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-dark-500 dark:hover:bg-dark-700"
          >
            &laquo; Back to Invoice List
          </button>
        </div>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Customer */}
            <div>
              <label className={labelCls}>Customer</label>
              <select value={customerid} onChange={(e) => setCustomerid(e.target.value)} className={inputCls} required>
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Bill Type */}
            <div>
              <label className={labelCls}>Bill Type</label>
              <select value={potype} onChange={(e) => setPotype(e.target.value)} className={inputCls} required>
                <option value="Normal">Normal</option>
                <option value="Fix Cost">Fix Cost</option>
              </select>
            </div>

            {/* PO Number */}
            {poList.length > 0 && (
              <div>
                <label className={labelCls}>PO Number</label>
                <select value={selectedPo} onChange={(e) => setSelectedPo(e.target.value)} className={inputCls}>
                  <option value="">Select PO</option>
                  {poList.map((po) => (
                    <option key={po.ponumber ?? po.id} value={po.ponumber ?? po.id}>
                      {po.ponumber ?? po.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Inward Entries (multi-select) */}
            {inwardList.length > 0 && (
              <div>
                <label className={labelCls}>Inward Entries (hold Ctrl/Cmd to select multiple)</label>
                <select
                  id="inwardid"
                  multiple
                  size={Math.min(inwardList.length, 8)}
                  onChange={handleInwardChange}
                  className={`${inputCls} min-h-[80px]`}
                >
                  {inwardList.map((iw) => (
                    <option key={iw.id} value={iw.id}>
                      {iw.label ?? iw.inwardno ?? iw.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-dark-700">
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Description</th>
                      {potype === "Normal" && (
                        <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Meters/Nos</th>
                      )}
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Rate</th>
                      {potype === "Normal" && (
                        <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Amount</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const amt = potype === "Normal"
                        ? ((parseFloat(item.meter) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)
                        : "";
                      return (
                        <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-800 dark:even:bg-dark-700">
                          <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                            <input type="text" value={item.description ?? ""} onChange={(e) => handleItemChange(i, "description", e.target.value)} className={inputCls} />
                          </td>
                          {potype === "Normal" && (
                            <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                              <input type="text" value={item.meter ?? ""} onChange={(e) => handleItemChange(i, "meter", e.target.value)} className={inputCls} style={{ minWidth: 80 }} />
                            </td>
                          )}
                          <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                            <input type="text" value={item.rate ?? ""} onChange={(e) => handleItemChange(i, "rate", e.target.value)} className={inputCls} style={{ minWidth: 80 }} />
                          </td>
                          {potype === "Normal" && (
                            <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                              <input type="text" readOnly value={amt} className={readonlyCls} style={{ minWidth: 80 }} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Charges section — shown once customer is selected */}
            {customerid && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelCls}>Subtotal</label>
                  <input type="text" readOnly value={totals.subtotal} className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Discount Type</label>
                  <select value={disctype} onChange={(e) => { setDisctype(e.target.value); recalc({ disctype: e.target.value }); }} className={inputCls}>
                    <option value="%">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Discount</label>
                  <input type="text" value={discnumber} onChange={(e) => { setDiscnumber(e.target.value); recalc({ discnumber: e.target.value }); }} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Witness Type</label>
                  <select value={witnesstype} onChange={(e) => { setWitnesstype(e.target.value); recalc({ witnesstype: e.target.value }); }} className={inputCls}>
                    <option value="%">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Witness Charges</label>
                  <input type="text" value={witnessnumber} onChange={(e) => { setWitnessnumber(e.target.value); recalc({ witnessnumber: e.target.value }); }} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mobilization Charges</label>
                  <input type="text" value={mobilisation} onChange={(e) => { setMobilisation(e.target.value); recalc({ mobilisation: e.target.value }); }} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Freight Charges</label>
                  <input type="text" value={freight} onChange={(e) => { setFreight(e.target.value); recalc({ freight: e.target.value }); }} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Sample Handling</label>
                  <input type="text" value={samplehandling} onChange={(e) => { setSamplehandling(e.target.value); recalc({ samplehandling: e.target.value }); }} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Sample Preparation</label>
                  <input type="text" value={sampleprep} onChange={(e) => { setSampleprep(e.target.value); recalc({ sampleprep: e.target.value }); }} className={inputCls} />
                </div>

                {/* Tax */}
                {sgst == 1 ? (
                  <>
                    <div>
                      <label className={labelCls}>CGST %</label>
                      <input type="text" value={cgstper} onChange={(e) => { setCgstper(e.target.value); recalc({ cgstper: e.target.value }); }} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>CGST Amount</label>
                      <input type="text" readOnly value={totals.cgstamount} className={readonlyCls} />
                    </div>
                    <div>
                      <label className={labelCls}>SGST %</label>
                      <input type="text" value={sgstper} onChange={(e) => { setSgstper(e.target.value); recalc({ sgstper: e.target.value }); }} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>SGST Amount</label>
                      <input type="text" readOnly value={totals.sgstamount} className={readonlyCls} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>IGST %</label>
                      <input type="text" value={igstper} onChange={(e) => { setIgstper(e.target.value); recalc({ igstper: e.target.value }); }} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>IGST Amount</label>
                      <input type="text" readOnly value={totals.igstamount} className={readonlyCls} />
                    </div>
                  </>
                )}

                <div>
                  <label className={labelCls}>Total</label>
                  <input type="text" readOnly value={totals.total} className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Round Off</label>
                  <input type="text" readOnly value={totals.roundoff} className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Final Total</label>
                  <input type="text" readOnly value={totals.finaltotal} className={readonlyCls} />
                </div>
              </div>
            )}

            {/* Remark */}
            <div>
              <label className={labelCls}>Remark</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>

            {/* BRN Nos (readonly) */}
            <div>
              <label className={labelCls}>BRN Nos.</label>
              <textarea
                readOnly
                value={brnnos}
                rows={3}
                className={readonlyCls}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Add Invoice"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
