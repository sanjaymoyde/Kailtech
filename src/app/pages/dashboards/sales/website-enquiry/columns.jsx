// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";
import { DateCell, HighlightingCell, StatusCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: "Full Name",
    cell: (info) => <HighlightingCell {...info} />,
  }),
  columnHelper.accessor("email", {
    id: "email",
    header: "Email Address",
    cell: (info) => <HighlightingCell {...info} />,
  }),
  columnHelper.accessor("phone", {
    id: "phone",
    header: "Phone Number",
    cell: (info) => <HighlightingCell {...info} />,
  }),
  columnHelper.accessor("message", {
    id: "message",
    header: "Enquiry Message",
    cell: (info) => (
      <p className="w-48 truncate text-xs-plus xl:w-56 2xl:w-64">
        {info.getValue() || "-"}
      </p>
    ),
  }),
  columnHelper.accessor("created_at", {
    id: "created_at",
    header: "Requested Date",
    cell: (info) => <DateCell {...info} />,
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => <StatusCell {...info} />,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => <RowActions {...info} />,
  }),
];
