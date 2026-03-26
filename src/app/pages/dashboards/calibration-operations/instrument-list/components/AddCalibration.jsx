import { useState, useEffect } from "react";
import axios from "utils/axios";
import Select from "react-select";
import { TrashIcon } from "@heroicons/react/24/outline";
import { EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Button } from "components/ui/button";

export default function AddCalibration({
  instid,
  instrumentId,
  formatId,
  onNext,
  onBack,
}) {
  const [rows1, setRows1] = useState([]);
  const [rows2, setRows2] = useState([]);
  const [rows3, setRows3] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [labToCalibrateOptions, setLabToCalibrateOptions] = useState([]);
  const [fieldnameOptions, setFieldnameOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uucRepeatableValue, setUucRepeatableValue] = useState("");
  const [masterRepeatableValue, setMasterRepeatableValue] = useState("");

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

  const removeRow1 = (id) => {
    if (rows1.length === 1) {
      alert("At least one row is required!");
      return;
    }
    setRows1((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  const removeRow2 = (id) => {
    if (rows2.length === 1) {
      alert("At least one row is required!");
      return;
    }
    setRows2((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  const setpointOptions = [
    { value: "uuc", label: "uuc" },
    { value: "master", label: "master" },
    { value: "separate", label: "separate" },
  ];

  // CHANGE KARO - customSelectStyles mein menu property
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      minWidth: "200px", // ← add karo
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      width: "350px", // ← ye add karo
      minWidth: "350px", // ← ye add karo
    }),
  };

  useEffect(() => {
    console.log("Edit component received formatId:", formatId);
    console.log("Edit component received instrumentId:", instrumentId);

    if (instrumentId) {
      fetchObservationSettings(instrumentId);
    } else {
      console.error("No instrumentId provided to Edit component");
    }
    fetchLabOptions();
    fetchFieldnameOptions();
  }, [instrumentId]);

  useEffect(() => {
    const currentSetpoint = rows3[0]?.setpoint?.value;

    if (!currentSetpoint) return;

    if (currentSetpoint === "master") {
      handleMasterMode();
    } else if (currentSetpoint === "uuc") {
      handleUucMode();
    } else if (currentSetpoint === "separate") {
      handleSeparateMode();
    }
  }, [rows3[0]?.setpoint?.value, masterRepeatableValue, uucRepeatableValue]);

  const handleMasterMode = () => {
    if (!masterRepeatableValue) {
      setRows2([createEmptyRow2(1, "master")]);
      return;
    }

    const repeatCount = parseInt(masterRepeatableValue);
    if (!isNaN(repeatCount) && repeatCount > 0) {
      const newRows = [];
      for (let i = 1; i <= repeatCount; i++) {
        newRows.push(createEmptyRow2(i, "master"));
      }
      setRows2(newRows);
    } else {
      setRows2([createEmptyRow2(1, "master")]);
    }
  };

  const handleUucMode = () => {
    if (!uucRepeatableValue) {
      setRows2([createEmptyRow2(1, "uuc")]);
      return;
    }

    const repeatCount = parseInt(uucRepeatableValue);
    if (!isNaN(repeatCount) && repeatCount > 0) {
      const newRows = [];
      for (let i = 1; i <= repeatCount; i++) {
        newRows.push(createEmptyRow2(i, "uuc"));
      }
      setRows2(newRows);
    } else {
      setRows2([createEmptyRow2(1, "uuc")]);
    }
  };

  const handleSeparateMode = () => {
    if (rows2.length === 0) {
      setRows2([createEmptyRow2(1, "separate")]);
    }
  };

  const fetchLabOptions = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get("/master/list-lab", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "true" && response.data.data) {
        const labOptions = response.data.data.map((lab) => ({
          value: lab.id,
          label: lab.name,
        }));
        setLabToCalibrateOptions(labOptions);
      }
    } catch (error) {
      console.error("Error fetching lab options:", error);
    }
  };

  const fetchFieldnameOptions = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(
        "/observationsetting/get-all-summary-type",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success && Array.isArray(response.data.new_summary)) {
        const options = response.data.new_summary.map((fieldname) => ({
          value: fieldname,
          label: fieldname,
        }));
        setFieldnameOptions(options);
      } else {
        console.warn("No new_summary found:", response.data);
        setFieldnameOptions([]);
      }
    } catch (error) {
      console.error("Error fetching fieldname options:", error);
      setFieldnameOptions([]);
    }
  };

  const fetchObservationSettings = async (fid) => {
    if (!fid) return;

    setLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(
        `/observationsetting/get-observation-setting/${instrumentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        const data = response.data.data;

        const table1Data = data.resultsetting.calibration_settings.map(
          (item, index) => ({
            id: index + 1,
            checked: item.checkbox === "yes",
            fieldname: item.fieldname
              ? { value: item.fieldname, label: item.fieldname }
              : null,
            fieldHeading: item.field_heading,
            SetVariable: item.SetVariable,
            formula: item.formula,
            fieldPosition: item.field_position.toString(),
          }),
        );

        const table2Data = data.observationsetting.observation_settings.map(
          (item, index) => ({
            id: index + 1,
            checked: item.checkbox === "yes",
            fieldname: item.fieldname,
            setvariable: item.setvariable,
            formula: item.formula,
            fieldHeading: item.field_heading,
          }),
        );

        const setpointValue = data.setpoint
          ? setpointOptions.find(
            (opt) => opt.value.toLowerCase() === data.setpoint.toLowerCase(),
          )
          : null;
        const labValue = data.allottolab
          ? labToCalibrateOptions.find((opt) => opt.value === data.allottolab)
          : null;

        const table3Data = {
          id: 1,
          checked: true,
          setpoint: setpointValue,
          masterRepeatable: data.master?.toString() || "",
          uucRepeatable: data.uuc?.toString() || "",
          labToCalibrate: labValue,
        };

        setRows1(table1Data.length > 0 ? table1Data : [createEmptyRow1(1)]);
        setRows2(
          table2Data.length > 0
            ? table2Data
            : [createEmptyRow2(1, data.setpoint || "uuc")],
        );
        setRows3([table3Data]);

        // Set repeatable values
        setMasterRepeatableValue(data.master?.toString() || "");
        setUucRepeatableValue(data.uuc?.toString() || "");

        if (data.setpoint) {
          if (data.setpoint === "master" && data.master) {
            const masterCount = parseInt(data.master);
            if (!isNaN(masterCount) && masterCount > 0) {
              const masterRows = Array.from(
                { length: masterCount },
                (_, index) => ({
                  ...createEmptyRow2(index + 1, "master"),
                  fieldname: `Master Observation ${index + 1}`,
                  setvariable: `master_obs${index + 1}`,
                }),
              );

              if (table2Data.length === 0) {
                setRows2(masterRows);
              }
            }
          } else if (data.setpoint === "uuc" && data.uuc) {
            const uucCount = parseInt(data.uuc);
            if (!isNaN(uucCount) && uucCount > 0) {
              const uucRows = Array.from({ length: uucCount }, (_, index) => ({
                ...createEmptyRow2(index + 1, "uuc"),
                fieldname: `UUC Observation ${index + 1}`,
                setvariable: `uuc_obs${index + 1}`,
              }));

              if (table2Data.length === 0) {
                setRows2(uucRows);
              }
            }
          }
        }
      } else {
        setRows1([createEmptyRow1(1)]);
        setRows2([createEmptyRow2(1, "uuc")]);
        setRows3([createEmptyRow3(1)]);
      }
    } catch (error) {
      console.error("Error fetching observation settings:", error);
      setRows1([createEmptyRow1(1)]);
      setRows2([createEmptyRow2(1, "uuc")]);
      setRows3([createEmptyRow3(1)]);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyRow1 = (id) => ({
    id,
    checked: true,
    fieldname: null,
    fieldHeading: "",
    SetVariable: "",
    formula: "",
    fieldPosition: "",
  });

  const createEmptyRow2 = (id, type = "uuc") => {
    let fieldname, setvariable;

    switch (type) {
      case "master":
        fieldname = `Master Observation ${id}`;
        setvariable = `master_obs${id}`;
        break;
      case "uuc":
        fieldname = `UUC Observation ${id}`;
        setvariable = `uuc_obs${id}`;
        break;
      case "separate":
        fieldname = `Observation ${id}`;
        setvariable = `obs${id}`;
        break;
      default:
        fieldname = `Observation ${id}`;
        setvariable = `obs${id}`;
    }

    return {
      id,
      checked: true,
      fieldname,
      setvariable,
      formula: "",
      fieldHeading: fieldname,
    };
  };

  const createEmptyRow3 = (id) => ({
    id,
    checked: true,
    setpoint: null,
    masterRepeatable: "",
    uucRepeatable: "",
    labToCalibrate: null,
  });

  const handleCheckbox1 = (id) => {
    setRows1(
      rows1.map((row) =>
        row.id === id ? { ...row, checked: !row.checked } : row,
      ),
    );
  };

  const handleInputChange1 = (id, field, value) => {
    setRows1(
      rows1.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleSelectChange1 = (id, field, selectedOption) => {
    setRows1(
      rows1.map((row) =>
        row.id === id ? { ...row, [field]: selectedOption } : row,
      ),
    );
  };

  const addRow1 = () => {
    const newId =
      rows1.length > 0 ? Math.max(...rows1.map((r) => r.id)) + 1 : 1;
    setRows1([...rows1, createEmptyRow1(newId)]);
  };

  const handleCheckbox2 = (id) => {
    setRows2(
      rows2.map((row) =>
        row.id === id ? { ...row, checked: !row.checked } : row,
      ),
    );
  };

  const handleInputChange2 = (id, field, value) => {
    setRows2(
      rows2.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const addRow2 = () => {
    const newId =
      rows2.length > 0 ? Math.max(...rows2.map((r) => r.id)) + 1 : 1;

    const currentSetpoint = rows3[0]?.setpoint?.value || "uuc";
    setRows2([...rows2, createEmptyRow2(newId, currentSetpoint)]);
  };

  const handleInputChange3 = (id, field, value) => {
    const currentSetpoint = rows3[0]?.setpoint?.value;

    if (field === "masterRepeatable") {
      setMasterRepeatableValue(value);

      if (currentSetpoint === "master") {
        const repeatCount = parseInt(value);
        if (!isNaN(repeatCount) && repeatCount > 0 && repeatCount <= 20) {
          const newRows2 = [];
          for (let i = 1; i <= repeatCount; i++) {
            const existingRow = rows2.find((row) => row.id === i);
            if (existingRow) {
              newRows2.push(existingRow);
            } else {
              newRows2.push(createEmptyRow2(i, "master"));
            }
          }
          setRows2(newRows2);
        } else if (value === "" || repeatCount === 0) {
          setRows2([createEmptyRow2(1, "master")]);
        }
      }
    } else if (field === "uucRepeatable") {
      setUucRepeatableValue(value);

      if (currentSetpoint === "uuc") {
        const repeatCount = parseInt(value);
        if (!isNaN(repeatCount) && repeatCount > 0 && repeatCount <= 20) {
          const newRows2 = [];
          for (let i = 1; i <= repeatCount; i++) {
            const existingRow = rows2.find((row) => row.id === i);
            if (existingRow) {
              newRows2.push(existingRow);
            } else {
              newRows2.push(createEmptyRow2(i, "uuc"));
            }
          }
          setRows2(newRows2);
        } else if (value === "" || repeatCount === 0) {
          setRows2([createEmptyRow2(1, "uuc")]);
        }
      }
    }

    setRows3(
      rows3.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleSelectChange3 = (id, field, selectedOption) => {
    setRows3(
      rows3.map((row) =>
        row.id === id ? { ...row, [field]: selectedOption } : row,
      ),
    );
  };

  const getRequiredRowsCount = () => {
    const currentSetpoint = rows3[0]?.setpoint?.value;

    if (currentSetpoint === "master") {
      const count = parseInt(masterRepeatableValue);
      return isNaN(count) || count <= 0 ? 1 : count;
    } else if (currentSetpoint === "uuc") {
      const count = parseInt(uucRepeatableValue);
      return isNaN(count) || count <= 0 ? 1 : count;
    } else if (currentSetpoint === "separate") {
      return 0;
    }
    return 1;
  };

  const handleSave = async () => {
    toast.success("Calibration settings saved!");
    onNext();

    if (!formatId) {
      alert("Format ID is missing!");
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");

      const calibration_settings = rows1
        .filter((row) => row.fieldname && row.fieldname.value)
        .map((row) => ({
          fieldname: row.fieldname.value,
          SetVariable: row.SetVariable,
          formula: row.formula,
          field_heading: row.fieldHeading,
          field_position: parseInt(row.fieldPosition) || 0,
          checkbox: row.checked ? "yes" : "no",
        }));

      const observation_settings = rows2
        .filter((row) => row.fieldname.trim() !== "")
        .map((row) => ({
          fieldname: row.fieldname,
          setvariable: row.setvariable,
          formula: row.formula,
          field_heading: row.fieldHeading,
          checkbox: row.checked ? "yes" : "no",
        }));

      const payload = {
        instrument_id: instrumentId,
        instid: instid,
        observation_id: parseInt(formatId),
        setpoint: rows3[0]?.setpoint?.value || "",
        uuc: rows3[0]?.uucRepeatable || "",
        master: rows3[0]?.masterRepeatable || "",
        allottolab: rows3[0]?.labToCalibrate?.value || "",
        resultsetting: {
          calibration_settings: calibration_settings,
          observation_settings: observation_settings,
        },
      };
      console.log("Payload:", payload);

      const response = await axios.post(
        "/observationsetting/update-observation-setting",
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        setSuccessMessage("Data saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchObservationSettings(formatId);
      } else {
        alert("Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("Error saving observation settings:", error);
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

  const currentSetpoint = rows3[0]?.setpoint?.value;
  const requiredRowsCount = getRequiredRowsCount();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="flex items-center justify-start gap-4 p-4">
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              Calibration Results Settings
              <EyeIcon
                className="h-6 w-6 cursor-pointer text-blue-600 transition hover:text-blue-800"
                onClick={() => setIsModalOpen(true)}
              />
            </h1>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="relative max-h-[85vh] w-[900px] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
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
                      <th className="border px-3 py-2 text-left">
                        Description
                      </th>
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

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Setpoint Dropdown */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Setpoint
                  </label>
                  <Select
                    value={rows3[0]?.setpoint}
                    onChange={(selectedOption) =>
                      handleSelectChange3(
                        rows3[0]?.id,
                        "setpoint",
                        selectedOption,
                      )
                    }
                    options={setpointOptions}
                    placeholder="Select..."
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>

                {/* Master Repeatable Field - Always show if setpoint is master or separate */}
                {(currentSetpoint === "master" ||
                  currentSetpoint === "separate") && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Master Repeatable
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={rows3[0]?.masterRepeatable || ""}
                        onChange={(e) =>
                          handleInputChange3(
                            rows3[0]?.id,
                            "masterRepeatable",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Master Repeatable"
                        title="Enter number of master observation rows"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {currentSetpoint === "master"
                          ? "Number of observation rows for Master"
                          : "Master observation rows (for separate mode)"}
                      </p>
                    </div>
                  )}

                {/* UUC Repeatable Field - Always show if setpoint is uuc or separate */}
                {(currentSetpoint === "uuc" ||
                  currentSetpoint === "separate") && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        UUC Repeatable
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={rows3[0]?.uucRepeatable || ""}
                        onChange={(e) =>
                          handleInputChange3(
                            rows3[0]?.id,
                            "uucRepeatable",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="UUC Repeatable"
                        title="Enter number of UUC observation rows"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {currentSetpoint === "uuc"
                          ? "Number of observation rows for UUC"
                          : "UUC observation rows (for separate mode)"}
                      </p>
                    </div>
                  )}

                {/* Lab to Calibrate */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Lab to Calibrate
                  </label>
                  <Select
                    value={rows3[0]?.labToCalibrate}
                    onChange={(selectedOption) =>
                      handleSelectChange3(
                        rows3[0]?.id,
                        "labToCalibrate",
                        selectedOption,
                      )
                    }
                    options={labToCalibrateOptions}
                    placeholder="Select Lab..."
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-xl font-bold text-gray-800">
              Calibration Settings
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        S. No.
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Checkbox
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Fieldname
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Set Variable
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Field Heading
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Field Position
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Formula
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows1.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{row.id}</td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={row.checked}
                            onChange={() => handleCheckbox1(row.id)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={row.fieldname}
                            onChange={(selectedOption) =>
                              handleSelectChange1(
                                row.id,
                                "fieldname",
                                selectedOption,
                              )
                            }
                            options={fieldnameOptions}
                            placeholder="Select..."
                            isClearable
                            styles={customSelectStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </td>
                        {/* Set Variable */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.SetVariable}
                            onChange={(e) =>
                              handleInputChange1(
                                row.id,
                                "SetVariable",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Set Variable"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.fieldHeading}
                            onChange={(e) =>
                              handleInputChange1(
                                row.id,
                                "fieldHeading",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Field Heading"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.fieldPosition}
                            onChange={(e) =>
                              handleInputChange1(
                                row.id,
                                "fieldPosition",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Position"
                          />
                        </td>
                        {/* Formula */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.formula}
                            onChange={(e) =>
                              handleInputChange1(
                                row.id,
                                "formula",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Formula"
                          />
                        </td>
                        <td className="w-[80px] px-2 py-3 text-center">
                          <button
                            style={{ cursor: "pointer" }}
                            onClick={() => removeRow1(row.id)}
                            disabled={rows1.length === 1}
                            className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <TrashIcon className="size-4.5 stroke-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t p-4">
                <button
                  style={{ cursor: "pointer" }}
                  onClick={addRow1}
                  className="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                >
                  Add Row
                </button>
              </div>
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Observation Setting
              </h2>
              <div className="text-sm text-gray-500">
                <div>
                  Setpoint:{" "}
                  <span className="font-semibold">
                    {currentSetpoint || "Not selected"}
                  </span>
                </div>
                <div>
                  Rows: <span className="font-semibold">{rows2.length}</span>
                </div>
                {currentSetpoint === "master" && masterRepeatableValue && (
                  <div>
                    Master Repeatable:{" "}
                    <span className="font-semibold">
                      {masterRepeatableValue}
                    </span>
                  </div>
                )}
                {currentSetpoint === "uuc" && uucRepeatableValue && (
                  <div>
                    UUC Repeatable:{" "}
                    <span className="font-semibold">{uucRepeatableValue}</span>
                  </div>
                )}
                {currentSetpoint === "separate" && (
                  <div>
                    <span className="font-semibold">
                      Master: {masterRepeatableValue || "0"}
                    </span>{" "}
                    |
                    <span className="font-semibold">
                      {" "}
                      UUC: {uucRepeatableValue || "0"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        S. No.
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Checkbox
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Observation Setting
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Set Variable
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Field Heading
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Formula
                      </th>
                      <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows2.map((row) => {
                      const isRequiredRow =
                        currentSetpoint === "master" ||
                          currentSetpoint === "uuc"
                          ? row.id <= requiredRowsCount
                          : false;

                      return (
                        <tr key={row.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{row.id}</td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={row.checked}
                              onChange={() => handleCheckbox2(row.id)}
                              className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.fieldname}
                              onChange={(e) =>
                                handleInputChange2(
                                  row.id,
                                  "fieldname",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Observation Setting Name"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.setvariable}
                              onChange={(e) =>
                                handleInputChange2(
                                  row.id,
                                  "setvariable",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Set Variable"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.fieldHeading}
                              onChange={(e) =>
                                handleInputChange2(
                                  row.id,
                                  "fieldHeading",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Field Heading"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.formula}
                              onChange={(e) =>
                                handleInputChange2(
                                  row.id,
                                  "formula",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Formula"
                            />
                          </td>
                          <td className="w-[80px] px-2 py-3 text-center">
                            <button
                              onClick={() => removeRow2(row.id)}
                              style={{ cursor: "pointer" }}
                              disabled={isRequiredRow && rows2.length === 1}
                              className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              title={
                                isRequiredRow
                                  ? "Required row cannot be deleted"
                                  : "Delete row"
                              }
                            >
                              <TrashIcon className="size-4.5 stroke-1" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {(currentSetpoint === "separate" ||
                rows2.length < requiredRowsCount) && (
                  <div className="flex justify-end border-t p-4">
                    <button
                      style={{ cursor: "pointer" }}
                      onClick={addRow2}
                      className="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                      {currentSetpoint === "separate"
                        ? "Add Row"
                        : `Add Row (Auto: ${requiredRowsCount})`}
                    </button>
                  </div>
                )}
            </>
          )}
        </div>

        <div className="mt-4 flex flex-row items-center justify-between gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Back
          </Button>

          <button
            style={{ cursor: "pointer" }}
            onClick={handleSave}
            disabled={loading}
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save & Next →
          </button>
        </div>
      </div>

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