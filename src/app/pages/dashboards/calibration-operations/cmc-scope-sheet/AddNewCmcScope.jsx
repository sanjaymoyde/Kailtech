import { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import { Button, Input } from "components/ui";
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = "https://lims.kailtech.in/api";

const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    "your-auth-token-here"
  );
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please check your token.");
    }
    throw error;
  }
);

const CMCScopeForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parameter: "Pressure",
    mode: "Measure",
    minFrequency: "",
    maxFrequency: "",
    unit: "Hectopascal(hPa)",
    leastcount: "",
    minCmc: "",
    maxCmc: "",
    cmcType: "Absolute",
    cmcUnit: "KJ/ m²",
    masters: [], // Array to store selected masters
    location: "Site",
    remark: "",
  });

  const [sourceOptions, setSourceOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [instrumentOptions, setInstrumentOptions] = useState([]);
  const [masterOptions, setMasterOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMasterOptions = async () => {
      try {
        const response = await apiClient.get('/material/get-master-list');
        if (response.data.status === "true" && response.data.data) {
          setMasterOptions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching master options:', err);
        setError('Failed to load master options: ' + (err.message || 'Unknown error'));
      }
    };

    const fetchInstrumentOptions = async () => {
      try {
        const response = await apiClient.get('/get-instrumentNames');
        if (response.data.status === "true" && response.data.data) {
          setInstrumentOptions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching instrument options:', err);
        setError('Failed to load instrument options: ' + (err.message || 'Unknown error'));
      }
    };

    const fetchSourceOptions = async () => {
      try {
        const response = await apiClient.get('/get-source');
        if (response.data.status === "true" && response.data.data) {
          setSourceOptions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching source options:', err);
        setError('Failed to load source options: ' + (err.message || 'Unknown error'));
      }
    };

    const fetchUnitOptions = async () => {
      try {
        const response = await apiClient.get('/master/units-list');
        if (response.data.status === "true" && response.data.data) {
          setUnitOptions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching unit options:', err);
        setError('Failed to load unit options: ' + (err.message || 'Unknown error'));
      }
    };

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchInstrumentOptions(),
          fetchSourceOptions(),
          fetchUnitOptions(),
          fetchMasterOptions()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle master selection and removal
  const handleMasterChange = (e) => {
    const selectedMaster = masterOptions.find(m => m.name === e.target.value);
    if (selectedMaster && !formData.masters.some(m => m.id === selectedMaster.id)) {
      setFormData(prev => ({
        ...prev,
        masters: [...prev.masters, selectedMaster]
      }));
      e.target.value = ''; // Reset input after selection
    }
  };

  const removeMaster = (masterId) => {
    setFormData(prev => ({
      ...prev,
      masters: prev.masters.filter(m => m.id !== masterId)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.parameter || !formData.mode) {
      toast.error('Please fill in required fields: Parameter and Mode');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        parameter: Array.isArray(formData.parameter)
          ? formData.parameter
          : formData.parameter.split(',').map(p => p.trim()),
        mode: formData.mode,
        minfrequency: parseInt(formData.minFrequency) || 0,
        maxfrequency: parseInt(formData.maxFrequency) || 0,
        unit: parseInt(formData.unit) || 0,
        leastcount: parseFloat(formData.leastcount) || 0,
        mincmc: parseFloat(formData.minCmc) || 0,
        maxcmc: parseFloat(formData.maxCmc) || 0,
        cmctype: formData.cmcType || "",
        cmcunit: parseInt(formData.cmcUnit) || 0,
        masters: formData.masters.map(m => m.id) || [],
        location: formData.location || "",
        remark: formData.remark || ""
      };

      console.log("Submitting payload:", payload);

      const response = await apiClient.post(
        "/calibrationoperations/add-cmc-scopesheet",
        payload
      );

      if (response.data.status === true || response.data.status === "true") {
        toast.success("CMC Scope has been added successfully to your Catalogue!");
        navigate("/dashboards/calibration-operations/cmc-scope-sheet");
      } else {
        throw new Error(response.data.message || "Failed to add CMC Scope");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      const errorMessage = err.response?.data?.message || err.message || "Unknown error occurred";
      toast.error("Error submitting form: " + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading Add New Cmc Sheet Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-800">Add CMC Scope</h1>
          </div>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            onClick={() => navigate("/dashboards/calibration-operations/cmc-scope-sheet")}
          >
            ← Back to CMC Scope List
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Quantity Measured/ Instrument *</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.parameter}
                    onChange={(e) => handleInputChange('parameter', e.target.value)}
                  >
                    {instrumentOptions.map((instrument, index) => (
                      <option key={`api-${index}`} value={instrument.name}>
                        {instrument.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Source *</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.mode}
                    onChange={(e) => handleInputChange('mode', e.target.value)}
                  >
                    {sourceOptions.map((source, index) => (
                      <option key={index} value={source.name}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Min Frequency / Range</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="e.g., 1, 50, 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.minFrequency}
                    onChange={(e) => handleInputChange('minFrequency', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Max Frequency / Range</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="e.g., 10000, 5000, 40"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.maxFrequency}
                    onChange={(e) => handleInputChange('maxFrequency', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Unit</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">UUC Leastcount</label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.01, 0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.leastcount}
                    onChange={(e) => handleInputChange('leastcount', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">
                  Min Calibration Measurement<br />Capability (%)
                </label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.05, 0.66, 0.4"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.minCmc}
                    onChange={(e) => handleInputChange('minCmc', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">
                  Max Calibration Measurement<br />Capability (%)
                </label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.10, 0.37, 13.2"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.maxCmc}
                    onChange={(e) => handleInputChange('maxCmc', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">CMC Type</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.cmcType}
                    onChange={(e) => handleInputChange('cmcType', e.target.value)}
                  >
                    <option value="Absolute">Absolute</option>
                    <option value="Percentage">%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">CMC Unit</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.cmcUnit}
                    onChange={(e) => handleInputChange('cmcUnit', e.target.value)}
                  >
                    {unitOptions.map((unit) => (
                      unit.description && (
                        <option key={`desc-${unit.id}`} value={unit.id}>
                          {unit.description}
                        </option>
                      )
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Master</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={handleMasterChange}
                  >
                    <option value="">Select Master</option>
                    {masterOptions.map((master) => (
                      <option key={master.id} value={master.name}>
                        {master.name} {master.idno && `(${master.idno})`}
                      </option>
                    ))}
                  </select>
                  {formData.masters.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.masters.map((master) => (
                        <span
                          key={master.id}
                          className="bg-yellow-200 text-green-800 px-2 py-1 rounded flex items-center"
                        >
                          {master.name} {master.idno && `(${master.idno})`}
                          <button
                            type="button"
                            onClick={() => removeMaster(master.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-right text-gray-700 font-medium">Location</label>
                <div className="col-span-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  >
                    <option value="Site">Site</option>
                    <option value="Lab">Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-start">
                <label className="text-right text-gray-700 font-medium pt-2">Remark</label>
                <div className="col-span-3">
                  <textarea
                    placeholder="Enter any remarks or comments"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    value={formData.remark}
                    onChange={(e) => handleInputChange('remark', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-gray-50 px-6 py-4 flex justify-end rounded-b-lg">
            <Button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={submitting || !formData.parameter || !formData.mode}
            >
              {submitting ? 'Adding Scope...' : 'Add Scope'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center">
          <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default CMCScopeForm;




