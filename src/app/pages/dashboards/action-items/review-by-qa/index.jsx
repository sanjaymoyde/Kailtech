// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage, useDebounceValue } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns.jsx";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "components/shared/table/SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

const selectCls =
  "rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none min-w-[200px] " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition";

// ----------------------------------------------------------------------
export default function QAReview() {
  const { cardSkin } = useThemeContext();
  const permissions  = usePermissions();

  // ── PHP permission 181 — page access guard ───────────────────────────────
  const canAccess = permissions.includes(181);

  // ── Dropdown data ────────────────────────────────────────────────────────
  const [customerTypes,    setCustomerTypes]    = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [departments,      setDepartments]      = useState([]);
  const [customers,        setCustomers]        = useState([]);

  // ── Filter state — matches PHP GET params ────────────────────────────────
  const [ctype,           setCtype]           = useState(""); // ?ctype
  const [specificpurpose, setSpecificpurpose] = useState(""); // ?specificpurpose
  const [department,      setDepartment]      = useState(""); // ?department
  const [cname,           setCname]           = useState(""); // ?cname
  const [startDate,       setStartDate]       = useState(""); // ?startdate
  const [endDate,         setEndDate]         = useState(""); // ?enddate
  const [lrn,             setLrn]             = useState(""); // ?lrn

  const [globalFilter, setGlobalFilter] = useState("");
  // Debounce global filter to avoid excessive API calls
  const [debouncedSearch] = useDebounceValue(globalFilter, 500);

  // ── Table data ────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // ── Fetch dropdown lists ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      // Customer Types — PHP: customertypes where status=1 (perm 389)
      if (permissions.includes(389)) {
        try {
          const res = await axios.get("/people/get-customer-type-list");
          const d   = res.data?.data ?? res.data?.Data ?? res.data ?? [];
          setCustomerTypes(Array.isArray(d) ? d : []);
        } catch { setCustomerTypes([]); }
      }

      // Specific Purposes — PHP: specificpurposes where status=1 (perm 390)
      if (permissions.includes(390)) {
        try {
          const res = await axios.get("/people/get-specific-purpose-list");
          const d   = res.data?.data ?? res.data?.Data ?? res.data ?? [];
          setSpecificPurposes(Array.isArray(d) ? d : []);
        } catch { setSpecificPurposes([]); }
      }

      // Departments — PHP: labs where status=1
      // (filtered by employeedepartment if user lacks perm 346 — backend handles this)
      try {
        const res = await axios.get("/hrm/department-list");
        const d   = res.data?.data ?? res.data?.Data ?? res.data ?? [];
        setDepartments(Array.isArray(d) ? d : []);
      } catch { setDepartments([]); }

      // Customer Names — PHP: customers where status=1
      try {
        const res = await axios.get("/people/get-all-customers");
        const d   = res.data?.data ?? res.data?.Data ?? res.data ?? [];
        setCustomers(Array.isArray(d) ? d : []);
      } catch { setCustomers([]); }
    };

    fetchDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch QA report list — /actionitem/qa-report-list ────────────────────
  // PHP: trfProducts JOIN trfs JOIN products JOIN testprices JOIN hodrequests
  //      WHERE hodrequests.status=8
  //      Filters: ctype, cname, specificpurpose, department
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ctype)           params.append("ctype",           ctype);
      if (specificpurpose) params.append("specificpurpose", specificpurpose);
      if (department)      params.append("department",      department);
      if (cname)           params.append("cname",           cname);
      if (startDate)       params.append("startdate",       startDate);
      if (endDate)         params.append("enddate",         endDate);
      if (lrn)             params.append("lrn",             lrn);
      if (debouncedSearch) params.append("search",          debouncedSearch);

      const res = await axios.get(`/actionitem/qa-report-list?${params.toString()}`);

      // API returns: { status: true, data: [...] }
      const d = res.data?.data ?? res.data ?? [];
      setProducts(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error("Error fetching QA report list:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [ctype, specificpurpose, department, cname, startDate, endDate, lrn, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Column visibility — PHP permission gates ──────────────────────────────
  // main_customer    → perm 358
  // customer_type    → perm 389
  // specific_purpose → perm 390
  const defaultColumnVisibility = {
    main_customer:    permissions.includes(358),
    customer_type:    permissions.includes(389),
    specific_purpose: permissions.includes(390),
  };

  // ── Table setup ───────────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen:   false,
    enableRowDense:     false,
    enableSorting:      true,
    enableColumnFilters: false,
  });

  const [sorting,           setSorting]           = useState([]);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-qa-review-1",
    defaultColumnVisibility,
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-qa-review-1",
    {},
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, sorting, columnVisibility, columnPinning, tableSettings },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.map((row, i) =>
            i === rowIndex ? { ...old[rowIndex], [columnId]: value } : row
          )
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setProducts((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const ids = rows.map((r) => r.original.id);
        setProducts((old) => old.filter((r) => !ids.includes(r.id)));
      },
      setTableSettings,
      refreshData: fetchProducts,
    },
    filterFns:               { fuzzy: fuzzyFilter },
    enableSorting:           tableSettings.enableSorting,
    enableColumnFilters:     tableSettings.enableColumnFilters,
    getCoreRowModel:         getCoreRowModel(),
    onGlobalFilterChange:    setGlobalFilter,
    getFilteredRowModel:     getFilteredRowModel(),
    getFacetedUniqueValues:  getFacetedUniqueValues(),
    getFacetedMinMaxValues:  getFacetedMinMaxValues(),
    globalFilterFn:          fuzzyFilter,
    onSortingChange:         setSorting,
    getSortedRowModel:       getSortedRowModel(),
    getPaginationRowModel:   getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange:    setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [products]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Permission guard — PHP: if(!in_array(181, $permissions)) redirect ─────
  if (!canAccess) {
    return (
      <Page title="QA Review">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 181 required
          </p>
        </div>
      </Page>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  // Subtle loading: Only show full-page spinner on initial load (when no data exists)
  if (loading && products.length === 0) {
    return (
      <Page title="QA Review">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          <span className="text-sm tracking-wide">Loading report data…</span>
        </div>
      </Page>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Page title="QA Review">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Toolbar table={table} />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-(--margin-x)",
            )}
          >
            {/* ─── Filters ──────────────────────────────────────────────── */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

              {/* Row 1 — Customer Type (perm 389) · Specific Purpose (perm 390) · Department */}
              <div className="flex flex-wrap items-end gap-4">

                {/* Customer Type — PHP: perm 389, customertypes where status=1 */}
                {permissions.includes(389) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Customer type:
                    </label>
                    <select
                      className={selectCls}
                      value={ctype}
                      onChange={(e) => setCtype(e.target.value)}
                    >
                      <option value="">Select Customer Type</option>
                      {customerTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specific Purpose — PHP: perm 390, specificpurposes where status=1 */}
                {permissions.includes(390) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Specific Purpose:
                    </label>
                    <select
                      className={selectCls}
                      value={specificpurpose}
                      onChange={(e) => setSpecificpurpose(e.target.value)}
                    >
                      <option value="">Select Specific purpose</option>
                      {specificPurposes.map((sp) => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Department — PHP: labs where status=1 */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Department:
                  </label>
                  <select
                    className={selectCls}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">Select</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Start Date:
                  </label>
                  <input
                    type="date"
                    className={selectCls}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    End Date:
                  </label>
                  <input
                    type="date"
                    className={selectCls}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2 — Customer Name · LRN · Clear Filters */}
              <div className="mt-3 flex flex-wrap items-end gap-4">

                {/* Customer Name — PHP: customers where status=1 */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Customer Name:
                  </label>
                  <select
                    className={selectCls}
                    value={cname}
                    onChange={(e) => setCname(e.target.value)}
                  >
                    <option value="">Select Customer Name</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* LRN Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    LRN:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter LRN"
                    className={selectCls}
                    value={lrn}
                    onChange={(e) => setLrn(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => {
                    setCtype("");
                    setSpecificpurpose("");
                    setDepartment("");
                    setCname("");
                    setStartDate("");
                    setEndDate("");
                    setLrn("");
                    setGlobalFilter("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* ─── Table ────────────────────────────────────────────────── */}
            <Card
              className={clsx(
                "relative flex grow flex-col overflow-hidden",
                tableSettings.enableFullScreen && "overflow-hidden",
              )}
            >
              {/* Subtle Progress Bar for re-fetching */}
              {loading && products.length > 0 && (
                <div className="absolute top-0 left-0 z-10 w-full">
                  <div className="h-0.5 w-full overflow-hidden bg-blue-100 dark:bg-blue-900/30">
                    <div className="h-full w-1/3 animate-progress bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                  </div>
                </div>
              )}
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table
                  hoverable
                  dense={tableSettings.enableRowDense}
                  sticky={tableSettings.enableFullScreen}
                  className="w-full text-left rtl:text-right"
                >
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left"  && "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="flex-1">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                <TableSortIcon sorted={header.column.getIsSorted()} />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
 
                  <TBody className={clsx(
                    "transition-opacity duration-300",
                    loading && products.length > 0 ? "opacity-50 grayscale-[20%]" : "opacity-100"
                  )}>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td colSpan={99} className="py-12 text-center text-sm text-gray-400">
                          No items found.
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() && !isSafari &&
                              "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white",
                                cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900",
                                cell.column.getCanPin() && [
                                  cell.column.getIsPinned() === "left"  && "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                                ],
                              )}
                            >
                              {cell.column.getIsPinned() && (
                                <div
                                  className={clsx(
                                    "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                    cell.column.getIsPinned() === "left"
                                      ? "ltr:border-r rtl:border-l"
                                      : "ltr:border-l rtl:border-r",
                                  )}
                                />
                              )}
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>

              <SelectedRowsActions table={table} title="Review By QA" showDelete={false} />

              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
                    !(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && "pt-4",
                  )}
                >
                  <PaginationSection table={table} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
