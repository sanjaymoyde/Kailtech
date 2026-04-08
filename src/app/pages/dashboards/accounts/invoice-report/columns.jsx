import { createColumnHelper } from "@tanstack/react-table";
import { StatusBadge } from "./StatusBadge";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("custname", {
    id: "custname",
    header: "Customer Name",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("ponumber", {
    id: "ponumber",
    header: "Po Number",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice No",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("subtotal", {
    id: "subtotal",
    header: "Item Total",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("discount", {
    id: "discount",
    header: "Discount",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("witnesscharges", {
    id: "witnesscharges",
    header: "Witness",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("samplehandling", {
    id: "samplehandling",
    header: "Sample Handling",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("sampleprep", {
    id: "sampleprep",
    header: "Sample Preparation",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("freight", {
    id: "freight",
    header: "Freight Charges",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("mobilisation", {
    id: "mobilisation",
    header: "Mobilization",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("subtotal2", {
    id: "subtotal2",
    header: "Total Taxable",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("sgstamount", {
    id: "sgstamount",
    header: "SGST",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("cgstamount", {
    id: "cgstamount",
    header: "CGST",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("igstamount", {
    id: "igstamount",
    header: "IGST",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "Invoice Amount",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("remaining", {
    id: "remaining",
    header: "Remaining Amount",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("typeofinvoice", {
    id: "typeofinvoice",
    header: "Invoice Type",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
];
