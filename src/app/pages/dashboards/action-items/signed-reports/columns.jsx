// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";
import { SelectCell, SelectHeader } from "components/shared/table/SelectCheckbox";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "select",
    header: SelectHeader,
    cell: SelectCell,
  }),

  // ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    enableSorting: true,
    cell: (info) => (
      <span className="font-medium text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Product
  columnHelper.accessor("pname", {
    id: "pname",
    header: "Product",
    enableSorting: true,
    size: 200,
    maxSize: 250,
    cell: (info) => (
      <span 
        className="text-gray-800 dark:text-dark-100 block"
        style={{ maxWidth: "250px", whiteSpace: "normal", wordBreak: "break-word" }}
      >
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Main Customer — hidden via columnVisibility if perm 358 absent
  columnHelper.accessor("main_customer", {
    id: "main_customer",
    header: "Main Customer",
    enableSorting: true,
    cell: (info) => (
      <span className="text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Report Customer
  columnHelper.accessor("report_customer", {
    id: "report_customer",
    header: "Report Customer",
    enableSorting: true,
    cell: (info) => {
      const val = info.getValue();
      if (Array.isArray(val)) return (
        <span className="text-gray-700 dark:text-dark-200">{val.join(", ") || "—"}</span>
      );
      return <span className="text-gray-700 dark:text-dark-200">{val ?? "—"}</span>;
    },
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    enableSorting: true,
    cell: (info) => (
      <span className="font-mono text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // BRN
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN",
    enableSorting: true,
    cell: (info) => (
      <span className="font-mono text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // ULR
  columnHelper.accessor("ulr", {
    id: "ulr",
    header: "ULR",
    enableSorting: true,
    cell: (info) => (
      <span className="font-mono text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Grade/Size
  columnHelper.accessor("grade_size", {
    id: "grade_size",
    header: "Grade/Size",
    enableSorting: true,
    cell: (info) => (
      <span className="text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Action
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableSorting: false,
    cell: RowActions,
  }),
];