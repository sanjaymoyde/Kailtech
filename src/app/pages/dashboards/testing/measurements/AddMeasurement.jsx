import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function AddMeasurement() {
  const navigate = useNavigate();

  // ✅ Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "",
  });

  // ✅ Units list
  const [units, setUnits] = useState([]);

  // ✅ Loading & errors
  const [loading, setLoading] = useState(false);
  const [fetchingUnits, setFetchingUnits] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Fetch units dropdown
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setFetchingUnits(true);
        const res = await axios.get("/master/units-list");

        console.log("Units API Response:", res.data); // Debug log

        if (res.data?.status === "true" && res.data.data) {
          setUnits(res.data.data || []);
        } else {
          toast.error("Failed to load units");
        }
      } catch (err) {
        console.error("Units API Error:", err);
        toast.error("Failed to load units");
      } finally {
        setFetchingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  // ✅ Handle input change
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

  const handleUnitChange = (selected) => {
    const value = selected ? selected.value : "";
    setFormData((prev) => ({
      ...prev,
      unit: value,
    }));

    if (errors.unit) {
      setErrors((prev) => ({
        ...prev,
        unit: "",
      }));
    }
  };

  const unitOptions = units.map((unit) => ({
    value: unit.id,
    label: unit.name || unit.unit || unit.unitdesc || unit.description || "-",
  }));

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "40px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      ":hover": { borderColor: "#93c5fd" },
    }),
    menu: (base) => ({ ...base, zIndex: 50 }),
  };

  // ✅ Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Measurement name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit form
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
        unit: Number(formData.unit),
      };

      const res = await axios.post("/testing/add-measurement", payload);

      // ✅ FIXED: Handle both boolean true and string "true"
      if (res.data?.status === true || res.data?.status === "true") {
        toast.success("Measurement added successfully ✅", {
          duration: 1000,
        });

        navigate("/dashboards/testing/measurements");
      } else {
        toast.error(res.data?.message || "Failed to add measurement ❌");
      }
    } catch (err) {
      console.error("Add Measurement Error:", err);
      toast.error(
        err?.response?.data?.message ||
        "Something went wrong while adding measurement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Measurement">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add Measurement
          </h2>

          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/testing/measurements")}
          >
            Back to List
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Input
              label="Measurement Name"
              name="name"
              placeholder="Enter measurement name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Input
              label="Description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* Unit Dropdown - FIXED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit <span className="text-red-500">*</span>
            </label>

            {fetchingUnits ? (
              <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700">
                <span className="text-gray-500">Loading units...</span>
              </div>
            ) : (
              <Select
                options={unitOptions}
                value={unitOptions.find((o) => o.value === formData.unit) || null}
                onChange={handleUnitChange}
                placeholder="Select unit..."
                isSearchable
                isLoading={fetchingUnits}
                isDisabled={fetchingUnits}
                styles={selectStyles}
                classNamePrefix="react-select"
                className="react-select-container text-gray-900 dark:text-gray-100"
              />
            )}

            {errors.unit && (
              <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
            )}

            {/* Show total units count */}
            {units.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {units.length} units available
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" color="primary" disabled={loading || fetchingUnits}>
            {loading ? (
              <div className="flex items-center gap-2">
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
              "Save Measurement"
            )}
          </Button>
        </form>
      </div>
    </Page>
  );
}
