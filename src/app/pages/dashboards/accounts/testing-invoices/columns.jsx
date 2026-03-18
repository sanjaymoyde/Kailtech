import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("invoiceno", {
    header: "Invoice No",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("inwardentryno", {
    header: "Inward Entry No",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("customer", {
    header: "Customer",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("billingcustomer", {
    header: "Billing Customer",
    cell: (info) => {
      const row = info.row.original;
      const val = info.getValue() || "";
      const mismatch = row.customer && val && row.customer !== val;
      return (
        <span className={mismatch ? "font-semibold text-red-600" : ""}>
          {val}
        </span>
      );
    },
  }),
  columnHelper.accessor("ponumber", {
    header: "PO Number",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("itemtotal", {
    header: "Item Total",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const v = info.getValue();
      if (v == 2) return "Einvoice";
      if (v == 1) return "Approved";
      if (v == 0) return "Pending";
      return v ?? "";
    },
  }),
  columnHelper.accessor("remainingamount", {
    header: "Remaining",
    cell: (info) => info.getValue(),
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
  }),
];
