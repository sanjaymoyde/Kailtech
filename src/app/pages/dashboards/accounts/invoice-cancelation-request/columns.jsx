import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

const statusMap = {
  0: { label: "Pending", class: "bg-yellow-100 text-yellow-800" },
  1: { label: "Approved", class: "bg-green-100 text-green-800" },
  2: { label: "Rejected", class: "bg-red-100 text-red-800" },
};

function formatDate(value) {
  if (!value || value === "0000-00-00" || value === "0000-00-00 00:00:00") {
    return "";
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
  return parseFloat(value ?? 0).toFixed(2);
}

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("invoicedate", {
    header: "Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("invoiceno", {
    header: "Invoice no",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("inwardid", {
    header: "Inward Entry no",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("customername", {
    header: "Customer",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("subtotal", {
    header: "Item Total",
    cell: (info) => formatAmount(info.getValue()),
  }),
  columnHelper.accessor("total", {
    header: "Amount",
    cell: (info) => formatAmount(info.getValue()),
  }),
  columnHelper.accessor("reason", {
    header: "Reason",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue() || "-"}
      </div>
    ),
  }),
  columnHelper.accessor("requestedby", {
    header: "Requested by",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("approvedby", {
    header: "Approved By",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const statusInfo = statusMap[status] || {
        label: status,
        class: "bg-gray-100 text-gray-800",
      };

      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusInfo.class}`}
        >
          {statusInfo.label}
        </span>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true; // Show all if no filter
      const status = String(row.getValue(columnId));
      return status === String(filterValue);
    },
    meta: {
      filterType: "select",
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (props) => (
      <RowActions
        {...props}
        onApproveReject={props.table.options.meta?.onApproveReject}
      />
    ),
  }),
];
