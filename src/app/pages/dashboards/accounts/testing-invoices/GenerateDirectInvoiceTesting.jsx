import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import toast from "react-hot-toast";

// ── helpers ──────────────────────────────────────────────────────────────────

function calcTotals({ items, disctype, discnumber, witnessnumber, witnesstype,
  mobilisation, freight, samplehandling, sampleprep, cgstper, sgstper, igstper, sgst }) {

  const f = (v) => parseFloat(v) || 0;

  let subtotal = 0;
  items.forEach((item) => {
    subtotal += (f(item.qty) * f(item.rate));
  });

  let discountamount = 0;
  if (disctype === "%") {
    discountamount = (subtotal / 100) * f(discnumber);
  } else {
    discountamount = f(discnumber);
  }

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

export default function GenerateDirectInvoiceTesting() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [sgst, setSgst] = useState(0);

  // PO / inward
  const [poList, setPoList] = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardList, setInwardList] = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);

  // product selector
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  // items table
  const [items, setItems] = useState([]);
  const [remark, setRemark] = useState("");

  // charges
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

  const recalc = useCallback((overrides = {}) => {
    const params = {
      items, disctype, discnumber, witnessnumber, witnesstype,
      mobilisation, freight, samplehandling, sampleprep,
      cgstper, sgstper, igstper, sgst, ...overrides,
    };
    setTotals(calcTotals(params));
  }, [items, disctype, discnumber, witnessnumber, witnesstype,
    mobilisation, freight, samplehandling, sampleprep, cgstper, sgstper, igstper, sgst]);

  useEffect(() => { recalc(); }, [recalc]);

  // load customers
  useEffect(() => {
    axios.get("/customers")
      .then((res) => setCustomers(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);
  }, []);

  // load PO list when customer changes
  useEffect(() => {
    if (!customerid) {
      setPoList([]); setSelectedPo(""); setInwardList([]);
      setSelectedInwards([]); setItems([]); setProducts([]);
      return;
    }
    const cust = customers.find((c) => String(c.id) === String(customerid));
    setSgst(cust?.statecode == 23 ? 1 : 0);

    axios.get(`/po-details?customerid=${customerid}`)
      .then((res) => {
        setPoList(Array.isArray(res.data) ? res.data : res.data?.data || []);
        setSelectedPo("");
        setInwardList([]);
        setSelectedInwards([]);
        setItems([]);
      })
      .catch(console.error);
  }, [customerid, customers]);

  // load inward entries when PO selected
  useEffect(() => {
    if (!selectedPo || !customerid) { setInwardList([]); setSelectedInwards([]); return; }
    axios.get(`/inward-entries?customerid=${customerid}&ponumber=${selectedPo}`)
      .then((res) => setInwardList(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);
  }, [selectedPo, customerid]);

  // load products when inward selection changes
  useEffect(() => {
    if (!selectedInwards.length) { setProducts([]); return; }
    axios.get(`/products?customerid=${customerid}&ponumber=${selectedPo}&inwardid=${selectedInwards.join(",")}`)
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);
  }, [selectedInwards, customerid, selectedPo]);

  const handleInwardChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedInwards(selected);
    setItems([]);
    setSelectedProduct("");
  };

  const handleAddItem = () => {
    if (!selectedProduct) { toast.error("Select a product first"); return; }
    if (items.find((i) => String(i.packageid) === String(selectedProduct))) {
      toast.error("Item already added");
      return;
    }
    const product = products.find((p) => String(p.id ?? p.packageid) === String(selectedProduct));
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        packageid: product.id ?? product.packageid,
        description: product.name ?? product.description ?? "",
        qty: product.qty ?? "1",
        rate: product.rate ?? "0",
      },
    ]);
    setSelectedProduct("");
  };

  const handleRemoveItem = (packageid) => {
    setItems((prev) => prev.filter((i) => String(i.packageid) !== String(packageid)));
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
      await axios.post("/direct-testing-invoices", {
        customerid, ponumber: selectedPo,
        inwardids: selectedInwards,
        items, remark,
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
    <Page title="Add Advance Invoice">
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

            {/* Inward Entries */}
            {inwardList.length > 0 && (
              <div>
                <label className={labelCls}>Inward Entries (hold Ctrl/Cmd to select multiple)</label>
                <select
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

            {/* Product selector */}
            {products.length > 0 && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelCls}>Add Item</label>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className={inputCls}>
                    <option value="">Select Item</option>
                    {products.map((p) => (
                      <option key={p.id ?? p.packageid} value={p.id ?? p.packageid}>
                        {p.name ?? p.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-dark-700">
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Description</th>
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Qty</th>
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Rate</th>
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Amount</th>
                      <th className="border border-gray-300 p-2 dark:border-dark-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const amt = ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(2);
                      return (
                        <tr key={item.packageid} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-800 dark:even:bg-dark-700">
                          <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                            <input type="text" value={item.description ?? ""} onChange={(e) => handleItemChange(i, "description", e.target.value)} className={inputCls} />
                          </td>
                          <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                            <input type="text" value={item.qty ?? ""} onChange={(e) => handleItemChange(i, "qty", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                          </td>
                          <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                            <input type="text" value={item.rate ?? ""} onChange={(e) => handleItemChange(i, "rate", e.target.value)} className={inputCls} style={{ minWidth: 80 }} />
                          </td>
                          <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                            <input type="text" readOnly value={amt} className={readonlyCls} style={{ minWidth: 80 }} />
                          </td>
                          <td className="border border-gray-300 p-1.5 text-center dark:border-dark-500">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.packageid)}
                              className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Charges section */}
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
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} className={inputCls} />
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
