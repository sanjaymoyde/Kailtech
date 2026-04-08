// Import Dependencies
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  PrinterIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Local Imports
import { Button, GhostSpinner } from "components/ui";

/**
 * Shared SelectedRowsActions Component
 * Handles Global Bulk Selection Actions: Delete, Print, Export (CSV/PDF)
 */
export function SelectedRowsActions({ 
  table, 
  title = "Report", 
  showDelete = false, 
  showPrint = true, 
  showExport = true 
}) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const selectedRows = table.getSelectedRowModel().rows;

  // --- LOGIC: PRINTING ---
  const handlePrint = () => {
    try {
      toast.success("Preparing for print...");
      
      const activeColumns = table.getAllColumns()
        .filter(col => col.getIsVisible() && !["select", "actions", "expander"].includes(col.id));

      const headers = activeColumns.map(col => {
        const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id;
        return String(header).toUpperCase();
      });

      const rows = selectedRows.map(row => 
        activeColumns.map(col => {
          const val = row.getValue(col.id);
          return val === undefined || val === null ? "" : String(val);
        })
      );

      const printWindow = window.open('', '_blank');
      const html = `
        <html>
          <head>
            <title>Print ${title}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f7f7f7; font-weight: bold; text-transform: uppercase; font-size: 11px; }
              td { font-size: 10px; }
              .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">KAILTECH</div>
              <h2>${title}</h2>
              <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <table>
              <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
            <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to generate print view");
    }
  };

  // --- LOGIC: EXPORT CSV ---
  const handleExportCSV = () => {
    try {
      const activeColumns = table.getAllColumns()
        .filter(col => col.getIsVisible() && !["select", "actions", "expander"].includes(col.id));

      const headers = activeColumns.map(col => {
        const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id;
        return header.toUpperCase();
      });

      const csvContent = [
        headers.join(","),
        ...selectedRows.map(row => 
          activeColumns.map(col => `"${String(row.getValue(col.id) || "").replace(/"/g, '""')}"`).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to export CSV");
    }
  };

  // --- LOGIC: EXPORT PDF ---
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const activeColumns = table.getAllColumns().filter(col => col.getIsVisible() && !["select", "actions", "expander"].includes(col.id));
      const headers = activeColumns.map(col => String(typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id).toUpperCase());
      const body = selectedRows.map(row => activeColumns.map(col => String(row.getValue(col.id) || "")));

      doc.text("KAILTECH - " + title, 14, 15);
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 20,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      doc.save(`${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to export PDF");
    }
  };

  // --- LOGIC: DELETE ---
  const handleDeleteRows = async () => {
    if (selectedRows.length > 0 && table.options.meta?.deleteRows) {
      setDeleteLoading(true);
      try {
        await table.options.meta.deleteRows(selectedRows);
        table.resetRowSelection();
      } catch (err) {
        console.error("Delete error:", err);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  return (
    <Transition
      as={Fragment}
      show={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}
      enter="transition-all duration-200"
      enterFrom="opacity-0 translate-y-4 scale-95"
      enterTo="opacity-100 translate-y-0 scale-100"
      leave="transition-all duration-150"
      leaveFrom="opacity-100 translate-y-0 scale-100"
      leaveTo="opacity-0 translate-y-4 scale-95"
    >
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex items-center justify-center">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl bg-white border border-gray-200 p-2 shadow-2xl ring-1 ring-black/5 dark:bg-dark-800 dark:border-dark-600 sm:p-3 max-w-2xl w-full mx-4">
          <div className="flex items-center space-x-3 px-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-xs ring-4 ring-primary-500/10">
              {selectedRows.length}
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-none">
                Selected
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                from {table.getCoreRowModel().rows.length} total
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-dark-600 mx-2 hidden sm:block"></div>

          <div className="flex items-center space-x-2">
            {showDelete && table.options.meta?.deleteRows && (
              <Button 
                onClick={handleDeleteRows}
                color="error" 
                variant="flat"
                className="gap-1.5 h-10 rounded-lg px-4 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10"
                disabled={deleteLoading}
              >
                {deleteLoading ? <GhostSpinner className="size-3.5" /> : <TrashIcon className="size-4" />}
                <span className="max-sm:hidden">Delete</span>
              </Button>
            )}
            
            {showPrint && (
              <Button 
                onClick={handlePrint}
                variant="flat"
                className="gap-1.5 h-10 rounded-lg px-4 text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-dark-700 dark:text-dark-100 dark:hover:bg-dark-600"
              >
                <PrinterIcon className="size-4" />
                <span className="max-sm:hidden">Print</span>
              </Button>
            )}

            {showExport && (
              <Menu as="div" className="relative inline-block text-left">
                <MenuButton 
                  as={Button} 
                  variant="flat"
                  className="gap-1.5 h-10 rounded-lg px-4 text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-dark-700 dark:text-dark-100 dark:hover:bg-dark-600"
                >
                  <EllipsisHorizontalIcon className="size-4" />
                  <span className="max-sm:hidden">Actions</span>
                </MenuButton>
                <Transition
                  as={MenuItems}
                  anchor={{ to: "top end", gap: 12 }}
                  className="absolute z-100 min-w-[14rem] rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 dark:border-dark-500 dark:bg-dark-750"
                >
                  <MenuItem>
                    {({ focus }) => (
                      <button 
                        onClick={handleExportCSV} 
                        className={clsx(
                          "group flex w-full items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                          focus ? "bg-primary-50 text-primary-600 dark:bg-primary-900/10 dark:text-primary-300" : "text-gray-700 dark:text-gray-200"
                        )}
                      >
                        <ArrowUpTrayIcon className="mr-3 size-4.5 opacity-60" />
                        <span>Export as CSV</span>
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button 
                        onClick={handleExportPDF} 
                        className={clsx(
                          "group flex w-full items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                          focus ? "bg-primary-50 text-primary-600 dark:bg-primary-900/10 dark:text-primary-300" : "text-gray-700 dark:text-gray-200"
                        )}
                      >
                        <ArrowUpTrayIcon className="mr-3 size-4.5 opacity-60" />
                        <span>Export as PDF</span>
                      </button>
                    )}
                  </MenuItem>
                  <div className="h-px bg-gray-100 dark:bg-dark-600 my-1"></div>
                  <MenuItem>
                    {({ focus }) => (
                      <button 
                        onClick={() => table.resetRowSelection()} 
                        className={clsx(
                          "group flex w-full items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                          focus ? "bg-gray-100 text-gray-800 dark:bg-dark-600" : "text-gray-400"
                        )}
                      >
                        <TrashIcon className="mr-3 size-4.5 opacity-60" />
                        <span>Clear Selection</span>
                      </button>
                    )}
                  </MenuItem>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>
    </Transition>
  );
}

SelectedRowsActions.propTypes = {
  table: PropTypes.object.isRequired,
  title: PropTypes.string,
  showDelete: PropTypes.bool,
  showPrint: PropTypes.bool,
  showExport: PropTypes.bool,
};
