import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";

export default function AddTestParameter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    mintemp: "27.5",
    maxtemp: "27.5",
    minhumidity: "50",
    maxhumidity: "50",
    time: "",
    mindurationdays: "",
    mindurationhours: "",
    maxdurationdays: "",
    maxdurationhours: "",
    reminderdays: "",
    reminderhours: "",
    department: "",
    nabl: "",
    products: [],
    instruments: [],
    measurements: [],
    results: [],
    cycle: "",
    visible: "",
    resultype: "",
    resultunit: "",
    decimal: "",
    minnabl: "",
    maxnabl: "",
    minqai: "",
    maxqai: "",
    remark: "",
  });

  // Dropdown data states
  const [dropdowns, setDropdowns] = useState({
    products: [],
    instruments: [],
    measurements: [],
    results: [],
    resultTypes: [],
    labs: [],
    units: [],
    choices: [
      { id: 1, name: "Yes" },
      { id: 2, name: "No" },
    ],
  });

  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);

  // Fetch all dropdown data
  useEffect(() => {
    const fetchAllDropdowns = async () => {
      try {
        setFetchingDropdowns(true);

        const [
          productsRes,
          instrumentsRes,
          measurementsRes,
          resultsRes,
          resultTypesRes,
          labsRes,
          unitsRes,
        ] = await Promise.all([
          axios.get("/testing/get-prodcut-list"),
          axios.get("/testing/get-instrument-categories"),
          axios.get("/testing/get-measurement"),
          axios.get("/testing/get-measurement-result"),
          axios.get("/testing/get-resulttypes"),
          axios.get("/master/list-lab"),
          axios.get("/master/units-list"),
        ]);

        console.log("Products API response:", productsRes.data);
        console.log("Instruments API response:", instrumentsRes.data);
        console.log("Measurements API response:", measurementsRes.data);
        console.log("Results API response:", resultsRes.data);
        
        // Extract data properly - based on your API response
        const productsData = productsRes.data?.data || [];
        const instrumentsData = instrumentsRes.data?.data || [];
        const measurementsData = measurementsRes.data?.data || []; // This is already an array
        const resultsData = resultsRes.data?.data || [];
        const resultTypesData = resultTypesRes.data?.data || [];
        const labsData = labsRes.data?.data || [];
        const unitsData = unitsRes.data?.data || [];

        console.log("Measurements data:", measurementsData);
        console.log("Measurements count:", measurementsData?.length || 0);

        setDropdowns({
          products: productsData,
          instruments: instrumentsData,
          measurements: measurementsData, // Direct array
          results: resultsData,
          resultTypes: resultTypesData,
          labs: labsData,
          units: unitsData,
          choices: [
            { id: 1, name: "Yes" },
            { id: 2, name: "No" },
          ],
        });
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
        toast.error("Failed to load dropdown data");
      } finally {
        setFetchingDropdowns(false);
      }
    };

    fetchAllDropdowns();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handler for react-select multi-select
  const handleReactSelectChange = (selectedOptions, fieldName) => {
    const selectedValues = selectedOptions 
      ? selectedOptions.map(option => option.value) 
      : [];

    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedValues,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Parameter name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.department) newErrors.department = "Lab is required";
    if (!formData.nabl) newErrors.nabl = "NABL selection is required";
    if (!formData.visible) newErrors.visible = "Visible selection is required";
    if (!formData.resultype) newErrors.resultype = "Result type is required";
    if (!formData.resultunit) newErrors.resultunit = "Result unit is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        mintemp: Number(formData.mintemp),
        maxtemp: Number(formData.maxtemp),
        minhumidity: Number(formData.minhumidity),
        maxhumidity: Number(formData.maxhumidity),
        time: formData.time ? Number(formData.time) : 0,
        mindurationdays: formData.mindurationdays ? Number(formData.mindurationdays) : 0,
        mindurationhours: formData.mindurationhours ? Number(formData.mindurationhours) : 0,
        maxdurationdays: formData.maxdurationdays ? Number(formData.maxdurationdays) : 0,
        maxdurationhours: formData.maxdurationhours ? Number(formData.maxdurationhours) : 0,
        reminderdays: formData.reminderdays ? Number(formData.reminderdays) : 0,
        reminderhours: formData.reminderhours ? Number(formData.reminderhours) : 0,
        department: Number(formData.department),
        nabl: Number(formData.nabl),
        products: formData.products,
        instruments: formData.instruments,
        measurements: formData.measurements,
        results: formData.results,
        cycle: formData.cycle ? Number(formData.cycle) : 0,
        visible: Number(formData.visible),
        resultype: Number(formData.resultype),
        resultunit: Number(formData.resultunit),
        decimal: formData.decimal ? Number(formData.decimal) : 0,
        minnabl: formData.minnabl ? Number(formData.minnabl) : 0,
        maxnabl: formData.maxnabl ? Number(formData.maxnabl) : 0,
        minqai: formData.minqai ? Number(formData.minqai) : 0,
        maxqai: formData.maxqai ? Number(formData.maxqai) : 0,
        remark: formData.remark,
      };

      console.log("Payload:", payload);

      const res = await axios.post("/testing/add-perameter", payload);

      if (res.data?.status === true || res.data?.status === "true") {
        toast.success("Test parameter added successfully ✅", {
          duration: 1000,
        });
        const newId = res.data?.data?.id || res.data?.id;
        navigate("/dashboards/testing/test-parameters", { 
          state: { updatedId: newId } 
        });
      } else {
        toast.error(res.data?.message || "Failed to add test parameter ❌");
      }
    } catch (err) {
      console.error("Add Parameter Error:", err);
      toast.error(
        err?.response?.data?.message || "Something went wrong while adding parameter"
      );
    } finally {
      setLoading(false);
    }
  };

  // Convert dropdown data to react-select format
  const getSelectOptions = (items) => {
    if (!items || !Array.isArray(items)) {
      console.log("getSelectOptions received non-array items:", items);
      return [];
    }
    
    return items.map(item => ({
      value: item.id,
      label: item.name || item.label || `Item ${item.id}`
    }));
  };

  // Get selected values for react-select
  const getSelectedOptions = (selectedIds, options) => {
    if (!selectedIds || !options) return [];
    return options.filter(option => selectedIds.includes(option.value));
  };

  // Custom styles for react-select to match your theme
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderColor: state.isFocused 
        ? '#3b82f6' 
        : 'rgb(209 213 219)', // gray-300
      boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.5)' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      },
      backgroundColor: 'white',
      borderRadius: '0.5rem',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#dbeafe', // blue-100
      borderRadius: '0.25rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e40af', // blue-800
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#3b82f6',
      '&:hover': {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
    }),
  };

  // Get measurement options - with debugging
  const measurementOptions = getSelectOptions(dropdowns.measurements);
  console.log("Measurement options for dropdown:", measurementOptions);

  if (fetchingDropdowns) {
    return (
      <Page title="Add Test Parameter">
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-300">Loading form data...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add Test Parameter">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add Test Parameter
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/testing/test-parameters")}
          >
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Parameter Name"
                name="name"
                placeholder="Enter parameter name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Input
                label="Description/Symbol"
                name="description"
                placeholder="Enter symbol"
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Temperature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Min Temperature Required (°C)"
                name="mintemp"
                type="number"
                step="0.1"
                placeholder="Min temperature"
                value={formData.mintemp}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Max Temperature Required (°C)"
                name="maxtemp"
                type="number"
                step="0.1"
                placeholder="Max temperature"
                value={formData.maxtemp}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Humidity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Min Humidity Required (%)"
                name="minhumidity"
                type="number"
                placeholder="Min humidity"
                value={formData.minhumidity}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Max Humidity Required (%)"
                name="maxhumidity"
                type="number"
                placeholder="Max humidity"
                value={formData.maxhumidity}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Time Required */}
          <div>
            <Input
              label="Time Required (days)"
              name="time"
              type="number"
              placeholder="Time required in days"
              value={formData.time}
              onChange={handleChange}
            />
          </div>

          {/* Min Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Min Duration (Days)"
                name="mindurationdays"
                type="number"
                placeholder="Minimum duration in days"
                value={formData.mindurationdays}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Min Duration (Hours)"
                name="mindurationhours"
                type="number"
                max="24"
                placeholder="Minimum duration in hours"
                value={formData.mindurationhours}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Max Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Max Duration (Days)"
                name="maxdurationdays"
                type="number"
                placeholder="Maximum duration in days"
                value={formData.maxdurationdays}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Max Duration (Hours)"
                name="maxdurationhours"
                type="number"
                max="24"
                placeholder="Maximum duration in hours"
                value={formData.maxdurationhours}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Reminder Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Reminder Duration (Days)"
                name="reminderdays"
                type="number"
                placeholder="Reminder duration in days"
                value={formData.reminderdays}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Reminder Duration (Hours)"
                name="reminderhours"
                type="number"
                max="24"
                placeholder="Reminder duration in hours"
                value={formData.reminderhours}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Select Lab */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Lab <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Lab</option>
              {dropdowns.labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-red-500 text-sm mt-1">{errors.department}</p>
            )}
          </div>

          {/* Covered Under NABL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Covered Under NABL? <span className="text-red-500">*</span>
            </label>
            <select
              name="nabl"
              value={formData.nabl}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {dropdowns.choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
            {errors.nabl && <p className="text-red-500 text-sm mt-1">{errors.nabl}</p>}
          </div>

          {/* Applicable Products */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Applicable Products
            </label>
            <Select
              isMulti
              name="products"
              options={getSelectOptions(dropdowns.products)}
              value={getSelectedOptions(formData.products, getSelectOptions(dropdowns.products))}
              onChange={(selected) => handleReactSelectChange(selected, 'products')}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select products..."
              isClearable
              isSearchable
            />
            <p className="text-xs text-gray-500 mt-1">Search and select multiple products</p>
          </div>

          {/* Applicable Instruments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Applicable Instruments
            </label>
            <Select
              isMulti
              name="instruments"
              options={getSelectOptions(dropdowns.instruments)}
              value={getSelectedOptions(formData.instruments, getSelectOptions(dropdowns.instruments))}
              onChange={(selected) => handleReactSelectChange(selected, 'instruments')}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select instruments..."
              isClearable
              isSearchable
            />
            <p className="text-xs text-gray-500 mt-1">Search and select multiple instruments</p>
          </div>

          {/* Variables (Not used in Calculation) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variables (Not used in Calculation)
            </label>
            <Select
              isMulti
              name="measurements"
              options={measurementOptions}
              value={getSelectedOptions(formData.measurements, measurementOptions)}
              onChange={(selected) => handleReactSelectChange(selected, 'measurements')}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select measurements..."
              isClearable
              isSearchable
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuShouldBlockScroll={true}
            />
            <div className="text-xs text-gray-500 mt-1">
              <p>Search and select multiple measurements</p>
              <p>Available measurements: {measurementOptions.length}</p>
            </div>
          </div>

          {/* Measurement Results */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Measurement Results
            </label>
            <Select
              isMulti
              name="results"
              options={getSelectOptions(dropdowns.results)}
              value={getSelectedOptions(formData.results, getSelectOptions(dropdowns.results))}
              onChange={(selected) => handleReactSelectChange(selected, 'results')}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select measurement results..."
              isClearable
              isSearchable
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
            <p className="text-xs text-gray-500 mt-1">Search and select multiple results</p>
          </div>

          {/* No. of Cycles */}
          <div>
            <Input
              label="No. of Cycles"
              name="cycle"
              type="number"
              placeholder="Number of cycles"
              value={formData.cycle}
              onChange={handleChange}
            />
          </div>

          {/* Visible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visible <span className="text-red-500">*</span>
            </label>
            <select
              name="visible"
              value={formData.visible}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {dropdowns.choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
            {errors.visible && <p className="text-red-500 text-sm mt-1">{errors.visible}</p>}
          </div>

          {/* Type of Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type of Result <span className="text-red-500">*</span>
            </label>
            <select
              name="resultype"
              value={formData.resultype}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Result Type</option>
              {dropdowns.resultTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.resultype && (
              <p className="text-red-500 text-sm mt-1">{errors.resultype}</p>
            )}
          </div>

          {/* Unit of Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit of Result <span className="text-red-500">*</span>
            </label>
            <select
              name="resultunit"
              value={formData.resultunit}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Result Unit</option>
              {dropdowns.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            {errors.resultunit && (
              <p className="text-red-500 text-sm mt-1">{errors.resultunit}</p>
            )}
          </div>

          {/* No. of Decimal Points */}
          <div>
            <Input
              label="No. of Decimal Points"
              name="decimal"
              type="number"
              placeholder="Digits after decimal"
              value={formData.decimal}
              onChange={handleChange}
            />
          </div>

          {/* NABL Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Min NABL Range"
                name="minnabl"
                type="number"
                step="0.01"
                placeholder="Min NABL range"
                value={formData.minnabl}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Max NABL Range"
                name="maxnabl"
                type="number"
                step="0.01"
                placeholder="Max NABL range"
                value={formData.maxnabl}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* QAI Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Min QAI Range"
                name="minqai"
                type="number"
                step="0.01"
                placeholder="Min QAI range"
                value={formData.minqai}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                label="Max QAI Range"
                name="maxqai"
                type="number"
                step="0.01"
                placeholder="Max QAI range"
                value={formData.maxqai}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Remark
            </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter remarks"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" color="primary" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                  />
                </svg>
                Saving...
              </div>
            ) : (
              "Insert Parameter"
            )}
          </Button>
        </form>
      </div>
    </Page>
  );
}