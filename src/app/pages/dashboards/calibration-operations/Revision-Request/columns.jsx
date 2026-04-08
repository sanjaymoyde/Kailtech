// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";

const columnHelper = createColumnHelper();

// ----------------------------------------------------------------------
// Expandable ID Cell
// ----------------------------------------------------------------------
const ExpandableCell = ({ row, getValue }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-white ${isExpanded ? "bg-red-500" : "bg-green-500"
            }`}
        >
          {isExpanded ? "−" : "+"}
        </button>
        <span className="font-medium text-gray-800">{getValue()}</span>
      </div>

      {isExpanded && (
        <div className="mt-2 ml-8 space-y-1 border-l-2 border-gray-200 pl-3 text-sm text-gray-700">
          <p>
            <strong>Requested On:</strong> {row.original.added_on || "—"}
          </p>
          <p>
            <strong>Requested By:</strong>{" "}
            {`${row.original.firstname || ""} ${row.original.lastname || ""
              }`.trim() || "—"}
          </p>
          <p>
            <strong>Approved On:</strong> {row.original.updated_on || "—"}
          </p>
          <p>
            <strong>Approved By:</strong>{" "}
            {`${row.original.appfname || ""} ${row.original.applname || ""
              }`.trim() || "—"}
          </p>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Status Badge
// ----------------------------------------------------------------------
const StatusBadge = ({ status }) => {
  const statusConfig = {
    0: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
    1: { label: "Approved", className: "bg-green-100 text-green-800" },
    2: { label: "Completed", className: "bg-blue-100 text-blue-800" },
    99: { label: "Rejected", className: "bg-red-100 text-red-800" },
  };

  const config = statusConfig[Number(status)] || {
    label: "Unknown",
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// ----------------------------------------------------------------------
// Columns
// ----------------------------------------------------------------------
export const columns = [


  // ID (Expandable)
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <ExpandableCell row={info.row} getValue={info.getValue} />
    ),
  }),

  columnHelper.accessor("instname", {
    header: "Name",
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("idno", {
    header: "ID No",
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("serialno", {
    header: "Serial No",
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("customername", {
    header: "Customer Name",
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("inwardid", {
    header: "Inward Entry No",
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("brnno", {
    header: "Certificate No",
    cell: (info) => info.getValue() || "—",
  }),

  // Status
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),

  columnHelper.accessor("revno", {
    header: "Rev No",
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("reason", {
    header: "Reason",
    cell: (info) => (
      <span className="text-sm" title={info.getValue()}>
        {info.getValue()?.substring(0, 30) || "—"}
        {info.getValue()?.length > 30 ? "..." : ""}
      </span>
    ),
  }),

  columnHelper.accessor("remark", {
    header: "Remark",
    cell: (info) => (
      <span className="text-sm" title={info.getValue()}>
        {info.getValue()?.substring(0, 30) || "—"}
        {info.getValue()?.length > 30 ? "..." : ""}
      </span>
    ),
  }),

  columnHelper.accessor("added_on", {
    header: "Requested On",
    cell: (info) => info.getValue() || "—",
  }),

  // ✅ CORRECTED - Approved By (ACTION COLUMN)
  columnHelper.accessor("approvedby", {
    header: "Approved By",
    cell: ({ row, table }) => {
      const status = Number(row.original.status);

      // ✅ Pending → Show Button
      if (status === 0) {
        return (
          <button
            onClick={() => {
              // ✅ Debug log to verify data
              console.log("Button clicked, row data:", row.original);

              // ✅ Call the function from table meta
              if (table.options.meta?.openApproveRejectModal) {
                table.options.meta.openApproveRejectModal(row.original);
              } else {
                console.error("openApproveRejectModal not found in table.options.meta");
              }
            }}
            className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 transition cursor-pointer"
          >
            Approve / Reject
          </button>
        );
      }

      // ✅ Approved / Rejected / Completed → Show Name
      return (
        <span className="text-sm text-gray-700">
          {`${row.original.appfname || ""} ${row.original.applname || ""}`.trim() || "—"}
        </span>
      );
    },
  }),
];