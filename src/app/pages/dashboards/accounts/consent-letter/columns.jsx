// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("conosentletterno", {
    id: "consentno",
    header: "Consent No.",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("consentletterdate", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString("en-GB");
    },
  }),

  columnHelper.accessor("customername", {
    id: "custname",
    header: "Customer Name",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("name", {
    id: "iscode",
    header: "IS Code",
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const val = info.getValue();
      return val === 1 ? "Approved" : val === 0 ? "Pending" : val;
    },
  }),

  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
];
