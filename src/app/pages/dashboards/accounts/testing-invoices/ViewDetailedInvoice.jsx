// ViewDetailedInvoice.jsx
// Route: /dashboards/accounts/testing-invoices/view-detailed/:id
// PHP port of: viewdetailedinvoice.php
//
// Key differences from ViewInvoiceCalibration (regular view):
//   1. Items table shows parameters listed under each item description
//      (fetched from parameters + packageparameters joined by pricematrixid)
//   2. Uses invoicedate (not approved_on) as the invoice date
//   3. "Total Charges" label (not "Total Testing/Calibration Charges")
//   4. API: GET /accounts/get-testing-invoice-byid/:id
//
// Logic:
//   statecode == "23"  → SGST mode (CGST + SGST), else IGST
//   status == 0        → DRAFT watermark
//   meter_option == 1  → show "Meter's" column, else "No's"

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import logo from "assets/krtc.jpg";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Cross-origin image → base64 (needed so html2canvas can render them) ────
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

// ─── Capture hidden div → multi-page PDF ─────────────────────────────────────
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
        clonedDoc
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach((n) => n.remove());
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
      sc
        .getContext("2d")
        .drawImage(canvas, 0, srcY, canvas.width, sc.height, 0, 0, canvas.width, sc.height);
      pdf.addImage(sc.toDataURL("image/png"), "PNG", margin, margin, cW, sliceH);
      srcY += sc.height;
      remaining -= sliceH;
    }
    pdf.save(filename);
    toast.success("PDF downloaded");
  } catch (err) {
    console.error("PDF error", err);
    toast.error("Failed to generate PDF");
  }
}

// ─── Inline style tokens (zero Tailwind, zero oklch — safe for html2canvas) ──
const S = {
  wrap: {
    fontFamily: "Arial,Helvetica,sans-serif",
    fontSize: 12,
    color: "#111",
    backgroundColor: "#fff",
    padding: 20,
    width: 794,
  },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 8 },
  th: {
    border: "1px solid #000",
    padding: "4px 6px",
    textAlign: "center",
    backgroundColor: "#f3f4f6",
    fontSize: 11,
  },
  td: { border: "1px solid #000", padding: "4px 6px", fontSize: 11, verticalAlign: "top" },
  tdR: {
    border: "1px solid #000",
    padding: "4px 8px",
    fontSize: 11,
    verticalAlign: "top",
    textAlign: "right",
  },
  tdC: {
    border: "1px solid #000",
    padding: "4px 6px",
    fontSize: 11,
    verticalAlign: "top",
    textAlign: "center",
  },
  label: { fontWeight: "bold" },
};

const f2 = (v) => parseFloat(v ?? 0).toFixed(2);
const fmtDate = (d) =>
  d && d !== "0000-00-00 00:00:00"
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "";

// ─── Number to words ──────────────────────────────────────────────────────────
function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function words(num) {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    if (num < 1000) return ones[Math.floor(num / 100)] + " hundred " + words(num % 100);
    if (num < 100000) return words(Math.floor(num / 1000)) + "thousand " + words(num % 1000);
    if (num < 10000000) return words(Math.floor(num / 100000)) + "lakh " + words(num % 100000);
    return words(Math.floor(num / 10000000)) + "crore " + words(num % 10000000);
  }
  const result = words(Math.round(n)).trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ─── PDF Print Template ───────────────────────────────────────────────────────
function DetailedInvoicePrintTemplate({ inv, addr, items, signUrl, digitalSignUrl, withLH, hasMeter }) {
  const statecode = !isNaN(inv.statecode)
    ? String(inv.statecode).padStart(2, "0")
    : inv.statecode;
  const isSGST = String(statecode) === "23";
  const stateLabel = inv.statename ?? statecode ?? "";
  const finalTotal = parseFloat(inv.finaltotal ?? 0);
  const status = Number(inv.status);

  return (
    <div style={S.wrap}>
      {/* Letterhead */}
      {withLH && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <img src={logo} alt="Logo" style={{ height: 60, width: "auto" }} crossOrigin="anonymous" />
          <div style={{ flex: 1, textAlign: "right" }}>
            <p style={{ fontFamily: "monospace", fontSize: 10, fontStyle: "italic", color: "#555", margin: 0 }}>
              NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),
              <br />
              BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
            </p>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "navy", marginTop: 4 }}>
              Kailtech Test And Research Centre Pvt. Ltd.
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: "bold", textTransform: "uppercase" }}>TAX INVOICE</div>
        <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginTop: 4 }}>For {inv.typeofinvoice || "Testing"} Charges</div>
        <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginTop: 2 }}>ORIGINAL FOR RECIPIENT</div>
      </div>

      {/* Customer + Invoice meta */}
      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "60%" }} colSpan={2}>
              <div style={S.label}>Customer:</div>
              <strong>M / s . {inv.customername}</strong>
              <div style={{ marginTop: 2 }}>
                {addr.address ? (
                  <>
                    {addr.address}<br />
                    {[addr.city, addr.pincode].filter(Boolean).join(", ")}
                  </>
                ) : (
                  inv.address
                )}
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={S.label}>State name: </span>{stateLabel}&nbsp;&nbsp;
                <span style={S.label}>State code: </span>
                {!isNaN(inv.statecode) ? statecode : "NA"}
              </div>
              <div>
                <span style={S.label}>GSTIN/UIN: </span>{inv.gstno}&nbsp;&nbsp;
                <span style={S.label}>PAN: </span>{inv.pan}
              </div>
              {inv.concern_person && (
                <div style={{ fontSize: 10, color: "#555" }}>Kind Attn. {inv.concern_person}</div>
              )}
            </td>
            <td style={{ ...S.td }} colSpan={3}>
              <div><span style={S.label}>Invoice No.: </span>{inv.invoiceno}</div>
              <div><span style={S.label}>Date: </span>{fmtDate(inv.invoicedate)}</div>
              <div><span style={S.label}>P.O. No. / Date: </span>{inv.ponumber}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items — including parameters under each description */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "8%" }}>S. No.</th>
            <th style={S.th}>Description</th>
            <th style={{ ...S.th, width: "10%" }}>{hasMeter ? "Meter's" : "No's"}</th>
            <th style={{ ...S.th, width: "10%" }}>Rate</th>
            <th style={{ ...S.th, width: "12%" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id ?? idx} style={{ backgroundColor: idx % 2 === 1 ? "#f9fafb" : "#fff" }}>
              <td style={S.tdC}>{idx + 1}</td>
              <td style={S.td}>
                <div dangerouslySetInnerHTML={{ __html: item.description }} />
                {/* PHP: parameters from packageparameters joined parameters by pricematrixid */}
                {Array.isArray(item.parameters) &&
                  item.parameters.map((p, pi) => (
                    <div key={pi} style={{ marginLeft: 8, fontSize: 10, color: "#444" }}>
                      {p.name}
                    </div>
                  ))}
              </td>
              <td style={S.tdC}>{item.meter_option == 1 ? (Math.round(item.meter * 100) / 100) : item.qty}</td>
              <td style={S.tdC}>{item.rate}</td>
              <td style={S.tdR}>{f2(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + BRN + Bank */}
      <table style={S.table}>
        <tbody>
          <tr>
            {/* Left: BRN / Remark / company info */}
            <td
              style={{ ...S.td, width: "60%", verticalAlign: "bottom" }}
              colSpan={2}
              rowSpan={
                4 +
                (parseFloat(inv.discnumber) > 0 ? 1 : 0) +
                (parseFloat(inv.witnesscharges) > 0 ? 1 : 0) +
                (parseFloat(inv.samplehandling) > 0 ? 1 : 0) +
                (parseFloat(inv.sampleprep) > 0 ? 1 : 0) +
                (parseFloat(inv.freight) > 0 ? 1 : 0) +
                (parseFloat(inv.mobilisation) > 0 ? 1 : 0) +
                (isSGST ? 2 : 1)
              }
            >
              {inv.brnnos?.trim() && <div><strong>BRN No :</strong> {inv.brnnos}</div>}
              {inv.remark?.trim() && <div><strong>Remark :</strong> {inv.remark}</div>}
              {(inv.brnnos?.trim() || inv.remark?.trim()) && <br />}
              <div>PAN : AADCK0799A</div>
              <div>GSTIN : 23AADCK0799A1ZV</div>
              <div>SAC Code : 998394 Category : Scientific and Technical Consultancy Services</div>
              <div>Udhyam Registeration No. Type of MSME : 230262102537</div>
              <div>CIN NO.U73100MP2006PTC019006</div>
            </td>
            <td style={S.td}>Subtotal</td>
            <td style={S.tdR}>{f2(inv.subtotal)}</td>
          </tr>
          {parseFloat(inv.discnumber) > 0 && (
            <tr>
              <td style={S.td}>Discount ({inv.discnumber}{inv.disctype === "%" ? "%" : ""})</td>
              <td style={S.tdR}>{f2(inv.discount)}</td>
            </tr>
          )}
          {parseFloat(inv.witnesscharges) > 0 && (
            <tr>
              <td style={S.td}>Witness Charges ({inv.witnessnumber}{inv.witnesstype === "%" ? "%" : ""})</td>
              <td style={S.tdR}>{f2(inv.witnesscharges)}</td>
            </tr>
          )}
          {parseFloat(inv.samplehandling) > 0 && (
            <tr>
              <td style={S.td}>Sample Handling</td>
              <td style={S.tdR}>{f2(inv.samplehandling)}</td>
            </tr>
          )}
          {parseFloat(inv.sampleprep) > 0 && (
            <tr>
              <td style={S.td}>Sample Preparation Charges</td>
              <td style={S.tdR}>{f2(inv.sampleprep)}</td>
            </tr>
          )}
          {parseFloat(inv.freight) > 0 && (
            <tr>
              <td style={S.td}>Freight Charges</td>
              <td style={S.tdR}>{f2(inv.freight)}</td>
            </tr>
          )}
          {parseFloat(inv.mobilisation) > 0 && (
            <tr>
              <td style={S.td}>Mobilization and Demobilization Charges</td>
              <td style={S.tdR}>{f2(inv.mobilisation)}</td>
            </tr>
          )}
          <tr>
            <td style={S.td}>Total</td>
            <td style={S.tdR}>{f2(inv.subtotal2)}</td>
          </tr>
          {isSGST ? (
            <>
              <tr>
                <td style={S.td}>CGST {inv.cgstper}%</td>
                <td style={S.tdR}>{f2(inv.cgstamount)}</td>
              </tr>
              <tr>
                <td style={S.td}>SGST {inv.sgstper}%</td>
                <td style={S.tdR}>{f2(inv.sgstamount)}</td>
              </tr>
            </>
          ) : (
            <tr>
              <td style={S.td}>IGST {inv.igstper}%</td>
              <td style={S.tdR}>{f2(inv.igstamount)}</td>
            </tr>
          )}
          <tr>
            <td style={S.td}>Total Charges With tax</td>
            <td style={S.tdR}>{f2(inv.total)}</td>
          </tr>
          <tr>
            <td style={S.td}>Round off</td>
            <td style={S.tdR}>{f2(inv.roundoff)}</td>
          </tr>

          {/* In words + final total */}
          <tr>
            <td style={{ ...S.td, borderRight: "none" }} colSpan={2}>
              <strong>(IN WORDS):</strong> Rs. {numberToWords(Math.round(finalTotal))} Only
            </td>
            <td style={{ ...S.td, borderLeft: "none" }}>
              <strong>Total Charges</strong>
            </td>
            <td style={{ ...S.tdR, fontWeight: "bold" }}>{f2(Math.round(finalTotal))}</td>
          </tr>

          {/* Bank details + Signatory */}
          <tr>
            <td style={{ ...S.td, borderRight: "none" }} colSpan={2}>
              <div>For online payments - {inv.bankaccountname ?? ""}</div>
              <div>Bank Name : {inv.bankname ?? ""}, Branch Name : {inv.bankbranch ?? ""}</div>
              <div>Bank Account No. : {inv.bankaccountno ?? ""}, A/c Type : {inv.bankactype ?? ""}</div>
              <div>IFSC CODE: {inv.bankifsccode ?? ""}, MICR CODE: {inv.bankmicr ?? ""}</div>
              <div style={{ marginTop: 6, fontSize: 10 }}>
                Certified that the particulars given above are true and correct.<br />
                <b> Declaration u/s 206 AB of Income Tax Act:</b> We have filed our Income Tax Return for previous two years with in specified due dates.
              </div>
            </td>
            <td style={{ ...S.td, borderLeft: "none", textAlign: "right" }} colSpan={2}>
              <div style={{ height: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ textAlign: "right" }}>For Kailtech Test And Research Centre Pvt. Ltd.</div>
                {(status === 1 || status === 2) && (
                  <div style={{ textAlign: "right" }}>
                    {signUrl && (
                      <img src={signUrl} alt="Sign" crossOrigin="anonymous"
                        style={{ width: 100, height: 40, objectFit: "contain" }} />
                    )}
                    {digitalSignUrl && (
                      <img src={digitalSignUrl} alt="DigSign" crossOrigin="anonymous"
                        style={{ maxHeight: 50, objectFit: "contain" }} />
                    )}
                  </div>
                )}
                <div style={{ textAlign: "right" }}><u>Authorised Signatory</u></div>
              </div>
            </td>
          </tr>

          {/* Terms & Conditions */}
          <tr>
            <td style={{ ...S.td, fontSize: 10 }} colSpan={4}>
              <strong><u>Terms &amp; Conditions:</u></strong>
              <ol style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
                <li>Cross Cheque/DD should be drawn in favour of Kailtech Test And Research Centre Pvt. Ltd. Payable at Indore</li>
                <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                <li>If the payment is to be paid in Cash pay to UPI <strong>0795933A0099960.bqr@kotak</strong> only and take official receipt. Else claim of payment, shall not be accepted</li>
                <li>Subject to exclusive jurisdiction of courts at Indore only.</li>
                <li>Errors &amp; omissions accepted.</li>
              </ol>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading invoice…
    </div>
  );
}

// ─── Summary row helper ───────────────────────────────────────────────────────
function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span
        className={`text-right text-gray-600 dark:text-dark-400 ${bold ? "font-semibold" : ""}`}
        style={{ flex: "0 0 70%" }}
      >
        {label}
      </span>
      <span
        className={`text-right tabular-nums ${bold ? "font-bold text-gray-900 dark:text-dark-100" : "text-gray-800 dark:text-dark-200"}`}
        style={{ flex: "0 0 30%" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ViewDetailedInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const printWithLH = useRef(null);
  const printWithoutLH = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgBase64, setImgBase64] = useState({ sign: "", dSign: "" });
  const [pdfBusy, setPdfBusy] = useState(false);

  // ── Fetch invoice detail ───────────────────────────────────────────────────
  // API: GET /accounts/view-detaild-invoice/:id
  // Expected response: { status: "true", data: { invoice: {...}, address: {...},
  //   items: [{ ...fields, parameters: [{name},...] }],
  //   signature_image, digital_signature } }
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/accounts/view-detaild-invoice/${id}`);
      const d = res.data?.data ?? res.data ?? {};
      setInvoice({
        ...(d.invoice ?? d),
        _address: d.address,
        _signature_image: d.signature_image,
        _digital_signature: d.digital_signature,
      });
      setItems(Array.isArray(d.items) ? d.items : []);
      const [sign, dSign] = await Promise.all([
        toBase64(d?.signature_image),
        toBase64(d?.digital_signature),
      ]);
      setImgBase64({ sign, dSign });
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Page title="View Detailed Invoice"><Spinner /></Page>;
  if (!invoice)
    return (
      <Page title="View Detailed Invoice">
        <div className="flex h-[60vh] items-center justify-center text-gray-500">
          Invoice not found.
        </div>
      </Page>
    );

  // ── Derived values (PHP logic) ──────────────────────────────────────────────
  const statecode = isNaN(Number(invoice.statecode))
    ? invoice.statecode
    : String(Number(invoice.statecode)).padStart(2, "0");
  const isSgst = statecode === "23";
  const isDraft = Number(invoice.status) === 0;

  // PHP: meter_option from invoicerow where status=1
  const hasMeter = items.some((it) => it.meter_option == 1);

  // ── Grouping logic (per user request) ──────────────────────────────────────
  const groupedItemsMap = items.reduce((acc, item) => {
    // Clean description: remove everything from "Brn No:" or "CCL Updation"
    const cleanedDesc = (item.description || "")
      .split(/<br>\s*Brn No:|CCL Updation/i)[0]
      .replace(/<br>\s*$/i, "")
      .trim();

    const key = `${cleanedDesc}_${item.rate}`;
    if (!acc[key]) {
      acc[key] = { ...item, description: cleanedDesc, qty: 0, meter: 0, amount: 0 };
    }
    acc[key].qty += parseFloat(item.qty || 0);
    acc[key].meter += parseFloat(item.meter || 0);
    acc[key].amount += parseFloat(item.amount || 0);
    return acc;
  }, {});
  const finalItems = Object.values(groupedItemsMap);

  // ── Format helpers ─────────────────────────────────────────────────────────
  const fmt = (v) => parseFloat(v || 0).toFixed(2);
  const discnumber = parseFloat(invoice.discnumber) || 0;
  const fmtInvoiceDate = (d) =>
    d && d !== "0000-00-00 00:00:00"
      ? new Date(d).toLocaleDateString("en-IN")
      : "";

  // ── PDF handlers ───────────────────────────────────────────────────────────
  const handlePdfWithLH = async () => {
    setPdfBusy(true);
    await capturePdf(printWithLH, `${invoice.invoiceno ?? "invoice"}_detailed.pdf`);
    setPdfBusy(false);
  };

  const handlePdfWithoutLH = async () => {
    setPdfBusy(true);
    await capturePdf(
      printWithoutLH,
      `${invoice.invoiceno ?? "invoice"}_detailed_withoutletterhead.pdf`,
    );
    setPdfBusy(false);
  };

  const templateProps = {
    inv: invoice,
    addr: invoice._address ?? {},
    items: finalItems,
    signUrl: imgBase64.sign || invoice._signature_image,
    digitalSignUrl: imgBase64.dSign || invoice._digital_signature,
    hasMeter,
  };

  return (
    <Page title="View Detailed Invoice">
      <div className="transition-content px-(--margin-x) pb-10">

        {/* ── Hidden print templates (off-screen, captured by html2canvas) ── */}
        <div style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}>
          <div ref={printWithLH} style={{ display: "none" }}>
            <DetailedInvoicePrintTemplate {...templateProps} withLH={true} />
          </div>
        </div>
        <div style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}>
          <div ref={printWithoutLH} style={{ display: "none" }}>
            <DetailedInvoicePrintTemplate {...templateProps} withLH={false} />
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handlePdfWithLH}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {pdfBusy ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            )}
            Export PDF Invoice
          </button>
          <button
            onClick={handlePdfWithoutLH}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export PDF Without LetterHead
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            « Back to Invoice List
          </button>
        </div>

        {/* ── Invoice Body ── */}
        <div
          className={`relative overflow-hidden rounded-lg border border-gray-300 bg-white p-6 text-sm dark:border-dark-600 dark:bg-dark-900 ${isDraft ? "draft-watermark" : ""
            }`}
        >
          {/* DRAFT watermark */}
          {isDraft && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
              <span className="rotate-[-35deg] text-[120px] font-black tracking-widest text-gray-500 uppercase">
                DRAFT
              </span>
            </div>
          )}

          {/* ── Header ── */}
          <div className="mb-4 grid grid-cols-12 gap-2">
            <div className="col-span-3 flex items-start">
              <img src={logo} alt="KRTC Logo" className="h-16 w-auto object-contain" />
            </div>
            <div className="col-span-9 text-right">
              <p className="font-mono text-xs italic text-gray-500">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),
                <br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
              </p>
              <h2 className="mt-1 text-xl font-bold" style={{ color: "navy" }}>
                {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
              </h2>
            </div>
            <div className="col-span-12 text-center text-base font-bold">
              TAX INVOICE<br />
              <span className="text-sm font-normal">For {invoice.typeofinvoice || "Testing"} Charges</span><br />
              <span className="text-xs font-semibold uppercase">ORIGINAL FOR RECIPIENT</span>
            </div>
          </div>

          {/* ── Customer + Invoice Info table ── */}
          <table className="w-full border-collapse border border-gray-400 text-xs dark:border-dark-500">
            <tbody>
              <tr>
                {/* Customer info */}
                <td className="w-3/5 border border-gray-400 p-3 align-top dark:border-dark-500">
                  <div className="font-bold">Customer:</div>
                  <div>M / s . {invoice.customername}</div>
                  <div className="mt-1">
                    {invoice._address
                      ? `${invoice._address.address ?? ""}, ${invoice._address.city ?? ""}, ${invoice._address.pincode ?? ""}`
                      : invoice.address}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4">
                    <span><b>State name: </b>{invoice.statename ?? statecode}</span>
                    <span><b>State code: </b>{isNaN(Number(statecode)) ? "NA" : statecode}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4">
                    <span><b>GSTIN/UIN: </b>{invoice.gstno || "—"}</span>
                    <span><b>PAN: </b>{invoice.pan || "—"}</span>
                  </div>
                  {invoice.concern_person && (
                    <div className="mt-1 text-gray-500 text-xs">
                      Kind Attn. {invoice.concern_person}
                    </div>
                  )}
                </td>

                {/* Invoice meta — PHP uses invoicedate (not approved_on) */}
                <td className="border border-gray-400 p-3 align-top dark:border-dark-500">
                  <div><b>Invoice No.: </b>{invoice.invoiceno}</div>
                  <div><b>Date: </b>{fmtInvoiceDate(invoice.invoicedate)}</div>
                  <div><b>P.O. No. / Date: </b>{invoice.ponumber}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Items table with Parameters ── */}
          <table className="mt-2 w-full border-collapse border border-gray-400 text-xs dark:border-dark-500">
            <thead>
              <tr className="bg-gray-100 dark:bg-dark-700">
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500"
                  style={{ width: "8%" }}>S. No.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500"
                  style={{ width: "50%" }}>Description</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                  {/* PHP: meter_option == 1 → "Meter's" else "No's" */}
                  {hasMeter ? "Meter's" : "No's"}
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                  Rate
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {finalItems.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-900 dark:even:bg-dark-800"
                >
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                    {idx + 1}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 dark:border-dark-500">
                    <div dangerouslySetInnerHTML={{ __html: item.description }} />
                    {Array.isArray(item.parameters) &&
                      item.parameters.map((p, pi) => (
                        <div key={pi} className="ml-2 text-gray-500" style={{ fontSize: 10 }}>
                          {p.name}
                        </div>
                      ))}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                    {item.meter_option == 1 ? (Math.round(item.meter * 100) / 100) : item.qty}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                    {item.rate}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right dark:border-dark-500">
                    {fmt(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Bottom table: BRN/remarks + summary ── */}
          <table className="mt-2 w-full border-collapse border border-gray-400 text-xs dark:border-dark-500">
            <tbody>
              <tr>
                {/* Left: BRN, Remark, company info */}
                <td className="w-3/5 border border-gray-400 p-3 align-bottom dark:border-dark-500">
                  {invoice.brnnos?.trim() && (
                    <div><b>BRN No :</b> {invoice.brnnos}</div>
                  )}
                  {invoice.remark?.trim() && (
                    <div><b>Remark :</b> {invoice.remark}</div>
                  )}
                  {(invoice.brnnos?.trim() || invoice.remark?.trim()) && <br />}
                  <div>PAN : AADCK0799A</div>
                  <div>GSTIN : 23AADCK0799A1ZV</div>
                  <div>SAC Code : 998394 Category : Scientific and Technical Consultancy Services</div>
                  <div>Udhyam Registeration No. Type of MSME : 230262102537</div>
                  <div>CIN NO.U73100MP2006PTC019006</div>
                </td>

                {/* Right: Summary */}
                <td className="border border-gray-400 p-3 align-top dark:border-dark-500">
                  <SummaryRow label="Subtotal" value={fmt(invoice.subtotal)} />

                  {discnumber > 0 && (
                    <SummaryRow
                      label={`Discount(${invoice.discnumber}${invoice.disctype === "%" ? "%" : ""})`}
                      value={fmt(invoice.discount)}
                    />
                  )}
                  {parseFloat(invoice.witnesscharges) > 0 && (
                    <SummaryRow
                      label={`Witness Charges (${invoice.witnessnumber}${invoice.witnesstype === "%" ? "%" : ""})`}
                      value={fmt(invoice.witnesscharges)}
                    />
                  )}
                  {parseFloat(invoice.samplehandling) > 0 && (
                    <SummaryRow label="Sample Handling" value={fmt(invoice.samplehandling)} />
                  )}
                  {parseFloat(invoice.sampleprep) > 0 && (
                    <SummaryRow label="Sample Preparation Charges" value={fmt(invoice.sampleprep)} />
                  )}
                  {parseFloat(invoice.freight) > 0 && (
                    <SummaryRow label="Freight Charges" value={fmt(invoice.freight)} />
                  )}
                  {parseFloat(invoice.mobilisation) > 0 && (
                    <SummaryRow
                      label="Mobilization and Demobilization Charges"
                      value={fmt(invoice.mobilisation)}
                    />
                  )}

                  <SummaryRow label="Total" value={fmt(invoice.subtotal2)} />

                  {/* Tax: PHP sgst==1 → CGST+SGST, else IGST */}
                  {isSgst ? (
                    <>
                      <SummaryRow label={`CGST ${invoice.cgstper}%`} value={fmt(invoice.cgstamount)} />
                      <SummaryRow label={`SGST ${invoice.sgstper}%`} value={fmt(invoice.sgstamount)} />
                    </>
                  ) : (
                    <SummaryRow label={`IGST ${invoice.igstper}%`} value={fmt(invoice.igstamount)} />
                  )}

                  <SummaryRow label="Total Charges With tax" value={fmt(invoice.total)} />
                  <SummaryRow label="Round off" value={fmt(invoice.roundoff)} />
                </td>
              </tr>

              {/* In words + final total */}
              <tr>
                <td className="border border-gray-400 p-3 dark:border-dark-500">
                  <b>(IN WORDS):</b> Rs.{" "}
                  {numberToWords(Math.round(parseFloat(invoice.finaltotal) || 0))} Only
                </td>
                <td className="border border-gray-400 p-3 dark:border-dark-500">
                  <SummaryRow
                    label="Total Charges"
                    value={fmt(Math.round(parseFloat(invoice.finaltotal) || 0))}
                    bold
                  />
                </td>
              </tr>

              {/* Bank details + Authorised signatory */}
              <tr>
                <td className="border border-gray-400 p-3 align-top text-xs dark:border-dark-500">
                  <div>
                    For online payments -{" "}
                    {invoice.bankaccountname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
                  </div>
                  <div>
                    Bank Name : {invoice.bankname ?? "—"}, Branch Name : {invoice.bankbranch ?? "—"}
                  </div>
                  <div>
                    Bank Account No. : {invoice.bankaccountno ?? "—"}, A/c Type :{" "}
                    {invoice.bankactype ?? "—"}
                  </div>
                  <div>
                    IFSC CODE: {invoice.bankifsccode ?? "—"}, MICR CODE: {invoice.bankmicr ?? "—"}
                  </div>
                  <div className="mt-2 text-gray-600">
                    Certified that the particulars given above are true and correct.<br />
                    <b> Declaration u/s 206 AB of Income Tax Act:</b> We have filed our Income Tax Return for previous two years with in specified due dates.
                  </div>
                </td>
                <td className="border border-gray-400 p-3 align-top text-xs dark:border-dark-500 h-1">
                  <div className="flex h-full min-h-[120px] flex-col justify-between text-right">
                    <div>
                      For {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
                    </div>
                    {(Number(invoice.status) === 1 || Number(invoice.status) === 2) &&
                      invoice._signature_image && (
                        <div className="mt-2 text-right">
                          <img
                            src={invoice._signature_image}
                            alt="Signature"
                            className="inline-block h-10 w-24 object-contain"
                          />
                          {invoice._digital_signature && (
                            <img
                              src={invoice._digital_signature}
                              alt="Digital Signature"
                              className="mt-1 inline-block h-10 object-contain"
                            />
                          )}
                        </div>
                      )}
                    <div className="underline">Authorised Signatory</div>
                  </div>
                </td>
              </tr>

              {/* Terms & Conditions */}
              <tr>
                <td
                  colSpan={2}
                  className="border border-gray-400 p-3 text-xs dark:border-dark-500"
                >
                  <b><u>Terms &amp; Conditions:</u></b>
                  <ol className="mt-1 list-decimal pl-5 space-y-0.5">
                    <li>
                      Cross Cheque/DD should be drawn in favour of{" "}
                      {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}{" "}
                      Payable at {invoice.companycity ?? "Indore"}
                    </li>
                    <li>
                      Please attached bill details indicating Invoice No. Quotation no &amp; TDS
                      deductions if any along with your payment.
                    </li>
                    <li>
                      As per existing GST rules. the GSTR-1 has to be filed in the immediate next
                      month of billing. So if you have any issue in this tax invoice viz customer
                      Name, Address, GST No., Amount etc, please inform positively in writing before
                      5th of next month, otherwise no such request will be entertained.
                    </li>
                    <li>
                      Payment not made with in 15 days from the date of issued bill will attract
                      interest @ 24% P.A.
                    </li>
                    <li>
                      If the payment is to be paid in Cash pay to UPI{" "}
                      <b>0795933A0099960.bqr@kotak</b> only and take official receipt. Else claim of
                      payment, shall not be accepted
                    </li>
                    <li>
                      Subject to exclusive jurisdiction of courts at{" "}
                      {invoice.companycity ?? "Indore"} only.
                    </li>
                    <li>Errors &amp; omissions accepted.</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 text-center text-xs text-gray-400">
            This is a system generated invoice
          </div>
        </div>
      </div>
    </Page>
  );
}
