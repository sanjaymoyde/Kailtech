// Import Dependencies
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";
import appLogo from "assets/logo.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExportToPdfConsentLetter from "./ExportToPdfConsentLetter";

// --- Capture PDF Helper ---
async function toBase64(url) {
  if (!url) return "";
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error("Canvas toDataURL failed:", err);
        resolve("");
      }
    };
    img.onerror = () => {
      console.error("Signature image load failed via Canvas:", url);
      resolve("");
    };
    // Add cache buster to help bypass CORS/Cache issues
    img.src = `${url}${url.includes('?') ? '&' : '?'}v_cb=${Date.now()}`;
  });
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
        clonedDoc.querySelectorAll('style').forEach(st => {
          if (st.innerHTML.includes('oklch')) {
            st.innerHTML = st.innerHTML.replace(/oklch\([^)]+\)/g, 'rgb(0,0,0)');
          }
        });
        const clonedEl = clonedDoc.querySelector(`[data-export-root]`) || clonedDoc.body;
        clonedEl.style.display = "block";
      }
    });
    el.style.display = "none";
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, pageW, pageH);
    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    toast.error("Failed to generate PDF locally.");
  }
}

export default function ViewConsentLetter() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef();
  const exportRef = useRef();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const [sigBase64, setSigBase64] = useState("");

  useEffect(() => {
    toBase64(appLogo).then(setLogoBase64);
    axios.get("/get-company-info")
      .then(res => setCompanyInfo(res.data?.data))
      .catch(err => console.error("Failed to load company info:", err));
  }, []);

  useEffect(() => {
    axios.get(`/accounts/view-consentletter/${id}`)
      .then((res) => {
        const d = Array.isArray(res.data) ? res.data[0] : res.data?.data ?? res.data;
        if (d) {
          setData(d);
          if (d.digital_signature) {
            toBase64(d.digital_signature).then(setSigBase64);
          }
        } else toast.error("Consent letter not found.");
      })
      .catch((err) => {
        console.error("Failed to load consent letter:", err);
        toast.error("Failed to load consent letter.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPdf = async () => {
    if (!exportRef.current) return;
    setPdfBusy(true);
    await capturePdf(exportRef, `ConsentLetter_${data?.conosentletterno || id}.pdf`);
    setPdfBusy(false);
  };

  if (loading) return <Page title="View Consent Letter"><div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">Loading...</div></Page>;
  if (!data) return <Page title="View Consent Letter"><div className="flex h-[60vh] items-center justify-center text-gray-500">No data found.</div></Page>;

  const isDraft = data.status === 0 || data.status === "0";

  return (
    <Page title="View Consent Letter">
      <div className="p-4 sm:p-6">
        <style>{`
          @media print {
            .print\\:hidden, .sidebar-panel, .app-header { display: none !important; }
            .draft-watermark {
              background-image: url("/images/draft.png") !important;
              background-repeat: no-repeat !important;
              background-position: center !important;
            }
          }
        `}</style>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}>
            <div ref={exportRef} style={{ display: "none" }} data-export-root>
              <ExportToPdfConsentLetter
                data={data}
                companyInfo={companyInfo}
                logoBase64={logoBase64}
                sigBase64={sigBase64}
                withLH={true}
              />
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">View Consent Letter</h1>
          <div className="flex gap-2">
            <button onClick={handleExportPdf} disabled={pdfBusy} className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {pdfBusy ? "Exporting..." : "Export to PDF"}
            </button>
            <button onClick={() => window.print()} className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700">
              Print Consent Letter
            </button>
            <button onClick={() => navigate("/dashboards/accounts/consent-letter")} className="rounded border border-gray-300 bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
              &laquo; Back to List
            </button>
          </div>
        </div>

        <div ref={printRef} className={`relative mx-auto max-w-4xl rounded border border-gray-200 bg-white p-8 dark:border-dark-600 dark:bg-dark-800 print:border-0 print:p-0 ${isDraft ? "draft-watermark" : ""}`}>
          {/* Header: Logo (col-xs-3) + Info (col-xs-9) */}
          <div className="mb-8 flex items-start border-gray-100 pb-4">
            <div className="w-1/4">
              <img
                src={companyInfo?.branding?.logo || data.company_logo || appLogo}
                alt="Logo"
                className="max-h-[90px] object-contain"
              />
            </div>
            <div className="w-3/4 text-right">
              <div className="font-mono text-[13px] italic leading-tight text-black opacity-80">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
              </div>
              <h1 className="mt-2 text-2xl font-bold text-[#000080]">
                {companyInfo?.company?.name || data.company_name || "KAILTECH TEST & RESEARCH CENTRE PVT. LTD."}
              </h1>
            </div>
          </div>

          {/* Header Tier 3: Document Title (Visible only in Print/PDF) */}
          <div className="mb-6 text-center hidden print:block">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">
              CONSENT LETTER
            </h2>
          </div>

          {/* Metadata (Right Aligned) */}
          <div className="mb-6 flex justify-end">
            <div className="text-right text-[13px] leading-relaxed">
              <p className="font-semibold">{data.conosentletterno}</p>
              <p>{data.datedon}</p>
            </div>
          </div>

          {/* Customer Information (Left Aligned) */}
          <div className="mb-8 max-w-[70%]">
            <h2 className="text-[14px] font-bold uppercase text-gray-900 leading-tight">
              {data.customername}
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-gray-600">
              {data.customeraddress}
            </p>
          </div>

          {/* Body text */}
          <div className="mt-8 text-[14px] leading-relax text-gray-800 dark:text-dark-100 pr-4">
            <p>Dear Sir,</p>
            <br />
            <p>With reference to your email regarding the consent letter.</p>
            <br />
            <p className="text-justify">
              We intimate you that we have fully equipped laboratory for the complete testing as per <strong>{data.standard}</strong> {data.remark}
            </p>
            <br />
            <p className="text-justify">
              We hereby give consent for complete testing as per <strong>{data.standard}</strong> as and when the sample is provided by you on chargeable basis. {data.remark2}
            </p>
            <br />
            <p>Assuring you of the best services at our end.</p>
            <p>Please feel free to contact us for any of your query.</p>
          </div>

          {/* Footer Signature Block (Left Aligned) */}
          <div className="mt-12 text-left relative min-h-[100px]">
            <p className="text-sm font-bold text-gray-900 mb-1">
              {companyInfo?.company?.name || data.company_name || "KAILTECH TEST & RESEARCH CENTRE PVT. LTD."}
            </p>

            {data.digital_signature ? (
              <div className="mt-2 opacity-100">
                <img
                  src={data.digital_signature}
                  alt="Signature"
                  className="max-h-[110px] object-contain"
                />
              </div>
            ) : (
              <div className="mt-1 font-mono text-[12px] leading-tight text-gray-800 whitespace-pre-line">
                <p>Electronically signed by</p>
                <p>{data.approved_by_name || "Authorized Signatory"}</p>
                <p>{data.datedon || ""}</p>
              </div>
            )}
          </div>

          {data.letterhead_footer && (
            <div className="hidden print:block absolute bottom-0 left-0 w-full">
              <img src={data.letterhead_footer} alt="Letterhead Footer" className="w-full" />
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
