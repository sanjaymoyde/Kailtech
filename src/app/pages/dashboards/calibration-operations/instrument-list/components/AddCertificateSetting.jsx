import { useState, useEffect } from "react";
import axios from "utils/axios";
import CertificateTable from "./CertificateTable";
import { toast } from "react-hot-toast";
import { Button } from "components/ui/button";

export default function AddCertificateSetting({
  instid,
  instrumentId,
  formatId,
  onComplete,
  onBack,
}) {
  console.log("AddCertificateSetting received:", {
    instid,
    instrumentId,
    formatId,
  });

  // ✅ Table list
  const tableList = [
    { value: "mastermatrix", label: "Master Matrix" },
    { value: "newcrfcalibrationpoint", label: "CRF Calibration Point" },
    { value: "new_summary", label: "Summary" },
    { value: "new_crfmatrix", label: "CRF Matrix" },
    { value: "cmcscope", label: "CMC Scope" },
  ];

  // ✅ States
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Helper: Create empty row
  const createEmptyRow = (id) => ({
    id,
    checked: true,
    selectedTable: null,
    fieldname: null,
    fieldfrom: "",
    setVariable: "",
    fieldHeading: "",
    fieldPosition: "",
    fieldnameOptions: [],
  });

  // ✅ Auto-fetch data when formatId is available
  useEffect(() => {
    console.log("AddCertificateSetting formatId:", formatId);
    if (formatId) {
      fetchCertificateSettings(formatId);
    } else {
      console.error("No formatId provided to AddCertificateSetting component");
    }
  }, [formatId]);

  // ✅ Fetch fieldname options (All in One API)
  const fetchFieldnameOptions = async (tableName) => {
    if (!tableName) return [];

    try {
      const response = await axios.get(
        "/observationsetting/get-all-summary-type",
      );

      if (!response.data.success) return [];

      const data = response.data;

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

  // ✅ Fetch certificate settings
  const fetchCertificateSettings = async (fid) => {
    if (!fid) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `/observationsetting/get-observation-setting/${instrumentId}`,
      );

      if (response.data.success) {
        const data = response.data.data;
        console.log("Fetched certificate settings:", data);

        if (
          data.certificatesetting &&
          data.certificatesetting.certificatesetting &&
          data.certificatesetting.certificatesetting.length > 0
        ) {
          const certificateData = await Promise.all(
            data.certificatesetting.certificatesetting.map(
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
                  fieldPosition: item.field_position
                    ? item.field_position.toString()
                    : "",
                  setVariable: item.variable || "",
                  fieldnameOptions: fieldnameOptions,
                };
              },
            ),
          );
          setRows(certificateData);
        } else {
          setRows([createEmptyRow(1)]);
        }
      } else {
        setRows([createEmptyRow(1)]);
      }
    } catch (error) {
      console.error("Error fetching certificate settings:", error);
      setRows([createEmptyRow(1)]);
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
  const handleCheckbox = (id) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
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
      }),
    );
  };

  const handleInputChange = (id, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleTableSelection = async (id, selectedOption) => {
    if (selectedOption) {
      const options = await fetchFieldnameOptions(selectedOption.value);

      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === id
            ? {
              ...row,
              selectedTable: selectedOption,
              fieldfrom: selectedOption.value,
              fieldname: null,
              fieldnameOptions: options,
            }
            : row,
        ),
      );
    } else {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === id
            ? {
              ...row,
              selectedTable: null,
              fieldfrom: "",
              fieldname: null,
              fieldnameOptions: [],
            }
            : row,
        ),
      );
    }
  };

  const handleFieldnameChange = (id, selectedOption) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, fieldname: selectedOption } : row,
      ),
    );
  };

  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    setRows([...rows, createEmptyRow(newId)]);
  };

  const removeRow = (id) => {
    if (rows.length === 1) {
      alert("At least one row is required!");
      return;
    }
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  // ✅ Save handler - Certificate Setting API
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

      // ✅ Map rows to certificate settings format
      const certificatesetting = rows.map((row) => ({
        fieldfrom: row.fieldfrom || "",
        fieldname: row.fieldname?.value || "",
        variable: row.setVariable || "",
        field_heading: row.fieldHeading || "",
        field_position: parseInt(row.fieldPosition) || "0",
        formula: null,
        checkbox: row.checked ? "yes" : "no",
      }));

      const payload = {
        observation_id: parseInt(formatId),
        instid: instid,
        resultsetting: {
          certificatesetting: certificatesetting,
        },
      };

      console.log("=== SENDING CERTIFICATE PAYLOAD ===");
      console.log(JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "/observationsetting/set-certificate-setting",
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
        setSuccessMessage("Certificate setting saved successfully!");
        toast.success("Certificate settings saved successfully!");
        setTimeout(() => {
          setSuccessMessage("");
          onComplete(); // ✅ Complete all steps
        }, 1500);
      } else {
        alert("Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("=== ERROR ===", error);
      toast.error(
        error.response?.data?.message || "Failed to save certificate settings"
      );
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
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-[98%] space-y-6">
          {/* Title */}
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            Certificate Settings
          </h1>

          {/* Table Component */}
          <CertificateTable
            rows={rows}
            tableList={tableList}
            customSelectStyles={customSelectStyles}
            handleCheckbox={handleCheckbox}
            handleInputChange={handleInputChange}
            handleTableSelection={handleTableSelection}
            handleFieldnameChange={handleFieldnameChange}
            addRow={addRow}
            removeRow={removeRow}
            loading={loading}
          />

          {/* Action Buttons */}
          <div className="mt-4 flex flex-row items-center justify-between gap-2">
            <Button
              onClick={onBack}
              variant="outline"
              className="rounded-md bg-gray-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Back
            </Button>

            <button
              onClick={handleSave}
              disabled={loading}
              style={{ cursor: loading ? "not-allowed" : "pointer" }}
              className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Complete & Finish"
              )}
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
    </>
  );
}