import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [

  // ✅ Serial Number
  // columnHelper.accessor((_row, index) => index + 1, {
  //   id: "s_no",
  //   header: "S No",
  //   cell: (info) => info.row.index + 1,
  // }),

  // ✅ ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  // ✅ Date
  columnHelper.accessor("quantity measured/instrument", {
    id: "quantity measured/instrument",
    header: "Quantity Measured/Instrument",
    cell: (info) => info.getValue(), // Format if needed
  }),

  // ✅ Inward Entry No (PO Number)
  columnHelper.accessor("mode", {
    id: "mode",
    header: "Mode",
    cell: (info) => info.getValue(),
  }),

  // ✅ Customer Name
  columnHelper.accessor("range/frequency", {
    id: "range/frequency",
    header: "Range/Frequency",
    cell: (info) => info.getValue(),
  }),

  // ✅ Contact Person
  columnHelper.accessor("* calibration measurement capability(±)", {
    id: "* calibration measurement capability(±)",
    header: "* Calibration Measurement Capability(±)",
    cell: (info) => info.getValue(),
  }),

  // ✅ Location
  columnHelper.accessor("instrumentlocation", {
    id: "instrumentlocation",
    header: "Location",
    cell: (info) => info.getValue(),
  }),

  // ✅ Remarks
  columnHelper.accessor("certcollectionremark", {
    id: "certcollectionremark",
    header: "Remarks",
    cell: (info) => info.getValue(),
  }),

  // ✅ Row Actions (Edit/Delete buttons)
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];
