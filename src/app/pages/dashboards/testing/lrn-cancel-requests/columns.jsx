// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// ✅ PHP code se: 0=Pending, 1=Approved, 2=Completed, 99=Rejected
const statusMap = {
  0: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  1: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  2: { label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  99: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const formatDate = (val) => {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "-";
  const date = new Date(val);
  if (isNaN(date)) return val;
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export const columns = [


  // ── Serial Number (UI generated) ──────────────────────────────────────────
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "ID",
    cell: (info) => info.row.index + 1,
  }),

  // ── Inward No (trfid from API) ────────────────────────────────────────────
  columnHelper.accessor("trfid", {
    id: "trfid",
    header: "Inward No",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Date of Receive ───────────────────────────────────────────────────────
  columnHelper.accessor("date", {
    id: "date",
    header: "Date of Receive",
    cell: (info) => formatDate(info.getValue()),
  }),

  // ── ID No ─────────────────────────────────────────────────────────────────
  columnHelper.accessor("idno", {
    id: "idno",
    header: "Id No",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Serial No ─────────────────────────────────────────────────────────────
  columnHelper.accessor("serialno", {
    id: "serialno",
    header: "Serial No",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Customer Name ─────────────────────────────────────────────────────────
  columnHelper.accessor("customername", {
    id: "customername",
    header: "Customer Name",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Certificate No (brnno) ────────────────────────────────────────────────
  columnHelper.accessor("brnno", {
    id: "brnno",
    header: "Certificate No",
    cell: (info) => info.getValue() || "-",
  }),

  // ── LRN No ────────────────────────────────────────────────────────────────
  columnHelper.accessor("lrnno", {
    id: "lrnno",
    header: "Lrn No",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Reason ────────────────────────────────────────────────────────────────
  columnHelper.accessor("reason", {
    id: "reason",
    header: "Reason",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Reject/Approve Reason ─────────────────────────────────────────────────
  columnHelper.accessor("rejectreason", {
    id: "rejectreason",
    header: "Reject/Approve Reason",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Requested On (added_on) ───────────────────────────────────────────────
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "Requested On",
    cell: (info) => formatDate(info.getValue()),
  }),

  // ── Requested By (firstname + lastname) ───────────────────────────────────
  columnHelper.accessor(
    (row) => `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(),
    {
      id: "requestedby",
      header: "Requested By",
      cell: (info) => info.getValue() || "-",
    }
  ),

  // ── Approved On ───────────────────────────────────────────────────────────
  columnHelper.accessor("approved_on", {
    id: "approved_on",
    header: "Approved On",
    cell: (info) => formatDate(info.getValue()),
  }),

  // ── Approved By (appfname + applname) ─────────────────────────────────────
  columnHelper.accessor(
    (row) => `${row.appfname ?? ""} ${row.applname ?? ""}`.trim(),
    {
      id: "approvedby",
      header: "Approved By",
      cell: (info) => info.getValue() || "-",
    }
  ),

  // ── Status (0/1/2/99) ─────────────────────────────────────────────────────
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const raw = info.getValue();
      const entry = statusMap[raw] ?? {
        label: String(raw ?? "-"),
        color: "bg-gray-100 text-gray-600 dark:bg-dark-600 dark:text-dark-300",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.color}`}
        >
          {entry.label}
        </span>
      );
    },
  }),

  // ── Actions ───────────────────────────────────────────────────────────────
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];