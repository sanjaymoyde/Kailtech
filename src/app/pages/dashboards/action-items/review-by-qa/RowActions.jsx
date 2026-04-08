// RowActions.jsx
// PHP equivalent: qareportsdata.php action buttons
//
// PHP logic:
//   $trfstatus == 3  → "Allot Quantity" + "Remove Item"
//   $trfstatus == 4  → "Assign Chemist"
//   $trfstatus == 5  → "Upload Report" (packtype=0) OR "Perform Test"
//   $trfstatus == 6  → "View Draft Report"
//   $trfstatus == 7  → "Review By HOD"        → testreport.php?hakuna=tid&what=hid
//   $trfstatus == 8  → "Review By QA"         → /dashboards/action-items/review-by-qa/:tid?hid=hid  ✅
//   $trfstatus == 9  → "Generate Final Report"
//   else             → "Pending TRF Approval"
//
// API fields (from /actionitem/qa-report-list response):
//   row.id          → $tid  (trfProducts.id)
//   row.hod_id      → $hid  (hodrequests.id)
//   row.hod_status  → $trfstatus
//   row.package_type → $packtype  (0=upload, 1=perform)

import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

// ── Button style map (same as HOD RowActions) ────────────────────────────────
const btnCls = {
  primary: "rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-blue-700 active:scale-95",
  info:    "rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-cyan-600 active:scale-95",
  warning: "rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-amber-600 active:scale-95",
  success: "rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-green-700 active:scale-95",
  muted:   "rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export function RowActions({ row }) {
  const navigate = useNavigate();

  // API field names from /actionitem/qa-report-list response
  const tid       = row.original.id;           // trfProducts.id
  const hid       = row.original.hod_id;       // hodrequests.id
  const hodStatus = row.original.hod_status;   // hodrequests.status
  const packtype  = row.original.package_type; // 0=upload, 1=perform

  const go = (path) => navigate(path);

  switch (hodStatus) {

    // PHP: $trfstatus == 3
    case 3:
      return (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => go(`/dashboards/action-items/allot-quantity/${tid}`)}
            className={btnCls.primary}
          >
            Allot Quantity
          </button>
          <button
            onClick={() => go(`/dashboards/action-items/delete-trf-item/${tid}`)}
            className={btnCls.info}
          >
            Remove Item
          </button>
        </div>
      );

    // PHP: $trfstatus == 4
    case 4:
      return (
        <button
          onClick={() => go(`/dashboards/action-items/assign-chemist/${tid}`)}
          className={btnCls.primary}
        >
          Assign Chemist
        </button>
      );

    // PHP: $trfstatus == 5 — packtype==0 → Upload Report, else → Perform Test
    case 5:
      return packtype === 0 ? (
        <button
          onClick={() => go(`/dashboards/action-items/upload-report/${tid}`)}
          className={btnCls.primary}
        >
          Upload Report
        </button>
      ) : (
        <button
          onClick={() => go(`/dashboards/action-items/perform-test/${tid}`)}
          className={btnCls.primary}
        >
          Perform Test
        </button>
      );

    // PHP: $trfstatus == 6 → View Draft Report
    case 6:
      return (
        <button
          onClick={() => go(`/dashboards/action-items/review-by-hod/${tid}`)}
          className={btnCls.primary}
        >
          View Draft Report
        </button>
      );

    // PHP: $trfstatus == 7 → Review By HOD (testreport.php?hakuna=tid&what=hid)
    case 7:
      return (
        <button
          onClick={() =>
            go(
              hid
                ? `/dashboards/action-items/review-by-hod/${tid}?hid=${hid}`
                : `/dashboards/action-items/review-by-hod/${tid}`
            )
          }
          className={btnCls.primary}
        >
          Review By HOD
        </button>
      );

    // PHP: $trfstatus == 8 → Review By QA
    // Route: /dashboards/action-items/review-by-qa/:tid?hid=hid
    case 8:
      return (
        <button
          onClick={() =>
            go(
              hid
                ? `/dashboards/action-items/review-by-qa/${tid}?hid=${hid}`
                : `/dashboards/action-items/review-by-qa/${tid}`
            )
          }
          className={btnCls.primary}
        >
          Review By QA
        </button>
      );

    // PHP: $trfstatus == 9 → Generate Final Report
    case 9:
      return (
        <button
          onClick={() => go(`/dashboards/action-items/review-by-hod/${tid}`)}
          className={btnCls.primary}
        >
          Generate Final Report
        </button>
      );

    // PHP: else → "Pending TRF Approval"
    default:
      return (
        <span className={btnCls.muted}>Pending TRF Approval</span>
      );
  }
}

RowActions.propTypes = {
  row:   PropTypes.object,
  table: PropTypes.object,
};
