// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

export const columns = [


  // ✅ S No (Index)
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Name Column
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId)?.toString().trim() || "";
      const b = rowB.getValue(columnId)?.toString().trim() || "";
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    },
  }),

  // ✅ Description Column
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];
