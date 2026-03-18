import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

const statusMap = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
};

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("invoiceno", {
    header: "Invoice no",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("inwardentryno", {
    header: "Inward Entry no",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("customer", {
    header: "Customer",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("itemtotal", {
    header: "Item Total",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("reason", {
    header: "Reason",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("requestedby", {
    header: "Requested by",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("approvedby", {
    header: "Approved By",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => statusMap[info.getValue()] ?? info.getValue(),
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
  }),
];
