// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import dayjs from "dayjs";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function AddConsentLetter() {
  const navigate = useNavigate();

  // ── Form State ──
  const [formData, setFormData] = useState({
    consentletterdate: dayjs().format("YYYY-MM-DD"), // mirrors date("d/m/Y")
    iscode: "",       // Standard
    customerid: "",   // Customer
    cusr: "",         // Customer Address
    remark: "",
    remark2: "",
  });

  // ── Dropdown data ──
  const [standards, setStandards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);

  // ── Loading states ──
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);

  // ── Submission state ──
  const [submitting, setSubmitting] = useState(false);

  // ── Validation errors ──
  const [errors, setErrors] = useState({});

  // ── Fetch Standards (mirrors selecttable("standards")) ──
  useEffect(() => {
    axios
      .get("/standards")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setStandards(list);
        // Auto-select first like PHP (no blank option in standards select)
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, iscode: list[0].id }));
        }
      })
      .catch((err) => console.error("Failed to load standards:", err))
      .finally(() => setStandardsLoading(false));
  }, []);

  // ── Fetch Customers (mirrors selectextrawhere("customers", "status=1")) ──
  useEffect(() => {
    axios
      .get("/customers", { params: { status: 1 } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomers(list);
      })
      .catch((err) => console.error("Failed to load customers:", err))
      .finally(() => setCustomersLoading(false));
  }, []);

  // ── Fetch Customer Addresses when customer changes ──
  // Mirrors: onchange="search(..., 'fetchcustomeraddressforconsent.php', ...)"
  useEffect(() => {
    if (!formData.customerid) {
      setCustomerAddresses([]);
      setFormData((prev) => ({ ...prev, cusr: "" }));
      return;
    }
    setAddressLoading(true);
    axios
      .get("/customer-addresses", { params: { customer_id: formData.customerid } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomerAddresses(list);
        setFormData((prev) => ({ ...prev, cusr: "" }));
      })
      .catch((err) => console.error("Failed to load addresses:", err))
      .finally(() => setAddressLoading(false));
  }, [formData.customerid]);

  // ── Handle input changes ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Validation ──
  const validate = () => {
    const newErrors = {};
    if (!formData.consentletterdate) newErrors.consentletterdate = "Date is required.";
    if (!formData.iscode) newErrors.iscode = "Standard is required.";
    if (!formData.customerid) newErrors.customerid = "Customer is required.";
    if (!formData.cusr) newErrors.cusr = "Customer address is required.";
    return newErrors;
  };

  // ── Submit (mirrors insertconcent.php) ──
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post("/consent-letters", formData);
      if (response.data.status) {
        toast.success("Consent letter added successfully ✅");
        navigate("/dashboards/accounts/consent-letter");
      } else {
        toast.error(response.data.message ?? "Failed to add consent letter.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Add Consent Letter">
      <div className="p-4 sm:p-6">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Consent Form
          </h1>
          <button
            onClick={() => navigate("/dashboards/accounts/consent-letter")}
            className="rounded border border-gray-300 bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            &laquo; Back to Consent Letter List
          </button>
        </div>

        {/* ── Form Card ── */}
        <div className="rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
          <div className="divide-y divide-gray-100 dark:divide-dark-600">

            {/* Consent Letter Date — readonly, auto-filled like PHP date("d/m/Y") */}
            <FormRow label="Consent Letter Date" error={errors.consentletterdate}>
              <input
                type="date"
                name="consentletterdate"
                value={formData.consentletterdate}
                readOnly
                className={inputClass(errors.consentletterdate)}
              />
            </FormRow>

            {/* Standard */}
            <FormRow label="Standard" required error={errors.iscode}>
              <select
                name="iscode"
                value={formData.iscode}
                onChange={handleChange}
                disabled={standardsLoading}
                className={inputClass(errors.iscode)}
              >
                {standardsLoading ? (
                  <option value="">Loading...</option>
                ) : (
                  standards.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </FormRow>

            {/* Customer Name — mirrors name + pnumber display */}
            <FormRow label="Customer Name" required error={errors.customerid}>
              <select
                name="customerid"
                value={formData.customerid}
                onChange={handleChange}
                disabled={customersLoading}
                className={inputClass(errors.customerid)}
              >
                <option value="">
                  {customersLoading ? "Loading..." : "Select Customer"}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.pnumber})
                  </option>
                ))}
              </select>
            </FormRow>

            {/* Customer Address — dependent on Customer selection */}
            {/* Mirrors: div#readd which is populated via fetchcustomeraddressforconsent.php */}
            <FormRow label="Customer Address" required error={errors.cusr}>
              <select
                name="cusr"
                value={formData.cusr}
                onChange={handleChange}
                disabled={!formData.customerid || addressLoading}
                className={inputClass(errors.cusr)}
              >
                <option value="">
                  {!formData.customerid
                    ? "Select a customer first"
                    : addressLoading
                      ? "Loading addresses..."
                      : customerAddresses.length === 0
                        ? "No addresses found"
                        : "Select Address"}
                </option>
                {customerAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.address}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* Remark */}
            <FormRow label="Remark" error={errors.remark}>
              <textarea
                name="remark"
                id="remark"
                value={formData.remark}
                onChange={handleChange}
                rows={3}
                className={inputClass(errors.remark)}
                placeholder="Enter remark"
              />
            </FormRow>

            {/* Remark 2 */}
            <FormRow label="Remark 2" error={errors.remark2}>
              <textarea
                name="remark2"
                id="remark2"
                value={formData.remark2}
                onChange={handleChange}
                rows={3}
                className={inputClass(errors.remark2)}
                placeholder="Enter remark 2"
              />
            </FormRow>

            {/* Submit */}
            <div className="px-4 py-4 sm:px-6">
              <div className="sm:ml-[16.67%]">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit"}
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
      <label className="w-full shrink-0 pt-2 text-sm font-medium text-gray-700 dark:text-dark-200 sm:w-1/6">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-5/6">
        {children}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
