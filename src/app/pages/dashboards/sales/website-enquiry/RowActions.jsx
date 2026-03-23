// Import Dependencies
import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";

// ----------------------------------------------------------------------

const confirmDeleteMessages = {
  pending: {
    description: "Are you sure you want to delete this enquiry? This cannot be undone.",
  },
  success: { title: "Enquiry Deleted" },
};

export function RowActions({ row, table }) {
  const { id } = row.original;

  // ── Delete ──────────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      // API endpoint for deleting enquiry (placeholder, update later if needed)
      await axios.delete(`/sales/delete-website-enquiry/${id}`);
      setDeleteSuccess(true);
      toast.success("Enquiry deleted ✅");
      setTimeout(() => {
        setDeleteOpen(false);
        table.options.meta?.deleteRow(row);
      }, 800);
    } catch {
      setDeleteError(true);
      toast.error("Failed to delete enquiry");
    } finally {
      setDeleteLoading(false);
    }
  }, [id, row, table]);

  const deleteState = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => {
             // Handle View/Edit logic here, e.g., open a drawer or navigate
             toast.info("View functionality to be implemented");
          }}
          className="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
        >
          View
        </button>
        <button
          onClick={() => {
            setDeleteOpen(true);
            setDeleteError(false);
            setDeleteSuccess(false);
          }}
          className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
        >
          Delete
        </button>
      </div>

      <ConfirmModal
        show={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        messages={confirmDeleteMessages}
        onOk={handleDelete}
        confirmLoading={deleteLoading}
        state={deleteState}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
