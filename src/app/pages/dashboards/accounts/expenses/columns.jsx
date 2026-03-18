// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr.no",
    cell: (info) => info.row.index + 1,
  }),

  columnHelper.accessor("title", {
    id: "title",
    header: "Title",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("category", {
    id: "category",
    header: "Category",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("reference_to", {
    id: "reference_to",
    header: "Reference To",
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
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
];
