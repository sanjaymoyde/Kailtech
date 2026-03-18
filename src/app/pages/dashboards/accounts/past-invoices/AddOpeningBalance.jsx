import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import toast from "react-hot-toast";

export default function AddOpeningBalance() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [date, setDate] = useState("");
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get("/customers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomers(data);
      })
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  // Mirrors sumamount() — recalculates a single row
  const recalcRow = useCallback((row) => {
    const f = (v) => parseFloat(v) || 0;
    const subtotal = f(row.subtotal);
    const discount = f(row.discount);
    const freight = f(row.freight);
    const mobilisation = f(row.mobilisation);
    const witnesscharges = f(row.witnesscharges);
    const samplehandling = f(row.samplehandling);
    const sampleprep = f(row.sampleprep);
    const sgst = row.sgst ?? 0;

    const subtotal2 = subtotal - discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep;

    let cgstamount = 0, sgstamount = 0, igstamount = 0;
    if (sgst === 1) {
      cgstamount = parseFloat(((subtotal2 / 100) * (f(row.cgstper) || 9)).toFixed(2));
      sgstamount = parseFloat(((subtotal2 / 100) * (f(row.sgstper) || 9)).toFixed(2));
    } else {
      igstamount = parseFloat(((subtotal2 / 100) * (f(row.igstper) || 18)).toFixed(2));
    }

    const total = parseFloat((subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2));
    const finaltotal = Math.round(total);
    const roundoff = parseFloat((finaltotal - total).toFixed(2));

    return {
      ...row,
      subtotal2: subtotal2.toFixed(2),
      cgstamount: cgstamount.toFixed(2),
      sgstamount: sgstamount.toFixed(2),
      igstamount: igstamount.toFixed(2),
      total: total.toFixed(2),
      roundoff: roundoff.toFixed(2),
      finaltotal: String(finaltotal),
    };
  }, []);

  const handleCustomerChange = async (e) => {
    const cid = e.target.value;
    setCustomerid(cid);
    setInvoiceRows([]);
    if (!cid) return;

    try {
      const res = await axios.get(`/invoices?customerid=${cid}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setInvoiceRows(
        data.map((inv) =>
          recalcRow({
            invoiceid: inv.id,
            invoiceno: inv.invoiceno ?? "",
            invoicedate: inv.invoicedate?.split("T")[0] ?? "",
            subtotal: inv.subtotal ?? "0",
            discount: inv.discount ?? "0",
            freight: inv.freight ?? "0",
            mobilisation: inv.mobilisation ?? "0",
            witnesscharges: inv.witnesscharges ?? "0",
            samplehandling: inv.samplehandling ?? "0",
            sampleprep: inv.sampleprep ?? "0",
            subtotal2: inv.subtotal2 ?? "0",
            cgstper: inv.cgstper ?? "9",
            cgstamount: inv.cgstamount ?? "0",
            sgstper: inv.sgstper ?? "9",
            sgstamount: inv.sgstamount ?? "0",
            igstper: inv.igstper ?? "18",
            igstamount: inv.igstamount ?? "0",
            total: inv.total ?? "0",
            roundoff: inv.roundoff ?? "0",
            finaltotal: inv.finaltotal ?? "0",
            sgst: inv.statecode == 23 ? 1 : 0,
          })
        )
      );
    } catch (err) {
      console.error("Failed to load invoices:", err);
    }
  };

  const handleRowChange = (index, field, value) => {
    setInvoiceRows((prev) => {
      const updated = [...prev];
      updated[index] = recalcRow({ ...updated[index], [field]: value });
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post("/opening-balances", { date, customerid, invoices: invoiceRows });
      toast.success("Opening balance added");
      navigate("/dashboards/accounts/past-invoices");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add opening balance");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";
  const readonlyCls = `${inputCls} bg-gray-100 dark:bg-dark-700`;

  const totalFinal = invoiceRows.reduce((sum, r) => sum + (parseFloat(r.finaltotal) || 0), 0);

  return (
    <Page title="Add Opening Balance">
      <div className="px-(--margin-x) py-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Add Opening Balance
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboards/accounts/past-invoices")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-dark-500 dark:hover:bg-dark-700"
          >
            &laquo; Back Opening Balances
          </button>
        </div>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            {/* Date */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200">
                Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                placeholder=""
                className={inputCls}
              />
            </div>

            {/* Customer */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200">
                Customer
              </label>
              <select
                value={customerid}
                onChange={handleCustomerChange}
                className={inputCls}
              >
                <option value="">Select</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice rows table — shown after customer selected */}
            {invoiceRows.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-dark-700">
                      {[
                        "Date", "Bill No", "Subtotal", "Discount",
                        "Freight", "Mobilization", "Witness Charges",
                        "Sample Handling", "Sample Prep",
                        "CGST/IGST", "SGST",
                        "Total", "Round Off", "Final Total",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border border-gray-300 p-2 text-left font-semibold dark:border-dark-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((row, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.invoicedate}
                            onFocus={(e) => (e.target.type = "date")}
                            onBlur={(e) => (e.target.type = "text")}
                            onChange={(e) => handleRowChange(i, "invoicedate", e.target.value)}
                            className={inputCls}
                            style={{ minWidth: 110 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.invoiceno} onChange={(e) => handleRowChange(i, "invoiceno", e.target.value)} className={inputCls} style={{ minWidth: 110 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.subtotal} onChange={(e) => handleRowChange(i, "subtotal", e.target.value)} className={inputCls} style={{ minWidth: 80 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.discount} onChange={(e) => handleRowChange(i, "discount", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.freight} onChange={(e) => handleRowChange(i, "freight", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.mobilisation} onChange={(e) => handleRowChange(i, "mobilisation", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.witnesscharges} onChange={(e) => handleRowChange(i, "witnesscharges", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.samplehandling} onChange={(e) => handleRowChange(i, "samplehandling", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" value={row.sampleprep} onChange={(e) => handleRowChange(i, "sampleprep", e.target.value)} className={inputCls} style={{ minWidth: 70 }} />
                        </td>
                        {/* CGST or IGST */}
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value={row.sgst === 1 ? row.cgstamount : row.igstamount} className={readonlyCls} style={{ minWidth: 70 }} />
                        </td>
                        {/* SGST (blank if IGST) */}
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value={row.sgst === 1 ? row.sgstamount : ""} className={readonlyCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value={row.total} className={readonlyCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input type="text" readOnly value={row.roundoff} className={readonlyCls} style={{ minWidth: 70 }} />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="number"
                            value={row.finaltotal}
                            onChange={(e) => handleRowChange(i, "finaltotal", e.target.value)}
                            className={inputCls}
                            style={{ minWidth: 80 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-dark-800">
                      <td colSpan={11} className="border border-gray-300 p-2 dark:border-dark-500" />
                      <th className="border border-gray-300 p-2 text-right dark:border-dark-500">Total</th>
                      <td colSpan={3} className="border border-gray-300 p-2 dark:border-dark-500">
                        <input type="text" readOnly value={totalFinal.toFixed(2)} className={readonlyCls} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
