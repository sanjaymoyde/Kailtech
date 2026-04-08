// Import Dependencies
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";


// Local Imports
import logo from "assets/krtc.jpg";
import { Page } from "components/shared/Page";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExportCreditNoteToPdf from "./ExportCreditNoteToPdf";
import { useRef } from "react";

// --- Capture PDF Helper ---
async function toBase64(url) {
  if (!url) return "";
  try {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function capturePdf(printRef, filename) {
  try {
    const el = printRef.current;
    el.style.display = "block";
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => n.remove());
        clonedDoc.documentElement.removeAttribute("style");
      },
    });
    el.style.display = "none";

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const cW = pageW - margin * 2;
    const cH = (canvas.height * cW) / canvas.width;
    const pgH = pageH - margin * 2;
    let srcY = 0, remaining = cH, firstPage = true;

    while (remaining > 0) {
      if (!firstPage) pdf.addPage();
      firstPage = false;
      const sliceH = Math.min(remaining, pgH);
      const sc = document.createElement("canvas");
      sc.width = canvas.width;
      sc.height = Math.round((sliceH / cH) * canvas.height);
      sc.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, sc.height, 0, 0, canvas.width, sc.height);
      pdf.addImage(sc.toDataURL("image/jpeg", 1.0), "JPEG", margin, margin, cW, sliceH);
      srcY += sc.height;
      remaining -= pgH;
    }
    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    toast.error("Failed to generate PDF locally. Please try again or use the backend export.");
  }
}
// ─── Shared UI components ──────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading...
    </div>
  );
}

// ----------------------------------------------------------------------

export default function ViewCreditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const printRef = useRef(null);

  useEffect(() => {
    toBase64(logo).then(setLogoBase64);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/accounts/view-credit-note/${id}`);
        const raw = res.data?.data;
        if (!raw) {
          setData(null);
          return;
        }

        // Map nested API response to flat object layout mapping existing state refs
        const flatData = {
          ...(raw.creditNote || {}),
          statecode: raw.statecode,
          items: raw.items || [],
          qr_code_url: raw.qr_code || null,
          digital_sign: raw.digital_sign || null
        };

        setData(flatData);
      } catch (err) {
        console.error("Failed to load credit note:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading)
    return (
      <Page title="View Credit Note">
        <PageSpinner />
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



  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setPdfBusy(true);
    await capturePdf(printRef, data?.creditnoteno ? `CreditNote_${data.creditnoteno}.pdf` : `CreditNote_${id}.pdf`);
    setPdfBusy(false);
  };

  const handleGenerateEInvoice = async () => {
    if (!window.confirm("Are you sure you want to generate E-Invoice?")) return;
    try {
      await axios.post("/accounts/credit-note/generate-einvoice", { id });
      toast.success("E-Invoice Generated Successfully!!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to generate E-Invoice.");
    }
  };

  const storedPerms = localStorage.getItem("userPermissions");
  const permissions = storedPerms ? JSON.parse(storedPerms) : [];
  const oldDate = new Date("2023-08-01").getTime();
  const invoiceDate = new Date(data.approved_on || data.created_at || data.cndate).getTime();
  const showEInvoiceButton = data.status == 1 && invoiceDate >= oldDate && permissions.includes(466);

  const gstStateMap = {
    "01": "JAMMU AND KASHMIR", "02": "HIMACHAL PRADESH", "03": "PUNJAB", "04": "CHANDIGARH", "05": "UTTARAKHAND",
    "06": "HARYANA", "07": "DELHI", "08": "RAJASTHAN", "09": "UTTAR PRADESH", 10: "BIHAR", 11: "SIKKIM",
    12: "ARUNACHAL PRADESH", 13: "NAGALAND", 14: "MANIPUR", 15: "MIZORAM", 16: "TRIPURA", 17: "MEGHALAYA",
    18: "ASSAM", 19: "WEST BENGAL", 20: "JHARKHAND", 21: "ODISHA", 22: "CHHATTISGARH", 23: "MADHYA PRADESH",
    24: "GUJARAT", 27: "MAHARASHTRA", 29: "KARNATAKA", 32: "KERALA", 33: "TAMIL NADU", 36: "TELANGANA",
    37: "ANDHRA PRADESH",
  };
  const stCode = String(data.statecode || "");
  const stateName = gstStateMap[stCode] || data.statename || stCode || "NA";

  return (
    <Page title="View Credit Note">
      <div className="p-4 sm:p-6">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>

        {/* Hidden PDF Gen Template */}
        <div style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}>
          <div ref={printRef} style={{ display: "none" }}>
            <ExportCreditNoteToPdf data={data} logoBase64={logoBase64} withLH={true} />
          </div>
        </div>
        {/* Action buttons */}
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
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
          <button
            onClick={handleExportPDF}
            disabled={pdfBusy}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600 ml-2 disabled:opacity-50"
          >
            {pdfBusy ? "Generating PDF..." : "Export PDF Credit Note"}
          </button>
          {showEInvoiceButton && (
            <button
              onClick={handleGenerateEInvoice}
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 sm:ml-auto ml-2"
            >
              Generate E-Invoice
            </button>
          )}
        </div>

        {/* Document */}
        <div id="printable-area" className="relative rounded border border-gray-300 bg-white p-6 dark:border-dark-500 dark:bg-dark-800 print:border-none print:shadow-none print:p-0">

          {/* Draft watermark */}
          {isDraft && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <span className="rotate-[-30deg] text-[8rem] font-black uppercase text-gray-500">
                DRAFT
              </span>
            </div>
          )}

          {/* Header */}
          <div className="mb-4 grid grid-cols-12 gap-2">
            <div className="col-span-3 flex items-start">
              <img src={logo} alt="KRTC Logo" className="h-[45px] sm:h-[65px] w-auto object-contain" />
            </div>
            <div className="col-span-9 text-right">
              <p className="font-mono text-[9px] sm:text-[11px] italic text-gray-500">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),
                <br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
              </p>
              <h2 className="mt-1 text-sm sm:text-xl font-bold" style={{ color: "navy" }}>
                {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}
              </h2>
            </div>
            <div className="col-span-12 text-center text-base font-bold">
              CREDIT NOTE
            </div>
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
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold">State name: </span>
                  {stateName}
                </div>
                <div>
                  <span className="font-semibold">State code: </span>
                  {stCode || "NA"}
                </div>
              </div>
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
                <div className="mt-2 inline-block border border-black p-1">
                  <img
                    alt="E-Invoice QR Code"
                    className="h-28 w-28 object-contain"
                    src={data.qr_code_url ?? `data:image/png;base64,${data.signed_qr_code}`}
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
                    <td className="border border-gray-300 p-2 dark:border-dark-500" dangerouslySetInnerHTML={{ __html: item.description }}></td>
                    <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{item.qty || item.quantity || 1}</td>
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
            <div className="border-b border-gray-300 p-3 text-sm dark:border-dark-500 sm:border-b-0 sm:border-r break-words">
              {isEinvoice && (
                <div className="mb-2">
                  {data.irn && <p className="break-all"><span className="font-semibold">IRN No:</span> {data.irn}</p>}
                  {data.ack_no && <p><span className="font-semibold">Acknowledgment No:</span> {data.ack_no}</p>}
                  {data.ack_dt && <p><span className="font-semibold">Acknowledgement Date:</span> {data.ack_dt}</p>}
                </div>
              )}
              {data.brnnos && <p className="mb-1"><span className="font-semibold">BRN No:</span> {data.brnnos.split(',').join(', ')}</p>}
              {data.remark && <p className="mb-1"><span className="font-semibold">Remark:</span> {data.remark}</p>}
              <div className="mt-2 text-xs text-gray-600 dark:text-dark-300">
                <p>PAN : {data.pan || "AADCK0799A"}</p>
                <p>GSTIN : {data.gstno || "23AADCK0799A1ZV"}</p>
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
          <div className="grid grid-cols-1 gap-0 border border-t-0 border-gray-300 dark:border-dark-500 sm:grid-cols-2">
            <div className="border-b border-gray-300 p-3 text-xs dark:border-dark-500 sm:border-b-0 sm:border-r">
              <span className="font-semibold text-sm">(IN WORDS): Rs. </span>
              <span className="text-sm">{data.amount_in_words ?? numberToWords(Math.round(data.finaltotal || 0)) + " Only"}</span>
              <div className="mt-4 text-gray-700 dark:text-dark-300">
                <div>For online payments - {data.bankaccountname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                <div>Bank Name : {data.bankname ?? "—"}, Branch Name : {data.bankbranch ?? "—"}</div>
                <div>Bank Account No. : {data.bankaccountno ?? "—"}, A/c Type : {data.bankactype ?? "—"}</div>
                <div>IFSC CODE: {data.bankifsccode ?? "—"}, MICR CODE: {data.bankmicr ?? "—"}</div>
                <div className="mt-2 text-gray-600">Certified that the particulars given above are true and correct.</div>
              </div>
            </div>
            <div className="p-3">
              <TotalRow
                label="Total Credit Note"
                value={parseFloat(data.finaltotal || 0).toFixed(2)}
                bold
              />
              <div className="mt-4 text-xs text-gray-700 dark:text-dark-300">
                <div>For {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}</div>
                {(Number(data.status) === 1 || Number(data.status) === 2) && data.digital_sign && (
                  <div className="mt-2">
                    <img
                      src={data.digital_sign}
                      alt="Digital Signature"
                      style={{ maxWidth: "250px", maxHeight: "100px" }}
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="mt-2 underline">Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-4 border border-gray-300 p-3 text-xs dark:border-dark-500">
            <p className="font-semibold underline">Terms &amp; Conditions:</p>
            <ol className="ml-4 mt-1 list-decimal space-y-1 text-gray-700 dark:text-dark-300">
              <li>Cross Cheque/DD should be drawn in favour of {data.companyname ?? "the company"} Payable at {data.city ?? "Indore"}</li>
              <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
              <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
              <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
              <li>If the payment is to be paid in Cash pay to UPI <span className="font-bold">0795933A0099960.bqr@kotak</span> only and take official receipt. Else claim of payment, shall not be accepted</li>
              <li>Subject to exclusive jurisdiction of courts at {data.city ?? "Indore"} only.</li>
              <li>Errors &amp; omissions accepted.</li>
            </ol>
          </div>
        </div>
      </div>
    </Page>
  );
}

// ── Helpers ──

function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const numToWords = (num) => {
    let str = "";
    if (num > 99) { str += ones[Math.floor(num / 100)] + " Hundred "; num %= 100; }
    if (num > 19) { str += tens[Math.floor(num / 10)] + " "; num %= 10; }
    if (num > 0) { str += ones[num] + " "; }
    return str.trim();
  };
  let words = "";
  if (n > 9999999) { words += numToWords(Math.floor(n / 10000000)) + " Crore "; n %= 10000000; }
  if (n > 99999) { words += numToWords(Math.floor(n / 100000)) + " Lakh "; n %= 100000; }
  if (n > 999) { words += numToWords(Math.floor(n / 1000)) + " Thousand "; n %= 1000; }
  if (n > 0) { words += numToWords(n); }
  return words.trim();
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
