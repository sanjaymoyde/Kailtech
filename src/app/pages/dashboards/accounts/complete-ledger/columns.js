// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("party", {
    id: "party",
    header: "Party",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("particulars", {
    id: "particulars",
    header: "Particulars",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("vch_type", {
    id: "vch_type",
    header: "Vch Type",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("vch_no", {
    id: "vch_no",
    header: "Vch No.",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("debit", {
    id: "debit",
    header: "Debit",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("credit", {
    id: "credit",
    header: "Credit",
    cell: (info) => info.getValue() ?? "-",
  }),
];
