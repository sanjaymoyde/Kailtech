// FILE PATH: app/pages/dashboards/accounts/calibration-invoice-list/ViewCalibrationInvoice/index.jsx
// Route:  calibration-invoice-list/view/:id
// API:    GET /accounts/view-calibration-invoice/:id
// Deps:   npm install jspdf html2canvas
//
// FIX: html2canvas crashes on oklch() (Tailwind v3/v4 colors).
// Solution: a hidden <div> with ONLY inline styles (zero Tailwind classes)
// is rendered off-screen. html2canvas captures THAT div, never touching
// any Tailwind oklch color.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "utils/axios";
import { parseUserPermissions } from "utils/permissions";
import logo from "assets/krtc.jpg";

// ─── Cross-origin image → base64 data URL ────────────────────────────────────
// html2canvas cannot load images from a different origin (CORS).
// We pre-fetch them server-side via our own API proxy, or directly when the
// server allows it. Falls back to empty string on failure (image is skipped).
async function toBase64(url) {
  if (!url) return "";
  try {
    // Route through our backend proxy to avoid CORS:
    //   GET /accounts/image-proxy?url=<encoded>  → returns the image bytes
    // If your backend already proxies, use that. Otherwise fetch directly:
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    // CORS blocked — try through a backend proxy endpoint
    try {
      const res = await fetch(
        `/accounts/image-proxy?url=${encodeURIComponent(url)}`,
        { cache: "force-cache" },
      );
      if (!res.ok) return "";
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return ""; // give up — image won't appear in PDF
    }
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

// ─── Indian number → words ───────────────────────────────────────────────────
function toWords(num) {
  const n = Math.round(parseFloat(num) || 0);
  if (!isFinite(n) || n === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const cv = (x) => {
    if (!isFinite(x) || x <= 0) return "";
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    if (x < 1000)
      return (
        a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + cv(x % 100) : "")
      );
    if (x < 100000)
      return (
        cv(Math.floor(x / 1000)) +
        " Thousand" +
        (x % 1000 ? " " + cv(x % 1000) : "")
      );
    if (x < 10000000)
      return (
        cv(Math.floor(x / 100000)) +
        " Lakh" +
        (x % 100000 ? " " + cv(x % 100000) : "")
      );
    return (
      cv(Math.floor(x / 10000000)) +
      " Crore" +
      (x % 10000000 ? " " + cv(x % 10000000) : "")
    );
  };
  return cv(n);
}

const f2 = (v) => parseFloat(v ?? 0).toFixed(2);
const fmtDate = (d) =>
  d && d !== "0000-00-00 00:00:00"
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

// ─── Shared inline style tokens (no oklch anywhere) ─────────────────────────
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
  td: {
    border: "1px solid #000",
    padding: "4px 6px",
    fontSize: 11,
    verticalAlign: "top",
  },
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
  tdNB: { padding: "4px 6px", fontSize: 11, verticalAlign: "top" }, // no border
  label: { fontWeight: "bold" },
  gray: { backgroundColor: "#f9fafb" },
};

// ─── PDF capture helper ──────────────────────────────────────────────────────
// Captures the hidden printRef div (pure inline styles).
// KEY FIX: onclone removes ALL <style>/<link> tags from the cloned document
// before html2canvas parses it. This eliminates Tailwind's oklch() CSS
// variables that live in :root — our template uses only inline styles so
// removing stylesheets has zero visual effect.
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
        // Strip every stylesheet — Tailwind's oklch vars live here.
        // InvoicePrintTemplate is 100% inline-styled so this is safe.
        clonedDoc
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach((node) => node.remove());

        // Also clear any inline oklch from :root CSS vars just in case
        clonedDoc.documentElement.removeAttribute("style");
      },
    });

    el.style.display = "none";

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = pdf.internal.pageSize.getWidth(); // 210
    const pageH = pdf.internal.pageSize.getHeight(); // 297
    const margin = 8;
    const cW = pageW - margin * 2;
    const cH = (canvas.height * cW) / canvas.width;
    const pgH = pageH - margin * 2;

    let srcY = 0,
      remaining = cH,
      firstPage = true;

    while (remaining > 0) {
      if (!firstPage) {
        pdf.addPage();
      }
      firstPage = false;

      const sliceH = Math.min(remaining, pgH);
      const sc = document.createElement("canvas");
      sc.width = canvas.width;
      sc.height = Math.round((sliceH / cH) * canvas.height);
      sc.getContext("2d").drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        sc.height,
        0,
        0,
        canvas.width,
        sc.height,
      );

      pdf.addImage(
        sc.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        cW,
        sliceH,
      );
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

// ─── Confirm modal (Tailwind OK — never captured by html2canvas) ─────────────
function ConfirmModal({ open, title, message, onOk, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="dark:bg-dark-800 w-96 rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="dark:text-dark-300 mb-5 text-sm text-gray-500">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="dark:border-dark-500 dark:text-dark-200 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onOk}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    0: { label: "DRAFT", cls: "bg-gray-200 text-gray-700" },
    1: { label: "APPROVED", cls: "bg-green-100 text-green-800" },
    2: { label: "E-INVOICE", cls: "bg-blue-100 text-blue-800" },
  };
  const s = map[status] ?? {
    label: "UNKNOWN",
    cls: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// InvoicePrintTemplate — rendered off-screen, captured by html2canvas.
// !! ALL styles are INLINE — zero Tailwind classes — zero oklch !!
// ══════════════════════════════════════════════════════════════════════════════
function InvoicePrintTemplate({
  inv,
  addr,
  items,
  qrUrl,
  signUrl,
  digitalSignUrl,
  withLH,
}) {
  const statecode = !isNaN(inv.statecode)
    ? String(inv.statecode).padStart(2, "0")
    : inv.statecode;
  const isSGST = String(statecode) === "23";
  const stateLabel = inv.statename ?? statecode ?? "";
  const finalTotal = parseFloat(inv.finaltotal ?? 0);

  const optRows = [
    parseFloat(inv.discnumber) > 0 ? 1 : 0,
    parseFloat(inv.witnesscharges) > 0 ? 1 : 0,
    parseFloat(inv.samplehandling) > 0 ? 1 : 0,
    parseFloat(inv.sampleprep) > 0 ? 1 : 0,
    parseFloat(inv.freight) > 0 ? 1 : 0,
    parseFloat(inv.mobilisation) > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);
  const rowspan = 4 + optRows + (isSGST ? 2 : 1); // subtotal + opts + tax + totalWithTax + roundoff

  return (
    <div style={S.wrap}>
      {/* ── LETTERHEAD (hidden when withLH=false) ── */}
      {withLH && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ height: 60, width: "auto" }}
            crossOrigin="anonymous"
          />
          <div style={{ flex: 1, textAlign: "right" }}>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontStyle: "italic",
                color: "#555",
                margin: 0,
              }}
            >
              NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832
              &amp; CC-2348),
              <br />
              BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration
              Laboratory
            </p>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "navy",
                marginTop: 4,
              }}
            >
              Kailtech Test And Research Centre Pvt. Ltd.
            </div>
          </div>
        </div>
      )}

      {/* ── TITLE ── */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          TAX INVOICE
        </div>
        <div style={{ fontSize: 12 }}>For {inv.typeofinvoice} Charges</div>
        <div
          style={{
            fontSize: 11,
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          ORIGINAL FOR RECIPIENT
        </div>
      </div>

      {/* ── CUSTOMER + INVOICE META ── */}
      <table style={S.table}>
        <tbody>
          <tr>
            {/* Customer — width:50% */}
            <td style={{ ...S.td, width: "50%" }} colSpan={2}>
              <div style={S.label}>Customer:</div>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={S.label}>M / s . :</span>
                <div>
                  <strong>{inv.customername}</strong>
                  <br />
                  {[addr.address, addr.city, addr.pincode]
                    .filter(Boolean)
                    .join(", ")}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 4,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ ...S.tdNB, width: "50%" }}>
                          <span style={S.label}>State name : </span>
                          {stateLabel}
                          <br />
                          <span style={S.label}>GSTIN/UIN : </span>
                          {inv.gstno}
                        </td>
                        <td style={{ ...S.tdNB, width: "50%" }}>
                          <span style={S.label}>State code : </span>
                          {!isNaN(inv.statecode) ? statecode : "NA"}
                          <br />
                          <span style={S.label}>PAN: </span>
                          {inv.pan}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {inv.concern_person && (
                <div style={{ marginTop: 4, fontSize: 11 }}>
                  Kind Attn. {inv.concern_person}
                </div>
              )}
            </td>

            {/* Invoice meta — border-right:none when QR present */}
            <td
              style={{
                ...S.td,
                width: "30%",
                borderRight:
                  inv.status === 2 && qrUrl ? "1px solid #000" : "none",
              }}
              colSpan={inv.status === 2 && qrUrl ? 2 : 3}
            >
              <div>
                <span style={S.label}>Invoice No. : </span>
                {inv.invoiceno}
              </div>
              <div>
                <span style={S.label}>Date : </span>
                {fmtDate(inv.approved_on)}
              </div>
              <div>
                <span style={S.label}>P.O. No./ Date : </span>
                {inv.ponumber}
              </div>
            </td>

            {/* QR — only status==2 */}
            {inv.status === 2 && qrUrl && (
              <td
                style={{ ...S.td, borderLeft: "none", width: 90, padding: 4 }}
              >
                <div style={{ border: "2px solid #000", overflow: "hidden" }}>
                  <img
                    src={qrUrl}
                    alt="QR"
                    style={{ width: "100%", display: "block" }}
                    crossOrigin="anonymous"
                  />
                </div>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/* ── LINE ITEMS ── */}
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "8%" }}>S. No.</th>
            <th style={{ ...S.th, width: "52%" }}>Description</th>
            <th style={S.th}>
              {items[0]?.meter_option === 1 ? "Meter's" : "No's"}
            </th>
            {inv.potype === "Normal" && (
              <>
                <th style={S.th}>Rate</th>
                <th style={S.th}>Amount</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id ?? i} style={i % 2 === 1 ? S.gray : {}}>
              <td style={S.tdC}>{i + 1}</td>
              <td style={S.td}>{item.description}</td>
              <td style={S.tdC}>
                {item.meter_option === 1 ? item.meter : item.qty}
              </td>
              {inv.potype === "Normal" && (
                <>
                  <td style={S.tdC}>{item.rate}</td>
                  <td style={S.tdR}>{f2(item.amount)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTALS TABLE ── */}
      <table style={{ ...S.table, pageBreakInside: "avoid" }}>
        <tbody>
          <tr>
            {/* Left cell — rowspan covers all charge rows */}
            <td
              style={{ ...S.td, width: "60%", verticalAlign: "bottom" }}
              rowSpan={rowspan}
              colSpan={3}
            >
              {inv.status === 2 && (
                <div style={{ marginBottom: 8 }}>
                  <div>
                    <span style={S.label}>Irn No:</span> {inv.irn}
                  </div>
                  <div>
                    <span style={S.label}>Acknowledgment No:</span> {inv.ack_no}
                  </div>
                  <div>
                    <span style={S.label}>Acknowledgement Date:</span>{" "}
                    {inv.ack_dt}
                  </div>
                </div>
              )}
              {inv.brnnos?.trim() && (
                <div>
                  <span style={S.label}>BRN No :</span> {inv.brnnos}
                </div>
              )}
              {inv.remark?.trim() && (
                <div>
                  <span style={S.label}>Remark :</span> {inv.remark}
                </div>
              )}
              {(inv.brnnos?.trim() || inv.remark?.trim()) && <br />}
              <div>PAN : AADCK0799A</div>
              <div>GSTIN : 23AADCK0799A1ZV</div>
              <div>
                SAC Code : 998394 Category : Scientific and Technical
                Consultancy Services
              </div>
              <div>Udhyam Registeration No. Type of MSME : 230262102537</div>
              <div>CIN NO.U73100MP2006PTC019006</div>
            </td>
            <td style={{ ...S.td, width: "22%" }}>Subtotal</td>
            <td style={{ ...S.tdR, width: "18%" }}>{f2(inv.subtotal)}</td>
          </tr>

          {/* Optional rows */}
          {parseFloat(inv.discnumber) > 0 && (
            <tr>
              <td style={S.td}>
                Discount ({inv.discnumber}
                {inv.disctype === "%" ? "%" : ""})
              </td>
              <td style={S.tdR}>{f2(inv.discount)}</td>
            </tr>
          )}
          {parseFloat(inv.witnesscharges) > 0 && (
            <tr>
              <td style={S.td}>
                Witness Charges ({inv.witnessnumber}
                {inv.witnesstype === "%" ? "%" : ""})
              </td>
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

          {/* Words + Final total */}
          <tr>
            <td style={{ ...S.td, borderRight: "none" }} colSpan={3}>
              <span style={S.label}>(IN WORDS):</span> Rs.{" "}
              {toWords(Math.round(finalTotal))} Only
            </td>
            <td style={{ ...S.td, borderLeft: "none", textAlign: "right" }}>
              <span style={S.label}>Total {inv.typeofinvoice} Charges</span>
            </td>
            <td style={{ ...S.tdR, fontWeight: "bold" }}>
              {f2(Math.round(finalTotal))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── BANK + SIGNATORY + T&C ── */}
      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "60%", borderRight: "none" }}>
              <div>For online payments — {inv.bankaccountname ?? ""}</div>
              <div>
                Bank Name : {inv.bankname ?? ""}, Branch Name :{" "}
                {inv.bankbranch ?? ""}
              </div>
              <div>
                Bank Account No. : {inv.bankaccountno ?? ""}, A/c Type :{" "}
                {inv.bankactype ?? ""}
              </div>
              <div>
                IFSC CODE: {inv.bankifsccode ?? ""}, MICR CODE:{" "}
                {inv.bankmicr ?? ""}
              </div>
              <div style={{ marginTop: 6, fontSize: 10 }}>
                Certified that the particulars given above are true and correct.
                The commercial values in this document are as per contract/
                Agreement/ Purchase order terms with the customer.{" "}
                <span style={S.label}>
                  Declaration u/s 206AB of Income Tax Act:
                </span>{" "}
                We have filed our Income Tax Return for previous two years with
                in specified due dates.
              </div>
            </td>
            <td
              style={{
                ...S.td,
                borderLeft: "none",
                borderBottom: "none",
                textAlign: "right",
              }}
            >
              <div>For Kailtech Test And Research Centre Pvt. Ltd.</div>
              {(inv.status === 1 || inv.status === 2) && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  {signUrl && (
                    <img
                      src={signUrl}
                      alt="Sign"
                      crossOrigin="anonymous"
                      style={{ width: 100, height: 40, objectFit: "contain" }}
                    />
                  )}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <img
                      src="/images/seal.png"
                      alt="Seal"
                      style={{ width: 80 }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    {digitalSignUrl && (
                      <img
                        src={digitalSignUrl}
                        alt="DigSign"
                        crossOrigin="anonymous"
                        style={{ maxHeight: 50, objectFit: "contain" }}
                      />
                    )}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <u>Authorised Signatory</u>
              </div>
            </td>
          </tr>

          {/* Terms & Conditions */}
          <tr>
            <td style={{ ...S.td, fontSize: 10 }} colSpan={2}>
              <strong>
                <u>Terms &amp; Conditions:</u>
              </strong>
              <ol
                style={{ margin: "4px 0 0", paddingLeft: 20, lineHeight: 1.7 }}
              >
                <li>
                  Cross Cheque/DD should be drawn in favour of Kailtech Test And
                  Research Centre Pvt. Ltd. Payable at Indore
                </li>
                <li>
                  Please attached bill details indicating Invoice No. Quotation
                  no &amp; TDS deductions if any along with your payment.
                </li>
                <li>
                  As per existing GST rules. the GSTR-1 has to be filed in the
                  immediate next month of billing. So if you have any issue in
                  this tax invoice viz customer Name, Address, GST No., Amount
                  etc, please inform positively in writing before 5th of next
                  month, otherwise no such request will be entertained.
                </li>
                <li>
                  Payment not made with in 15 days from the date of issued bill
                  will attract interest @ 24% P.A.
                </li>
                <li>
                  If the payment is to be paid in Cash pay to UPI{" "}
                  <strong>0795933A0099960.bqr@kotak</strong> only and take
                  official receipt. Else claim of payment, shall not be accepted
                </li>
                <li>
                  Subject to exclusive jurisdiction of courts at Indore only.
                </li>
                <li>Errors &amp; omissions accepted.</li>
              </ol>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          color: "#888",
          marginTop: 8,
        }}
      >
        This is a system generated invoice
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
export default function ViewCalibrationInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = useMemo(() => {
    if (typeof window === "undefined") return [];
    return parseUserPermissions(localStorage.getItem("userPermissions"));
  }, []);
  const hasPerm = useCallback((permission) => permissions.includes(permission), [
    permissions,
  ]);

  // Two separate print refs: one WITH letterhead, one WITHOUT
  const printWithLH = useRef(null);
  const printWithoutLH = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgBase64, setImgBase64] = useState({ qr: "", sign: "", dSign: "" }); // pre-loaded for PDF
  const [approveModal, setApproveModal] = useState(false);
  const [einvModal, setEinvModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/accounts/view-calibration-invoice/${id}`);
      const d = res.data?.data ?? res.data;
      setData(d);

      // Pre-load cross-origin images as base64 so html2canvas can render them.
      // lims.kailtech.in images will CORS-block html2canvas without this step.
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

  const doApprove = async () => {
    try {
      setBusy(true);
      await axios.post("/accounts/approve-calibration-invoice", {
        invoiceid: id,
      });
      toast.success("Invoice approved");
      setApproveModal(false);
      load();
    } catch {
      toast.error("Failed to approve invoice");
    } finally {
      setBusy(false);
    }
  };

  const doEInvoice = async () => {
    try {
      setBusy(true);
      await axios.post("/accounts/generate-einvoice", { invoiceid: id });
      toast.success("E-Invoice generated");
      setEinvModal(false);
      load();
    } catch {
      toast.error("Failed to generate E-Invoice");
    } finally {
      setBusy(false);
    }
  };

  const handlePdfWithLH = async () => {
    setPdfBusy(true);
    await capturePdf(
      printWithLH,
      `${data?.invoice?.invoiceno ?? "invoice"}.pdf`,
    );
    setPdfBusy(false);
  };

  const handlePdfWithoutLH = async () => {
    setPdfBusy(true);
    await capturePdf(
      printWithoutLH,
      `${data?.invoice?.invoiceno ?? "invoice"}withoutletterhead.pdf`,
    );
    setPdfBusy(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg
          className="h-5 w-5 animate-spin text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
          />
        </svg>
        Loading invoice…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-400">
        Invoice not found.
      </div>
    );
  }

  const inv = data.invoice ?? {};
  const addr = data.address ?? {};
  const items = data.items ?? [];
  const qrUrl = data.qr_image; // used in on-screen view
  const signUrl = data.signature_image;
  const digitalSignUrl = data.digital_signature;

  const statecode = !isNaN(inv.statecode)
    ? String(inv.statecode).padStart(2, "0")
    : inv.statecode;
  const isSGST = String(statecode) === "23";
  const finalTotal = parseFloat(inv.finaltotal ?? 0);
  const isFOC = inv.invoiceno === "FOC";
  const invoiceDate = fmtDate(inv.approved_on);

  const canApprove =
    inv.status === 0 &&
    ((hasPerm(269) && finalTotal <= 5000) ||
      (hasPerm(270) && finalTotal > 5000));

  const approvedAt = inv.approved_on ? new Date(inv.approved_on) : null;
  const canEInvoice =
    !isFOC &&
    inv.status === 1 &&
    approvedAt >= new Date("2023-08-01") &&
    hasPerm(466) &&
    finalTotal !== 0;

  const stateLabel = inv.statename ?? statecode ?? "";

  // PDF template uses base64 data URLs (no CORS issue).
  // On-screen view uses original URLs (browser loads them normally).
  const templateProps = {
    inv,
    addr,
    items,
    qrUrl: imgBase64.qr || qrUrl,
    signUrl: imgBase64.sign || signUrl,
    digitalSignUrl: imgBase64.dSign || digitalSignUrl,
  };

  return (
    <div className="transition-content px-(--margin-x) pb-10">
      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <ConfirmModal
        open={approveModal}
        title="Approve Invoice"
        message={`Approve invoice ${inv.invoiceno || "#" + id}?`}
        onOk={doApprove}
        onCancel={() => setApproveModal(false)}
        loading={busy}
      />
      <ConfirmModal
        open={einvModal}
        title="Generate E-Invoice"
        message="Are you sure? This action cannot be undone."
        onOk={doEInvoice}
        onCancel={() => setEinvModal(false)}
        loading={busy}
      />

      {/* ── Hidden print templates (off-screen, captured by html2canvas) ─
           display:none blocks canvas capture, so we use position absolute
           far off-screen but keep display:block                          */}
      <div
        style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}
      >
        {/* WITH letterhead */}
        <div ref={printWithLH}>
          <InvoicePrintTemplate {...templateProps} withLH={true} />
        </div>
      </div>
      <div
        style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}
      >
        {/* WITHOUT letterhead */}
        <div ref={printWithoutLH}>
          <InvoicePrintTemplate {...templateProps} withLH={false} />
        </div>
      </div>

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <div className="dark:border-dark-600 dark:bg-dark-800 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 print:hidden">
        <button
          onClick={handlePdfWithLH}
          disabled={pdfBusy}
          className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {pdfBusy ? (
            <svg
              className="h-3.5 w-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
              />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          )}
          Export PDF Invoice
        </button>
        <button
          onClick={handlePdfWithoutLH}
          disabled={pdfBusy}
          className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          Export PDF Without LetterHead
        </button>
        <button
          onClick={() =>
            navigate("/dashboards/accounts/calibration-invoice-list")
          }
          className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
        >
          Back To Invoice list
        </button>
        {canApprove && (
          <button
            onClick={() => setApproveModal(true)}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Approve
          </button>
        )}
        {canEInvoice && (
          <button
            onClick={() => setEinvModal(true)}
            className="rounded bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Generate E-Invoice
          </button>
        )}
        <div className="ml-auto">
          <StatusBadge status={inv.status} />
        </div>
      </div>

      {/* ── ON-SCREEN INVOICE (Tailwind OK here — never captured) ─────── */}
      <div
        className="relative overflow-hidden bg-white shadow-md"
        style={{ fontFamily: "Arial,Helvetica,sans-serif", fontSize: 13 }}
      >
        {inv.status === 0 && (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
            style={{ opacity: 0.07 }}
          >
            <span
              className="font-black tracking-widest text-gray-800 uppercase"
              style={{ fontSize: 180, transform: "rotate(-30deg)" }}
            >
              DRAFT
            </span>
          </div>
        )}
        <div className="relative z-10 p-5">
          {/* Letterhead */}
          <div className="mb-3 flex items-start gap-4">
            <img src={logo} alt="Logo" style={{ height: 60, width: "auto" }} />
            <div className="flex-1 text-right">
              <p className="font-mono text-xs text-gray-500 italic">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos.
                TC-7832 &amp; CC-2348),
                <br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration
                Laboratory
              </p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "navy" }}>
                Kailtech Test And Research Centre Pvt. Ltd.
              </h2>
            </div>
          </div>

          <div className="mb-2 text-center">
            <div className="text-base font-bold uppercase">TAX INVOICE</div>
            <div className="text-sm">For {inv.typeofinvoice} Charges</div>
            <div className="text-xs font-semibold text-gray-600 uppercase">
              ORIGINAL FOR RECIPIENT
            </div>
          </div>

          {/* Customer + meta */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 p-2 align-top"
                  style={{ width: "50%" }}
                  colSpan={2}
                >
                  <strong>Customer:</strong>
                  <br />
                  <strong>M / s . :</strong> <strong>{inv.customername}</strong>
                  <br />
                  {[addr.address, addr.city, addr.pincode]
                    .filter(Boolean)
                    .join(", ")}
                  <div className="mt-1 flex flex-wrap gap-x-6">
                    <span>
                      <strong>State name : </strong>
                      {stateLabel}
                    </span>
                    <span>
                      <strong>State code : </strong>
                      {!isNaN(inv.statecode) ? statecode : "NA"}
                    </span>
                    <span>
                      <strong>GSTIN/UIN : </strong>
                      {inv.gstno}
                    </span>
                    <span>
                      <strong>PAN: </strong>
                      {inv.pan}
                    </span>
                  </div>
                  {inv.concern_person && (
                    <div className="mt-1 text-xs">
                      Kind Attn. {inv.concern_person}
                    </div>
                  )}
                </td>
                <td
                  className="border border-gray-400 p-2 align-top"
                  style={{
                    width: "30%",
                    borderRight: inv.status === 2 && qrUrl ? undefined : "none",
                  }}
                  colSpan={inv.status === 2 && qrUrl ? 2 : 3}
                >
                  <div>
                    <strong>Invoice No. : </strong>
                    {inv.invoiceno}
                  </div>
                  <div>
                    <strong>Date : </strong>
                    {invoiceDate}
                  </div>
                  <div>
                    <strong>P.O. No./ Date : </strong>
                    {inv.ponumber}
                  </div>
                </td>
                {inv.status === 2 && qrUrl && (
                  <td
                    className="border border-gray-400 p-1 align-top"
                    style={{ borderLeft: "none", width: 90 }}
                  >
                    <div
                      style={{ border: "2px solid #000", overflow: "hidden" }}
                    >
                      <img
                        src={qrUrl}
                        alt="QR"
                        style={{ width: "100%" }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          {/* Items */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th
                  className="border border-gray-400 px-2 py-1 text-center"
                  style={{ width: "8%" }}
                >
                  S. No.
                </th>
                <th
                  className="border border-gray-400 px-2 py-1 text-center"
                  style={{ width: "52%" }}
                >
                  Description
                </th>
                <th className="border border-gray-400 px-2 py-1 text-center">
                  {items[0]?.meter_option === 1 ? "Meter's" : "No's"}
                </th>
                {inv.potype === "Normal" && (
                  <>
                    <th className="border border-gray-400 px-2 py-1 text-center">
                      Rate
                    </th>
                    <th className="border border-gray-400 px-2 py-1 text-center">
                      Amount
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id ?? i}
                  className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {item.description}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {item.meter_option === 1 ? item.meter : item.qty}
                  </td>
                  {inv.potype === "Normal" && (
                    <>
                      <td className="border border-gray-400 px-2 py-1 text-center">
                        {item.rate}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 pr-2 text-right tabular-nums">
                        {f2(item.amount)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 p-3 align-bottom"
                  style={{ width: "60%" }}
                  colSpan={3}
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
                  {inv.status === 2 && (
                    <div className="mb-2 text-xs">
                      <div>
                        <strong>Irn No:</strong> {inv.irn}
                      </div>
                      <div>
                        <strong>Acknowledgment No:</strong> {inv.ack_no}
                      </div>
                      <div>
                        <strong>Acknowledgement Date:</strong> {inv.ack_dt}
                      </div>
                    </div>
                  )}
                  {inv.brnnos?.trim() && (
                    <div>
                      <strong>BRN No :</strong> {inv.brnnos}
                    </div>
                  )}
                  {inv.remark?.trim() && (
                    <div>
                      <strong>Remark :</strong> {inv.remark}
                    </div>
                  )}
                  <div>PAN : AADCK0799A</div>
                  <div>GSTIN : 23AADCK0799A1ZV</div>
                  <div>
                    SAC Code : 998394 Category : Scientific and Technical
                    Consultancy Services
                  </div>
                  <div>
                    Udhyam Registeration No. Type of MSME : 230262102537
                  </div>
                  <div>CIN NO.U73100MP2006PTC019006</div>
                </td>
                <td
                  className="border border-gray-400 px-2 py-1"
                  style={{ width: "22%" }}
                >
                  Subtotal
                </td>
                <td
                  className="border border-gray-400 px-2 py-1 text-right tabular-nums"
                  style={{ width: "18%" }}
                >
                  {f2(inv.subtotal)}
                </td>
              </tr>
              {parseFloat(inv.discnumber) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Discount ({inv.discnumber}
                    {inv.disctype === "%" ? "%" : ""})
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.discount)}
                  </td>
                </tr>
              )}
              {parseFloat(inv.witnesscharges) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Witness Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.witnesscharges)}
                  </td>
                </tr>
              )}
              {parseFloat(inv.samplehandling) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Sample Handling
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.samplehandling)}
                  </td>
                </tr>
              )}
              {parseFloat(inv.sampleprep) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Sample Preparation Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.sampleprep)}
                  </td>
                </tr>
              )}
              {parseFloat(inv.freight) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Freight Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.freight)}
                  </td>
                </tr>
              )}
              {parseFloat(inv.mobilisation) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Mobilization and Demobilization Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.mobilisation)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 px-2 py-1">Total</td>
                <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                  {f2(inv.subtotal2)}
                </td>
              </tr>
              {isSGST ? (
                <>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">
                      CGST {inv.cgstper}%
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                      {f2(inv.cgstamount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">
                      SGST {inv.sgstper}%
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                      {f2(inv.sgstamount)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    IGST {inv.igstper}%
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {f2(inv.igstamount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  Total Charges With tax
                </td>
                <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                  {f2(inv.total)}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">Round off</td>
                <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                  {f2(inv.roundoff)}
                </td>
              </tr>
              <tr>
                <td
                  className="border border-gray-400 px-2 py-1"
                  colSpan={3}
                  style={{ borderRight: "none" }}
                >
                  <strong>(IN WORDS):</strong> Rs.{" "}
                  {toWords(Math.round(finalTotal))} Only
                </td>
                <td
                  className="border border-gray-400 px-2 py-1 text-right"
                  style={{ borderLeft: "none" }}
                >
                  <strong>Total {inv.typeofinvoice} Charges</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1 text-right font-bold tabular-nums">
                  {f2(Math.round(finalTotal))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bank + Signatory + T&C */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 p-3 align-top"
                  style={{ width: "60%", borderRight: "none" }}
                >
                  <div>For online payments — {inv.bankaccountname ?? ""}</div>
                  <div>
                    Bank Name : {inv.bankname ?? ""}, Branch Name :{" "}
                    {inv.bankbranch ?? ""}
                  </div>
                  <div>
                    Bank Account No. : {inv.bankaccountno ?? ""}, A/c Type :{" "}
                    {inv.bankactype ?? ""}
                  </div>
                  <div>
                    IFSC CODE: {inv.bankifsccode ?? ""}, MICR CODE:{" "}
                    {inv.bankmicr ?? ""}
                  </div>
                  <div className="mt-2 text-xs">
                    Certified that the particulars given above are true and
                    correct. The commercial values in this document are as per
                    contract/Agreement/Purchase order terms with the customer.{" "}
                    <strong>Declaration u/s 206AB of Income Tax Act:</strong> We
                    have filed our Income Tax Return for previous two years with
                    in specified due dates.
                  </div>
                </td>
                <td
                  className="border border-gray-400 p-3 text-right align-top"
                  style={{ borderLeft: "none", borderBottom: "none" }}
                >
                  <div>For Kailtech Test And Research Centre Pvt. Ltd.</div>
                  {(inv.status === 1 || inv.status === 2) && (
                    <div className="mt-2 flex flex-col items-end gap-1">
                      {signUrl && (
                        <img
                          src={signUrl}
                          alt="Sign"
                          crossOrigin="anonymous"
                          style={{
                            width: 100,
                            height: 40,
                            objectFit: "contain",
                          }}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/seal.png"
                          alt="Seal"
                          style={{ width: 80 }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        {digitalSignUrl && (
                          <img
                            src={digitalSignUrl}
                            alt="DigSign"
                            crossOrigin="anonymous"
                            style={{ maxHeight: 50, objectFit: "contain" }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <u>Authorised Signatory</u>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-3 text-xs" colSpan={2}>
                  <strong>
                    <u>Terms &amp; Conditions:</u>
                  </strong>
                  <ol className="mt-1 list-decimal pl-5 leading-relaxed">
                    <li>
                      Cross Cheque/DD should be drawn in favour of Kailtech Test
                      And Research Centre Pvt. Ltd. Payable at Indore
                    </li>
                    <li>
                      Please attached bill details indicating Invoice No.
                      Quotation no &amp; TDS deductions if any along with your
                      payment.
                    </li>
                    <li>
                      As per existing GST rules. the GSTR-1 has to be filed in
                      the immediate next month of billing. So if you have any
                      issue in this tax invoice viz customer Name, Address, GST
                      No., Amount etc, please inform positively in writing
                      before 5th of next month, otherwise no such request will
                      be entertained.
                    </li>
                    <li>
                      Payment not made with in 15 days from the date of issued
                      bill will attract interest @ 24% P.A.
                    </li>
                    <li>
                      If the payment is to be paid in Cash pay to UPI{" "}
                      <strong>0795933A0099960.bqr@kotak</strong> only and take
                      official receipt. Else claim of payment, shall not be
                      accepted
                    </li>
                    <li>
                      Subject to exclusive jurisdiction of courts at Indore
                      only.
                    </li>
                    <li>Errors &amp; omissions accepted.</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-center text-xs text-gray-400">
            This is a system generated invoice
          </div>
        </div>
      </div>
    </div>
  );
}
