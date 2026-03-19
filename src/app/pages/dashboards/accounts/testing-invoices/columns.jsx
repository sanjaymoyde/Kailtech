// columns.jsx — Testing Invoice List
// PHP port of tinvoicesData.php columns:
// ID | Date | Invoice No | Inward Entry No | Customer (cname) | Billing Customer (customername)
// | Po Number | Item Total (subtotal) | Amount (finaltotal) | Remaining | Status | Actions
//
// API field map:
//   id, invoicedate, approved_on, invoiceno, inwardid,
//   cname, customername, ponumber, subtotal, finaltotal, remaining, status

import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// PHP: $statusarray = array("0"=>"Pending", 1=>"Approved", 2=>"Einvoice", 91=>"Updated", 99=>"Cancelled")
const STATUS_MAP = {
  0: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  1: { label: "Approved", cls: "bg-green-100 text-green-700" },
  2: { label: "Einvoice", cls: "bg-blue-100  text-blue-700" },
  91: { label: "Updated", cls: "bg-gray-100  text-gray-600" },
  99: { label: "Cancelled", cls: "bg-red-100   text-red-700" },
};

function StatusBadge({ value }) {
  const s = STATUS_MAP[Number(value)] ?? {
    label: String(value),
    cls: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// PHP: date shown = approved_on if set, else invoicedate formatted d/m/Y
function fmtDate(approvedOn, invoicedate) {
  const src =
    approvedOn && approvedOn !== "0000-00-00 00:00:00" && approvedOn !== null
      ? approvedOn
      : invoicedate;
  if (!src) return "";
  return new Date(src).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const columns = [
  // S.No — PHP: $i (row counter)
  columnHelper.accessor((_row, i) => i + 1, {
    id: "s_no",
    header: "S No",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (info) => (
      <span className="dark:text-dark-400 text-xs text-gray-500 tabular-nums">
        {info.row.index + 1}
      </span>
    ),
  }),

  // Date — PHP: approved_on else invoicedate
  columnHelper.accessor((row) => fmtDate(row.approved_on, row.invoicedate), {
    id: "date",
    header: "Date",
    cell: (info) => (
      <span className="dark:text-dark-200 text-xs text-gray-700 tabular-nums">
        {info.getValue()}
      </span>
    ),
  }),

  // Invoice No
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice No",
    cell: (info) => (
      <span className="dark:text-dark-100 text-xs font-medium text-gray-800">
        {info.getValue() || <span className="text-gray-400 italic">—</span>}
      </span>
    ),
  }),

  // Inward Entry No — PHP: inwardid (can be comma-separated)
  columnHelper.accessor("inwardid", {
    id: "inwardid",
    header: "Inward Entry No",
    cell: (info) => (
      <div className="dark:text-dark-300 max-w-[180px] text-xs break-words text-gray-700">
        {info.getValue() || "—"}
      </div>
    ),
  }),

  // Customer — PHP: cname (customers.name from join)
  columnHelper.accessor("cname", {
    id: "cname",
    header: "Customer",
    cell: (info) => (
      <span className="dark:text-dark-100 text-xs text-gray-800">
        {info.getValue()}
      </span>
    ),
  }),

  // Billing Customer — PHP: customername (invoices.customername)
  columnHelper.accessor("customername", {
    id: "customername",
    header: "Billing Customer",
    cell: (info) => (
      <span className="dark:text-dark-100 text-xs text-gray-800">
        {info.getValue()}
      </span>
    ),
  }),

  // Po Number
  columnHelper.accessor("ponumber", {
    id: "ponumber",
    header: "Po Number",
    cell: (info) => (
      <span className="dark:text-dark-200 text-xs text-gray-700">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // Item Total (subtotal)
  columnHelper.accessor("subtotal", {
    id: "subtotal",
    header: "Item Total",
    cell: (info) => (
      <span className="dark:text-dark-200 text-xs text-gray-700 tabular-nums">
        {parseFloat(info.getValue() ?? 0).toFixed(2)}
      </span>
    ),
  }),

  // Amount (finaltotal)
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "Amount",
    cell: (info) => (
      <span className="text-xs font-semibold text-gray-900 tabular-nums dark:text-white">
        ₹ {parseFloat(info.getValue() ?? 0).toFixed(2)}
      </span>
    ),
  }),

  // Remaining Amount
  columnHelper.accessor("remaining", {
    id: "remaining",
    header: "Remaining",
    cell: (info) => {
      const v = parseFloat(info.getValue() ?? 0);
      return (
        <span
          className={`text-xs tabular-nums ${v > 0 ? "font-medium text-red-600" : "text-gray-500"}`}
        >
          ₹ {v.toFixed(2)}
        </span>
      );
    },
  }),

  // Status — PHP: $statusarray[$row['status']]
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    meta: { filterType: "select" }, // triggers <select> filter in THead
    cell: (info) => <StatusBadge value={info.getValue()} />,
  }),

  // Actions
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (props) => <RowActions row={props.row} table={props.table} />,
  }),
];
