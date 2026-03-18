// Import Dependencies
import { useState, useEffect } from "react";
import clsx from "clsx";
import { useNavigate } from "react-router";
import axios from "utils/axios";

export function Toolbar({ table, filters, onChange, onSearch }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  // Fetch customer list on mount (status=1, ordered by name — same as PHP)
  useEffect(() => {
    axios
      .get("/customers", { params: { status: 1 } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomers(list);
      })
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const handleExport = () => {
    if (!table) return;
    const headers = table
      .getHeaderGroups()[0]
      .headers.map((h) => h.column.columnDef.header)
      .filter(Boolean);
    const rows = table.getFilteredRowModel().rows;

    const escapeCell = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const bodyRows = rows
      .map((row) => {
        const cells = row.getVisibleCells().map((cell) => {
          const val =
            typeof cell.getValue === "function" ? cell.getValue() : cell.value;
          return `<td>${escapeCell(val)}</td>`;
        });
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");

    const html = `<table><thead><tr>${headers
      .map((h) => `<th>${escapeCell(h)}</th>`)
      .join("")}</tr></thead><tbody>${bodyRows}</tbody></table>`;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gstr1.xls";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-(--margin-x) pt-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Invoice List
        </h2>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          &laquo; Back
        </button>
        <button
          onClick={() => navigate("/dashboards/accounts/igst")}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          IGST
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
        {/* Start Date — max = today */}
        <input
          type="text"
          value={filters.startdate}
          onChange={(e) => onChange("startdate", e.target.value)}
          onFocus={(e) => {
            e.target.type = "date";
            e.target.max = today;
          }}
          onBlur={(e) => {
            if (!e.target.value) e.target.type = "text";
          }}
          placeholder="Start Date"
          className={clsx(
            "h-10 w-full rounded border border-blue-500 px-3 text-sm outline-none",
            "focus:ring-2 focus:ring-blue-500/40",
          )}
        />

        {/* End Date — max = today */}
        <input
          type="text"
          value={filters.enddate}
          onChange={(e) => onChange("enddate", e.target.value)}
          onFocus={(e) => {
            e.target.type = "date";
            e.target.max = today;
          }}
          onBlur={(e) => {
            if (!e.target.value) e.target.type = "text";
          }}
          placeholder="End Date"
          className={clsx(
            "h-10 w-full rounded border border-blue-500 px-3 text-sm outline-none",
            "focus:ring-2 focus:ring-blue-500/40",
          )}
        />

        {/* Customer dropdown — populated from API */}
        <select
          value={filters.customerid}
          onChange={(e) => onChange("customerid", e.target.value)}
          className={clsx(
            "h-10 w-full rounded border border-gray-300 px-3 text-sm text-gray-700",
            "focus:border-blue-500 focus:outline-none",
          )}
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={onSearch}
          className="h-10 rounded bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          Search
        </button>
        <button
          onClick={handleExport}
          className="h-10 rounded bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200"
        >
          Export
        </button>
      </div>
    </div>
  );
}
