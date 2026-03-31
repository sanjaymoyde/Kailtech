// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate } from "react-router";
import PropTypes from "prop-types";

// Local Imports
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

export function Toolbar({
  table,
  filters,
  setFilters,
  customers,
  bdList,
  onSearch,
  permissions = [],
}) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const navigate = useNavigate();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="table-toolbar">
      {/* ── Top Row: Title + Button ── */}
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-(--margin-x) pt-4",
        )}
      >
        <div className="min-w-0">
          <h2 className="dark:text-dark-50 text-xl font-semibold tracking-wide text-gray-800">
            Payment List
          </h2>
        </div>
        <div className="flex gap-2">
          {permissions.includes(274) && (
            <>
              <Button
                onClick={() => navigate("/dashboards/accounts/payment-list/create")}
                className="h-9 rounded-md px-4 text-sm font-medium"
                color="primary"
              >
                + Payment Received
              </Button>
              <Button
                onClick={() =>
                  navigate("/dashboards/accounts/payment-list/create?advance=Yes")
                }
                className="h-9 rounded-md px-4 text-sm font-medium"
                color="info"
              >
                + Advance Payment Received
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Filter Row: Start Date | End Date | Customer | BD | Search btn ── */}
      <div
        className={clsx(
          "transition-content mt-4 flex flex-nowrap items-end gap-3 overflow-x-auto",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-(--margin-x)",
        )}
      >
        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            Start Date
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
            }}
            value={filters.startdate}
            onChange={(selectedDates, dateStr) =>
              handleFilterChange("startdate", dateStr)
            }
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            End Date
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
            }}
            value={filters.enddate}
            onChange={(selectedDates, dateStr) =>
              handleFilterChange("enddate", dateStr)
            }
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Customer Select */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            Customer
          </label>
          <select
            value={filters.customerid}
            onChange={(e) => handleFilterChange("customerid", e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-[220px] rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          >
            <option value="">Select Customer</option>
            <option value="Suspense">Suspense</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* BD Select */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            BD
          </label>
          <select
            value={filters.bd}
            onChange={(e) => handleFilterChange("bd", e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-[160px] rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          >
            <option value="">Select BD</option>
            {bdList.map((bd) => (
              <option key={bd.id} value={bd.id}>
                {bd.firstname} {bd.lastname}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          className="h-9 rounded-md px-5 text-sm font-medium"
          color="primary"
          variant="outlined"
        >
          Search
        </Button>
      </div>

      {/* ── Search Input Row ── */}
      <div
        className={clsx(
          "transition-content flex justify-between gap-4 pt-4 pb-1",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-(--margin-x)",
        )}
      >
        <div className="flex shrink-0 items-center space-x-2">
          <SearchInput table={table} />
        </div>
        <TableConfig table={table} />
      </div>
    </div>
  );
}

function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "ring-primary-500/50 h-8 text-xs focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search receipt, customer..."
    />
  );
}

Toolbar.propTypes = {
  table: PropTypes.object,
  filters: PropTypes.object,
  setFilters: PropTypes.func,
  customers: PropTypes.array,
  bdList: PropTypes.array,
  onSearch: PropTypes.func,
  permissions: PropTypes.array,
};
