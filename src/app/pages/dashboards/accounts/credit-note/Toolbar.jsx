// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate } from "react-router";
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const navigate = useNavigate();

  const permissions =
    localStorage.getItem("userPermissions")?.split(",").map(Number) || [];

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-(--margin-x) pt-4",
        )}
      >
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Credit Note List
        </h2>
        {permissions.includes(335) && (
          <Button
            onClick={() => navigate("/dashboards/accounts/credit-note/add")}
            className="h-9 rounded-md px-4 text-sm font-medium"
            color="primary"
          >
            + New Credit Note
          </Button>
        )}
      </div>

      <div
        className={clsx(
          "transition-content flex items-center gap-2 pt-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-(--margin-x)",
        )}
      >
        <SearchInput table={table} />
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
        input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search ID, Customer..."
    />
  );
}
