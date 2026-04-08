import { useNavigate } from "react-router";
import { useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios"; 
import { toast } from "sonner";

export default function AddManageEmployee() {
  const navigate = useNavigate();

  // State for form and loading
  const [formData, setFormData] = useState({ name: "", employee_code: "" });
  const [loading, setLoading] = useState(false);

  // Error and touched states
  const [errors, setErrors] = useState({
    name: "",
    employee_code: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    employee_code: false,
  });

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle field blur to show validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    validateField(name, value);
  };

  // Validate individual field
  const validateField = (fieldName, value) => {
    let error = "";
    
    if (!value.trim()) {
      error = "This field is required";
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === "";
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }

    // Validate employee_code
    if (!formData.employee_code.trim()) {
      newErrors.employee_code = "This field is required";
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      employee_code: true,
    });

    return isValid;
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("employee_code", formData.employee_code);

      await axios.post("/hrm/add-employee", form); 

      toast.success("Manage employee created successfully ", {
        duration: 1000,
        icon: "✅",
      });

      navigate("/dashboards/hrm/manage-employee");
    } catch (err) {
      console.error("Error creating employee:", err);
      toast.error(err?.response?.data?.message || "Failed to create employee ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Manage Employee">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add Manage Employee
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/hrm/manage-employee")}
          >
            Back to List
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Name"
              name="name"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name && touched.name ? "border-red-500" : ""}
            />
            {errors.name && touched.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Input
              label="Employee Code"
              name="employee_code"
              placeholder="Enter employee code"
              value={formData.employee_code}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.employee_code && touched.employee_code ? "border-red-500" : ""}
            />
            {errors.employee_code && touched.employee_code && (
              <p className="text-red-500 text-sm mt-1">{errors.employee_code}</p>
            )}
          </div>

          <Button type="submit" color="primary" disabled={loading}>
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
              "Save"
            )}
          </Button>
        </form>
      </div>
    </Page>
  );
}
