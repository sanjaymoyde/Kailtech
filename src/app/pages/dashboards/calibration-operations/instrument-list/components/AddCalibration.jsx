import { useState, useEffect } from "react";
import axios from "utils/axios";
import Select from "react-select";
import { TrashIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
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
  const [tables1, setTables1] = useState([{
    id: Date.now(),
    tableName: "",
    setpoint: null,
    masterRepeatable: "",
    uucRepeatable: "",
    fixedRepeatable: "",
    rows: [],
    observationRows: []
  }]);
  const [rows2, setRows2] = useState([]);
  const [rows3, setRows3] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [labToCalibrateOptions, setLabToCalibrateOptions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [functionOptions, setFunctionOptions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [allFunctionsData, setAllFunctionsData] = useState({});

  // Prevent number input scroll behavior
  useEffect(() => {
    const preventNumberInputScroll = (e) => {
      if (e.target.type === 'number') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('wheel', preventNumberInputScroll, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', preventNumberInputScroll);
    };
  }, []);

  // ✅ Source table list for two-tier dropdown
  const tableList = [
    { value: "mastermatrix", label: "Master Matrix" },
    { value: "newcrfcalibrationpoint", label: "CRF Calibration Point" },
    { value: "new_summary", label: "Summary" },
    { value: "new_crfmatrix", label: "CRF Matrix" },
    { value: "cmcscope", label: "CMC Scope" },
  ];

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

  const removeRow1 = (tableId, rowId) => {
    setTables1(prevTables => prevTables.map(table => {
      if (table.id === tableId) {
        if (table.rows.length === 1) {
          alert("At least one row is required!");
          return table;
        }
        return { ...table, rows: table.rows.filter(row => row.id !== rowId) };
      }
      return table;
    }));
  };

  const addTable1 = () => {
    setTables1([...tables1, {
      id: Date.now(),
      tableName: "",
      setpoint: null,
      masterRepeatable: "",
      uucRepeatable: "",
      fixedRepeatable: "",
      rows: [createEmptyRow1(1)],
      observationRows: [createEmptyRow2(1, "uuc")]
    }]);
  };

  const removeTable1 = (tableId) => {
    if (tables1.length === 1) return;
    setTables1(tables1.filter(t => t.id !== tableId));
  };

  // eslint-disable-next-line no-unused-vars
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
    { value: "fixed", label: "fixed" },
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
    }
    fetchLabOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrumentId, formatId]);

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

  const fetchFieldnameOptions = async (tableName) => {
    if (!tableName) return [];
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

        let flattenedCalibrationSettings = [];
        if (data.resultsetting && typeof data.resultsetting === "object") {
          // If it's an array (old payload format support)
          if (Array.isArray(data.resultsetting.calibration_settings)) {
            flattenedCalibrationSettings = data.resultsetting.calibration_settings;
          } else {
            // New dynamic key format
            Object.keys(data.resultsetting).forEach((key) => {
              if (key !== "observation_settings" && key !== "certificatesetting") {
                const rowsArray = data.resultsetting[key];
                if (Array.isArray(rowsArray)) {
                  rowsArray.forEach(row => {
                    flattenedCalibrationSettings.push({ ...row, table_name: row.table_name || key });
                  });
                }
              }
            });
          }
        }

        const allRows1 = await Promise.all(
          flattenedCalibrationSettings.map(async (item, index) => {
            const tableObj = tableList.find((t) => t.value === item.fieldfrom);
            let fieldOptions = [];
            if (item.fieldfrom) {
              fieldOptions = await fetchFieldnameOptions(item.fieldfrom);
            }

            return {
              id: index + 1,
              checked: item.checkbox === "yes",
              selectedTable: tableObj || null,
              fieldname: item.fieldname
                ? { value: item.fieldname, label: item.fieldname }
                : null,
              fieldnameOptions: fieldOptions,
              fieldfrom: item.fieldfrom || "",
              fieldHeading: item.field_heading || "",
              SetVariable: item.SetVariable || "",
              formula: item.formula || "",
              formulaList: item.formula
                ? item.formula.split("|").map((f) => f.trim())
                : [item.formula || ""],
              fieldPosition: item.field_position != null ? item.field_position.toString() : "",
              selectedFunction: null,
              table_index: item.table_index || 0,
              table_name: item.table_name || "",
            };
          }),
        );

        // Group rows into tables based on table_index
        const groupedTables = allRows1.reduce((acc, row) => {
          const tIdx = row.table_index || 0;
          if (!acc[tIdx]) acc[tIdx] = [];
          acc[tIdx].push(row);
          return acc;
        }, []);

        const initialTables = groupedTables.length > 0
          ? groupedTables.map((rows, idx) => ({
            id: Date.now() + idx,
            tableName: rows[0]?.table_name || "",
            setpoint: null,
            masterRepeatable: "",
            uucRepeatable: "",
            fixedRepeatable: "",
            rows,
          }))
          : [{
            id: Date.now(),
            tableName: "",
            setpoint: null,
            masterRepeatable: "",
            uucRepeatable: "",
            fixedRepeatable: "",
            rows: [createEmptyRow1(1)],
          }];

        setTables1(initialTables);

        const obsSettingArray = Array.isArray(data.observationsetting)
          ? data.observationsetting
          : data.observationsetting?.observation_settings || [];

        const table2Data = obsSettingArray.map(
          (item, index) => ({
            id: index + 1,
            checked: item.checkbox === "yes",
            fieldname: item.fieldname || "",
            setvariable: item.setvariable || "",
            formula: item.formula || "",
            fieldHeading: item.field_heading || "",
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

        // setTables1 handled above
        setRows2(
          table2Data.length > 0
            ? table2Data
            : [createEmptyRow2(1, data.setpoint || "uuc")],
        );
        setRows3([table3Data]);

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
        setTables1([{
          id: Date.now(),
          tableName: "",
          setpoint: null,
          masterRepeatable: "",
          uucRepeatable: "",
          fixedRepeatable: "",
          rows: [createEmptyRow1(1)],
        }]);
        setRows2([createEmptyRow2(1, "uuc")]);
        setRows3([createEmptyRow3(1)]);
      }
    } catch (error) {
      console.error("Error fetching observation settings:", error);
      setTables1([{
        id: Date.now(),
        tableName: "",
        setpoint: null,
        masterRepeatable: "",
        uucRepeatable: "",
        fixedRepeatable: "",
        rows: [createEmptyRow1(1)],
      }]);
      setRows2([createEmptyRow2(1, "uuc")]);
      setRows3([createEmptyRow3(1)]);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyRow1 = (id) => ({
    id,
    checked: true,
    selectedTable: null,
    fieldname: null,
    fieldnameOptions: [],
    fieldfrom: "",
    fieldHeading: "",
    SetVariable: "",
    formula: "",
    formulaList: [""],
    fieldPosition: "",
    selectedFunction: null,
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

  const handleCheckbox1 = (tableId, rowId) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, checked: !r.checked } : r)
    } : t));
  };

  const buildFormulaList = (count, existingList = []) => {
    const parsed = parseInt(count, 10);
    const target = !isNaN(parsed) && parsed > 0 ? parsed : 1;
    const base = Array.isArray(existingList) ? [...existingList] : [];
    const trimmed = base.slice(0, target);
    while (trimmed.length < target) trimmed.push("");
    return trimmed;
  };

  const handleInputChange1 = (tableId, rowId, field, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => {
        if (r.id !== rowId) return r;
        if (field === "formula") {
          return { ...r, formula: value, formulaList: [value] };
        }
        return { ...r, [field]: value };
      })
    } : t));
  };

  const handleFormulaListChange = (tableId, rowId, index, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => {
        if (r.id !== rowId) return r;
        const updatedList = [...(r.formulaList || [])];
        updatedList[index] = value;
        return { ...r, formulaList: updatedList, formula: updatedList.join(" | ") };
      })
    } : t));
  };

  const handleSelectChange1 = (tableId, rowId, field, selectedOption) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: selectedOption } : r)
    } : t));
  };

  const handleTableSelection1 = async (tableId, rowId, selectedOption) => {
    if (selectedOption) {
      const options = await fetchFieldnameOptions(selectedOption.value);
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedTable: selectedOption,
          fieldfrom: selectedOption.value,
          fieldname: null,
          fieldnameOptions: options,
        } : r)
      } : t));
    } else {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedTable: null,
          fieldfrom: "",
          fieldname: null,
          fieldnameOptions: [],
        } : r)
      } : t));
    }
  };

  const handleFunctionSelect = (tableId, rowId, selectedOption) => {
    if (!selectedOption) {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, selectedFunction: null } : r)
      } : t));
      return;
    }

    const funcData = allFunctionsData[selectedOption.value];
    if (funcData) {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedFunction: selectedOption,
          SetVariable: funcData.variable,
          formula: funcData.formula,
        } : r)
      } : t));
    }
  };

  const addRow1 = (tableId) => {
    setTables1(prev => prev.map(table => {
      if (table.id === tableId) {
        const newId = table.rows.length > 0 ? Math.max(...table.rows.map(r => r.id)) + 1 : 1;
        return { ...table, rows: [...table.rows, createEmptyRow1(newId)] };
      }
      return table;
    }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleCheckbox2 = (id) => {
    setRows2(
      rows2.map((row) =>
        row.id === id ? { ...row, checked: !row.checked } : row,
      ),
    );
  };

  // eslint-disable-next-line no-unused-vars
  const handleInputChange2 = (id, field, value) => {
    setRows2(
      rows2.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleTableNameChange1 = (tableId, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? { ...t, tableName: value } : t));
  };

  const handleTableSetpointChange = (tableId, selectedOption) => {
    setTables1(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const resetRows = t.rows.map(r => {
        const list = buildFormulaList(
          selectedOption?.value === "fixed" ? (t.fixedRepeatable || 1) : 1,
          r.formulaList || [r.formula || ""],
        );
        return {
          ...r,
          formulaList: list,
          formula: list.join(" | "),
        };
      });
      
      // Generate observation rows based on setpoint
      let newObservationRows = [];
      const setpointValue = selectedOption?.value;
      
      if (setpointValue === "master" && t.masterRepeatable) {
        const count = parseInt(t.masterRepeatable) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
      } else if (setpointValue === "uuc" && t.uucRepeatable) {
        const count = parseInt(t.uucRepeatable) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
      } else if (setpointValue === "separate") {
        const masterCount = parseInt(t.masterRepeatable) || 0;
        const uucCount = parseInt(t.uucRepeatable) || 0;
        const masterRows = Array.from({ length: masterCount }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
        const uucRows = Array.from({ length: uucCount }, (_, index) => ({
          ...createEmptyRow2(masterCount + index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
        newObservationRows = [...masterRows, ...uucRows];
      } else {
        // Default: create one observation row
        newObservationRows = [createEmptyRow2(1, setpointValue || "uuc")];
      }
      
      return {
        ...t,
        setpoint: selectedOption,
        fixedRepeatable: selectedOption?.value === "fixed" ? (t.fixedRepeatable || "") : "",
        rows: resetRows,
        observationRows: newObservationRows.length > 0 ? newObservationRows : t.observationRows,
      };
    }));
  };

  const handleFixedRepeatableChange = (tableId, value) => {
    setTables1(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const listCount = parseInt(value, 10);
      const adjustedRows = t.rows.map(r => {
        const list = buildFormulaList(listCount, r.formulaList || [r.formula || ""]);
        return { ...r, formulaList: list, formula: list.join(" | ") };
      });
      return { ...t, fixedRepeatable: value, rows: adjustedRows };
    }));
  };

  const handleTableRepeatableChange = (tableId, field, value) => {
    setTables1(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      
      const updatedTable = { ...t, [field]: value };
      
      // Regenerate observation rows based on new repeatable value
      let newObservationRows = [...t.observationRows];
      const setpointValue = t.setpoint?.value;
      
      if (setpointValue === "master" && field === "masterRepeatable") {
        const count = parseInt(value) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
      } else if (setpointValue === "uuc" && field === "uucRepeatable") {
        const count = parseInt(value) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
      } else if (setpointValue === "separate") {
        const masterCount = parseInt(field === "masterRepeatable" ? value : t.masterRepeatable) || 0;
        const uucCount = parseInt(field === "uucRepeatable" ? value : t.uucRepeatable) || 0;
        const masterRows = Array.from({ length: masterCount }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
        const uucRows = Array.from({ length: uucCount }, (_, index) => ({
          ...createEmptyRow2(masterCount + index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
        newObservationRows = [...masterRows, ...uucRows];
      }
      
      return { ...updatedTable, observationRows: newObservationRows };
    }));
  };

  // eslint-disable-next-line no-unused-vars
  const addRow2 = () => {
    const newId =
      rows2.length > 0 ? Math.max(...rows2.map((r) => r.id)) + 1 : 1;

    setRows2([...rows2, createEmptyRow2(newId, "uuc")]);
  };

  // Table-specific observation row handlers
  const handleTableObservationCheckbox = (tableId, rowId) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t,
      observationRows: t.observationRows.map(r => r.id === rowId ? { ...r, checked: !r.checked } : r)
    } : t));
  };

  const handleTableObservationInputChange = (tableId, rowId, field, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t,
      observationRows: t.observationRows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
    } : t));
  };

  const addTableObservationRow = (tableId) => {
    setTables1(prev => prev.map(t => {
      if (t.id === tableId) {
        const newId = t.observationRows.length > 0 ? Math.max(...t.observationRows.map(r => r.id)) + 1 : 1;
        const type = t.setpoint?.value || "uuc";
        return { ...t, observationRows: [...t.observationRows, createEmptyRow2(newId, type)] };
      }
      return t;
    }));
  };

  const removeTableObservationRow = (tableId, rowId) => {
    setTables1(prev => prev.map(t => {
      if (t.id === tableId) {
        if (t.observationRows.length === 1) {
          alert("At least one observation row is required!");
          return t;
        }
        return { ...t, observationRows: t.observationRows.filter(r => r.id !== rowId) };
      }
      return t;
    }));
  };

  const handleSelectChange3 = (id, field, selectedOption) => {
    setRows3(
      rows3.map((row) =>
        row.id === id ? { ...row, [field]: selectedOption } : row,
      ),
    );
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

      const dynamic_calibration_settings = {};

      tables1.forEach((table, tIdx) => {
        const tName = table.tableName && table.tableName.trim() !== ""
          ? table.tableName.trim()
          : `calibration_settings_${tIdx + 1}`; // fallback

        const tableRows = table.rows
          .filter((row) => row.fieldname && row.fieldname.value)
          .map((row) => ({
            fieldname: row.fieldname.value,
            fieldfrom: row.fieldfrom || "",
            SetVariable: row.SetVariable,
            formula: row.formula,
            field_heading: row.fieldHeading,
            field_position: parseInt(row.fieldPosition) || 0,
            checkbox: row.checked ? "yes" : "no",
            table_index: tIdx,
            table_name: tName,
          }));

        if (tableRows.length > 0) {
          dynamic_calibration_settings[tName] = tableRows;
        }
      });

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
          ...dynamic_calibration_settings,
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

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-md">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="px-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Calibration Settings</h2>
              <button
                onClick={addTable1}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                title="Add new table"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Add Table
              </button>
            </div>
            {tables1.map((table, tableIdx) => (
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
                        onChange={(e) => handleTableNameChange1(table.id, e.target.value)}
                        className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter table name..."
                      />
                    </div>
                    <div className="flex gap-2">
                      {tableIdx > 0 && (
                        <button
                          onClick={() => removeTable1(table.id)}
                          className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                          Remove Table
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Setpoint and Repeatable fields for each table */}
                  <div className="flex flex-wrap items-start gap-4 md:flex-nowrap">
                    <div className="min-w-[220px] flex-1 md:flex-none">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Setpoint
                      </label>
                      <Select
                        value={table.setpoint}
                        onChange={(selectedOption) => handleTableSetpointChange(table.id, selectedOption)}
                        options={setpointOptions}
                        placeholder="Select..."
                        isClearable
                        styles={customSelectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>

                    {(table.setpoint?.value === "master" || table.setpoint?.value === "separate") && (
                      <div className="min-w-[220px] flex-1 md:flex-none">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Master Repeatable
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={table.masterRepeatable || ""}
                          onChange={(e) => handleTableRepeatableChange(table.id, "masterRepeatable", e.target.value)}
                          onWheel={(e) => e.preventDefault()}
                          onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Master Repeatable"
                          title="Enter number of master observation rows"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {table.setpoint?.value === "master"
                            ? "Number of observation rows for Master"
                            : "Master observation rows (for separate mode)"}
                        </p>
                      </div>
                    )}

                    {(table.setpoint?.value === "uuc" || table.setpoint?.value === "separate") && (
                      <div className="min-w-[220px] flex-1 md:flex-none">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          UUC Repeatable
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={table.uucRepeatable || ""}
                          onChange={(e) => handleTableRepeatableChange(table.id, "uucRepeatable", e.target.value)}
                          onWheel={(e) => e.preventDefault()}
                          onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="UUC Repeatable"
                          title="Enter number of UUC observation rows"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {table.setpoint?.value === "uuc"
                            ? "Number of observation rows for UUC"
                            : "UUC observation rows (for separate mode)"}
                        </p>
                      </div>
                    )}

                    {table.setpoint?.value === "fixed" && (
                      <div className="min-w-[220px] flex-1 md:flex-none">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          No of rows
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={table.fixedRepeatable || ""}
                          onChange={(e) => handleFixedRepeatableChange(table.id, e.target.value)}
                          onWheel={(e) => e.preventDefault()}
                          onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="No of rows"
                          title="Number of formula rows to show"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Controls how many formula inputs appear in each row.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observation Setting Table */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Observation Setting</h3>
                    <div className="text-sm text-gray-500">
                      Rows: <span className="font-semibold">{table.observationRows?.length || 0}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">S. No.</th>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Checkbox</th>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Observation Setting</th>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Set Variable</th>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Field Heading</th>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Formula/Value</th>
                          <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(table.observationRows || []).map((row) => (
                          <tr key={row.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{row.id}</td>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={row.checked}
                                onChange={() => handleTableObservationCheckbox(table.id, row.id)}
                                className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.fieldname}
                                onChange={(e) => handleTableObservationInputChange(table.id, row.id, "fieldname", e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Observation Setting Name"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.setvariable}
                                onChange={(e) => handleTableObservationInputChange(table.id, row.id, "setvariable", e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Set Variable"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.fieldHeading}
                                onChange={(e) => handleTableObservationInputChange(table.id, row.id, "fieldHeading", e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Field Heading"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.formula}
                                onChange={(e) => handleTableObservationInputChange(table.id, row.id, "formula", e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Formula/Value"
                              />
                            </td>
                            <td className="w-[80px] px-2 py-3 text-center">
                              <button
                                onClick={() => removeTableObservationRow(table.id, row.id)}
                                disabled={(table.observationRows || []).length === 1}
                                className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete row"
                              >
                                <TrashIcon className="size-4.5 stroke-1" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => addTableObservationRow(table.id)}
                      className="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                      Add Row
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100/50">
                      <tr>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">S. No.</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Checkbox</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Fieldname</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Set Variable</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Field Heading</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Field Position</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Formula/Value</th>
                        <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm">{row.id}</td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={row.checked}
                              onChange={() => handleCheckbox1(table.id, row.id)}
                              className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <Select
                                value={row.selectedTable}
                                onChange={(opt) => handleTableSelection1(table.id, row.id, opt)}
                                options={tableList}
                                placeholder="Select table..."
                                isClearable
                                styles={customSelectStyles}
                                menuPortalTarget={document.body}
                              />
                              {row.selectedTable && (
                                <Select
                                  value={row.fieldname}
                                  onChange={(opt) => handleSelectChange1(table.id, row.id, "fieldname", opt)}
                                  options={row.fieldnameOptions || []}
                                  placeholder="Select fieldname..."
                                  isClearable
                                  styles={customSelectStyles}
                                  menuPortalTarget={document.body}
                                />
                              )}
                              <Select
                                value={row.selectedFunction}
                                onChange={(opt) => handleFunctionSelect(table.id, row.id, opt)}
                                options={functionOptions}
                                placeholder="Select Function..."
                                isClearable
                                styles={customSelectStyles}
                                menuPortalTarget={document.body}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.SetVariable || ""}
                              onChange={(e) => handleInputChange1(table.id, row.id, "SetVariable", e.target.value)}
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Set Variable"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.fieldHeading}
                              onChange={(e) => handleInputChange1(table.id, row.id, "fieldHeading", e.target.value)}
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Field Heading"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.fieldPosition || ""}
                              onChange={(e) => handleInputChange1(table.id, row.id, "fieldPosition", e.target.value)}
                              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Position"
                            />
                          </td>
                          <td className="px-4 py-3 min-w-[350px]">
                            {table.setpoint?.value === "fixed" ? (
                              <div className="flex flex-col gap-2">
                                {buildFormulaList(table.fixedRepeatable || 1, row.formulaList).map((fVal, fIdx) => (
                                  <input
                                    key={`${row.id}-formula-${fIdx}`}
                                    type="text"
                                    value={fVal}
                                    onChange={(e) => handleFormulaListChange(table.id, row.id, fIdx, e.target.value)}
                                    className="w-full rounded-md border px-4 py-2 text-sm shadow-[0_0_8px_rgba(0,0,0,0.05)] focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Formula ${fIdx + 1}`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={row.formula}
                                onChange={(e) => handleInputChange1(table.id, row.id, "formula", e.target.value)}
                                className="w-full h-14 rounded-md border px-4 py-3 text-base shadow-[0_0_8px_rgba(0,0,0,0.05)] focus:ring-2 focus:ring-blue-500"
                                placeholder="Formula"
                              />
                            )}
                          </td>
                          <td className="w-[80px] px-2 py-3 text-center">
                            <button
                              onClick={() => removeRow1(table.id, row.id)}
                              disabled={table.rows.length === 1}
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
                    onClick={() => addRow1(table.id)}
                    className="rounded-md bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
                  >
                    Add Row
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
