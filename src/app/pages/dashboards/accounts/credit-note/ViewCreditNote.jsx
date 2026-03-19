// Import Dependencies
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function ViewCreditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/credit-notes/${id}`)
      .then((res) => setData(res.data?.data ?? res.data))
      .catch((err) => console.error("Failed to load credit note:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Page title="View Credit Note">
        <div className="p-6 text-sm text-gray-500">Loading...</div>
      </Page>
    );
  if (!data)
    return (
      <Page title="View Credit Note">
        <div className="p-6 text-sm text-red-500">Credit note not found.</div>
      </Page>
    );

  const isSGST = data.sgst == 1;
  const isDraft = data.status == 0;
  const isEinvoice = data.status == 2;

  const fmt = (v) => parseFloat(v || 0).toFixed(2);

  return (
    <Page title="View Credit Note">
      <div className="p-4 sm:p-6">
        {/* Action buttons */}
        <div className="mb-4 flex gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/credit-note")}
            className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back To Credit Note List
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
              Credit Note
            </h2>
          </div>

          {/* Info table */}
          <div className="mb-4 grid grid-cols-1 gap-4 border border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            {/* Customer info */}
            <div className="border-b border-gray-300 p-3 dark:border-dark-500 sm:border-b-0 sm:border-r">
              <p className="font-semibold">Customer:</p>
              <p>M/s. {data.customername}</p>
              {data.address && (
                <p className="text-sm text-gray-600 dark:text-dark-300">
                  {data.address}
                  {data.city ? `, ${data.city}` : ""}
                  {data.pincode ? `, ${data.pincode}` : ""}
                </p>
              )}
              {data.statename && (
                <p className="text-sm">
                  <span className="font-medium">State: </span>{data.statename}
                  {data.statecode && (
                    <span className="ml-4 font-medium">
                      State Code: {data.statecode}
                    </span>
                  )}
                </p>
              )}
              {data.gstno && (
                <p className="text-sm">
                  <span className="font-medium">GSTIN/UIN: </span>{data.gstno}
                  {data.pan && (
                    <span className="ml-4 font-medium">PAN: {data.pan}</span>
                  )}
                </p>
              )}
            </div>

            {/* CN details */}
            <div className="p-3">
              <p className="text-sm">
                <span className="font-semibold">Credit Note No.: </span>
                {data.creditnoteno}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date: </span>
                {data.creditnotedate
                  ? new Date(data.creditnotedate).toLocaleDateString("en-GB")
                  : data.cndate}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Invoice No./Date: </span>
                {data.invoiceno}
              </p>

              {/* E-Invoice QR placeholder */}
              {isEinvoice && data.signed_qr_code && (
                <div className="mt-2 inline-block border-2 border-black p-1">
                  <p className="text-xs text-gray-500">[QR Code]</p>
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
                  <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Description</th>
                  <th className="border border-gray-300 p-2 text-center dark:border-dark-500">No&apos;s</th>
                  {data.potype === "Normal" && (
                    <>
                      <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Rate</th>
                      <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data.items) && data.items.map((item, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-800 dark:even:bg-dark-700">
                    <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{i + 1}</td>
                    <td className="border border-gray-300 p-2 dark:border-dark-500">{item.description}</td>
                    <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{item.qty}</td>
                    {data.potype === "Normal" && (
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

          {/* Bottom section: remarks + totals */}
          <div className="grid grid-cols-1 gap-0 border border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            {/* Left: IRN / remarks / bank */}
            <div className="border-b border-gray-300 p-3 text-sm dark:border-dark-500 sm:border-b-0 sm:border-r">
              {isEinvoice && (
                <div className="mb-2">
                  {data.irn && <p><span className="font-semibold">IRN No:</span> {data.irn}</p>}
                  {data.ack_no && <p><span className="font-semibold">Acknowledgment No:</span> {data.ack_no}</p>}
                  {data.ack_dt && <p><span className="font-semibold">Acknowledgement Date:</span> {data.ack_dt}</p>}
                </div>
              )}
              {data.brnnos && <p><span className="font-semibold">BRN No:</span> {data.brnnos}</p>}
              {data.remark && <p><span className="font-semibold">Remark:</span> {data.remark}</p>}
              <div className="mt-2 text-xs text-gray-600 dark:text-dark-300">
                <p>PAN : AADCK0799A</p>
                <p>GSTIN : 23AADCK0799A1ZV</p>
                <p>SAC Code : 998394</p>
              </div>
            </div>

            {/* Right: totals */}
            <div className="p-3 text-sm">
              <TotalRow label="Subtotal" value={fmt(data.subtotal)} />
              {data.discnumber > 0 && (
                <TotalRow
                  label={`Discount (${data.discnumber}${data.disctype === "%" ? "%" : ""})`}
                  value={fmt(data.discount)}
                />
              )}
              {data.witnesscharges > 0 && (
                <TotalRow
                  label={`Witness Charges (${data.witnessnumber}${data.witnesstype === "%" ? "%" : ""})`}
                  value={fmt(data.witnesscharges)}
                />
              )}
              {data.samplehandling > 0 && (
                <TotalRow label="Sample Handling" value={fmt(data.samplehandling)} />
              )}
              {data.sampleprep > 0 && (
                <TotalRow label="Sample Preparation Charges" value={fmt(data.sampleprep)} />
              )}
              {data.freight > 0 && (
                <TotalRow label="Freight Charges" value={fmt(data.freight)} />
              )}
              {data.mobilisation > 0 && (
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

          {/* Final total row */}
          <div className="grid grid-cols-1 gap-0 border-x border-b border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            <div className="border-b border-gray-300 p-3 text-sm dark:border-dark-500 sm:border-b-0 sm:border-r">
              <span className="font-semibold">(IN WORDS): Rs. </span>
              {data.amount_in_words ?? `${Math.round(data.finaltotal)}`}
            </div>
            <div className="p-3">
              <TotalRow
                label="Total Credit Note"
                value={parseFloat(data.finaltotal || 0).toFixed(2)}
                bold
              />
            </div>
          </div>

          {/* Terms */}
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

// ── Helpers ──

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
