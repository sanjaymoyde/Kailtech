// Import Dependencies
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import dayjs from "dayjs";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";
import { JWT_HOST_API } from "configs/auth.config";

// ----------------------------------------------------------------------

export default function ViewConsentLetter() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/consent-letters/${id}`)
      .then((res) => {
        const d = Array.isArray(res.data) ? res.data[0] : res.data?.data ?? res.data;
        if (d) setData(d);
        else toast.error("Consent letter not found.");
      })
      .catch((err) => {
        console.error("Failed to load consent letter:", err);
        toast.error("Failed to load consent letter.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPdf = () => {
    const base = JWT_HOST_API.replace(/\/api\/?$/, "");
    const pdfUrl = `${base}/exporttopdfconsentletter.php?hakuna=${id}`;
    const newTab = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    if (!newTab) {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  };

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

  if (loading) {
    return (
      <Page title="View Consent Letter">
        <PageSpinner />
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="View Consent Letter">
        <div className="flex h-[60vh] items-center justify-center text-gray-500">
          No data found.
        </div>
      </Page>
    );
  }

  const formattedDate = dayjs(data.consentletterdate).format("DD.MM.YYYY");
  const isDraft = data.status === 0;

  return (
    <Page title="View Consent Letter">
      <div className="p-4 sm:p-6">
        {/* Draft watermark — mirrors PHP's status==0 background-image: draft.png */}
        <style>{`
          @media print {
            .print\\:hidden { display: none !important; }
            .draft-watermark {
              background-image: url("/images/draft.png");
              background-repeat: no-repeat;
              background-position: center;
            }
          }
        `}</style>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            View Consent Letter
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleExportPdf}
              className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Export to PDF
            </button>
            <button
              onClick={() => window.print()}
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Download Consent Letter
            </button>
            <button
              onClick={() => navigate("/dashboards/accounts/consent-letter")}
              className="rounded border border-gray-300 bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              &laquo; Back to List
            </button>
          </div>
        </div>

        <div
          ref={printRef}
          className={`relative mx-auto max-w-4xl rounded border border-gray-200 bg-white p-8 dark:border-dark-600 dark:bg-dark-800 print:border-0 print:p-0 ${isDraft ? "draft-watermark" : ""}`}
        >
          <div className="flex items-start justify-between border-b border-gray-300 pb-4">
            <div className="w-1/4">
              {data.company_logo ? (
                <img
                  src={data.company_logo}
                  alt="Company Logo"
                  className="max-h-20 object-contain"
                />
              ) : (
                <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400">
                  Logo
                </div>
              )}
            </div>
            <div className="w-3/4 text-right">
              <p className="font-mono text-sm italic text-gray-600 dark:text-dark-300">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 & CC-2348),
                <br />
                BIS Recognized & ISO 9001 Certified Test & Calibration Laboratory
              </p>
              <h2 className="mt-1 text-lg font-bold text-blue-900 dark:text-blue-300">
                {data.company_name}
              </h2>
            </div>
          </div>

          {data.letterhead_footer && (
            <div className="hidden print:block print:absolute print:bottom-0 print:left-0 print:w-full">
              <img
                src={data.letterhead_footer}
                alt="Letterhead Footer"
                className="w-full"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <div className="text-right text-sm">
              <p className="font-medium">{data.conosentletterno}</p>
              <p className="text-gray-600 dark:text-dark-300">{formattedDate}</p>
            </div>
          </div>

          <div className="mt-4 pl-8 text-sm">
            <p className="font-bold">{data.customername}</p>
            <p className="mt-1 whitespace-pre-line text-gray-700 dark:text-dark-300">
              {data.customeraddress}
            </p>
          </div>

          <div className="mt-6 pl-8 pr-4 text-sm leading-7 text-gray-800 dark:text-dark-100">
            <p>Dear Sir,</p>
            <br />
            <p>With reference to your email regarding the consent letter.</p>
            <br />
            <p>
              We intimate you that we have fully equipped laboratory for the
              complete testing as per <strong>{data.standard_name}</strong> {data.remark}
            </p>
            <br />
            <p>
              We hereby give consent for complete testing as per <strong>{data.standard_name}</strong>
              as and when the sample is provided by you on chargeable basis. {data.remark2}
            </p>
            <br />
            <p>Assuring you of the best services at our end.</p>
            <br />
            <p>Please feel free to contact us for any of your query.</p>
            <br />
            <p className="font-bold">{data.company_name}</p>
          </div>

          {data.approved_by_name && (
            <div className="mt-8 pl-8">
              {data.digital_sign_url ? (
                <img
                  src={data.digital_sign_url}
                  alt="Digital Signature"
                  className="max-h-24"
                />
              ) : (
                <div className="rounded border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-dark-500">
                  <p>Electronically signed by</p>
                  <p className="font-medium">{data.approved_by_name}</p>
                  <p>{data.approved_by_designation}</p>
                  <p>{data.approved_by_empid}</p>
                  <p>{data.approved_on}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
