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

  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString("en-GB");
    },
  }),

  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice No",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("creditnoteno", {
    id: "creditnoteno",
    header: "Credit Note No",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("customername", {
    id: "customername",
    header: "Customer",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("billingcustomer", {
    id: "billingcustomer",
    header: "Billing Customer",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("itemtotal", {
    id: "itemtotal",
    header: "Item Total",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("amount", {
    id: "amount",
    header: "Amount",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const val = info.getValue();
      const map = { 0: "Pending", 1: "Approved", 2: "Einvoice" };
      const colorMap = {
        0: "bg-yellow-100 text-yellow-800",
        1: "bg-green-100 text-green-800",
        2: "bg-blue-100 text-blue-800",
      };
      return (
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${colorMap[val] ?? ""}`}>
          {map[val] ?? val}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
];
