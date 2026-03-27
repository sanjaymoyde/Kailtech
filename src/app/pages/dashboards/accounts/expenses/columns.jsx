import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: () => <div className="text-center">Sr.no</div>,
    cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
  }),

  columnHelper.accessor("title", {
    id: "title",
    header: () => <div className="text-center">Title</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),

  columnHelper.accessor("description", {
    id: "description",
    header: () => <div className="text-center">Description</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),

  columnHelper.accessor("category_name", {
    id: "category_name",
    header: () => <div className="text-center">Category</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),

  columnHelper.accessor("expensedate", {
    id: "expensedate",
    header: () => <div className="text-center">Date</div>,
    cell: (info) => {
      const val = info.getValue();
      return (
        <div className="text-center">
          {val ? dayjs(val).format("DD/MM/YYYY") : "-"}
        </div>
      );
    },
  }),

  columnHelper.accessor("referenceto", {
    id: "referenceto",
    header: () => <div className="text-center">Reference To</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),

  columnHelper.accessor("amount", {
    id: "amount",
    header: () => <div className="text-center">Amount</div>,
    cell: (info) => <div className="text-center font-medium">{info.getValue() ?? "0"}</div>,
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: () => <div className="text-center">Status</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),

/*
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
*/
];
