// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [

  // ✅ ID
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),

  // ✅ Description
  columnHelper.accessor("description", {
    header: "Description/Symbol",
    cell: (info) => info.getValue(),
  }),





  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];
