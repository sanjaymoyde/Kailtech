import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";

// PHP: Approve button — perm 177
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

export function RowActions({ row, table }) {
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const permissions = usePermissions();

  const id = row.original.id;

  // POST /approvals/unlock-witness  { id }
  // PHP: wapproval=1, checks papproval+approval → sets status=1, closenotification "Approve Witness"
  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      await axios.post("/approvals/unlock-witness", { id });
      toast.success("Witness Approved ✅");
      table.options.meta?.deleteRow(row);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to approve witness.";
      toast.error(msg + " ❌");
    } finally {
      setApproving(false);
    }
  }, [id, row, table]);

  // POST /approvals/cancel-witness/{id}
  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await axios.post(`/approvals/cancel-witness/${id}`);
      toast.success("Witness Cancelled ✅");
      table.options.meta?.deleteRow(row);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to cancel witness.";
      toast.error(msg + " ❌");
    } finally {
      setCancelling(false);
    }
  }, [id, row, table]);

  // PHP: only perm 177 sees Approve button
  const canApprove = permissions.includes(177);

  if (!canApprove) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleApprove}
        disabled={approving}
        className={`rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-red-700 ${approving ? "cursor-not-allowed opacity-60" : ""
          }`}
      >
        {approving ? "Approving…" : "Approve Witness"}
      </button>

      <button
        onClick={handleCancel}
        disabled={cancelling}
        className={`rounded bg-gray-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-gray-600 ${cancelling ? "cursor-not-allowed opacity-60" : ""
          }`}
      >
        {cancelling ? "Cancelling…" : "Cancel Witness"}
      </button>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};