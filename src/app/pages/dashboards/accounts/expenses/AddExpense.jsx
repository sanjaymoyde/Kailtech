// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "utils/axios";
import { DatePicker } from "components/shared/form/Datepicker";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function AddExpense() {
  const navigate = useNavigate();

  // ── Form State ──
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    referenceto: "",
    expensedate: "",
    amount: "",
  });

  // ── Categories from API (mirrors PHP selecttable("expensecategory")) ──
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ── Submission State ──
  const [submitting, setSubmitting] = useState(false);

  // ── Validation errors ──
  const [errors, setErrors] = useState({});

  // ── Fetch categories on mount (mirrors PHP selecttable("expensecategory")) ──
  useEffect(() => {
    axios
      .get("/accounts/get-expense-category-list")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCategories(list);
      })
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // ── Handle input changes ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Validation (mirrors data-bvalidator="required") ──
  const validate = () => {
    const newErrors = {};
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.referenceto.trim()) newErrors.referenceto = "Expense In Favor Of is required.";
    if (!formData.expensedate) newErrors.expensedate = "Expense Date is required.";
    if (!formData.amount) {
      newErrors.amount = "Amount is required.";
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a valid positive number.";
    }
    return newErrors;
  };

  // ── Submit (mirrors insertExpense.php) ──
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      // Format date to DD/MM/YYYY if it's in YYYY-MM-DD
      let formattedDate = formData.expensedate;
      if (formattedDate.includes("-")) {
        const [y, m, d] = formattedDate.split("-");
        formattedDate = `${d}/${m}/${y}`;
      }

      const payload = {
        ...formData,
        expensedate: formattedDate,
        category: Number(formData.category),
        amount: Number(formData.amount),
      };

      const res = await axios.post("/accounts/add-expense", payload);
      if (res.data?.status || res.data?.success) {
        toast.success(res.data?.message || "Expense added successfully.");
        navigate("/dashboards/accounts/expenses");
      } else {
        toast.error(res.data?.message || "Failed to add expense.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Add New Expense">
      <div className="p-4 sm:p-6">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Add New Expense
          </h1>
          <button
            onClick={() => navigate("/dashboards/accounts/expenses")}
            className="rounded border border-gray-300 bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 dark:border-dark-500"
          >
            &laquo; Expenses List
          </button>
        </div>

        {/* ── Form Card ── */}
        <div className="rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
          <div className="divide-y divide-gray-100 dark:divide-dark-600">

            {/* Category */}
            <FormRow label="Category" required error={errors.category}>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={categoriesLoading}
                className={inputClass(errors.category)}
              >
                <option value="">
                  {categoriesLoading ? "Loading..." : "-- Select Category --"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* Title */}
            <FormRow label="Title" required error={errors.title}>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className={inputClass(errors.title)}
                placeholder="Enter expense title"
              />
            </FormRow>

            {/* Description */}
            <FormRow label="Description" required error={errors.description}>
              <input
                type="text"
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                className={inputClass(errors.description)}
                placeholder="Enter description"
              />
            </FormRow>

            {/* Expense In Favor Of (referenceto) */}
            <FormRow label="Expense In Favor Of" required error={errors.referenceto}>
              <input
                type="text"
                name="referenceto"
                id="referenceto"
                value={formData.referenceto}
                onChange={handleChange}
                className={inputClass(errors.referenceto)}
                placeholder="Enter reference"
              />
            </FormRow>

            {/* Expense Date — mirrors PHP readonly date picker (onfocus="setcalender") */}
            <FormRow label="Expense Date" required error={errors.expensedate}>
              <DatePicker
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                }}
                value={formData.expensedate}
                onChange={(dates, dateStr) =>
                  handleChange({ target: { name: "expensedate", value: dateStr } })
                }
                placeholder="Expense Date"
                className={inputClass(errors.expensedate)}
              />
            </FormRow>

            {/* Amount */}
            <FormRow label="Amount" required error={errors.amount}>
              <input
                type="number"
                name="amount"
                id="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputClass(errors.amount)}
                placeholder="0.00"
              />
            </FormRow>

            {/* Submit */}
            <div className="px-4 py-4 sm:px-6">
              <div className="sm:ml-[25%]">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Page>
  );
}

// ── Helpers ──

function inputClass(error) {
  return [
    "w-full rounded border px-3 py-2 text-sm outline-none transition",
    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
    "dark:bg-dark-700 dark:text-dark-100",
    error
      ? "border-red-400 dark:border-red-500"
      : "border-gray-300 dark:border-dark-500",
  ].join(" ");
}

function FormRow({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 sm:flex-row sm:items-start sm:px-6">
      <label className="w-full shrink-0 pt-2 text-sm font-medium text-gray-700 dark:text-dark-200 sm:w-1/4">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-3/4">
        {children}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}