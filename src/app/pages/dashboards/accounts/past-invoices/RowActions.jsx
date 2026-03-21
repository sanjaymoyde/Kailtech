import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { Dialog } from "@headlessui/react";
import { Button } from "components/ui";
import axios from "utils/axios";
import toast from "react-hot-toast";

export function RowActions({ row }) {
  const navigate = useNavigate();
  const { id, invoiceno } = row.original;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/accounts/cancel-request", {
        invoiceid: id,
        reason: reason.trim(),
      });

      const ok =
        res.data?.success === true ||
        res.data?.status === true ||
        res.data?.status === "true";

      if (!ok) {
        toast.error(
          res.data?.message ??
            "A request already pending. Please complete that first",
        );
        return;
      }

      toast.success(res.data?.message ?? "Cancellation request submitted");
      setOpen(false);
      setReason("");
    } catch (err) {
      console.error(err);
      toast.error(err?.message ?? "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          color="warning"
          className="h-7 rounded px-3 text-xs"
          onClick={() => navigate(`/dashboards/accounts/past-invoices/edit/${id}`)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          color="warning"
          className="h-7 rounded px-3 text-xs"
          onClick={() => setOpen(true)}
        >
          Request Cancel
        </Button>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded bg-white shadow-xl dark:bg-dark-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-dark-500">
              <Dialog.Title className="text-base font-medium text-gray-800 dark:text-dark-50">
                Request For Cancelation
              </Dialog.Title>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-50">
                Invoice Cancel Request Of {invoiceno}
              </p>
              <div className="flex items-start gap-4">
                <label className="mt-2 w-44 shrink-0 text-sm text-gray-700 dark:text-dark-200">
                  Reason For Cancelation
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-dark-500">
              <Button
                color="primary"
                className="h-9 rounded-md px-4 text-sm font-medium"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save changes"}
              </Button>
              <Button
                color="info"
                className="h-9 rounded-md px-4 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
