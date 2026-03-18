import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/invoices/${id}`)
      .then((res) => setData(res.data?.data ?? res.data))
      .catch((err) => console.error("Failed to load invoice:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Page title="View Invoice">
        <div className="p-6 text-sm text-gray-500">Loading...</div>
      </Page>
    );

  if (!data)
    return (
      <Page title="View Invoice">
        <div className="p-6 text-sm text-red-500">Invoice not found.</div>
      </Page>
    );

  const isSGST = data.sgst == 1;
  const isDraft = data.status == 0;
  const isEinvoice = data.status == 2;
  const isNormal = data.potype === "Normal";
  const fmt = (v) => parseFloat(v || 0).toFixed(2);

  return (
    <Page title="View Invoice">
      <div className="p-4 sm:p-6">
        {/* Action buttons */}
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="rounded bg-gray-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Export PDF Without Letterhead
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/canceled-invoices")}
            className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back To Invoice List
          </button>
        </div>

        {/* Document */}
        <div className="relative rounded border border-gray-300 bg-white p-6 dark:border-dark-500 dark:bg-dark-800">

          {/* Draft watermark */}
          {isDraft && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <span className="rotate-[-30deg] text-[8rem] font-black uppercase text-gray-500">
                DRAFT
              </span>
            </div>
          )}

          {/* Header */}
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-navy-700 dark:text-dark-50">
              Tax Invoice
            </h2>
          </div>

          {/* Info grid */}
          <div className="mb-4 grid grid-cols-1 gap-0 border border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            {/* Customer info */}
            <div className="border-b border-gray-300 p-3 text-sm dark:border-dark-500 sm:border-b-0 sm:border-r">
              <p className="font-semibold">Customer:</p>
              <p>M/s. {data.customername}</p>
              {data.address && (
                <p className="text-gray-600 dark:text-dark-300">
                  {data.address}
                  {data.city ? `, ${data.city}` : ""}
                  {data.pincode ? `, ${data.pincode}` : ""}
                </p>
              )}
              {data.statename && (
                <p>
                  <span className="font-medium">State: </span>{data.statename}
                  {data.statecode && (
                    <span className="ml-4 font-medium">State Code: {data.statecode}</span>
                  )}
                </p>
              )}
              {data.gstno && (
                <p>
                  <span className="font-medium">GSTIN/UIN: </span>{data.gstno}
                  {data.pan && (
                    <span className="ml-4 font-medium">PAN: {data.pan}</span>
                  )}
                </p>
              )}
            </div>

            {/* Invoice details */}
            <div className="p-3 text-sm">
              <p>
                <span className="font-semibold">Invoice No.: </span>{data.invoiceno}
              </p>
              <p>
                <span className="font-semibold">Date: </span>
                {data.invoicedate
                  ? new Date(data.invoicedate).toLocaleDateString("en-GB")
                  : data.date}
              </p>
              {data.pono && (
                <p>
                  <span className="font-semibold">PO No.: </span>{data.pono}
                </p>
              )}
              {data.inwardentryno && (
                <p>
                  <span className="font-semibold">Inward Entry No.: </span>{data.inwardentryno}
                </p>
              )}

              {/* QR code (e-invoice) */}
              {isEinvoice && data.signed_qr_code && (
                <div className="mt-2 inline-block border-2 border-black p-1">
                  <img
                    src={`data:image/png;base64,${data.signed_qr_code}`}
                    alt="QR Code"
                    className="h-20 w-20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm dark:border-dark-500">
              <thead className="bg-gray-100 dark:bg-dark-700">
                <tr>
                  <th className="border border-gray-300 p-2 text-center dark:border-dark-500">S.No.</th>
                  <th className="border border-gray-300 p-2 text-left dark:border-dark-500">Description</th>
                  <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Meters/Nos</th>
                  {isNormal && (
                    <>
                      <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Rate</th>
                      <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data.items) && data.items.map((item, i) => (
                  <tr
                    key={i}
                    className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-800 dark:even:bg-dark-700"
                  >
                    <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{i + 1}</td>
                    <td className="border border-gray-300 p-2 dark:border-dark-500">{item.description}</td>
                    <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{item.qty}</td>
                    {isNormal && (
                      <>
                        <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{item.rate}</td>
                        <td className="border border-gray-300 p-2 text-right dark:border-dark-500">{fmt(item.amount)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-1 gap-0 border border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            {/* Left: IRN / bank / terms */}
            <div className="border-b border-gray-300 p-3 text-sm dark:border-dark-500 sm:border-b-0 sm:border-r">
              {isEinvoice && (
                <div className="mb-2">
                  {data.irn && <p><span className="font-semibold">IRN No:</span> {data.irn}</p>}
                  {data.ack_no && <p><span className="font-semibold">Acknowledgment No:</span> {data.ack_no}</p>}
                  {data.ack_dt && <p><span className="font-semibold">Acknowledgement Date:</span> {data.ack_dt}</p>}
                </div>
              )}
              <div className="mt-2 text-xs text-gray-600 dark:text-dark-300">
                <p className="font-semibold">Bank Details:</p>
                {data.bankname && <p>Bank: {data.bankname}</p>}
                {data.accountno && <p>A/C No: {data.accountno}</p>}
                {data.ifsccode && <p>IFSC: {data.ifsccode}</p>}
                {data.branch && <p>Branch: {data.branch}</p>}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-dark-300">
                <p>PAN : AADCK0799A</p>
                <p>GSTIN : 23AADCK0799A1ZV</p>
                <p>SAC Code : 998394</p>
              </div>
            </div>

            {/* Right: totals */}
            <div className="p-3 text-sm">
              <TotalRow label="Subtotal" value={fmt(data.subtotal)} />
              {parseFloat(data.discnumber) > 0 && (
                <TotalRow
                  label={`Discount (${data.discnumber}${data.disctype === "%" ? "%" : ""})`}
                  value={fmt(data.discount)}
                />
              )}
              {parseFloat(data.witnesscharges) > 0 && (
                <TotalRow
                  label={`Witness Charges (${data.witnessnumber}${data.witnesstype === "%" ? "%" : ""})`}
                  value={fmt(data.witnesscharges)}
                />
              )}
              {parseFloat(data.samplehandling) > 0 && (
                <TotalRow label="Sample Handling" value={fmt(data.samplehandling)} />
              )}
              {parseFloat(data.sampleprep) > 0 && (
                <TotalRow label="Sample Preparation Charges" value={fmt(data.sampleprep)} />
              )}
              {parseFloat(data.freight) > 0 && (
                <TotalRow label="Freight Charges" value={fmt(data.freight)} />
              )}
              {parseFloat(data.mobilisation) > 0 && (
                <TotalRow label="Mobilization and Demobilization Charges" value={fmt(data.mobilisation)} />
              )}
              <TotalRow label="Total" value={fmt(data.subtotal2)} />
              {isSGST ? (
                <>
                  <TotalRow label={`CGST ${data.cgstper}%`} value={fmt(data.cgstamount)} />
                  <TotalRow label={`SGST ${data.sgstper}%`} value={fmt(data.sgstamount)} />
                </>
              ) : (
                <TotalRow label={`IGST ${data.igstper}%`} value={fmt(data.igstamount)} />
              )}
              <TotalRow label="Total Charges With Tax" value={fmt(data.total)} />
              <TotalRow label="Round Off" value={fmt(data.roundoff)} />
            </div>
          </div>

          {/* Final total */}
          <div className="grid grid-cols-1 gap-0 border-x border-b border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            <div className="border-b border-gray-300 p-3 text-sm dark:border-dark-500 sm:border-b-0 sm:border-r">
              <span className="font-semibold">(IN WORDS): Rs. </span>
              {data.amount_in_words ?? `${Math.round(data.finaltotal)}`}
            </div>
            <div className="p-3">
              <TotalRow
                label="Grand Total"
                value={fmt(data.finaltotal)}
                bold
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-4 border border-gray-300 p-3 text-xs dark:border-dark-500">
            <p className="font-semibold underline">Terms &amp; Conditions:</p>
            <ol className="ml-4 mt-1 list-decimal space-y-1 text-gray-700 dark:text-dark-300">
              <li>Cross Cheque/DD should be drawn in favour of the company.</li>
              <li>Please attach bill details indicating Invoice No., Quotation No. &amp; TDS deductions if any along with your payment.</li>
              <li>As per existing GST rules, the GSTR-1 has to be filed in the immediate next month of billing. If you have any issue in this tax invoice, please inform in writing before 5th of next month.</li>
              <li>Payment not made within 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
              <li>Subject to exclusive jurisdiction of courts only.</li>
              <li>Errors &amp; omissions accepted.</li>
            </ol>
          </div>
        </div>
      </div>
    </Page>
  );
}

function TotalRow({ label, value, bold }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={bold ? "font-semibold" : "text-gray-600 dark:text-dark-300"}>
        {label}
      </span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
