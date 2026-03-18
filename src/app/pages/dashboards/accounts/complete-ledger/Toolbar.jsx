// Import Dependencies
import { useState } from "react";
import clsx from "clsx";

export function Toolbar({ filters, onChange, onSearch }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [customer, setCustomer] = useState(filters.customerid || "");
  const [filterType, setFilterType] = useState(filters.type || "");
  const [bd, setBd] = useState(filters.bd || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "customerid") setCustomer(value);
    if (name === "type") setFilterType(value);
    if (name === "bd") setBd(value);
    onChange(name, value);
  };

  return (
    <div className="px-(--margin-x) pt-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Ledger
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1.6fr_1fr]">
        <input
          type="text"
          value={startDate}
          onChange={(e) => handleInput("startdate", e.target.value)}
          onFocus={(e) => (e.target.type = "date")}
          onBlur={(e) => {
            if (!e.target.value) e.target.type = "text";
          }}
          placeholder="Start Date"
          className={clsx(
            "h-10 w-full rounded border border-blue-500 px-3 text-sm outline-none",
            "focus:ring-2 focus:ring-blue-500/40",
          )}
        />
        <input
          type="text"
          value={endDate}
          onChange={(e) => handleInput("enddate", e.target.value)}
          onFocus={(e) => (e.target.type = "date")}
          onBlur={(e) => {
            if (!e.target.value) e.target.type = "text";
          }}
          placeholder="End Date"
          className={clsx(
            "h-10 w-full rounded border border-blue-500 px-3 text-sm outline-none",
            "focus:ring-2 focus:ring-blue-500/40",
          )}
        />
        <select
          value={customer}
          onChange={(e) => handleInput("customerid", e.target.value)}
          className={clsx(
            "h-10 w-full rounded border border-gray-300 px-3 text-sm text-gray-700",
            "focus:border-blue-500 focus:outline-none",
          )}
        >
          <option value="">Select Customer</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => handleInput("type", e.target.value)}
          className={clsx(
            "h-10 w-full rounded border border-gray-300 px-3 text-sm text-gray-700",
            "focus:border-blue-500 focus:outline-none",
          )}
        >
          <option value="">All</option>
          <option value="Sales">Sales</option>
          <option value="Payment">Payment</option>
        </select>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-[0.6fr_auto]">
        <select
          value={bd}
          onChange={(e) => handleInput("bd", e.target.value)}
          className={clsx(
            "h-10 w-full rounded border border-gray-300 px-3 text-sm text-gray-700",
            "focus:border-blue-500 focus:outline-none",
          )}
        >
          <option value="">Select BD</option>
        </select>
        <button
          onClick={onSearch}
          className="h-10 rounded bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>
      </div>
    </div>
  );
}
