// ViewInvoiceCalibration.jsx
// Route: /dashboards/accounts/testing-invoices/view/:id
// PHP port of: viewInvoiceCalibration.php
//
// Key logic:
//   statecode == "23"  → SGST mode (CGST + SGST), else IGST
//   invoiceno == "FOC" → skip per-item discount/tax calc (all amounts = 0)
//   status == 0        → DRAFT watermark
//   status == 2        → show QR code (signed_qr_code)
//   potype == "Normal" → show Rate + Amount columns
//   meter_option == 1  → show "Meter's" column, else "No's"
//
// Per-item amount distribution (PHP logic):
//   otherCharges = witnesscharges + samplehandling + sampleprep + freight + mobilisation
//   item_otherCharge = (otherCharges / totalQuantity) * item.qty
//   item_amount = item.amount + item_otherCharge
//   amount_new = subtotal + otherCharges
//   if disctype == "amount": item_discount = (item_amount / amount_new) * discnumber
//   else:                    item_discount = (item_amount / amount_new) * discount
//   item_assAmt = item_amount - item_discount
//   tax on item_assAmt

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import logo from "assets/krtc.jpg";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Cross-origin image → base64 (needed so html2canvas can render them) ─────
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

// ─── Capture a hidden ref div → multi-page PDF ───────────────────────────────
// KEY: strips all stylesheets in onclone so Tailwind's oklch() vars don't crash
// html2canvas. The print template uses only inline styles so this is safe.
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
      sc.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, sc.height, 0, 0, canvas.width, sc.height);
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

// ─── Shared inline style tokens (zero Tailwind / zero oklch) ─────────────────
const S = {
  wrap: { fontFamily: "Arial,Helvetica,sans-serif", fontSize: 12, color: "#111", backgroundColor: "#fff", padding: 20, width: 794 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 8 },
  th: { border: "1px solid #000", padding: "4px 6px", textAlign: "center", backgroundColor: "#f3f4f6", fontSize: 11 },
  td: { border: "1px solid #000", padding: "4px 6px", fontSize: 11, verticalAlign: "top" },
  tdR: { border: "1px solid #000", padding: "4px 8px", fontSize: 11, verticalAlign: "top", textAlign: "right" },
  tdC: { border: "1px solid #000", padding: "4px 6px", fontSize: 11, verticalAlign: "top", textAlign: "center" },
  tdNB: { padding: "4px 6px", fontSize: 11, verticalAlign: "top" },
  label: { fontWeight: "bold" },
};

const f2 = (v) => parseFloat(v ?? 0).toFixed(2);
const fmtDate = (d) =>
  d && d !== "0000-00-00 00:00:00"
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

// ─── Number to words (PHP: convert_number_to_words) ──────────────────────────
function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  ];
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

// ─── Print template — ALL inline styles, zero Tailwind, zero oklch ───────────
// This is the div captured by html2canvas for PDF generation.
function InvoicePrintTemplate({ inv, addr, items, qrUrl, signUrl, digitalSignUrl, withLH }) {
  const statecode = !isNaN(inv.statecode) ? String(inv.statecode).padStart(2, "0") : inv.statecode;
  const isSGST = String(statecode) === "23";
  const stateLabel = inv.statename ?? statecode ?? "";
  const finalTotal = parseFloat(inv.finaltotal ?? 0);
  const isFoc = inv.invoiceno === "FOC";
  const isNormalPo = inv.potype === "Normal";
  const hasMeter = items.some((it) => it.meter_option == 1);
  const status = Number(inv.status);
  // Only use qrUrl if it's a base64 data URL — raw URLs will CORS-block html2canvas
  const safeQrUrl = qrUrl && qrUrl.startsWith("data:") ? qrUrl : null;

  // Per-item calculations (same PHP logic)
  const totalQty = items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
  const otherCharges = (parseFloat(inv.witnesscharges) || 0) + (parseFloat(inv.samplehandling) || 0) +
    (parseFloat(inv.sampleprep) || 0) + (parseFloat(inv.freight) || 0) + (parseFloat(inv.mobilisation) || 0);

  return (
    <div style={S.wrap}>
      {/* Letterhead */}
      {withLH && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <img src={logo} alt="Logo" style={{ height: 60, width: "auto" }} crossOrigin="anonymous" />
          <div style={{ flex: 1, textAlign: "right" }}>
            <p style={{ fontFamily: "monospace", fontSize: 10, fontStyle: "italic", color: "#555", margin: 0 }}>
              NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
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
        <div style={{ fontSize: 12 }}>For {inv.typeofinvoice} Charges</div>
        <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>ORIGINAL FOR RECIPIENT</div>
      </div>

      {/* Customer + Invoice meta */}
      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "55%" }} colSpan={2}>
              <div style={S.label}>Customer:</div>
              <strong>{inv.customername}</strong><br />
              {[addr.address, addr.city, addr.pincode].filter(Boolean).join(", ")}
              <div style={{ marginTop: 4 }}>
                <span style={S.label}>State name: </span>{stateLabel}&nbsp;&nbsp;
                <span style={S.label}>State code: </span>{!isNaN(inv.statecode) ? statecode : "NA"}
              </div>
              <div>
                <span style={S.label}>GSTIN/UIN: </span>{inv.gstno}&nbsp;&nbsp;
                <span style={S.label}>PAN: </span>{inv.pan}
              </div>
              {inv.concern_person && <div style={{ fontSize: 10, color: "#555" }}>Kind Attn. {inv.concern_person}</div>}
            </td>
            <td style={{ ...S.td, width: "30%", borderRight: status === 2 && safeQrUrl ? undefined : "none" }}
              colSpan={status === 2 && safeQrUrl ? 2 : 3}>
              <div><span style={S.label}>Invoice No.: </span>{inv.invoiceno}</div>
              <div><span style={S.label}>Date: </span>{fmtDate(inv.approved_on)}</div>
              <div><span style={S.label}>P.O. No. / Date: </span>{inv.ponumber}</div>
            </td>
            {status === 2 && safeQrUrl && (
              <td style={{ ...S.td, borderLeft: "none", width: 80 }}>
                <div style={{ border: "2px solid #000", overflow: "hidden" }}>
                  <img src={safeQrUrl} alt="QR" style={{ width: "100%" }} crossOrigin="anonymous" />
                </div>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/* Items */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "8%" }}>S. No.</th>
            <th style={S.th}>Description</th>
            <th style={{ ...S.th, width: "10%" }}>{hasMeter ? "Meter's" : "No's"}</th>
            {isNormalPo && <>
              <th style={{ ...S.th, width: "10%" }}>Rate</th>
              <th style={{ ...S.th, width: "12%" }}>Amount</th>
            </>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            // Per-item calc (skip for FOC)
            let displayAmount = f2(item.amount);
            if (!isFoc && isNormalPo) {
              const itemAmountOld = parseFloat(item.amount) || 0;
              const qty = parseFloat(item.qty) || 0;
              const itemOtherCharge = otherCharges > 0 && totalQty > 0
                ? parseFloat(((otherCharges / totalQty) * qty).toFixed(2)) : 0;
              displayAmount = f2(itemAmountOld + itemOtherCharge);
            }
            return (
              <tr key={item.id ?? idx} style={{ backgroundColor: idx % 2 === 1 ? "#f9fafb" : "#fff" }}>
                <td style={S.tdC}>{idx + 1}</td>
                <td style={S.td}>{item.description}</td>
                <td style={S.tdC}>{item.meter_option == 1 ? item.meter : item.qty}</td>
                {isNormalPo && <>
                  <td style={S.tdC}>{item.rate}</td>
                  <td style={S.tdR}>{displayAmount}</td>
                </>}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals + BRN + Bank */}
      <table style={S.table}>
        <tbody>
          <tr>
            {/* Left: IRN / BRN / company info */}
            <td style={{ ...S.td, width: "60%", verticalAlign: "bottom" }} colSpan={3}
              rowSpan={4 + (parseFloat(inv.discnumber) > 0 ? 1 : 0) +
                (parseFloat(inv.witnesscharges) > 0 ? 1 : 0) +
                (parseFloat(inv.samplehandling) > 0 ? 1 : 0) +
                (parseFloat(inv.sampleprep) > 0 ? 1 : 0) +
                (parseFloat(inv.freight) > 0 ? 1 : 0) +
                (parseFloat(inv.mobilisation) > 0 ? 1 : 0) +
                (isSGST ? 2 : 1)}>
              {status === 2 && (<div style={{ marginBottom: 6, fontSize: 10 }}>
                {inv.irn && <div><strong>Irn No:</strong> {inv.irn}</div>}
                {inv.ack_no && <div><strong>Acknowledgment No:</strong> {inv.ack_no}</div>}
                {inv.ack_dt && <div><strong>Acknowledgement Date:</strong> {inv.ack_dt}</div>}
              </div>)}
              {inv.brnnos?.trim() && <div><strong>BRN No :</strong> {inv.brnnos}</div>}
              {inv.remark?.trim() && <div><strong>Remark :</strong> {inv.remark}</div>}
              <div>PAN : AADCK0799A</div>
              <div>GSTIN : 23AADCK0799A1ZV</div>
              <div>SAC Code : 998394 Category : Scientific and Technical Consultancy Services</div>
              <div>Udhyam Registeration No. Type of MSME : 230262102537</div>
              <div>CIN NO.U73100MP2006PTC019006</div>
            </td>
            <td style={S.td}>Subtotal</td>
            <td style={S.tdR}>{f2(inv.subtotal)}</td>
          </tr>
          {parseFloat(inv.discnumber) > 0 && <tr>
            <td style={S.td}>Discount ({inv.discnumber}{inv.disctype === "%" ? "%" : ""})</td>
            <td style={S.tdR}>{f2(inv.discount)}</td>
          </tr>}
          {parseFloat(inv.witnesscharges) > 0 && <tr>
            <td style={S.td}>Witness Charges ({inv.witnessnumber}{inv.witnesstype === "%" ? "%" : ""})</td>
            <td style={S.tdR}>{f2(inv.witnesscharges)}</td>
          </tr>}
          {parseFloat(inv.samplehandling) > 0 && <tr>
            <td style={S.td}>Sample Handling</td>
            <td style={S.tdR}>{f2(inv.samplehandling)}</td>
          </tr>}
          {parseFloat(inv.sampleprep) > 0 && <tr>
            <td style={S.td}>Sample Preparation Charges</td>
            <td style={S.tdR}>{f2(inv.sampleprep)}</td>
          </tr>}
          {parseFloat(inv.freight) > 0 && <tr>
            <td style={S.td}>Freight Charges</td>
            <td style={S.tdR}>{f2(inv.freight)}</td>
          </tr>}
          {parseFloat(inv.mobilisation) > 0 && <tr>
            <td style={S.td}>Mobilization and Demobilization Charges</td>
            <td style={S.tdR}>{f2(inv.mobilisation)}</td>
          </tr>}
          <tr>
            <td style={S.td}>Total</td>
            <td style={S.tdR}>{f2(inv.subtotal2)}</td>
          </tr>
          {isSGST ? (<>
            <tr><td style={S.td}>CGST {inv.cgstper}%</td><td style={S.tdR}>{f2(inv.cgstamount)}</td></tr>
            <tr><td style={S.td}>SGST {inv.sgstper}%</td><td style={S.tdR}>{f2(inv.sgstamount)}</td></tr>
          </>) : (
            <tr><td style={S.td}>IGST {inv.igstper}%</td><td style={S.tdR}>{f2(inv.igstamount)}</td></tr>
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
            <td style={{ ...S.td, borderRight: "none" }} colSpan={3}>
              <strong>(IN WORDS):</strong> Rs. {numberToWords(Math.round(finalTotal))} Only
            </td>
            <td style={{ ...S.td, borderLeft: "none" }}>
              <strong>Total {inv.typeofinvoice} Charges</strong>
            </td>
            <td style={{ ...S.tdR, fontWeight: "bold" }}>{f2(Math.round(finalTotal))}</td>
          </tr>
        </tbody>
      </table>

      {/* Bank + Signatory */}
      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "60%", borderRight: "none" }}>
              <div>For online payments — {inv.bankaccountname ?? ""}</div>
              <div>Bank Name : {inv.bankname ?? ""}, Branch Name : {inv.bankbranch ?? ""}</div>
              <div>Bank Account No. : {inv.bankaccountno ?? ""}, A/c Type : {inv.bankactype ?? ""}</div>
              <div>IFSC CODE: {inv.bankifsccode ?? ""}, MICR CODE: {inv.bankmicr ?? ""}</div>
              <div style={{ marginTop: 6, fontSize: 10 }}>
                Certified that the particulars given above are true and correct.
                The commercial values in this document are as per contract/Agreement/Purchase order terms with the customer.
                <strong> Declaration u/s 206AB of Income Tax Act:</strong> We have filed our Income Tax Return for previous two years with in specified due dates.
              </div>
            </td>
            <td style={{ ...S.td, borderLeft: "none", textAlign: "right" }}>
              <div>For Kailtech Test And Research Centre Pvt. Ltd.</div>
              {(status === 1 || status === 2) && (<div style={{ marginTop: 8 }}>
                {signUrl && <img src={signUrl} alt="Sign" crossOrigin="anonymous" style={{ width: 100, height: 40, objectFit: "contain" }} />}
                {digitalSignUrl && <img src={digitalSignUrl} alt="DigSign" crossOrigin="anonymous" style={{ maxHeight: 50, objectFit: "contain" }} />}
              </div>)}
              <div style={{ marginTop: 8 }}><u>Authorised Signatory</u></div>
            </td>
          </tr>
          <tr>
            <td style={{ ...S.td, fontSize: 10 }} colSpan={2}>
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
      <div style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 8 }}>
        This is a system generated invoice
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading invoice…
    </div>
  );
}

// ─── Label + Value row helper ─────────────────────────────────────────────────
function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className={`text-right text-gray-600 dark:text-dark-400 ${bold ? "font-semibold" : ""}`} style={{ flex: "0 0 70%" }}>
        {label}
      </span>
      <span className={`text-right tabular-nums ${bold ? "font-bold text-gray-900 dark:text-dark-100" : "text-gray-800 dark:text-dark-200"}`} style={{ flex: "0 0 30%" }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ViewInvoiceCalibration() {
  const { id } = useParams();
  const navigate = useNavigate();

  const printWithLH = useRef(null);
  const printWithoutLH = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgBase64, setImgBase64] = useState({ qr: "", sign: "", dSign: "" });
  const [pdfBusy, setPdfBusy] = useState(false);

  // ── Fetch invoice detail ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/accounts/view-calibration-invoice/${id}`);
      const d = res.data?.data ?? res.data ?? {};
      setInvoice({ ...(d.invoice ?? d), _address: d.address, _qr_image: d.qr_image, _signature_image: d.signature_image, _digital_signature: d.digital_signature });
      setItems(Array.isArray(d.items) ? d.items : []);
      const [qr, sign, dSign] = await Promise.all([
        toBase64(d?.qr_image),
        toBase64(d?.signature_image),
        toBase64(d?.digital_signature),
      ]);
      setImgBase64({ qr, sign, dSign });
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Page title="View Invoice"><Spinner /></Page>;
  if (!invoice) return (
    <Page title="View Invoice">
      <div className="flex h-[60vh] items-center justify-center text-gray-500">Invoice not found.</div>
    </Page>
  );

  // ── Derived values (PHP logic) ─────────────────────────────────────────────
  const statecode = isNaN(Number(invoice.statecode))
    ? invoice.statecode
    : String(Number(invoice.statecode)).padStart(2, "0");
  const isSgst = statecode === "23";
  const isFoc = invoice.invoiceno === "FOC";
  const isNormalPo = invoice.potype === "Normal";
  const isDraft = Number(invoice.status) === 0;
  const isEinvoice = Number(invoice.status) === 2;

  // PHP: totalQuantity = sum of all item qty
  const totalQuantity = items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);

  // PHP: otherCharge = witnesscharges + samplehandling + sampleprep + freight + mobilisation
  const otherCharges =
    (parseFloat(invoice.witnesscharges) || 0) +
    (parseFloat(invoice.samplehandling) || 0) +
    (parseFloat(invoice.sampleprep) || 0) +
    (parseFloat(invoice.freight) || 0) +
    (parseFloat(invoice.mobilisation) || 0);

  const hasOtherCharges = otherCharges > 0;

  // PHP: amount_new = subtotal + otherCharge
  const subtotal = parseFloat(invoice.subtotal) || 0;
  const amountNew = subtotal + otherCharges;

  // ── Per-item calculations (PHP logic, skipped for FOC) ─────────────────────
  const computedItems = items.map((item) => {
    if (isFoc) {
      return { ...item, itemOtherCharge: 0, itemAmount: 0, itemDiscount: 0, itemAssAmt: 0, itemCgst: 0, itemSgst: 0, itemIgst: 0, itemTotVal: 0, gstRate: 0 };
    }

    const itemAmountOld = parseFloat(item.amount) || 0;
    const qty = parseFloat(item.qty) || 0;

    // PHP: item_otherCharge = (otherCharges / totalQuantity) * item.qty
    const itemOtherCharge = hasOtherCharges && totalQuantity > 0
      ? parseFloat(((otherCharges / totalQuantity) * qty).toFixed(2))
      : 0;

    const itemAmount = itemAmountOld + itemOtherCharge;

    // PHP: item_discount based on disctype
    let itemDiscount = 0;
    if (amountNew > 0) {
      if (invoice.disctype === "amount") {
        itemDiscount = parseFloat(((itemAmount / amountNew) * (parseFloat(invoice.discnumber) || 0)).toFixed(2));
      } else {
        itemDiscount = parseFloat(((itemAmount / amountNew) * (parseFloat(invoice.discount) || 0)).toFixed(2));
      }
    }

    const itemAssAmt = itemAmount - itemDiscount;

    // PHP: tax on itemAssAmt
    let itemCgst = 0, itemSgst = 0, itemIgst = 0;
    if (isSgst) {
      itemCgst = parseFloat((itemAssAmt * ((parseFloat(invoice.cgstper) || 0) / 100)).toFixed(2));
      itemSgst = parseFloat((itemAssAmt * ((parseFloat(invoice.sgstper) || 0) / 100)).toFixed(2));
    } else {
      itemIgst = parseFloat((itemAssAmt * ((parseFloat(invoice.igstper) || 0) / 100)).toFixed(2));
    }

    const gstRate = (parseFloat(invoice.cgstper) || 0) + (parseFloat(invoice.sgstper) || 0) + (parseFloat(invoice.igstper) || 0);
    const itemTotVal = itemAssAmt + itemCgst + itemSgst + itemIgst;

    return { ...item, itemOtherCharge, itemAmount, itemDiscount, itemAssAmt, itemCgst, itemSgst, itemIgst, itemTotVal, gstRate };
  });

  // ── Summary values ─────────────────────────────────────────────────────────
  const fmt = (v) => parseFloat(v || 0).toFixed(2);
  const discnumber = parseFloat(invoice.discnumber) || 0;

  // ── PDF handlers ──────────────────────────────────────────────────────────
  const handlePdfWithLH = async () => {
    setPdfBusy(true);
    await capturePdf(printWithLH, `${invoice.invoiceno ?? "invoice"}.pdf`);
    setPdfBusy(false);
  };

  const handlePdfWithoutLH = async () => {
    setPdfBusy(true);
    await capturePdf(printWithoutLH, `${invoice.invoiceno ?? "invoice"}withoutletterhead.pdf`);
    setPdfBusy(false);
  };

  const templateProps = {
    inv: invoice,
    addr: invoice._address ?? {},
    items,
    qrUrl: imgBase64.qr || invoice._qr_image,
    signUrl: imgBase64.sign || invoice._signature_image,
    digitalSignUrl: imgBase64.dSign || invoice._digital_signature,
  };

  return (
    <Page title="View Invoice">
      <div className="transition-content px-(--margin-x) pb-10">

        {/* ── Hidden print templates (off-screen, captured by html2canvas) ── */}
        <div style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}>
          <div ref={printWithLH} style={{ display: "none" }}>
            <InvoicePrintTemplate {...templateProps} withLH={true} />
          </div>
        </div>
        <div style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}>
          <div ref={printWithoutLH} style={{ display: "none" }}>
            <InvoicePrintTemplate {...templateProps} withLH={false} />
          </div>
        </div>

        {/* ── Action buttons (no-print) ── */}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export PDF Without LetterHead
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            &laquo; Back to Invoice List
          </button>
        </div>

        {/* ── Invoice body ── */}
        <div
          className={`relative overflow-hidden rounded-lg border border-gray-300 bg-white p-6 text-sm dark:border-dark-600 dark:bg-dark-900 ${
            isDraft ? "draft-watermark" : ""
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
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
              </p>
              <h2 className="mt-1 text-xl font-bold text-navy-700" style={{ color: "navy" }}>
                {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
              </h2>
            </div>
            <div className="col-span-6 text-center text-base font-bold">
              TAX INVOICE<br />
              <span className="text-sm font-normal">For {invoice.typeofinvoice} Charges</span>
            </div>
            <div className="col-span-6 text-right text-sm">
              ORIGINAL FOR RECIPIENT
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
                  <div className="mt-1">{invoice._address ? `${invoice._address.address}, ${invoice._address.city}, ${invoice._address.pincode}` : invoice.address}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4">
                    <span><b>State name: </b>{invoice.statename ?? statecode}</span>
                    <span><b>State code: </b>{isNaN(Number(statecode)) ? "NA" : statecode}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4">
                    <span><b>GSTIN/UIN: </b>{invoice.gstno || "—"}</span>
                    <span><b>PAN: </b>{invoice.pan || "—"}</span>
                  </div>
                  {invoice.concern_person && (
                    <div className="mt-1 text-gray-500">Kind Attn. {invoice.concern_person}</div>
                  )}
                </td>

                {/* Invoice meta */}
                <td className="border border-gray-400 p-3 align-top dark:border-dark-500" style={{ borderRight: isEinvoice ? "none" : undefined }}>
                  <div><b>Invoice No.: </b>{invoice.invoiceno}</div>
                  <div>
                    <b>Date: </b>
                    {invoice.approved_on && invoice.approved_on !== "0000-00-00 00:00:00"
                      ? new Date(invoice.approved_on).toLocaleDateString("en-IN")
                      : ""}
                  </div>
                  <div><b>P.O. No. / Date: </b>{invoice.ponumber}</div>
                </td>

                {/* QR code (status == 2) */}
                {isEinvoice && invoice._qr_image && (
                  <td className="w-24 border border-gray-400 p-1 align-top dark:border-dark-500" style={{ borderLeft: "none" }}>
                    <div className="border-2 border-black overflow-hidden">
                      <img src={invoice._qr_image} alt="QR Code" className="w-full" />
                    </div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          {/* ── Items table ── */}
          <table className="mt-2 w-full border-collapse border border-gray-400 text-xs dark:border-dark-500">
            <thead>
              <tr className="bg-gray-100 dark:bg-dark-700">
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "8%" }}>S. No.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">Description</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "10%" }}>
                  {/* PHP: meter_option == 1 → "Meter's" else "No's" */}
                  {items.some((it) => it.meter_option == 1) ? "Meter's" : "No's"}
                </th>
                {isNormalPo && (
                  <>
                    <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "10%" }}>Rate</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "12%" }}>Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {computedItems.map((item, idx) => (
                <tr key={item.id ?? idx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-900 dark:even:bg-dark-800">
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">{idx + 1}</td>
                  <td className="border border-gray-400 px-2 py-1.5 dark:border-dark-500">{item.description}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                    {/* PHP: meter_option == 1 → show meter, else qty */}
                    {item.meter_option == 1 ? item.meter : item.qty}
                  </td>
                  {isNormalPo && (
                    <>
                      <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">{item.rate}</td>
                      <td className="border border-gray-400 px-2 py-1.5 text-right dark:border-dark-500">{fmt(item.amount)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Bottom table: BRN/remarks + summary ── */}
          <table className="mt-2 w-full border-collapse border border-gray-400 text-xs dark:border-dark-500">
            <tbody>
              <tr>
                {/* Left: IRN, BRN, Remark, company info */}
                <td className="w-3/5 border border-gray-400 p-3 align-bottom dark:border-dark-500">
                  {/* E-Invoice details (status == 2) */}
                  {isEinvoice && (
                    <div className="mb-2">
                      {invoice.irn && <div><b>Irn No:</b> {invoice.irn}</div>}
                      {invoice.ack_no && <div><b>Acknowledgment No:</b> {invoice.ack_no}</div>}
                      {invoice.ack_dt && <div><b>Acknowledgement Date:</b> {invoice.ack_dt}</div>}
                    </div>
                  )}
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
                    <SummaryRow label="Mobilization and Demobilization Charges" value={fmt(invoice.mobilisation)} />
                  )}

                  <SummaryRow label="Total" value={fmt(invoice.subtotal2)} />

                  {/* Tax */}
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
                  <b>(IN WORDS):</b> Rs. {numberToWords(Math.round(parseFloat(invoice.finaltotal) || 0))} Only
                </td>
                <td className="border border-gray-400 p-3 dark:border-dark-500">
                  <SummaryRow
                    label={`Total ${invoice.typeofinvoice} Charges`}
                    value={fmt(Math.round(parseFloat(invoice.finaltotal) || 0))}
                    bold
                  />
                </td>
              </tr>

              {/* Bank details + Authorised signatory */}
              <tr>
                <td className="border border-gray-400 p-3 align-top text-xs dark:border-dark-500">
                  <div>For online payments - {invoice.bankaccountname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                  <div>Bank Name : {invoice.bankname ?? "—"}, Branch Name : {invoice.bankbranch ?? "—"}</div>
                  <div>Bank Account No. : {invoice.bankaccountno ?? "—"}, A/c Type : {invoice.bankactype ?? "—"}</div>
                  <div>IFSC CODE: {invoice.bankifsccode ?? "—"}, MICR CODE: {invoice.bankmicr ?? "—"}</div>
                  <div className="mt-2 text-gray-600">
                    Certified that the particulars given above are true and correct.
                    The commercial values in this document are as per contract/Agreement/Purchase order terms with the customer.
                    <b> Declaration u/s 206 AB of Income Tax Act:</b> We have filed our Income Tax Return for previous two years with in specified due dates.
                  </div>
                </td>
                <td className="border border-gray-400 p-3 align-top text-xs dark:border-dark-500">
                  <div>For {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                  {/* Approved by signature */}
                  {(Number(invoice.status) === 1 || Number(invoice.status) === 2) && invoice._signature_image && (
                    <div className="mt-2">
                      <img src={invoice._signature_image} alt="Signature" className="h-10 w-24 object-contain" />
                      {invoice._digital_signature && (
                        <img src={invoice._digital_signature} alt="Digital Signature" className="mt-1 h-10 object-contain" />
                      )}
                    </div>
                  )}
                  <div className="mt-3 underline">Authorised Signatory</div>
                </td>
              </tr>

              {/* Terms & Conditions */}
              <tr>
                <td colSpan={2} className="border border-gray-400 p-3 text-xs dark:border-dark-500">
                  <b><u>Terms &amp; Conditions:</u></b>
                  <ol className="mt-1 list-decimal pl-5 space-y-0.5">
                    <li>Cross Cheque/DD should be drawn in favour of {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."} Payable at {invoice.companycity ?? "Indore"}</li>
                    <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                    <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                    <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                    <li>If the payment is to be paid in Cash pay to UPI <b>0795933A0099960.bqr@kotak</b> only and take official receipt. Else claim of payment, shall not be accepted</li>
                    <li>Subject to exclusive jurisdiction of courts at {invoice.companycity ?? "Indore"} only.</li>
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
