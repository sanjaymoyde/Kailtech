// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
// import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [

  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S. No.",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Date Time (When) - using added_on from API
  columnHelper.accessor("added_on", {
    id: "date_time",
    header: "Date Time (When)",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "-";

      // Format the datetime
      try {
        // The API returns format like "2024-07-01 01:11:00.00"
        const date = new Date(value);
        return date.toLocaleString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      } catch {
        return value;
      }
    },
  }),

  // ✅ Employee Name & Code (Who) - using added_by from API
  columnHelper.accessor("added_by", {
    id: "employee",
    header: "Employee Name & Code (Who)",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Activities (What) - using activity from API
  columnHelper.accessor("activity", {
    id: "activities",
    header: "Activities (What)",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Remark (Why) - using remark from API (currently empty in response)
  columnHelper.accessor("remark", {
    id: "remark",
    header: "Remark (Why)",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ How - using how from API
  columnHelper.accessor("how", {
    id: "how",
    header: "How",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Location (Where) - using ip from API
  columnHelper.accessor("ip", {
    id: "location",
    header: "Location (Where)",
    cell: (info) => info.getValue() || "-",
  }),


];