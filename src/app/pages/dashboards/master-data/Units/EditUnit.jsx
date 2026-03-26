import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function EditUnit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [unit, setUnit] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/master/get-unit-byid/${id}`); // ✅ updated endpoint
        const result = response.data;

        if (result.status === "true" && result.data) {
          setUnit({
            name: result.data.name || "",
            description: result.data.description || "",
          });
        } else {
          toast.error(result.message || "Failed to load unit data.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong while loading unit.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUnit((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Custom validation function
  const validateForm = () => {
    const newErrors = {};

    if (!unit.name.trim()) {
      newErrors.name = "This is required field";
    }

    // Description is optional, so no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("name", unit.name);
      form.append("description_text", unit.description); // Fix: this field is required by the DB

      const response = await axios.post(`/master/update-unit/${id}`, form); // ✅ updated endpoint
      const result = response.data;

      if (result.status === "true") {
        toast.success("Unit updated successfully ✅", {
          duration: 1000,
          icon: "✅",
        });
        navigate("/dashboards/master-data/units");
      } else {
        toast.error(result.message || "Failed to update unit ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Edit Unit">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Edit Unit
          </h2>
          <Button
            variant="outlined"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/master-data/units")}
          >
            Back to List
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Unit Name"
              name="name"
              value={unit.name}
              onChange={handleChange}
            // removed required attribute
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Input
              label="Description"
              name="description"
              value={unit.description}
              onChange={handleChange}
            // no required attribute (description is optional)
            />
            {/* No error for description as it's optional */}
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








