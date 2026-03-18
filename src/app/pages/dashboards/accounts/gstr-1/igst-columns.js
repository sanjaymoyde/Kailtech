// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const igstColumns = [
  columnHelper.display({
    id: "s_no",
    header: "SR. NO",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("gstno", {
    id: "gstno",
    header: "GSTIN NO",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("custname", {
    id: "custname",
    header: "RECEIVER NAME",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "INVOICE NO",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoicedate", {
    id: "invoicedate",
    header: "INVOICE DATE",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString("en-GB");
    },
  }),
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "TOTAL INVOICE VALUE",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("subtotal2", {
    id: "subtotal2",
    header: "TAXABLE VALUE",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("igstamount", {
    id: "igstamount",
    header: "IGST TAX",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("roundoff", {
    id: "roundoff",
    header: "ROUND OFF",
    // PHP uses sprintf("%.02f", $row['roundoff'])
    cell: (info) => Number(info.getValue() || 0).toFixed(2),
  }),
];
