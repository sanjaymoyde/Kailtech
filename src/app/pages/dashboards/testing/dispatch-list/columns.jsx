// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";


const columnHelper = createColumnHelper();

const formatDate = (val) => {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "-";
  const date = new Date(val);
  if (isNaN(date)) return val;
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export const columns = [


  // ── Serial / UI ID ────────────────────────────────────────────────────────
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "ID",
    cell: (info) => info.row.index + 1,
  }),

  // ── Dispatch Date ─────────────────────────────────────────────────────────
  columnHelper.accessor("dispatchdate", {
    id: "dispatchdate",
    header: "Date",
    cell: (info) => formatDate(info.getValue()),
  }),

  // ── TRF ID ────────────────────────────────────────────────────────────────
  columnHelper.accessor("trfid", {
    id: "trfid",
    header: "Trf Id",
    cell: (info) => info.getValue() || "-",
  }),

  // ── Customer (Name + Address) ─────────────────────────────────────────────
  columnHelper.accessor(
    (row) => `${row.customername ?? ""} ${row.customeraddress ?? ""}`.trim(),
    {
      id: "customer",
      header: "Customer",
      cell: (info) => {
        const row = info.row.original;
        const name = row.customername || "";
        const address = row.customeraddress || "";
        return (
          <div>
            <div className="font-medium text-gray-800 dark:text-dark-100">{name || "-"}</div>
            {address && (
              <div className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">{address}</div>
            )}
          </div>
        );
      },
    }
  ),

  // ── Contact Person (Name + Designation + Email + Mobile) ──────────────────
  columnHelper.accessor("concernpersonname", {
    id: "contactperson",
    header: "Contact Person",
    cell: (info) => {
      const row = info.row.original;
      const name = row.concernpersonname || "";
      const designation = row.concernpersondesignation || "";
      const email = row.concernpersonemail || "";
      const mobile = row.concernpersonmobile || "";
      return (
        <div className="space-y-0.5 text-sm">
          <div className="font-medium text-gray-800 dark:text-dark-100">{name || "Mr."}</div>
          {designation && <div className="text-gray-500 dark:text-dark-400">{designation}</div>}
          {email && <div className="text-gray-500 dark:text-dark-400">{email}</div>}
          {mobile && <div className="text-gray-500 dark:text-dark-400">{mobile}</div>}
        </div>
      );
    },
  }),

  // ── Actions ───────────────────────────────────────────────────────────────
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
  }),
];