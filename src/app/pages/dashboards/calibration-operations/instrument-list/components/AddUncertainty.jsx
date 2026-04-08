import { useState, useEffect } from "react";
import axios from "utils/axios";
// import { useNavigate } from "react-router-dom";
import UncertaintyTable from "../../../Operations/observation-settings/components/UncertaintyTable";
import { EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Button } from "components/ui/button";

export default function AddUncertainty({
  instid,
  instrumentId,
  formatId,
  onComplete,
  onBack,
}) {
  // const { id: formatId } = useParams();
  // const navigate = useNavigate();

  console.log("Instrument ID from URL:", formatId);

  // ✅ Table list
  const tableList = [
    { value: "mastermatrix", label: "Master Matrix" },
    { value: "newcrfcalibrationpoint", label: "CRF Calibration Point" },
    { value: "new_summary", label: "Summary" },
    { value: "new_crfmatrix", label: "CRF Matrix" },
    { value: "cmcscope", label: "CMC Scope" },
  ];

  // ✅ States
  const [tables, setTables] = useState([{
    id: Date.now(),
    tableName: "",
    rows: []
  }]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const data = [
    { type: "Operator", symbol: "+", name: "Addition", example: "$a + $b" },
    { type: "Operator", symbol: "-", name: "Subtraction", example: "$a - $b" },
    {
      type: "Operator",
      symbol: "*",
      name: "Multiplication",
      example: "$a * $b",
    },
    { type: "Operator", symbol: "/", name: "Division", example: "$a / $b" },
    { type: "Operator", symbol: "%", name: "Modulus", example: "$a % $b" },
    {
      type: "Function",
      symbol: "abs($x)",
      name: "Absolute Value",
      example: "abs(-5) → 5",
    },
    {
      type: "Function",
      symbol: "pow($x, $y)",
      name: "Power",
      example: "pow(2, 3) → 8",
    },
    {
      type: "Function",
      symbol: "sqrt($x)",
      name: "Square Root",
      example: "sqrt(16) → 4",
    },
    {
      type: "Function",
      symbol: "min($a, $b, ...)",
      name: "Minimum Value",
      example: "min(2, 5, 3) → 2",
    },
    {
      type: "Function",
      symbol: "max($a, $b, ...)",
      name: "Maximum Value",
      example: "max(2, 5, 3) → 5",
    },
    {
      type: "Example",
      symbol: "($a + $b) / 2",
      name: "Average Formula",
      example: "Average of A and B",
    },
    {
      type: "Example",
      symbol: "sqrt($a * $b)",
      name: "Geometric Mean",
      example: "Square root of A×B",
    },
    {
      type: "Example",
      symbol: "abs($a - $b)",
      name: "Absolute Difference",
      example: "Difference without sign",
    },
  ];
  // ✅ Helper: Create empty row
  const createEmptyRow = (id) => ({
    id,
    checked: true,
    selectedTable: null,
    fieldname: null,
    fieldfrom: "",
    setVariable: "",
    fieldHeading: "",
    formula: "",
    fieldPosition: "",
    fieldnameOptions: [],
  });

  // ✅ Table management functions
  const addTable = () => {
    setTables([...tables, {
      id: Date.now(),
      tableName: "",
      rows: [createEmptyRow(1)]
    }]);
  };

  const removeTable = (tableId) => {
    if (tables.length === 1) return;
    setTables(tables.filter(t => t.id !== tableId));
  };

  const handleTableNameChange = (tableId, value) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, tableName: value } : t));
  };

  // ✅ Auto-fetch data when formatId is available
  useEffect(() => {
    console.log("EditUncertainty received formatId:", formatId);
    if (formatId) {
      fetchUncertaintySettings(formatId);
    } else {
      console.error("No formatId provided to EditUncertainty component");
    }
  }, [formatId]);

  // ✅ Fetch fieldname options based on selected table
  // ✅ Fetch fieldname options (All in One API)
  const fetchFieldnameOptions = async (tableName) => {
    if (!tableName) return [];

    try {
      // Call only ONCE the unified API that returns all 5 lists
      const response = await axios.get(
        "/observationsetting/get-all-summary-type",
      );

      // 👆 this API should return your provided JSON (new_summary, mastermatrix, etc.)

      if (!response.data.success) return [];

      const data = response.data;

      // 🔁 Map tableName to the correct list
      let targetList = [];
      switch (tableName) {
        case "new_summary":
          targetList = data.new_summary;
          break;
        case "mastermatrix":
          targetList = data.mastermatrix;
          break;
        case "newcrfcalibrationpoint":
          targetList = data.newcrfcalibrationpoint;
          break;
        case "new_crfmatrix":
          targetList = data.new_crfmatrix;
          break;
        case "cmcscope":
          targetList = data.cmcscope;
          break;
        default:
          targetList = [];
      }

      // ✅ Return formatted options for React Select
      if (Array.isArray(targetList)) {
        return targetList.map((fieldname) => ({
          value: fieldname,
          label: fieldname,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching fieldname options:", error);
      return [];
    }
  };

  // ✅ Fetch uncertainty settings
  const fetchUncertaintySettings = async (fid) => {
    if (!fid) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `/observationsetting/get-observation-setting/${instrumentId}`,
      );

      if (response.data.success) {
        const data = response.data.data;
        console.log("Fetched uncertainty settings:", data);

        if (
          data.uncertaintysetting &&
          data.uncertaintysetting.uncertaintysetting &&
          data.uncertaintysetting.uncertaintysetting.length > 0
        ) {
          const uncertaintyData = await Promise.all(
            data.uncertaintysetting.uncertaintysetting.map(
              async (item, index) => {
                const tableObj = tableList.find(
                  (t) => t.value === item.fieldfrom,
                );

                let fieldnameOptions = [];
                if (item.fieldfrom) {
                  fieldnameOptions = await fetchFieldnameOptions(
                    item.fieldfrom,
                  );
                }

                return {
                  id: index + 1,
                  checked: item.checkbox === "yes",
                  selectedTable: tableObj || null,
                  fieldname: item.fieldname
                    ? { value: item.fieldname, label: item.fieldname }
                    : null,
                  fieldfrom: item.fieldfrom || "",
                  fieldHeading: item.field_heading || "",
                  formula: item.formula || "",
                  fieldPosition: item.field_position
                    ? item.field_position.toString()
                    : "",
                  setVariable: item.variable || "",
                  fieldnameOptions: fieldnameOptions,
                };
              },
            ),
          );
          setTables([{
            id: Date.now(),
            tableName: "Uncertainty Table",
            rows: uncertaintyData
          }]);
        } else {
          setTables([{
            id: Date.now(),
            tableName: "",
            rows: [createEmptyRow(1)]
          }]);
        }
      } else {
        setTables([{
          id: Date.now(),
          tableName: "",
          rows: [createEmptyRow(1)]
        }]);
      }
    } catch (error) {
      console.error("Error fetching uncertainty settings:", error);
      setTables([{
        id: Date.now(),
        tableName: "",
        rows: [createEmptyRow(1)]
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Custom styles for React Select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
    }),
  };

  // ✅ Handlers
  const handleCheckbox = (tableId, id) => {
    setTables(prev => prev.map(t => t.id === tableId ? {
      ...t,
      rows: t.rows.map((row) => {
        if (row.id === id) {
          const newChecked = !row.checked;
          return {
            ...row,
            checked: newChecked,
            fieldPosition: newChecked
              ? row.fieldPosition === "0" || row.fieldPosition === 0
                ? "1"
                : row.fieldPosition
              : "0",
          };
        }
        return row;
      })
    } : t));
  };

  const handleInputChange = (tableId, id, field, value) => {
    setTables(prev => prev.map(t => t.id === tableId ? {
      ...t,
      rows: t.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    } : t));
  };

  const handleTableSelection = async (tableId, id, selectedOption) => {
    if (selectedOption) {
      const options = await fetchFieldnameOptions(selectedOption.value);

      setTables(prev => prev.map(t => t.id === tableId ? {
        ...t,
        rows: t.rows.map((row) =>
          row.id === id
            ? {
              ...row,
              selectedTable: selectedOption,
              fieldfrom: selectedOption.value,
              fieldname: null,
              fieldnameOptions: options,
            }
            : row
        )
      } : t));
    } else {
      setTables(prev => prev.map(t => t.id === tableId ? {
        ...t,
        rows: t.rows.map((row) =>
          row.id === id
            ? {
              ...row,
              selectedTable: null,
              fieldfrom: "",
              fieldname: null,
              fieldnameOptions: [],
            }
            : row
        )
      } : t));
    }
  };

  const handleFieldnameChange = (tableId, id, selectedOption) => {
    setTables(prev => prev.map(t => t.id === tableId ? {
      ...t,
      rows: t.rows.map((row) =>
        row.id === id ? { ...row, fieldname: selectedOption } : row
      )
    } : t));
  };

  const addRow = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const newId = t.rows.length > 0 ? Math.max(...t.rows.map((r) => r.id)) + 1 : 1;
        return { ...t, rows: [...t.rows, createEmptyRow(newId)] };
      }
      return t;
    }));
  };

  const removeRow = (tableId, id) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        if (t.rows.length === 1) {
          alert("At least one row is required!");
          return t;
        }
        return { ...t, rows: t.rows.filter((row) => row.id !== id) };
      }
      return t;
    }));
  };

  // const handleBack = () => {
  //   navigate("/dashboards/operations/observation-settings");
  // };

  // ✅ Save handler - EXACTLY like cURL API
  const handleSave = async () => {
    if (!formatId) {
      alert("Format ID is missing! Please check the URL parameter.");
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        alert("Authentication token not found! Please login again.");
        setLoading(false);
        return;
      }

      // ✅ Collect all rows from all tables
      const allRows = tables.flatMap(table => table.rows);

      // ✅ Filter and map rows - allowing empty fieldfrom/fieldname like in cURL
      const uncertaintysetting = allRows.map((row) => ({
        fieldfrom: row.fieldfrom || "",
        fieldname: row.fieldname?.value || "",
        variable: row.setVariable || "",
        field_heading: row.fieldHeading || "",
        field_position: parseInt(row.fieldPosition) || "0",
        formula: row.formula || "",
        checkbox: row.checked ? "yes" : "no",
      }));

      const payload = {
        instrument_id: instrumentId,
        instid: instid,
        observation_id: parseInt(formatId),
        resultsetting: {
          uncertaintysetting: uncertaintysetting,
        },
      };

      console.log("=== SENDING PAYLOAD ===");
      console.log(JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "/observationsetting/set-uncertainty-setting",
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("=== API RESPONSE ===");
      console.log(response.data);

      if (response.data.success) {
        setSuccessMessage("Observation setting updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchUncertaintySettings(formatId);
        toast.success("Uncertainty settings saved!");
        onComplete(); // Complete all steps
      } else {
        alert("Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("=== ERROR ===", error);
      alert(
        `Error: ${error.response?.data?.message || error.message || "Failed to save data"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!formatId) {
    return <div className="p-6 text-red-600">Invalid format ID.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-[98%] space-y-6">
        {/* Back Button */}
        {/* <div className="flex items-center justify-start gap-4">
          <button
            style={{ cursor: "pointer" }}
            onClick={handleBack}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </button>
        </div> */}
        {/* Title + View Icon */}
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
          Edit Uncertainty Setting
          <EyeIcon
            className="h-6 w-6 cursor-pointer text-blue-600 transition hover:text-blue-800"
            onClick={() => setIsModalOpen(true)}
          />
        </h1>
        {/* Modal Section */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative max-h-[85vh] w-[900px] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              {/* Close Button */}
              <button
                style={{ cursor: "pointer" }}
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <h2 className="mb-4 border-b pb-3 text-center text-xl font-bold text-gray-800">
                🧮 Formula Reference Table
              </h2>

              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left">Type</th>
                    <th className="border px-3 py-2 text-left">
                      Symbol / Function
                    </th>
                    <th className="border px-3 py-2 text-left">Description</th>
                    <th className="border px-3 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{item.type}</td>
                      <td className="border px-3 py-2 font-mono text-blue-700">
                        {item.symbol}
                      </td>
                      <td className="border px-3 py-2">{item.name}</td>
                      <td className="border px-3 py-2 text-gray-600">
                        {item.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table Component */}
        <div className="space-y-6">
          <div className="px-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Uncertainty Tables</h2>
            <button
              onClick={addTable}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
              title="Add new table"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Table
            </button>
          </div>

          {tables.map((table, tableIdx) => (
            <div key={table.id} className="overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="whitespace-nowrap text-xl font-bold text-gray-800">
                      Table {tableIdx + 1}
                    </h3>
                    <input
                      type="text"
                      value={table.tableName || ""}
                      onChange={(e) => handleTableNameChange(table.id, e.target.value)}
                      className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter table name..."
                    />
                  </div>
                  {tableIdx > 0 && (
                    <button
                      onClick={() => removeTable(table.id)}
                      className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Table
                    </button>
                  )}
                </div>
              </div>

              <UncertaintyTable
                rows={table.rows}
                tableList={tableList}
                customSelectStyles={customSelectStyles}
                handleCheckbox={(id) => handleCheckbox(table.id, id)}
                handleInputChange={(id, field, value) => handleInputChange(table.id, id, field, value)}
                handleTableSelection={(id, selectedOption) => handleTableSelection(table.id, id, selectedOption)}
                handleFieldnameChange={(id, selectedOption) => handleFieldnameChange(table.id, id, selectedOption)}
                addRow={() => addRow(table.id)}
                removeRow={(id) => removeRow(table.id, id)}
                loading={loading}
              />
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-4 flex flex-row items-center justify-between gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Back
          </Button>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{ cursor: loading ? "not-allowed" : "pointer" }}
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save & Next
          </button>
        </div>
      </div>

      {/* Toast-style Success Message */}
      {successMessage && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-2xl">
            {successMessage}
          </div>
        </div>
      )}
    </div>
  );
}
