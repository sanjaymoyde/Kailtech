// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const formatDate = (val) => {
  if (!val || val === "0000-00-00") return "-";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  } catch {
    return val;
  }
};

const fmt = (val) => {
  if (val === undefined || val === null || val === "" || isNaN(val)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(val);
};

export const columns = [
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => formatDate(info.getValue()),
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
    cell: (info) => fmt(info.getValue()),
  }),
  columnHelper.accessor("credit", {
    id: "credit",
    header: "Credit",
    cell: (info) => fmt(info.getValue()),
  }),
  columnHelper.accessor("balance", {
    id: "balance",
    header: "Balance",
    cell: (info) => {
      const val = info.getValue() || 0;
      return (
        <span className={val >= 0 ? "text-green-600" : "text-red-600"}>
          {fmt(Math.abs(val))} {val >= 0 ? "Dr" : "Cr"}
        </span>
      );
    },
  }),
];
