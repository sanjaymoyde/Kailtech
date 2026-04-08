import { useNavigate } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function AddTestPermissibleValue() {
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
    added_by: 31,
    updated_by: 31
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
  const [parameterInputs, setParameterInputs] = useState([{ id: 1 }]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState({
    products: true,
    grades: true,
    sizes: true,
    standards: true,
    parameters: true,
    methods: true,
    clauses: true
  });

  // Error states
  const [errors, setErrors] = useState({});

  // ✅ IMPROVED: Better response extraction matching PHP logic
  const extractArrayFromResponse = (responseData) => {
    console.log("🔍 Raw API Response:", responseData);
    
    // Handle different response structures
    if (responseData && typeof responseData === 'object') {
      // Check for data property (most common)
      if (responseData.data) {
        if (Array.isArray(responseData.data)) {
          console.log("✅ Found array in .data:", responseData.data.length, "items");
          // Log first item structure for debugging
          if (responseData.data.length > 0) {
            console.log("   First item structure:", Object.keys(responseData.data[0]));
          }
          return responseData.data;
        }
        // Sometimes data is wrapped again
        if (responseData.data.data && Array.isArray(responseData.data.data)) {
          console.log("✅ Found array in .data.data:", responseData.data.data.length, "items");
          if (responseData.data.data.length > 0) {
            console.log("   First item structure:", Object.keys(responseData.data.data[0]));
          }
          return responseData.data.data;
        }
      }
      
      // Check for items property
      if (Array.isArray(responseData.items)) {
        console.log("✅ Found array in .items:", responseData.items.length, "items");
        if (responseData.items.length > 0) {
          console.log("   First item structure:", Object.keys(responseData.items[0]));
        }
        return responseData.items;
      }
      
      // Check for results property
      if (Array.isArray(responseData.results)) {
        console.log("✅ Found array in .results:", responseData.results.length, "items");
        if (responseData.results.length > 0) {
          console.log("   First item structure:", Object.keys(responseData.results[0]));
        }
        return responseData.results;
      }
    }
    
    // If already an array
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

  // ✅ FIXED: Generate options matching PHP logic (status=1 filter)
  const generateOptions = (dataArray, fieldName = 'unknown') => {
    console.log(`📋 Generating options for ${fieldName}:`, dataArray?.length || 0, "items");
    
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.warn(`⚠️ ${fieldName}: No data available`);
      return [];
    }
    
    // PHP uses: status=1 filter
    // Filter only active items (status === 1 or status === "1")
    const options = dataArray
      .filter(item => {
        // Skip if no item
        if (!item || typeof item !== 'object') return false;
        
        // If no status field, include the item (default behavior)
        if (!Object.prototype.hasOwnProperty.call(item, 'status')) {
          return true;
        }
        
        // ✅ FIXED: Match PHP logic - status=1 for active
        const status = item.status;
        const isActive = status === 1 || 
                        status === '1' || 
                        status === true ||
                        status === 'true' ||
                        status === 99 ||  // Keep this as fallback
                        status === '99';
        
        if (!isActive) {
          console.log(`⏭️ Skipping inactive (status=${status}):`, item.name || item.id);
        }
        
        return isActive;
      })
      .map(item => {
        // ✅ FIXED: Match PHP structure for value/label extraction with multiple fallbacks
        // PHP shows: name(description) for products, sizes, parameters
        // PHP shows: just name for others
        
        const id = item.id || item.ID || item.Id || item.value;
        
        // 🔧 CRITICAL FIX: Multiple fallbacks for name field
        // Try different possible field names in order of priority
        let name = item.name || 
                   item.Name || 
                   item.method_name ||  // Fallback for methods
                   item.parameter_name ||  // Fallback for parameters
                   item.grade_name ||  // Fallback for grades
                   item.label || 
                   item.title ||
                   item.text ||
                   '';
        
        // If still empty, try using description as name
        if (!name && item.description) {
          name = item.description;
        }
        
        // If still empty, use the ID as fallback (better than empty)
        if (!name && id) {
          name = `Item ${id}`;
          console.warn(`⚠️ No name found for ${fieldName} item ${id}, using ID as fallback`);
        }
        
        // Add description in parentheses if available (like PHP does)
        // But only if name and description are different
        if (item.description && 
            item.description.trim() !== '' && 
            item.description !== name &&  // Don't duplicate if description was used as name
            fieldName !== 'grades' && 
            fieldName !== 'standards' && 
            fieldName !== 'methods' && 
            fieldName !== 'clauses') {
          name = `${name} (${item.description})`;
        }
        
        // Ensure we return proper string values
        const value = id !== undefined && id !== null ? String(id) : '';
        const label = name ? String(name).trim() : '';
        
        // Log problematic items for debugging
        if (!label && value) {
          console.warn(`⚠️ Item with ID ${value} in ${fieldName} has no label. Raw item:`, item);
        }
        
        return { value, label };
      })
      .filter(option => {
        // Remove invalid options with better validation
        const hasValidValue = option.value && 
                             option.value !== '' &&
                             option.value !== 'undefined' && 
                             option.value !== 'null';
        
        const hasValidLabel = option.label && 
                             option.label !== '' &&
                             option.label !== 'undefined' &&
                             option.label !== 'null';
        
        const isValid = hasValidValue && hasValidLabel;
        
        if (!isValid) {
          console.warn(`⚠️ Filtering invalid option for ${fieldName}:`, 
            JSON.stringify({ value: option.value, label: option.label }));
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

  // ✅ IMPROVED: Fetch dropdown data with better error handling
  const fetchDropdownData = useCallback(async () => {
    console.log("🔄 Starting to fetch all dropdown data...");
    
    try {
      // Fetch all data in parallel
      const [
        productsRes,
        gradesRes,
        sizesRes,
        standardsRes,
        parametersRes,
        methodsRes,
        clausesRes
      ] = await Promise.allSettled([
        axios.get("/testing/get-prodcut-list"),
        axios.get("/testing/get-grades"),
        axios.get("/testing/get-sizes"),
        axios.get("/testing/get-standards"),
        axios.get("/testing/get-perameter-list"),
        axios.get("/testing/get-methods"),
        axios.get("/testing/get-clauses")
      ]);

      // Process each response
      const processResponse = (response, setter, name) => {
        setDropdownLoading(prev => ({ ...prev, [name.toLowerCase()]: true }));
        
        if (response.status === 'fulfilled') {
          console.log(`\n📦 ${name} Response:`, response.value);
          
          const extractedData = extractArrayFromResponse(response.value.data);
          console.log(`   Extracted ${extractedData.length} items`);
          
          if (extractedData.length > 0) {
            setter(extractedData);
            console.log(`✅ ${name} loaded successfully`);
          } else {
            console.warn(`⚠️ ${name}: No data found in response`);
            setter([]);
          }
        } else {
          console.error(`❌ ${name} failed:`, response.reason);
          setter([]);
          toast.error(`Failed to load ${name}`);
        }
        
        setDropdownLoading(prev => ({ ...prev, [name.toLowerCase()]: false }));
      };

      processResponse(productsRes, setProducts, 'Products');
      processResponse(gradesRes, setGrades, 'Grades');
      processResponse(sizesRes, setSizes, 'Sizes');
      processResponse(standardsRes, setStandards, 'Standards');
      processResponse(parametersRes, setParameters, 'Parameters');
      processResponse(methodsRes, setMethods, 'Methods');
      processResponse(clausesRes, setClauses, 'Clauses');

      console.log("\n✅ All dropdown data fetch completed");

    } catch (error) {
      console.error("❌ Critical error fetching dropdown data:", error);
      toast.error("Failed to load form data");
      
      // Reset all to empty arrays
      setProducts([]);
      setGrades([]);
      setSizes([]);
      setStandards([]);
      setParameters([]);
      setMethods([]);
      setClauses([]);
      
      // Set all loading to false
      setDropdownLoading({
        products: false,
        grades: false,
        sizes: false,
        standards: false,
        parameters: false,
        methods: false,
        clauses: false
      });
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Debug log
  useEffect(() => {
    console.log("\n📊 Current Dropdown Status:", {
      products: `${products.length} items`,
      grades: `${grades.length} items`,
      sizes: `${sizes.length} items`,
      standards: `${standards.length} items`,
      parameters: `${parameters.length} items`,
      methods: `${methods.length} items`,
      clauses: `${clauses.length} items`
    });
  }, [products, grades, sizes, standards, parameters, methods, clauses]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle array field changes
  const handleArrayChange = (index, field, value) => {
    setFormData(prev => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Handle min/max value changes
  const handleParameterValueChange = (index, type, value) => {
    const field = type === 'min' ? 'pvaluemin' : 'pvaluemax';
    setFormData(prev => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Handle specification changes
  const handleSpecificationChange = (index, value) => {
    setFormData(prev => {
      const updatedArray = [...prev.specification];
      updatedArray[index] = value;
      return { ...prev, specification: updatedArray };
    });
  };

  // Add parameter row
  const addParameterRow = () => {
    const newId = parameterInputs.length + 1;
    setParameterInputs(prev => [...prev, { id: newId }]);
    
    setFormData(prev => ({
      ...prev,
      parameter: [...prev.parameter, ""],
      method: [...prev.method, ""],
      clause: [...prev.clause, ""],
      pvaluemin: [...prev.pvaluemin, ""],
      pvaluemax: [...prev.pvaluemax, ""],
      specification: [...prev.specification, ""]
    }));
  };

  // Remove parameter row
  const removeParameterRow = (index) => {
    if (parameterInputs.length === 1) {
      toast.error("At least one parameter is required");
      return;
    }

    setParameterInputs(prev => prev.filter((_, i) => i !== index));
    
    setFormData(prev => {
      const newFormData = { ...prev };
      ['parameter', 'method', 'clause', 'pvaluemin', 'pvaluemax', 'specification'].forEach(key => {
        newFormData[key] = newFormData[key].filter((_, i) => i !== index);
      });
      return newFormData;
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    const requiredFields = ['product', 'grade', 'size', 'standard'];
    requiredFields.forEach(field => {
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

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
          formData[key].forEach(value => {
            formDataToSend.append(`${key}[]`, value);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post("/testing/add-permissible-value", formDataToSend);
      const result = response.data;
      const newId = result?.data?.id || result?.id;

      toast.success("Test Permissible Value created successfully ✅", {
        duration: 2000,
      });

      setTimeout(() => {
        navigate("/dashboards/testing/test-permissible-values", { 
          state: { updatedId: newId } 
        });
      }, 1500);

    } catch (err) {
      console.error("Error creating permissible value:", err);
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          "Failed to create test permissible value";
      toast.error(errorMessage + " ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Test Permissible Value">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Add Test Permissible Value
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
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
                disabled={dropdownLoading.products}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {dropdownLoading.products ? "Loading..." : "Select Product"}
                </option>
                {generateOptions(products, 'products').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.product && (
                <p className="text-red-500 text-sm mt-1">{errors.product}</p>
              )}
              {!dropdownLoading.products && (
                <p className={`text-xs mt-1 ${products.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {products.length > 0 
                    ? `${generateOptions(products, 'products').length} products available ✓` 
                    : 'No products available'}
                </p>
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
                disabled={dropdownLoading.grades}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {dropdownLoading.grades ? "Loading..." : "Select Grade"}
                </option>
                {generateOptions(grades, 'grades').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
              )}
              {!dropdownLoading.grades && (
                <p className={`text-xs mt-1 ${grades.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {grades.length > 0 
                    ? `${generateOptions(grades, 'grades').length} grades available ✓` 
                    : 'No grades available'}
                </p>
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
                disabled={dropdownLoading.sizes}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {dropdownLoading.sizes ? "Loading..." : "Select Size"}
                </option>
                {generateOptions(sizes, 'sizes').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.size && (
                <p className="text-red-500 text-sm mt-1">{errors.size}</p>
              )}
              {!dropdownLoading.sizes && (
                <p className={`text-xs mt-1 ${sizes.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {sizes.length > 0 
                    ? `${generateOptions(sizes, 'sizes').length} sizes available ✓` 
                    : 'No sizes available'}
                </p>
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
                disabled={dropdownLoading.standards}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {dropdownLoading.standards ? "Loading..." : "Select Standard"}
                </option>
                {generateOptions(standards, 'standards').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.standard && (
                <p className="text-red-500 text-sm mt-1">{errors.standard}</p>
              )}
              {!dropdownLoading.standards && (
                <p className={`text-xs mt-1 ${standards.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {standards.length > 0 
                    ? `${generateOptions(standards, 'standards').length} standards available ✓` 
                    : 'No standards available'}
                </p>
              )}
            </div>
          </div>

          {/* Parameters Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Parameters
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
              <div key={row.id} className="border p-4 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700">
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
                      onChange={(e) => handleArrayChange(index, 'parameter', e.target.value)}
                      disabled={dropdownLoading.parameters}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {dropdownLoading.parameters ? "Loading..." : "Select Parameter"}
                      </option>
                      {generateOptions(parameters, 'parameters').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`parameter_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`parameter_${index}`]}</p>
                    )}
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.method[index] || ""}
                      onChange={(e) => handleArrayChange(index, 'method', e.target.value)}
                      disabled={dropdownLoading.methods}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {dropdownLoading.methods ? "Loading..." : "Select Method"}
                      </option>
                      {generateOptions(methods, 'methods').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`method_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`method_${index}`]}</p>
                    )}
                  </div>

                  {/* Clause */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Clause
                    </label>
                    <select
                      value={formData.clause[index] || ""}
                      onChange={(e) => handleArrayChange(index, 'clause', e.target.value)}
                      disabled={dropdownLoading.clauses}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {dropdownLoading.clauses ? "Loading..." : "Select Clause"}
                      </option>
                      {generateOptions(clauses, 'clauses').map((option) => (
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
                      onChange={(e) => handleParameterValueChange(index, 'min', e.target.value)}
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
                      onChange={(e) => handleParameterValueChange(index, 'max', e.target.value)}
                      placeholder="Enter maximum value"
                    />
                  </div>

                  {/* Specification */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Input
                      label="Specification"
                      value={formData.specification[index] || ""}
                      onChange={(e) => handleSpecificationChange(index, e.target.value)}
                      placeholder="Enter specification details"
                    />
                  </div>
                </div>

                {errors[`value_${index}`] && (
                  <p className="text-red-500 text-sm mt-2">{errors[`value_${index}`]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboards/testing/test-permissible-values")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Permissible Value"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}