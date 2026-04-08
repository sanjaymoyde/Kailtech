import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EditManageEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [employee, setEmployee] = useState({ name: "", employee_code: "" });

  // Error and touched states
  const [errors, setErrors] = useState({
    name: "",
    employee_code: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    employee_code: false,
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/hrm/get-employee-byid/${id}`);
        const result = response.data;

        if (result.status === "true" && result.data) {
          setEmployee({
            name: result.data.name || "",
            employee_code: result.data.employee_code || "",
          });
        } else {
          toast.error(result.message || "Failed to load employee.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({
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
    if (!employee.name.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }

    // Validate employee_code
    if (!employee.employee_code.trim()) {
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

  // Update employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const form = new FormData();
      form.append("name", employee.name);
      form.append("employee_code", employee.employee_code);

      const response = await axios.post(`/hrm/update-employee/${id}`, form);
      const result = response.data;

      if (result.status === "true") {
        toast.success(result.message || "Employee updated successfully ✅", {
          duration: 1000,
          icon: "✅",
        });

        navigate("/dashboards/hrm/manage-employee");
      } else {
        toast.error(result.message || "Failed to update employee ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Edit Manage Employee">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Edit Manage Employee
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
              value={employee.name}
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
              value={employee.employee_code}
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
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
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
              "Update"
            )}
          </Button>
        </form>
      </div>
    </Page>
  );
}
