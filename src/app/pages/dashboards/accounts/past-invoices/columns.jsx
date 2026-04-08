// columns.jsx — Past Invoice List
// PHP port of pastinvoices.php columns:
// ID | Date | Invoice no | Customer | Amount | Remaining Amount | Status | Action
//
// PHP status filter: All | Pending (0) | Approved (1)  — only 2 values (simpler than testing/calibration)
//
// API field map (adjust if backend uses different names):
//   id, invoicedate, invoiceno, cname (customer name), finaltotal, remaining, status

import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// PHP: status 0=Pending, 1=Approved
const STATUS_MAP = {
  0: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  1: { label: "Approved", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

function StatusBadge({ value }) {
  const s = STATUS_MAP[Number(value)] ?? { label: String(value ?? ""), cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// PHP: date formatted d/m/Y
function fmtDate(val) {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export const columns = [
  // S.No / ID
  columnHelper.accessor((_row, i) => i + 1, {
    id: "s_no",
    header: "ID",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (info) => (
      <span className="dark:text-dark-400 text-xs text-gray-500">{info.row.index + 1}</span>
    ),
  }),

  // Date — PHP: invoicedate formatted d/m/Y
  columnHelper.accessor((row) => row.invoicedate ?? row.date ?? "", {
    id: "date",
    header: "Date",
    cell: (info) => (
      <span className="dark:text-dark-300 text-sm text-gray-600">{fmtDate(info.getValue())}</span>
    ),
  }),

  // Invoice No
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice no",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // Customer — PHP: cname (customers.name)
  // API may return as 'cname', 'customer', or 'customername'
  columnHelper.accessor((row) => row.cname ?? row.customer ?? row.customername ?? "", {
    id: "cname",
    header: "Customer",
    cell: (info) => (
      <span className="dark:text-dark-100 text-sm font-medium text-gray-800">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // Amount — PHP: finaltotal
  columnHelper.accessor((row) => row.finaltotal ?? row.amount ?? 0, {
    id: "finaltotal",
    header: "Amount",
    cell: (info) => (
      <span className="dark:text-dark-100 font-mono text-sm font-semibold text-gray-800">
        ₹{parseFloat(info.getValue() ?? 0).toFixed(2)}
      </span>
    ),
  }),

  // Remaining Amount
  columnHelper.accessor((row) => row.remaining ?? row.remainingamount ?? 0, {
    id: "remaining",
    header: "Remaining Amount",
    cell: (info) => {
      const v = parseFloat(info.getValue() ?? 0);
      return (
        <span className={`font-mono text-sm ${v > 0 ? "font-medium text-red-600" : "text-gray-500"}`}>
          ₹{v.toFixed(2)}
        </span>
      );
    },
  }),

  // Status — PHP: 0=Pending, 1=Approved (only 2 options)
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    // PHP: exact match filter — "0" = Pending, "1" = Approved
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === "" || filterValue === undefined) return true;
      return String(row.getValue(columnId)) === String(filterValue);
    },
    meta: {
      filterType: "select", filterOptions: [
        { value: "0", label: "Pending" },
        { value: "1", label: "Approved" },
      ]
    },
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
