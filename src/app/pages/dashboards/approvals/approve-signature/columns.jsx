// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// PHP: group_concat(name) → comma-separated parameter names → stacked badges
function ParamList({ value }) {
  if (!value) return <span className="text-gray-400">—</span>;
  const parts = String(value).split(",").map((v) => v.trim()).filter(Boolean);
  if (parts.length === 0) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((p, i) => (
        <span
          key={i}
          className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        >
          {p}
        </span>
      ))}
    </div>
  );
}

export const columns = [


  // PHP: $n[] = $i;  (S.NO — auto-incremented counter)
  columnHelper.display({
    id: "sno",
    header: "S.No",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return (
        <span className="text-xs text-gray-500 dark:text-dark-400">
          {pageIndex * pageSize + row.index + 1}
        </span>
      );
    },
  }),

  // PHP: $n[] = $row['lrn'];  — trfProducts.lrn
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // PHP: $n[] = $row['brn'];  — trfProducts.brn
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN No",
    cell: (info) => (
      <span className="font-mono text-xs">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // PHP: $n[] = $row['cname'];  — customers.name
  columnHelper.accessor("cname", {
    id: "cname",
    header: "Customer",
    cell: (info) => info.getValue() ?? "—",
  }),

  // PHP: $n[] = $row['pname'];  — products.name
  columnHelper.accessor("pname", {
    id: "pname",
    header: "Product",
    cell: (info) => info.getValue() ?? "—",
  }),

  // API: parameter_names — e.g. "Complete Tests", "Size and grading"
  columnHelper.accessor("parameter_names", {
    id: "parameter_names",
    header: "Parameters",
    enableSorting: false,
    cell: (info) => <ParamList value={info.getValue()} />,
  }),

  // PHP: Approve button + View Report link
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableSorting: false,
    cell: RowActions,
  }),
];