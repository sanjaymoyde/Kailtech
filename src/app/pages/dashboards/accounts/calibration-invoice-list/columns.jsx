// columns.js — Calibration Invoice List
// PHP: invoices joined with customers
// Columns: ID, Date, Invoice no, Inward Entry no, Customer(cname),
//          Billing Customer(customername), Po Number, Item Total(subtotal),
//          Amount(finaltotal), Status, Remaining, Action

import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// PHP: $statusarray = array("0"=>"Pending",1=>"Approved","2"=>"Einvoice",91=>"Updated",99=>"Cancled")
const STATUS_MAP = {
  0: {
    label: "Pending",
    cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  1: {
    label: "Approved",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  2: {
    label: "Einvoice",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  91: {
    label: "Updated",
    cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  99: {
    label: "Cancelled",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

// PHP: changedateformatespecito → d/m/Y
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "0000-00-00" || dateStr === "0000-00-00 00:00:00")
    return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export const columns = [
  // ── S.No ──────────────────────────────────────────────────────────
  columnHelper.display({
    id: "s_no",
    header: "ID",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (info) => (
      <span className="dark:text-dark-400 text-xs text-gray-500">
        {info.row.index + 1}
      </span>
    ),
  }),

  // ── Date (PHP: approved_on if set else invoicedate) ───────────────
  columnHelper.accessor(
    (row) =>
      row.approved_on && row.approved_on !== "0000-00-00 00:00:00"
        ? row.approved_on
        : row.invoicedate,
    {
      id: "date",
      header: "Date",
      cell: (info) => (
        <span className="dark:text-dark-300 text-sm text-gray-600">
          {formatDate(info.getValue())}
        </span>
      ),
    },
  ),

  // ── Invoice No ────────────────────────────────────────────────────
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice No",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // ── Inward Entry No (PHP: text-wrap width-200) ────────────────────
  columnHelper.accessor("inwardid", {
    id: "inwardid",
    header: "Inward Entry No",
    cell: (info) => (
      <div className="dark:text-dark-300 max-w-[200px] text-xs break-words text-gray-600">
        {info.getValue() || "—"}
      </div>
    ),
  }),

  // ── Customer (PHP: customers.name as cname) ───────────────────────
  columnHelper.accessor("cname", {
    id: "cname",
    header: "Customer",
    cell: (info) => (
      <span className="dark:text-dark-100 text-sm font-medium text-gray-800">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // ── Billing Customer (PHP: invoices.customername) ─────────────────
  // PHP row highlight: cname.trim() != customername.trim() → pink background
  columnHelper.accessor("customername", {
    id: "customername",
    header: "Billing Customer",
    cell: (info) => {
      const row = info.row.original;
      const isDiff =
        (row.cname || "").trim() !== (row.customername || "").trim();
      return (
        <span
          className={
            isDiff
              ? "text-sm font-medium text-red-700 dark:text-red-400"
              : "dark:text-dark-200 text-sm text-gray-700"
          }
        >
          {info.getValue() || "—"}
        </span>
      );
    },
  }),

  // ── PO Number ─────────────────────────────────────────────────────
  columnHelper.accessor("ponumber", {
    id: "ponumber",
    header: "Po Number",
    cell: (info) => (
      <span className="dark:text-dark-300 text-sm text-gray-600">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // ── Item Total (PHP: subtotal) ────────────────────────────────────
  columnHelper.accessor("subtotal", {
    id: "subtotal",
    header: "Item Total",
    cell: (info) => (
      <span className="font-mono text-sm">
        ₹
        {info.getValue() != null ? parseFloat(info.getValue()).toFixed(2) : "—"}
      </span>
    ),
  }),

  // ── Amount (PHP: finaltotal) ──────────────────────────────────────
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "Amount",
    cell: (info) => (
      <span className="dark:text-dark-100 font-mono text-sm font-semibold text-gray-800">
        ₹
        {info.getValue() != null ? parseFloat(info.getValue()).toFixed(2) : "—"}
      </span>
    ),
  }),

  // ── Status (PHP: $statusarray[$row['status']]) ────────────────────
  // PHP: columns[8] → <select> Pending/Approved/Einvoice — exact match
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    // PHP: exact match like '0', '1', '2'
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === "" || filterValue === undefined) return true;
      return String(row.getValue(columnId)) === String(filterValue);
    },
    // ✅ signal to index.jsx → render <select> not text input
    meta: { filterType: "select" },
    cell: (info) => {
      const s = STATUS_MAP[info.getValue()] ?? {
        label: "Unknown",
        cls: "bg-gray-100 text-gray-600",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}
        >
          {s.label}
        </span>
      );
    },
  }),

  // ── Remaining ─────────────────────────────────────────────────────
  columnHelper.accessor("remaining", {
    id: "remaining",
    header: "Remaining",
    cell: (info) => (
      <span className="dark:text-dark-300 font-mono text-sm text-gray-600">
        {info.getValue() != null
          ? `₹${parseFloat(info.getValue()).toFixed(2)}`
          : "—"}
      </span>
    ),
  }),

  // ── Actions ───────────────────────────────────────────────────────
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableColumnFilter: false,
    enableSorting: false,
    cell: RowActions,
  }),
];
