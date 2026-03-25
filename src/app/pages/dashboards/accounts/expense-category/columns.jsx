import { createColumnHelper } from "@tanstack/react-table";
// import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: () => <div className="text-center">ID</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: () => <div className="text-center">Name</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),
  columnHelper.accessor("description", {
    id: "description",
    header: () => <div className="text-center">Description/Symbol</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "-"}</div>,
  }),
/*
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
*/
];
