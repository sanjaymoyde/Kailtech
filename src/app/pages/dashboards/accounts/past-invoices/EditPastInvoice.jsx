import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import toast from "react-hot-toast";

export default function EditPastInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sgst, setSgst] = useState(0);

  const [form, setForm] = useState({
    invoicedate: "",
    invoiceno: "",
    statecode: "",
    subtotal: "0",
    discount: "0",
    freight: "0",
    mobilisation: "0",
    witnesscharges: "0",
    samplehandling: "0",
    sampleprep: "0",
    subtotal2: "0",
    cgstper: "9",
    cgstamount: "0",
    sgstper: "9",
    sgstamount: "0",
    igstper: "18",
    igstamount: "0",
    total: "0",
    roundoff: "0",
    finaltotal: "0",
  });

  useEffect(() => {
    axios
      .get(`/invoices/${id}`)
      .then((res) => {
        const d = res.data?.data ?? res.data;
        const isSgst = d.statecode == 23 ? 1 : 0;
        setSgst(isSgst);
        setForm({
          invoicedate: d.invoicedate?.split("T")[0] ?? d.invoicedate ?? "",
          invoiceno: d.invoiceno ?? "",
          statecode: d.statecode ?? "",
          subtotal: d.subtotal ?? "0",
          discount: d.discount ?? "0",
          freight: d.freight ?? "0",
          mobilisation: d.mobilisation ?? "0",
          witnesscharges: d.witnesscharges ?? "0",
          samplehandling: d.samplehandling ?? "0",
          sampleprep: d.sampleprep ?? "0",
          subtotal2: d.subtotal2 ?? "0",
          cgstper: d.cgstper ?? "9",
          cgstamount: d.cgstamount ?? "0",
          sgstper: d.sgstper ?? "9",
          sgstamount: d.sgstamount ?? "0",
          igstper: d.igstper ?? "18",
          igstamount: d.igstamount ?? "0",
          total: d.total ?? "0",
          roundoff: d.roundoff ?? "0",
          finaltotal: d.finaltotal ?? "0",
        });
      })
      .catch((err) => console.error("Failed to load invoice:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // Mirrors PHP sumamount() logic
  const recalculate = useCallback((updated) => {
    const f = parseFloat;
    const subtotal = f(updated.subtotal) || 0;
    const discount = f(updated.discount) || 0;
    const freight = f(updated.freight) || 0;
    const mobilisation = f(updated.mobilisation) || 0;
    const witnesscharges = f(updated.witnesscharges) || 0;
    const samplehandling = f(updated.samplehandling) || 0;
    const sampleprep = f(updated.sampleprep) || 0;

    const subtotal2 = subtotal - discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep;

    let cgstamount = 0;
    let sgstamount = 0;
    let igstamount = 0;

    if (sgst === 1) {
      cgstamount = parseFloat(((subtotal2 / 100) * (f(updated.cgstper) || 9)).toFixed(2));
      sgstamount = parseFloat(((subtotal2 / 100) * (f(updated.sgstper) || 9)).toFixed(2));
    } else {
      igstamount = parseFloat(((subtotal2 / 100) * (f(updated.igstper) || 18)).toFixed(2));
    }

    const totalamount = parseFloat((subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2));
    const finaltotal = Math.round(totalamount);
    const roundoff = parseFloat((finaltotal - totalamount).toFixed(2));

    return {
      ...updated,
      subtotal2: subtotal2.toFixed(2),
      cgstamount: cgstamount.toFixed(2),
      sgstamount: sgstamount.toFixed(2),
      igstamount: igstamount.toFixed(2),
      total: totalamount.toFixed(2),
      roundoff: roundoff.toFixed(2),
      finaltotal: String(finaltotal),
    };
  }, [sgst]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => recalculate({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.put(`/invoices/${id}`, form);
      toast.success("Invoice updated successfully");
      navigate("/dashboards/accounts/past-invoices");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Page title="Edit Past Invoice">
        <div className="p-6 text-sm text-gray-500">Loading...</div>
      </Page>
    );

  const inputCls = "w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";
  const readonlyCls = `${inputCls} bg-gray-100 dark:bg-dark-700`;

  return (
    <Page title="Edit Past Invoice">
      <div className="px-(--margin-x) py-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Edit Past Invoice
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboards/accounts/past-invoices")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-dark-500 dark:hover:bg-dark-700"
          >
            &laquo; Back
          </button>
        </div>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-dark-700">
                    {[
                      "Date", "Bill No", "Subtotal", "Discount",
                      "Freight Charges", "Mobilization and Demobilization Charges",
                      "Witness Charges", "Sample Handling", "Sample Preparation Charges",
                      ...(sgst === 1 ? ["CGST", "SGST"] : ["IGST"]),
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
                  <tr>
                    {/* Date */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input
                        type="text"
                        name="invoicedate"
                        value={form.invoicedate}
                        onChange={handleChange}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => (e.target.type = "text")}
                        placeholder="Date"
                        className={inputCls}
                        style={{ minWidth: 110 }}
                      />
                    </td>
                    {/* Bill No */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input
                        type="text"
                        name="invoiceno"
                        value={form.invoiceno}
                        onChange={handleChange}
                        className={inputCls}
                        style={{ minWidth: 120 }}
                      />
                    </td>
                    {/* Subtotal */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="subtotal" value={form.subtotal} onChange={handleChange} className={inputCls} style={{ minWidth: 90 }} />
                    </td>
                    {/* Discount */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="discount" value={form.discount} onChange={handleChange} className={inputCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Freight */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="freight" value={form.freight} onChange={handleChange} className={inputCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Mobilisation */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="mobilisation" value={form.mobilisation} onChange={handleChange} className={inputCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Witness */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="witnesscharges" value={form.witnesscharges} onChange={handleChange} className={inputCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Sample Handling */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="samplehandling" value={form.samplehandling} onChange={handleChange} className={inputCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Sample Prep */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" name="sampleprep" value={form.sampleprep} onChange={handleChange} className={inputCls} style={{ minWidth: 80 }} />
                    </td>

                    {sgst === 1 ? (
                      <>
                        {/* CGST */}
                        <td className="border border-gray-300 p-2 dark:border-dark-500">
                          <input type="text" readOnly value={form.cgstamount} className={readonlyCls} style={{ minWidth: 80 }} />
                        </td>
                        {/* SGST */}
                        <td className="border border-gray-300 p-2 dark:border-dark-500">
                          <input type="text" readOnly value={form.sgstamount} className={readonlyCls} style={{ minWidth: 80 }} />
                        </td>
                      </>
                    ) : (
                      /* IGST */
                      <td className="border border-gray-300 p-2 dark:border-dark-500">
                        <input type="text" readOnly value={form.igstamount} className={readonlyCls} style={{ minWidth: 80 }} />
                      </td>
                    )}

                    {/* Total */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" readOnly value={form.total} className={readonlyCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Round Off */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input type="text" readOnly value={form.roundoff} className={readonlyCls} style={{ minWidth: 80 }} />
                    </td>
                    {/* Final Total */}
                    <td className="border border-gray-300 p-2 dark:border-dark-500">
                      <input
                        type="number"
                        name="finaltotal"
                        value={form.finaltotal}
                        onChange={handleChange}
                        className={inputCls}
                        style={{ minWidth: 90 }}
                      />
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-dark-800">
                    <td
                      colSpan={sgst === 1 ? 11 : 10}
                      className="border border-gray-300 p-2 dark:border-dark-500"
                    />
                    <th className="border border-gray-300 p-2 text-right dark:border-dark-500">
                      Total
                    </th>
                    <td
                      colSpan={3}
                      className="border border-gray-300 p-2 dark:border-dark-500"
                    >
                      <input
                        type="text"
                        readOnly
                        value={form.finaltotal}
                        className={readonlyCls}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4">
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
