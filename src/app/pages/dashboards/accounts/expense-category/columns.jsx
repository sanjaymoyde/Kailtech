import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("description", {
    id: "description",
    header: "Description/Symbol",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => <RowActions row={info.row} table={info.table} />,
  }),
];
