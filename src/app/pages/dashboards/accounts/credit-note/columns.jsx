// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("creditnotedate", {
    id: "creditnotedate",
    header: "Date",
    cell: (info) => {
      const val = info.getValue();
      if (!val || val === "0000-00-00") return "-";
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString("en-GB");
    },
    meta: {
      filterType: "date",
    },
  }),

  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice no",
    cell: (info) => info.getValue() ?? "-",
    meta: {
      filterType: "text",
    },
  }),

  columnHelper.accessor("creditnoteno", {
    id: "creditnoteno",
    header: "Credit Note no",
    cell: (info) => info.getValue() || "-",
    meta: {
      filterType: "text",
    },
  }),

  columnHelper.accessor("customername", {
    id: "customername",
    header: "Customer",
    cell: (info) => info.getValue() ?? "-",
    meta: {
      filterType: "text",
    },
  }),

  columnHelper.accessor("cname", {
    id: "cname",
    header: "Billing Customer",
    cell: (info) => info.getValue() ?? "-",
    meta: {
      filterType: "text",
    },
  }),

  columnHelper.accessor("subtotal", {
    id: "subtotal",
    header: "Item Total",
    cell: (info) => {
      const val = info.getValue();
      return val ? parseFloat(val).toFixed(2) : "0.00";
    },
    meta: {
      filterType: "text",
    },
  }),

  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "Amount",
    cell: (info) => {
      const val = info.getValue();
      return val ? parseFloat(val).toFixed(2) : "0.00";
    },
    meta: {
      filterType: "text",
    },
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const val = info.getValue();
      const map = { 0: "Pending", 1: "Approved", 2: "Einvoice" };
      const colorMap = {
        0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        1: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        2: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      };
      return (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colorMap[val] ?? ""}`}>
          {map[val] ?? val}
        </span>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
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
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
];
