// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

const fmt = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(val);
};

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("customername", {
    id: "customername",
    header: "Customer Name",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("department", {
    id: "department",
    header: "Verticle",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("spname", {
    id: "spname",
    header: "Specific Purpose",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("id", {
    id: "id",
    header: "TRF/CRF No",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const date = info.getValue();
      return date ? new Date(date).toLocaleDateString("en-GB") : "-";
    },
  }),
  columnHelper.accessor("bd_name", {
    id: "bd_name",
    header: "BD",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("subtotal", {
    id: "subtotal",
    header: "Item Total",
    cell: (info) => fmt(Number(info.getValue())),
  }),
];
