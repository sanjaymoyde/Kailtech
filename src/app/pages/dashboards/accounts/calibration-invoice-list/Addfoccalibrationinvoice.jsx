// AddFocTestingInvoice.jsx
// Route: /dashboards/accounts/calibration-invoice-list/add-foc
// PHP permission: 292
// PHP port: generateFocTestingInvoice.php → insertTestingInvoice.php
//
// FOC = Free of Cost  →  foc:"Yes", invoiceno:"FOC", typeofinvoice:"Testing"
// KEY RULE (from PHP sumamount): ALL rates = 0 (readonly), ALL charges = 0 (readonly)
//
// API flow:
//   GET /accounts/get-ponumber/:customerid
//   GET /accounts/get-service-reportforinvoice?customerid=&ponumber=&potype=Normal
//   GET /accounts/get-invoice-item?potype=Normal&customerid=&ponumber=&inwardid=
//   GET /accounts/get-brn-number?inwardid=
//   POST /accounts/add-testing-invoice

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_STATE_CODE = "23";
const POTYPE = "Normal"; // FOC always Normal

// ─────────────────────────────────────────────────────────────────────────────
// Style tokens
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400";
const selectCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-400 mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";
const roInputCls =
  "dark:bg-dark-800 dark:border-dark-600 dark:text-dark-200 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-not-allowed";

// ─────────────────────────────────────────────────────────────────────────────
// PHP sumamount() port — FOC version
// ALL rates forced 0; ALL charges forced 0 → only tax calculated on subtotal2
// ─────────────────────────────────────────────────────────────────────────────
function calcFocTotals({ cgstper, sgstper, igstper, isSgst }) {
  // FOC: rate = 0 for all items → subtotal always 0
  const subtotal2 = 0;

  const cgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * (parseFloat(cgstper) || 0)).toFixed(2))
    : 0;
  const sgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * (parseFloat(sgstper) || 0)).toFixed(2))
    : 0;
  const igstamount = !isSgst
    ? parseFloat(((subtotal2 / 100) * (parseFloat(igstper) || 0)).toFixed(2))
    : 0;

  const total = parseFloat(
    (subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2),
  );
  const finaltotal = Math.round(total);
  const roundoff = parseFloat((finaltotal - total).toFixed(2));

  return {
    subtotal: 0,
    discount: 0,
    witnesscharges: 0,
    subtotal2: 0,
    cgstamount,
    sgstamount,
    igstamount,
    total,
    finaltotal,
    roundoff,
  };
}

const toSlashDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Customer Dropdown
// ─────────────────────────────────────────────────────────────────────────────
function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedName = useMemo(() => {
    const c = customers.find((c) => String(c.id) === String(value));
    return c ? c.name : "";
  }, [customers, value]);

  const filtered = useMemo(() => {
    if (!query) return customers.slice(0, 60);
    const q = query.toLowerCase();
    return customers
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [customers, query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedName}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search customer..."
          className={inputCls}
          autoComplete="off"
        />
        {value && !open && (
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
          >
            ✕
          </button>
        )}
      </div>
      {open && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No customers found
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onMouseDown={() => {
                  onChange(String(c.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                  String(c.id) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "dark:text-dark-200 text-gray-700"
                }`}
              >
                {c.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inward Entry Multi-Select — chips + checkbox dropdown
// ─────────────────────────────────────────────────────────────────────────────
function InwardMultiSelect({ options, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (id) => {
    const strId = String(id);
    const next = value.includes(strId)
      ? value.filter((v) => v !== strId)
      : [...value, strId];
    onChange(next);
  };

  const removeChip = (e, id) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== String(id)));
  };

  const selectedOpts = options.filter((o) => value.includes(String(o.id)));

  return (
    <div ref={wrapRef} className="relative">
      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        className={[
          "dark:bg-dark-900 dark:border-dark-500 relative min-h-[38px] w-full cursor-pointer rounded-md border bg-white px-2 py-1.5 pr-8 transition-colors",
          disabled
            ? "dark:bg-dark-800 cursor-not-allowed border-gray-200 bg-gray-50"
            : "border-gray-300 hover:border-blue-400",
          open ? "border-blue-500 ring-1 ring-blue-500" : "",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selectedOpts.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            >
              {opt.display ?? String(opt.id).padStart(4, "0")}
              <button
                type="button"
                onMouseDown={(e) => removeChip(e, opt.id)}
                className="ml-0.5 leading-none text-blue-500 hover:text-blue-800 focus:outline-none"
              >
                &times;
              </button>
            </span>
          ))}
          {selectedOpts.length === 0 && (
            <span className="dark:text-dark-500 px-1 text-sm text-gray-400">
              {disabled ? "Select PO first..." : "Select Inward Entry..."}
            </span>
          )}
        </div>
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-400">
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No entries found
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = value.includes(String(opt.id));
              return (
                <div
                  key={opt.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleOption(opt.id);
                  }}
                  className={[
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors select-none",
                    isSelected
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "dark:text-dark-200 dark:hover:bg-dark-700 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "dark:border-dark-500 border-gray-300",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {opt.display ?? String(opt.id).padStart(4, "0")}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────
function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
      <svg
        className="h-4 w-4 animate-spin text-blue-500"
        viewBox="0 0 24 24"
        fill="none"
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
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Charge Row — readonly, label right-aligned
// ─────────────────────────────────────────────────────────────────────────────
function ChargeRowReadonly({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5/12" />
      <label className="dark:text-dark-400 w-3/12 pr-4 text-right text-sm font-medium text-gray-600">
        {label}
      </label>
      <div className="w-4/12">
        <input readOnly value={value} className={roInputCls} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AddFocTestingInvoice() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [ponumbers, setPonumbers] = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardOptions, setInwardOptions] = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);
  const [items, setItems] = useState([]);
  const [brnnos, setBrnnos] = useState("");
  const [remark, setRemark] = useState("");
  const [billingInfo, setBillingInfo] = useState(null);
  const [taxInfo, setTaxInfo] = useState(null);
  const [invoicedate, setInvoicedate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // FOC: tax percentages readonly but stored for display
  const [cgstper, setCgstper] = useState(9);
  const [sgstper, setSgstper] = useState(9);
  const [igstper, setIgstper] = useState(18);

  // Loading flags
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPo, setLoadingPo] = useState(false);
  const [loadingInward, setLoadingInward] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isSgst = useMemo(() => {
    if (taxInfo) return taxInfo.sgst_applicable === 1;
    return String(billingInfo?.statecode ?? "").trim() === COMPANY_STATE_CODE;
  }, [taxInfo, billingInfo]);

  // FOC: all totals are 0 (rate forced 0 by PHP)
  const totals = useMemo(
    () => calcFocTotals({ cgstper, sgstper, igstper, isSgst }),
    [cgstper, sgstper, igstper, isSgst],
  );

  // ── Load customers ────────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((res) => setCustomers(res.data.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // ── PHP: getPoDetail → /accounts/get-ponumber/:customerid ─────────────────
  const loadPoDetail = useCallback(async (cid) => {
    setPonumbers([]);
    setSelectedPo("");
    setInwardOptions([]);
    setSelectedInwards([]);
    setItems([]);
    setBrnnos("");
    setBillingInfo(null);
    setTaxInfo(null);
    if (!cid) return;
    setLoadingPo(true);
    try {
      const res = await axios.get(`/accounts/get-ponumber/${cid}`);
      setPonumbers(res.data.data ?? res.data ?? []);
    } catch {
      toast.error("Failed to load PO numbers");
    } finally {
      setLoadingPo(false);
    }
  }, []);

  useEffect(() => {
    loadPoDetail(customerid);
  }, [customerid, loadPoDetail]);

  // ── PHP: getServiceReportForm → get-service-reportforinvoice ──────────────
  const loadServiceReport = useCallback(
    async (po) => {
      setInwardOptions([]);
      setSelectedInwards([]);
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      setTaxInfo(null);
      if (!po || !customerid) return;
      setLoadingInward(true);
      try {
        const res = await axios.get(
          `/accounts/get-service-reportforinvoice?customerid=${customerid}&ponumber=${encodeURIComponent(po)}&potype=${POTYPE}`,
        );
        setInwardOptions(res.data.data ?? res.data ?? []);
      } catch {
        toast.error("Failed to load inward entries");
      } finally {
        setLoadingInward(false);
      }
    },
    [customerid],
  );

  useEffect(() => {
    loadServiceReport(selectedPo);
  }, [selectedPo, loadServiceReport]);

  // ── PHP: getServiceReportDetail + getTestingInvoiceBrnNos ─────────────────
  // API: /accounts/get-invoice-item → { customer, tax, items[] }
  // API: /accounts/get-brn-number   → { brn_numbers }
  const loadItems = useCallback(
    async (inwards) => {
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      setTaxInfo(null);
      if (!inwards.length || !selectedPo || !customerid) return;
      setLoadingItems(true);
      try {
        const inwardParam = inwards.join(",");
        const [itemsRes, brnRes] = await Promise.all([
          axios.get(
            `/accounts/get-invoice-item?potype=${POTYPE}&customerid=${customerid}&ponumber=${encodeURIComponent(selectedPo)}&inwardid=${inwardParam}`,
          ),
          axios.get(`/accounts/get-brn-number?inwardid=${inwardParam}`),
        ]);

        if (itemsRes.data.customer) setBillingInfo(itemsRes.data.customer);

        if (itemsRes.data.tax) {
          const tax = itemsRes.data.tax;
          setTaxInfo(tax);
          if (tax.cgst) setCgstper(tax.cgst);
          if (tax.sgst) setSgstper(tax.sgst);
          if (tax.igst) setIgstper(tax.igst);
        }

        const rawItems = itemsRes.data.items ?? itemsRes.data.data ?? [];
        setItems(
          rawItems.map((item, idx) => ({
            ...item,
            _key: `item-${idx}`,
            id: item.item_id ?? item.id,
            rate: 0, // FOC: force rate = 0
            brnno: item.bookingrefno,
            packagedesc: item.description ?? item.packagedesc ?? "",
          })),
        );

        setBrnnos(brnRes.data.brn_numbers ?? "");
      } catch {
        toast.error("Failed to load invoice items");
      } finally {
        setLoadingItems(false);
      }
    },
    [customerid, selectedPo],
  );

  const handleInwardChange = (vals) => {
    setSelectedInwards(vals);
    loadItems(vals);
  };

  // Remove item + update brnnos (PHP: removeBrn())
  const removeItem = (key, itemBrn) => {
    setItems((prev) => prev.filter((i) => i._key !== key));
    if (itemBrn) {
      setBrnnos((prev) => {
        const list = prev
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return list.filter((b) => b !== itemBrn).join(",");
      });
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerid) {
      toast.error("Please select a customer");
      return;
    }
    if (!selectedPo) {
      toast.error("Please select a PO number");
      return;
    }
    if (!selectedInwards.length) {
      toast.error("Please select at least one inward entry");
      return;
    }
    if (items.length === 0) {
      toast.error("No items found for selected entries");
      return;
    }

    const payload = {
      // ── Core fields (same as add-calibration-invoice) ──
      customerid: Number(customerid),
      potype: POTYPE,
      ponumber: selectedPo,
      inwardid: selectedInwards.map(Number),
      customername: billingInfo?.name ?? "",
      addressid: billingInfo?.addressid ?? 0,
      address: billingInfo?.address ?? "",
      statecode: billingInfo?.statecode ?? "",
      pan: billingInfo?.pan ?? "",
      gstno: billingInfo?.gstno ?? "",
      invoicedate: toSlashDate(invoicedate),

      // ── FOC-specific flags ──
      foc: "Yes",
      invoiceno: "FOC",
      typeofinvoice: "Testing",

      // ── Items — PHP itemid[], brnno[], itemrate[] forced 0 ──
      itemid: items.map((i) => Number(i.id)),
      itemname: items.map((i) => i.name ?? ""),
      iteminstid: items.map((i) => Number(i.instid ?? i.instrumentid ?? 0)),
      itemidno: items.map((i) => i.idno ?? ""),
      brnno: items.map((i) => i.brnno ?? ""),
      itemserialno: items.map((i) => i.serialno ?? ""),
      itemlocation: items.map((i) => i.location ?? ""),
      itemaccreditation: items.map((i) => i.accreditation ?? ""),
      itempackagename: items.map((i) => i.packagename ?? ""),
      itempackagedesc: items.map((i) => i.packagedesc ?? ""),
      itempricematrixid: items.map((i) => Number(i.pricematrixid ?? 0)),
      iteminwardid: items.map((i) =>
        Number(i.inwardid ?? selectedInwards[0] ?? 0),
      ),
      itemrate: items.map(() => 0), // PHP: rate forced 0 for FOC

      // ── Charges — PHP forces all 0 for FOC (readonly in sumamount) ──
      subtotal: 0,
      discnumber: 0,
      disctype: "%",
      discount: 0,
      freight: 0,
      mobilisation: 0,
      witnessnumber: 0,
      witnesstype: "%",
      witnesscharges: 0,
      samplehandling: 0,
      sampleprep: 0,
      subtotal2: 0,

      // ── Tax (same structure as calibration) ──
      cgstper: isSgst ? Number(cgstper) : 0,
      cgstamount: isSgst ? totals.cgstamount : 0,
      sgstper: isSgst ? Number(sgstper) : 0,
      sgstamount: isSgst ? totals.sgstamount : 0,
      igstper: !isSgst ? Number(igstper) : 0,
      igstamount: !isSgst ? totals.igstamount : 0,

      total: totals.total,
      roundoff: totals.roundoff,
      finaltotal: totals.finaltotal,

      remark,
      brnnos,
    };

    setSaving(true);
    try {
      const r = await axios.post("/accounts/add-calibration-invoice", payload);
      if (r.data?.status === false) {
        toast.error(r.data?.message ?? "Failed to create FOC invoice");
        return;
      }
      toast.success("FOC Testing Invoice created successfully");
      navigate("/dashboards/accounts/calibration-invoice-list");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ?? "Server error. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page title="Add FOC Testing Invoice">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="dark:text-dark-100 text-lg font-semibold text-gray-800">
            Inward Entry Form
          </h1>
          {/* FOC badge */}
          <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            FOC — Free of Cost
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            navigate("/dashboards/accounts/calibration-invoice-list")
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          ← Back to Invoice List
        </button>
      </div>

      <Card className="p-6">
        {/* ══ Top Row: Customer | Bill Type | PO | Inward ══ */}
        <div className="grid grid-cols-4 gap-5">
          {/* Customer */}
          <div>
            <label className={labelCls}>Customer</label>
            {loadingCustomers ? (
              <Spinner text="Loading..." />
            ) : (
              <CustomerSearch
                customers={customers}
                value={customerid}
                onChange={setCustomerid}
              />
            )}
          </div>

          {/* Bill Type — FOC always Normal, readonly display */}
          <div>
            <label className={labelCls}>Bill Type</label>
            <input readOnly value="Normal (FOC)" className={roInputCls} />
          </div>

          {/* PO Number */}
          <div>
            <label className={labelCls}>PO Number</label>
            {loadingPo ? (
              <Spinner text="Loading PO..." />
            ) : (
              <select
                value={selectedPo}
                onChange={(e) => setSelectedPo(e.target.value)}
                disabled={!customerid || ponumbers.length === 0}
                className={selectCls}
              >
                <option value="">
                  {!customerid
                    ? "Select customer first..."
                    : ponumbers.length === 0
                      ? "No PO found"
                      : "Select PO..."}
                </option>
                {ponumbers.map((po) => (
                  <option
                    key={po.id ?? po.ponumber}
                    value={po.ponumber ?? po.id}
                  >
                    {po.display ?? po.ponumber ?? String(po.id)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Inward Entry */}
          <div>
            <label className={labelCls}>Inward Entry</label>
            {loadingInward ? (
              <Spinner text="Loading entries..." />
            ) : (
              <InwardMultiSelect
                options={inwardOptions}
                value={selectedInwards}
                onChange={handleInwardChange}
                disabled={!selectedPo || inwardOptions.length === 0}
              />
            )}
          </div>
        </div>

        {/* ══ Billing Info ══ */}
        {billingInfo && (
          <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-5 border-t border-gray-200 pt-5 md:grid-cols-2">
            {/* Left: customer details */}
            <div className="dark:text-dark-200 space-y-1 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Customer:</span>{" "}
                <span className="font-bold">{billingInfo.name}</span>
              </div>
              {billingInfo.address && (
                <div>
                  <span className="font-semibold">Address:</span>{" "}
                  {billingInfo.address}
                </div>
              )}
              <div className="flex flex-wrap gap-4 pt-1">
                <span>
                  <span className="dark:text-dark-400 text-xs font-semibold text-gray-500">
                    State code:
                  </span>{" "}
                  <strong>{billingInfo.statecode}</strong>
                </span>
                <span>
                  <span className="dark:text-dark-400 text-xs font-semibold text-gray-500">
                    GSTIN/UIN:
                  </span>{" "}
                  <strong>{billingInfo.gstno}</strong>
                </span>
                <span>
                  <span className="dark:text-dark-400 text-xs font-semibold text-gray-500">
                    PAN:
                  </span>{" "}
                  <strong>{billingInfo.pan}</strong>
                </span>
              </div>
              <div className="dark:text-dark-400 pt-1 text-xs text-gray-500">
                Kind Attn.
              </div>
            </div>

            {/* Right: Invoice No / Date / Tax badge */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="dark:text-dark-400 w-32 shrink-0 text-sm font-semibold text-gray-600">
                  Invoice No.:
                </label>
                <span className="rounded bg-purple-100 px-2 py-0.5 text-sm font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  FOC
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="dark:text-dark-400 w-32 shrink-0 text-sm font-semibold text-gray-600">
                  Date:
                </label>
                <input
                  type="date"
                  value={invoicedate}
                  onChange={(e) => setInvoicedate(e.target.value)}
                  className={`${inputCls} max-w-xs`}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="dark:text-dark-400 w-32 shrink-0 text-sm font-semibold text-gray-600">
                  Tax Type:
                </label>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isSgst
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  }`}
                >
                  {isSgst ? "CGST + SGST Applicable" : "IGST Applicable"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══ Items Table ══ */}
        {loadingItems ? (
          <div className="dark:border-dark-600 mt-6 border-t border-gray-200 pt-6">
            <Spinner text="Loading items..." />
          </div>
        ) : (
          items.length > 0 && (
            <div className="dark:border-dark-600 mt-6 border-t border-gray-200 pt-4">
              {/* FOC notice */}
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                FOC Invoice — All rates are set to ₹0 (Free of Cost)
              </div>

              <div className="dark:border-dark-600 overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="dark:bg-dark-800 dark:text-dark-400 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      <th className="w-10 px-4 py-3 text-left">SR NO</th>
                      <th className="px-4 py-3 text-left">DESCRIPTION</th>
                      <th className="w-32 px-4 py-3 text-center">RATE</th>
                      <th className="w-12 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="dark:divide-dark-700 divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr
                        key={item._key}
                        className="dark:bg-dark-900 dark:hover:bg-dark-800 bg-white transition-colors hover:bg-gray-50"
                      >
                        <td className="dark:text-dark-400 px-4 py-3 text-center text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="dark:text-dark-100 font-medium text-gray-800">
                            {item.name}
                          </div>
                          {item.packagedesc && (
                            <div className="dark:text-dark-400 mt-0.5 text-xs text-gray-500">
                              {item.packagedesc}
                            </div>
                          )}
                          {item.location && (
                            <div className="dark:text-dark-400 mt-0.5 text-xs text-gray-400">
                              {item.location}
                            </div>
                          )}
                          {item.brnno && (
                            <div className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                              BRN No: {item.brnno}
                            </div>
                          )}
                          {item.accreditation === "Nabl" && (
                            <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              With Nabl
                            </span>
                          )}
                        </td>
                        {/* Rate — always 0, readonly (FOC) */}
                        <td className="px-4 py-3">
                          <input
                            readOnly
                            value="0"
                            className={`${roInputCls} text-center`}
                            title="FOC — rate is always 0"
                          />
                        </td>
                        {/* Remove */}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item._key, item.brnno)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-500 text-white hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* ══ Charges Section — ALL READONLY (FOC) ══ */}
        <div className="dark:border-dark-600 mt-6 space-y-3 border-t border-gray-200 pt-6">
          <ChargeRowReadonly label="Subtotal" value="0.00" />

          {/* Discount row */}
          <div className="flex items-center gap-2">
            <div className="w-5/12" />
            <label className="dark:text-dark-400 w-3/12 pr-4 text-right text-sm font-medium text-gray-600">
              Discount
            </label>
            <div className="flex w-4/12 items-center gap-2">
              <input
                readOnly
                value="0"
                className={`${roInputCls} w-20 text-center`}
              />
              <input
                readOnly
                value=""
                placeholder="%"
                className={`${roInputCls} flex-1`}
              />
              <input
                readOnly
                value="0.00"
                className={`${roInputCls} w-28 text-right`}
              />
            </div>
          </div>

          <ChargeRowReadonly label="Freight Charges" value="0" />
          <ChargeRowReadonly
            label="Mobilisation and Demobilisation Charges"
            value="0"
          />

          {/* Witness Charges row */}
          <div className="flex items-center gap-2">
            <div className="w-5/12" />
            <label className="dark:text-dark-400 w-3/12 pr-4 text-right text-sm font-medium text-gray-600">
              Witness Charges
            </label>
            <div className="flex w-4/12 items-center gap-2">
              <input
                readOnly
                value="0"
                className={`${roInputCls} w-20 text-center`}
              />
              <input readOnly value="" className={`${roInputCls} flex-1`} />
              <input
                readOnly
                value="0.00"
                className={`${roInputCls} w-28 text-right`}
              />
            </div>
          </div>

          <ChargeRowReadonly label="Sample Handling" value="0" />
          <ChargeRowReadonly label="Sample Preparation Charges" value="0" />
          <ChargeRowReadonly label="Subtotal" value="0.00" />

          {/* Tax rows — readonly percentages */}
          {isSgst ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-5/12" />
                <label className="dark:text-dark-400 w-3/12 pr-4 text-right text-sm font-medium text-gray-600">
                  CGst
                </label>
                <div className="flex w-4/12 items-center gap-2">
                  <input
                    readOnly
                    value={cgstper}
                    className={`${roInputCls} w-16 text-center`}
                  />
                  <span className="text-sm text-gray-500">%</span>
                  <input
                    readOnly
                    value={totals.cgstamount.toFixed(2)}
                    className={`${roInputCls} flex-1 text-right`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5/12" />
                <label className="dark:text-dark-400 w-3/12 pr-4 text-right text-sm font-medium text-gray-600">
                  Sgst
                </label>
                <div className="flex w-4/12 items-center gap-2">
                  <input
                    readOnly
                    value={sgstper}
                    className={`${roInputCls} w-16 text-center`}
                  />
                  <span className="text-sm text-gray-500">%</span>
                  <input
                    readOnly
                    value={totals.sgstamount.toFixed(2)}
                    className={`${roInputCls} flex-1 text-right`}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-3/12 pr-4 text-right text-sm font-medium text-gray-600">
                IGst
              </label>
              <div className="flex w-4/12 items-center gap-2">
                <input
                  readOnly
                  value={igstper}
                  className={`${roInputCls} w-16 text-center`}
                />
                <span className="text-sm text-gray-500">%</span>
                <input
                  readOnly
                  value={totals.igstamount.toFixed(2)}
                  className={`${roInputCls} flex-1 text-right`}
                />
              </div>
            </div>
          )}

          <ChargeRowReadonly label="Total" value={totals.total.toFixed(2)} />
          <ChargeRowReadonly
            label="Round off"
            value={totals.roundoff.toFixed(2)}
          />
          <ChargeRowReadonly
            label="Final Total"
            value={totals.finaltotal.toFixed(2)}
          />
        </div>

        {/* ══ Remark ══ */}
        <div className="mt-6 grid grid-cols-12 items-start gap-3">
          <label className="dark:text-dark-400 col-span-2 pt-2 text-right text-sm font-medium text-gray-600">
            Remark
          </label>
          <div className="col-span-10">
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter remark..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* ══ BRN Nos — readonly (auto-filled from API) ══ */}
        <div className="mt-4 grid grid-cols-12 items-start gap-3">
          <label className="dark:text-dark-400 col-span-2 pt-2 text-right text-sm font-medium text-gray-600">
            BRN Nos.
          </label>
          <div className="col-span-10">
            <textarea
              rows={3}
              readOnly
              value={brnnos}
              placeholder="Auto-filled from inward entries..."
              className={`${roInputCls} resize-none`}
            />
          </div>
        </div>

        {/* ══ Submit ══ */}
        <div className="dark:border-dark-600 mt-6 flex justify-end border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
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
              </>
            ) : (
              "Add Invoice"
            )}
          </button>
        </div>
      </Card>
    </Page>
  );
}
