// Import Dependencies
import PropTypes from "prop-types";

// ----------------------------------------------------------------------

export function RowActions({ row, onApproveReject }) {
  const status = row.original.status;
  const isPending = status === 0 || status === "0";

  console.log("Row data:", row.original); // Debug log
  console.log("Status:", status, "isPending:", isPending); // Debug log

  // If not pending, show nothing
  if (!isPending) {
    return null;
  }

  const handleAction = () => {
    onApproveReject(row.original);
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleAction}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Approve / Reject
      </button>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  onApproveReject: PropTypes.func,
};
