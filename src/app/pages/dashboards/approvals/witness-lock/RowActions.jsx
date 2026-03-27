import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";
import { Input } from "components/ui";
import { DatePicker } from "components/shared/form/Datepicker";
import { ClockIcon } from "@heroicons/react/24/outline";

// PHP: perm 178 required for both buttons
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

// ── Unlock Modal ──────────────────────────────────────────────────────────────
// PHP: unlockwitness.php — wdatetime, wtime, wdetail
// PHP: updatewitness.php — sets witness=0, witnesslock=0, wdetail=""
function UnlockModal({ row, onClose, onSuccess }) {
  const [wdatetime,  setWdatetime]  = useState(row.original.wdatetime ?? "");
  const [wtime,      setWtime]      = useState(row.original.wtime ?? "");
  const [wdetail,    setWdetail]    = useState(row.original.wdetail ?? "");
  const [submitting, setSubmitting] = useState(false);

  const id           = row.original.id;
  const customerName = row.original.customername ?? "—";

  // POST /approvals/unlock-witness  { id, wdatetime, wtime, wdetail }
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await axios.post("/approvals/unlock-witness", {
        id,
        wdatetime,
        wtime,
        wdetail,
      });
      toast.success("Witness Unlocked Successfully ✅");
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to unlock witness.";
      toast.error(msg + " ❌");
    } finally {
      setSubmitting(false);
    }
  }, [id, wdatetime, wtime, wdetail, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-dark-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-600">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100">
            Choose Chemist —{" "}
            <span className="font-normal text-gray-500">{customerName}</span>
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Witness Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Witness Date
            </label>
            <DatePicker
              options={{
                dateFormat: "d/m/Y",
                allowInput: true
              }}
              value={wdatetime}
              onChange={(selectedDates, dateStr) => setWdatetime(dateStr)}
              placeholder="dd/mm/yyyy"
            />
          </div>

          {/* Witness Time */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Witness Time
            </label>
            <Input
              type="time"
              value={wtime}
              onChange={(e) => setWtime(e.target.value)}
              prefix={<ClockIcon className="size-5" />}
            />
          </div>

          {/* Witness Details */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Witness Details
            </label>
            <Input
              type="text"
              value={wdetail}
              onChange={(e) => setWdetail(e.target.value)}
              placeholder="name of persons"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-dark-600">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-dark-600 dark:text-gray-400 dark:hover:bg-dark-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 ${
              submitting ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {submitting ? "Updating…" : "Update Witness"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RowActions ────────────────────────────────────────────────────────────────
export function RowActions({ row, table }) {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const permissions = usePermissions();

  const id = row.original.id;

  // POST /approvals/cancel-witness/{id}
  // PHP: cancelwitness.php
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

  // PHP: if (in_array(178, $permissions))
  if (!permissions.includes(178)) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-blue-700"
        >
          Unlock
        </button>

        <button
          onClick={handleCancel}
          disabled={cancelling}
          className={`rounded bg-gray-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-gray-600 ${
            cancelling ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          {cancelling ? "Cancelling…" : "Cancel Witness"}
        </button>
      </div>

      {modalOpen && (
        <UnlockModal
          row={row}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            table.options.meta?.deleteRow(row);
          }}
        />
      )}
    </>
  );
}

RowActions.propTypes = {
  row:   PropTypes.object,
  table: PropTypes.object,
};

UnlockModal.propTypes = {
  row:       PropTypes.object,
  onClose:   PropTypes.func,
  onSuccess: PropTypes.func,
};