import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import toast from "react-hot-toast";

// FOC bill — all charges are zero and readonly; total is always 0

export default function CreateFocBill() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [sgst, setSgst] = useState(0);

  const [poList, setPoList] = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardList, setInwardList] = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);
  const [items, setItems] = useState([]);
  const [brnnos, setBrnnos] = useState("");
  const [remark, setRemark] = useState("");

  // tax percentages (editable) — amounts will always be 0 since subtotal2 = 0
  const [cgstper, setCgstper] = useState("9");
  const [sgstper, setSgstper] = useState("9");
  const [igstper, setIgstper] = useState("18");

  const [submitting, setSubmitting] = useState(false);

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
      setSelectedInwards([]); setItems([]); setBrnnos("");
      return;
    }
    const cust = customers.find((c) => String(c.id) === String(customerid));
    setSgst(cust?.statecode == 23 ? 1 : 0);

    axios.get(`/po-details?customerid=${customerid}`)
      .then((res) => {
        setPoList(Array.isArray(res.data) ? res.data : res.data?.data || []);
        setSelectedPo(""); setInwardList([]); setSelectedInwards([]); setItems([]); setBrnnos("");
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

  // load items + BRN nos when inward selection changes
  useEffect(() => {
    if (!selectedInwards.length) { setItems([]); setBrnnos(""); return; }
    const params = new URLSearchParams({
      customerid, ponumber: selectedPo,
      inwardid: selectedInwards.join(","),
    });
    axios.get(`/invoice-items?${params}`)
      .then((res) => setItems(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(console.error);

    axios.get(`/brn-nos?inwardid=${selectedInwards.join(",")}`)
      .then((res) => setBrnnos(res.data?.brnnos ?? res.data ?? ""))
      .catch(console.error);
  }, [selectedInwards, customerid, selectedPo]);

  const handleInwardChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedInwards(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post("/testing-invoices", {
        customerid, ponumber: selectedPo,
        inwardids: selectedInwards,
        items, remark, brnnos,
        foc: true,
        // all charges zero
        disctype: "%", discnumber: "0",
        witnesstype: "%", witnessnumber: "0",
        mobilisation: "0", freight: "0",
        samplehandling: "0", sampleprep: "0",
        cgstper, sgstper, igstper, sgst,
        subtotal: "0", discount: "0", witnesscharges: "0",
        subtotal2: "0", cgstamount: "0", sgstamount: "0",
        igstamount: "0", total: "0", roundoff: "0", finaltotal: "0",
      });
      toast.success("FOC invoice added");
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
    <Page title="Add FOC Testing Invoice">
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

            {/* Items table — rates forced to 0 and readonly */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-dark-700">
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Description</th>
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Meters/Nos</th>
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Rate</th>
                      <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-800 dark:even:bg-dark-700">
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value={item.description ?? ""} className={readonlyCls} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value={item.meter ?? ""} className={readonlyCls} style={{ minWidth: 80 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value="0" className={readonlyCls} style={{ minWidth: 80 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value="0.00" className={readonlyCls} style={{ minWidth: 80 }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals — all zero and readonly */}
            {customerid && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelCls}>Subtotal</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Discount</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Witness Charges</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Mobilization Charges</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Freight Charges</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Sample Handling</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Sample Preparation</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>

                {sgst == 1 ? (
                  <>
                    <div>
                      <label className={labelCls}>CGST %</label>
                      <input type="text" value={cgstper} onChange={(e) => setCgstper(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>CGST Amount</label>
                      <input type="text" readOnly value="0.00" className={readonlyCls} />
                    </div>
                    <div>
                      <label className={labelCls}>SGST %</label>
                      <input type="text" value={sgstper} onChange={(e) => setSgstper(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>SGST Amount</label>
                      <input type="text" readOnly value="0.00" className={readonlyCls} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>IGST %</label>
                      <input type="text" value={igstper} onChange={(e) => setIgstper(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>IGST Amount</label>
                      <input type="text" readOnly value="0.00" className={readonlyCls} />
                    </div>
                  </>
                )}

                <div>
                  <label className={labelCls}>Total</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Round Off</label>
                  <input type="text" readOnly value="0.00" className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>Final Total</label>
                  <input type="text" readOnly value="0" className={readonlyCls} />
                </div>
              </div>
            )}

            {/* Remark */}
            <div>
              <label className={labelCls}>Remark</label>
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} className={inputCls} />
            </div>

            {/* BRN Nos (readonly) */}
            <div>
              <label className={labelCls}>BRN Nos.</label>
              <textarea readOnly value={brnnos} rows={3} className={readonlyCls} />
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
