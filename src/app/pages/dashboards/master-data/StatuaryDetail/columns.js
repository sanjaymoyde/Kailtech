// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [


  // ✅ Serial Number (mapped to ID)
  columnHelper.accessor((_row, index) => index + 1, {
    id: "id",
    header: "ID",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Name
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue(),
  }),

  // ✅ Description/Symbol
  columnHelper.accessor("description", {
    id: "description",
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