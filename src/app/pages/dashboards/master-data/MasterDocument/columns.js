// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";


const columnHelper = createColumnHelper();

export const columns = [


  // Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "sr_no",
    header: "Sr No",
    cell: (info) => info.row.index + 1,
  }),

  // Name - maps to 'name' from API
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue() || "-",
  }),

  // Document No./Procedure No - maps to 'code' from API
  columnHelper.accessor("code", {
    id: "code",
    header: "Document No./Procedure No",
    cell: (info) => info.getValue() || "-",
  }),

  // Issue No - maps to 'issueno' from API
  columnHelper.accessor("issueno", {
    id: "issueno",
    header: "Issue No",
    cell: (info) => info.getValue() || "-",
  }),

  // Rev No - maps to 'revno' from API
  columnHelper.accessor("revno", {
    id: "revno",
    header: "Rev No",
    cell: (info) => info.getValue() || "-",
  }),

  // Category - maps to 'category' from API
  // Note: In PHP, it fetches the category name from documentcategory table
  // You'll need to handle this in your API or pass the category name
  columnHelper.accessor("category", {
    id: "category",
    header: "Category",
    cell: (info) => info.getValue() || "-",
  }),

  // Header - maps to 'header' from API
  columnHelper.accessor("header", {
    id: "header",
    header: "Header",
    cell: (info) => info.getValue() || "-",
  }),

  // Footer - maps to 'footer' from API
  columnHelper.accessor("footer", {
    id: "footer",
    header: "Footer",
    cell: (info) => info.getValue() || "-",
  }),

  // Added On - maps to 'added_on' from API
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "Added On",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "-";
      // Format the date as per PHP: date("d/m/Y H:i:s", strtotime($row['added_on']))
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    },
  }),

  // Shared With - maps to 'sharedwith' from API
  columnHelper.accessor("sharedwith", {
    id: "sharedwith",
    header: "Shared With",
    cell: (info) => {
      const value = info.getValue();
      // In PHP, it fetches names from admin table based on IDs
      // You'll need to handle this in your API
      return value || "-";
    },
  }),

  // Actions
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
  }),
];