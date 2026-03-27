// Import Dependencies
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "utils/axios";

// ----------------------------------------------------------------------

function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

export function RowActions({ row, table }) {
  const navigate = useNavigate();
  const permissions = usePermissions();

  const {
    id,
    trf,
    view_report,       // "https://…/testreports/testreport{id}.pdf"
    view_report_with,  // "https://…/testreports/testreportlh{id}.pdf"
  } = row.original;

  const [regenerating, setRegenerating] = useState(false);
  const [regenResult, setRegenResult] = useState(null);



  // ── Regenerate Cache Copy ──────────────────────────────────────────────
  // GET /actionitem/Regeneratetest-Cache-Copy/:tid/:trf
  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setRegenResult(null);
      const res = await axios.post(`/actionitem/Regeneratetest-Cache-Copy/${id}/${trf ?? ""}`);
      const ok = res.data?.status === "true" || res.data?.status === true;
      // Update view_report links in table row if returned
      if (ok && res.data?.pdf) {
        table?.options?.meta?.updateData?.(row.index, "view_report", res.data.pdf);
        table?.options?.meta?.updateData?.(row.index, "view_report_with", res.data.lpdf);
      }
      setRegenResult({ ok, message: ok ? "Cache regenerated successfully." : "Regeneration failed." });
      setTimeout(() => setRegenResult(null), 2500);
    } catch {
      setRegenResult({ ok: false, message: "Regeneration failed." });
      setTimeout(() => setRegenResult(null), 2500);
    } finally {
      setRegenerating(false);
    }
  };

  // ── Upload Amended Report ──────────────────────────────────────────────
  // PHP: dynamicmodal(tid, 'amendreport.php', 'what', 'Choose Chemist')
  // perm 267
  const handleAmendedReport = () => {
    navigate(`/dashboards/action-items/signed-reports/amend/${id}`);
  };

  // ── Request Revision ───────────────────────────────────────────────────
  // PHP: dynamicmodal(tid, 'requestrevtesting.php', trf, 'Request For Revision')
  // perm 411
  const handleRequestRevision = () => {
    navigate(
      `/dashboards/action-items/signed-reports/request-revision?tid=${id}&trf=${trf ?? ""}`
    );
  };


  // ── View Report links (only if PDF exists) ─────────────────────────────
  // PHP: if(file_exists($fileWithFullPath))
  const hasViewReport = Boolean(view_report);

  return (
    <div className="flex flex-col gap-1.5">




      {/* ── Upload Amended Report — perm 267 ──────────────────────── */}
      {permissions.includes(267) && (
        <button
          onClick={handleAmendedReport}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          Upload Amended Report
        </button>
      )}

      {/* ── Regenerate Cache Copy — always shown ──────────────────── */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {regenerating ? "Regenerating…" : "Regenerate Cache Copy"}
      </button>

      {/* ── View Report + View Report With Letterhead ─────────────── */}
      {/* PHP: if(file_exists($fileWithFullPath)) → show both links */}
      {hasViewReport && (
        <>
          <button
            onClick={() => window.open(view_report, "_blank", "noreferrer")}
            className="rounded-md bg-cyan-500 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            View Report
          </button>
          {view_report_with && (
            <button
              onClick={() => window.open(view_report_with, "_blank", "noreferrer")}
              className="rounded-md bg-cyan-500 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              View Report With Letterhead
            </button>
          )}
        </>
      )}

      {/* ── Request Revision — perm 411 ───────────────────────────── */}
      {permissions.includes(411) && (
        <button
          onClick={handleRequestRevision}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          Request Revision
        </button>
      )}

      {/* Regen result toast */}
      {regenResult && (
        <p
          className={`mt-1 rounded px-2 py-1 text-xs font-medium ${regenResult.ok
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
            }`}
        >
          {regenResult.ok ? "✓ " : "⚠ "}{regenResult.message}
        </p>
      )}
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object,
};