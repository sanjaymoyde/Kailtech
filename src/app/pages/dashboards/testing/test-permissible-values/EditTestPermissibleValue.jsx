import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EditTestPermissibleValue() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Main form state
  const [formData, setFormData] = useState({
    product: "",
    grade: "",
    size: "",
    standard: "",
    parameter: [],
    method: [],
    clause: [],
    pvaluemin: [],
    pvaluemax: [],
    specification: [],
    updated_by: 31,
  });

  // Dropdown data states
  const [products, setProducts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [methods, setMethods] = useState([]);
  const [clauses, setClauses] = useState([]);

  // Dynamic parameter inputs
  const [parameterInputs, setParameterInputs] = useState([]);

  // Loading states
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState({
    products: true,
    grades: true,
    sizes: true,
    standards: true,
    parameters: true,
    methods: true,
    clauses: true,
  });

  // Error states
  const [errors, setErrors] = useState({});

  // Helper function to extract array from API response
  const extractArrayFromResponse = (responseData) => {
    console.log("🔍 Raw API Response:", responseData);

    if (responseData && typeof responseData === "object") {
      if (responseData.data) {
        if (Array.isArray(responseData.data)) {
          console.log("✅ Found array in .data:", responseData.data.length, "items");
          if (responseData.data.length > 0) {
            console.log("   First item structure:", Object.keys(responseData.data[0]));
          }
          return responseData.data;
        }
        if (responseData.data.data && Array.isArray(responseData.data.data)) {
          console.log("✅ Found array in .data.data:", responseData.data.data.length, "items");
          if (responseData.data.data.length > 0) {
            console.log("   First item structure:", Object.keys(responseData.data.data[0]));
          }
          return responseData.data.data;
        }
      }

      if (Array.isArray(responseData.items)) {
        console.log("✅ Found array in .items:", responseData.items.length, "items");
        if (responseData.items.length > 0) {
          console.log("   First item structure:", Object.keys(responseData.items[0]));
        }
        return responseData.items;
      }

      if (Array.isArray(responseData.results)) {
        console.log("✅ Found array in .results:", responseData.results.length, "items");
        if (responseData.results.length > 0) {
          console.log("   First item structure:", Object.keys(responseData.results[0]));
        }
        return responseData.results;
      }
    }

    if (Array.isArray(responseData)) {
      console.log("✅ Already an array:", responseData.length, "items");
      if (responseData.length > 0) {
        console.log("   First item structure:", Object.keys(responseData[0]));
      }
      return responseData;
    }

    console.warn("⚠️ Could not extract array, returning empty array");
    return [];
  };

  // Generate options matching PHP logic
  const generateOptions = (dataArray, fieldName = "unknown") => {
    console.log(`📋 Generating options for ${fieldName}:`, dataArray?.length || 0, "items");

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.warn(`⚠️ ${fieldName}: No data available`);
      return [];
    }

    const options = dataArray
      .filter((item) => {
        if (!item || typeof item !== "object") return false;

        if (!Object.prototype.hasOwnProperty.call(item, "status")) {
          return true;
        }

        const status = item.status;
        const isActive =
          status === 1 ||
          status === "1" ||
          status === true ||
          status === "true" ||
          status === 99 ||
          status === "99";

        if (!isActive) {
          console.log(`⏭️ Skipping inactive (status=${status}):`, item.name || item.id);
        }

        return isActive;
      })
      .map((item) => {
        const id = item.id || item.ID || item.Id || item.value;

        let name =
          item.name ||
          item.Name ||
          item.method_name ||
          item.parameter_name ||
          item.grade_name ||
          item.standard_name ||
          item.standard_code ||
          item.clause_name ||
          item.size_name ||
          item.product_name ||
          item.code ||
          item.short_name ||
          item.sname ||
          item.label ||
          item.title ||
          item.text ||
          "";

        if (!name && item.description) {
          name = item.description;
        }

        // ✅ Smart fallback: scan all string fields (skip id/status/timestamps)
        if (!name) {
          const skipFields = new Set([
            "id", "ID", "Id",
            "status", "created_at", "updated_at", "deleted_at",
            "created_by", "updated_by", "deleted_by",
          ]);
          const firstStringField = Object.entries(item).find(
            ([key, val]) =>
              !skipFields.has(key) &&
              typeof val === "string" &&
              val.trim() !== "" &&
              isNaN(Number(val))
          );
          if (firstStringField) {
            name = firstStringField[1];
            console.log(`🔄 ${fieldName} item ${id}: used field "${firstStringField[0]}" as name`);
          }
        }

        if (!name && id) {
          name = `Item ${id}`;
          console.warn(`⚠️ No name found for ${fieldName} item ${id}. Full item:`, JSON.stringify(item));
        }

        if (
          item.description &&
          item.description.trim() !== "" &&
          item.description !== name &&
          fieldName !== "grades" &&
          fieldName !== "standards" &&
          fieldName !== "methods" &&
          fieldName !== "clauses"
        ) {
          name = `${name} (${item.description})`;
        }

        const value = id !== undefined && id !== null ? String(id) : "";
        const label = name ? String(name).trim() : "";

        if (!label && value) {
          console.warn(`⚠️ Item with ID ${value} in ${fieldName} has no label. Raw item:`, item);
        }

        return { value, label };
      })
      .filter((option) => {
        const hasValidValue =
          option.value &&
          option.value !== "" &&
          option.value !== "undefined" &&
          option.value !== "null";

        const hasValidLabel =
          option.label &&
          option.label !== "" &&
          option.label !== "undefined" &&
          option.label !== "null";

        const isValid = hasValidValue && hasValidLabel;

        if (!isValid) {
          console.warn(
            `⚠️ Filtering invalid option for ${fieldName}:`,
            JSON.stringify({ value: option.value, label: option.label })
          );
        }

        return isValid;
      });

    console.log(`✅ Generated ${options.length} valid options for ${fieldName}`);
    if (options.length > 0) {
      console.log(`   First option:`, options[0]);
      console.log(`   Sample options (first 3):`, options.slice(0, 3));
    }

    return options;
  };

  // ✅ FIXED: Single useEffect — dropdowns + record fetch in sequence
  useEffect(() => {
    let cancelled = false;

    const initPage = async () => {
      console.log("🔄 Starting page init...");

      const [
        productsRes, gradesRes, sizesRes, standardsRes,
        parametersRes, methodsRes, clausesRes,
      ] = await Promise.allSettled([
        axios.get("/testing/get-prodcut-list"),
        axios.get("/testing/get-grades"),
        axios.get("/testing/get-sizes"),
        axios.get("/testing/get-standards"),
        axios.get("/testing/get-perameter-list"),
        axios.get("/testing/get-methods"),
        axios.get("/testing/get-clauses"),
      ]);

      if (cancelled) return;

      const extract = (res, name) => {
        if (res.status === "fulfilled") {
          const data = extractArrayFromResponse(res.value.data);
          console.log(`✅ ${name}: ${data.length} items`);
          return data;
        }
        console.error(`❌ ${name} failed:`, res.reason);
        toast.error(`Failed to load ${name}`);
        return [];
      };

      const productsData = extract(productsRes, "Products");
      const gradesData = extract(gradesRes, "Grades");
      const sizesData = extract(sizesRes, "Sizes");
      const standardsData = extract(standardsRes, "Standards");
      const parametersData = extract(parametersRes, "Parameters");
      const methodsData = extract(methodsRes, "Methods");
      const clausesData = extract(clausesRes, "Clauses");

      setProducts(productsData);
      setGrades(gradesData);
      setSizes(sizesData);
      setStandards(standardsData);
      setParameters(parametersData);
      setMethods(methodsData);
      setClauses(clausesData);

      // Set all dropdowns loaded at once
      setDropdownLoading({
        products: false, grades: false, sizes: false, standards: false,
        parameters: false, methods: false, clauses: false,
      });

      console.log("✅ All dropdowns loaded — fetching record...");

      // ── Fetch existing record ──
      if (!id) return;

      try {
        setFetchLoading(true);
        const response = await axios.get(`/testing/get-permissible-value-byid`, {
          params: { id: id }
        });
        if (cancelled) return;

        const result = response.data;
        console.log("📦 Record Response:", result);

        // ✅ FIX: Flexible status handling
        const isSuccess =
          result.status === true || result.status === "true" ||
          result.status === 1   || result.status === "1" ||
          result.status === "success" || result.status === "ok";

        if (isSuccess && result.data) {
          const data = result.data;
          console.log("📋 Raw record data:", data);

          // ✅ CRITICAL FIX: Parse arrays and convert ALL values to strings
          const parseArray = (value) => {
            if (Array.isArray(value)) {
              // Convert each item to string
              return value.map(v => String(v).trim());
            }
            if (typeof value === "string") {
              // Split by comma and convert to strings
              return value.split(",").map((v) => String(v).trim());
            }
            return [];
          };

          const parsedParameter = parseArray(data.parameter);
          const parsedMethod = parseArray(data.method);
          const parsedClause = parseArray(data.clause);
          const parsedPvaluemin = parseArray(data.pvaluemin);
          const parsedPvaluemax = parseArray(data.pvaluemax);
          const parsedSpecification = parseArray(data.specification);

          console.log("📊 Parsed arrays:", {
            parameter: parsedParameter,
            method: parsedMethod,
            clause: parsedClause,
            pvaluemin: parsedPvaluemin,
            pvaluemax: parsedPvaluemax,
            specification: parsedSpecification
          });

          setFormData({
            product:       String(data.product   || ""),
            grade:         String(data.grade      || ""),
            size:          String(data.size       || ""),
            standard:      String(data.standard   || ""),
            parameter:     parsedParameter,
            method:        parsedMethod,
            clause:        parsedClause,
            pvaluemin:     parsedPvaluemin,
            pvaluemax:     parsedPvaluemax,
            specification: parsedSpecification,
            updated_by:    31,
          });

          // ✅ Create parameter inputs based on actual count
          const paramCount = parsedParameter.length;
          const newInputs = Array.from({ length: Math.max(paramCount, 1) }, (_, i) => ({ id: i + 1 }));
          setParameterInputs(newInputs);

          console.log(`✅ Form populated with ${paramCount} parameters`);
          console.log("   Parameter values:", parsedParameter);
          console.log("   Method values:", parsedMethod);
          console.log("   Clause values:", parsedClause);

        } else {
          console.error("❌ Non-success response:", result);
          toast.error(result.message || "Could not load record. Please try again.");
          setParameterInputs([{ id: 1 }]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("❌ Record fetch error:", err);
        toast.error("Error loading record. Please try again.");
        setParameterInputs([{ id: 1 }]);
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };

    initPage();
    return () => { cancelled = true; };
  }, [id]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle array field changes
  const handleArrayChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Handle min/max value changes
  const handleParameterValueChange = (index, type, value) => {
    const field = type === "min" ? "pvaluemin" : "pvaluemax";
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Handle specification changes
  const handleSpecificationChange = (index, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev.specification];
      updatedArray[index] = value;
      return { ...prev, specification: updatedArray };
    });
  };

  // Add parameter row
  const addParameterRow = () => {
    const newId = parameterInputs.length + 1;
    setParameterInputs((prev) => [...prev, { id: newId }]);

    setFormData((prev) => ({
      ...prev,
      parameter: [...prev.parameter, ""],
      method: [...prev.method, ""],
      clause: [...prev.clause, ""],
      pvaluemin: [...prev.pvaluemin, ""],
      pvaluemax: [...prev.pvaluemax, ""],
      specification: [...prev.specification, ""],
    }));
  };

  // Remove parameter row
  const removeParameterRow = (index) => {
    if (parameterInputs.length === 1) {
      toast.error("At least one parameter is required");
      return;
    }

    setParameterInputs((prev) => prev.filter((_, i) => i !== index));

    setFormData((prev) => {
      const newFormData = { ...prev };
      ["parameter", "method", "clause", "pvaluemin", "pvaluemax", "specification"].forEach(
        (key) => {
          newFormData[key] = newFormData[key].filter((_, i) => i !== index);
        }
      );
      return newFormData;
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    const requiredFields = ["product", "grade", "size", "standard"];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });

    formData.parameter.forEach((param, index) => {
      if (!param) {
        newErrors[`parameter_${index}`] = "Parameter is required";
      }
    });

    formData.method.forEach((method, index) => {
      if (!method) {
        newErrors[`method_${index}`] = "Method is required";
      }
    });

    formData.pvaluemin.forEach((min, index) => {
      const max = formData.pvaluemax[index];
      if (min && max && parseFloat(min) > parseFloat(max)) {
        newErrors[`value_${index}`] = "Min value cannot be greater than max value";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix form errors before submitting");
      return;
    }

    setSubmitLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add ID for update
      formDataToSend.append("id", id);

      // Append all fields
      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          formData[key].forEach((value) => {
            formDataToSend.append(`${key}[]`, value);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post("/testing/update-permissible-value", formDataToSend);
      const result = response.data;

      if (result.status === "true" || result.status === true) {
        toast.success("Test Permissible Value updated successfully ✅", {
          duration: 2000,
        });

        setTimeout(() => {
          navigate("/dashboards/testing/test-permissible-values", { 
            state: { updatedId: parseInt(id) } 
          });
        }, 1500);
      } else {
        toast.error(result.message || "Failed to update test permissible value ❌");
      }
    } catch (err) {
      console.error("Error updating permissible value:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update test permissible value";
      toast.error(errorMessage + " ❌");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Show loading screen while ANY dropdown is loading OR while fetching existing data
  const isAnyDropdownLoading = Object.values(dropdownLoading).some(Boolean);

  if (isAnyDropdownLoading || fetchLoading) {
    return (
      <Page title="Edit Test Permissible Value">
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
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
            <p className="text-gray-600 dark:text-gray-300">
              Loading permissible value data...
            </p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Test Permissible Value">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit Test Permissible Value
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/testing/test-permissible-values")}
          >
            ← Back to List
          </Button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {generateOptions(products, "products").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.product && (
                <p className="text-red-500 text-sm mt-1">{errors.product}</p>
              )}
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Grade</option>
                {generateOptions(grades, "grades").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
              )}
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size <span className="text-red-500">*</span>
              </label>
              <select
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Size</option>
                {generateOptions(sizes, "sizes").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.size && (
                <p className="text-red-500 text-sm mt-1">{errors.size}</p>
              )}
            </div>

            {/* Standard */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard <span className="text-red-500">*</span>
              </label>
              <select
                name="standard"
                value={formData.standard}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Standard</option>
                {generateOptions(standards, "standards").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.standard && (
                <p className="text-red-500 text-sm mt-1">{errors.standard}</p>
              )}
            </div>
          </div>

          {/* Parameters Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Parameters ({parameterInputs.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParameterRow}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                + Add Parameter
              </Button>
            </div>

            {parameterInputs.map((row, index) => (
              <div
                key={row.id}
                className="border p-4 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Parameter #{index + 1}
                  </span>
                  {parameterInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameterRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Parameter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Parameter <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.parameter[index] || ""}
                      onChange={(e) =>
                        handleArrayChange(index, "parameter", e.target.value)
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Parameter</option>
                      {generateOptions(parameters, "parameters").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`parameter_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`parameter_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.method[index] || ""}
                      onChange={(e) =>
                        handleArrayChange(index, "method", e.target.value)
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Method</option>
                      {generateOptions(methods, "methods").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`method_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`method_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Clause */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Clause
                    </label>
                    <select
                      value={formData.clause[index] || ""}
                      onChange={(e) =>
                        handleArrayChange(index, "clause", e.target.value)
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Clause</option>
                      {generateOptions(clauses, "clauses").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Min Value */}
                  <div>
                    <Input
                      label="Min Value"
                      type="number"
                      step="0.01"
                      value={formData.pvaluemin[index] || ""}
                      onChange={(e) =>
                        handleParameterValueChange(index, "min", e.target.value)
                      }
                      placeholder="Enter minimum value"
                    />
                  </div>

                  {/* Max Value */}
                  <div>
                    <Input
                      label="Max Value"
                      type="number"
                      step="0.01"
                      value={formData.pvaluemax[index] || ""}
                      onChange={(e) =>
                        handleParameterValueChange(index, "max", e.target.value)
                      }
                      placeholder="Enter maximum value"
                    />
                  </div>

                  {/* Specification */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Input
                      label="Specification"
                      value={formData.specification[index] || ""}
                      onChange={(e) =>
                        handleSpecificationChange(index, e.target.value)
                      }
                      placeholder="Enter specification details"
                    />
                  </div>
                </div>

                {errors[`value_${index}`] && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors[`value_${index}`]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate("/dashboards/testing/test-permissible-values")
              }
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={submitLoading}
              className="min-w-[120px]"
            >
              {submitLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                  Updating...
                </div>
              ) : (
                "Update Permissible Value"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}