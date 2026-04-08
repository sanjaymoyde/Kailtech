import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

function formatDate(value) {
  if (!value || value === "0000-00-00" || value === "0000-00-00 00:00:00") {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${String(parsed.getDate()).padStart(2, "0")}/${String(
    parsed.getMonth() + 1,
  ).padStart(2, "0")}/${parsed.getFullYear()}`;
}

function formatAmount(value) {
  return `Rs.${parseFloat(value ?? 0).toFixed(2)}`;
}

function renderStatusBadge(value) {
  const numeric = Number(value);
  if (numeric === 99) {
    return (
      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Canceled
      </span>
    );
  }
  const isApproved = numeric === 1;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isApproved
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      }`}
    >
      {isApproved ? "Approved" : "Pending"}
    </span>
  );
}

export const columns = [
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "ID",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (info) => (
      <span className="text-xs text-gray-500 dark:text-dark-400">
        {info.row.index + 1}
      </span>
    ),
  }),
  columnHelper.accessor((row) => row.invoicedate ?? row.date ?? "", {
    id: "date",
    header: "Date",
    cell: (info) => (
      <span className="text-sm text-gray-600 dark:text-dark-300">
        {formatDate(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice No",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
        {info.getValue() || "-"}
      </span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor((row) => row.inwardid ?? row.inwardentryno ?? "", {
    id: "inwardid",
    header: "Inward Entry No",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "-"}
      </span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor((row) => row.cname ?? row.customername ?? "", {
    id: "customer",
    header: "Customer",
    cell: (info) => (
      <span className="text-sm font-medium text-gray-800 dark:text-dark-100">
        {info.getValue() || "-"}
      </span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor((row) => row.subtotal ?? row.itemtotal ?? 0, {
    id: "subtotal",
    header: "Item Total",
    cell: (info) => (
      <span className="font-mono text-sm text-gray-700 dark:text-dark-200">
        {formatAmount(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor((row) => row.finaltotal ?? row.amount ?? 0, {
    id: "finaltotal",
    header: "Amount",
    cell: (info) => (
      <span className="font-mono text-sm font-semibold text-gray-800 dark:text-dark-100">
        {formatAmount(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    meta: { filterType: "select" },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      return String(row.getValue(columnId)) === String(filterValue);
    },
    cell: (info) => renderStatusBadge(info.getValue()),
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (props) => <RowActions row={props.row} table={props.table} />,
  }),
];
