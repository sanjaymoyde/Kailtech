import { Button, Input } from 'components/ui';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'utils/axios';
import Select from 'react-select';
import { toast } from 'sonner';

function ViewChecklist() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the ID from URL params (96 in your case)

  const [siteChecklistData, setSiteChecklistData] = useState([]);
  const [generalChecklistData, setGeneralChecklistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generalSearchTerm, setGeneralSearchTerm] = useState('');

  // Column-specific search states for Site Checklist
  const [siteSearchFilters, setSiteSearchFilters] = useState({
    sno: '',
    discipline: '',
    equipment: '',
    generalCheck: '',
    unit: '',
    checkPoint: '',
    acceptanceLimit: '',
    action: ''
  });

  // Column-specific search states for General Checklist
  const [generalSearchFilters, setGeneralSearchFilters] = useState({
    sno: '',
    accessories: '',
    quantity: '',
    condition: '',
    remarks: '',
    action: ''
  });

  const fetchSiteChecklist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/material/get-site-checklist/${id || 96}`);
      setSiteChecklistData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching site checklist:', error);
      setSiteChecklistData([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGeneralChecklist = useCallback(async () => {
    try {
      const response = await axios.get(`/material/get-general-checklist/${id || 96}`);
      setGeneralChecklistData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching general checklist:', error);
      setGeneralChecklistData([]);
    }
  }, [id]);

  // Fetch Site Checklist Data
  useEffect(() => {
    fetchSiteChecklist();
    fetchGeneralChecklist();
  }, [fetchSiteChecklist, fetchGeneralChecklist]);

  const handleDeleteSiteChecklist = (checklistId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Are you sure you want to delete this site checklist item?</p>
        <div className="flex gap-2">
          <Button
            className="h-8 bg-red-500 hover:bg-red-600 text-white text-xs px-3 rounded"
            onClick={async () => {
              toast.dismiss(t);
              try {
                await axios.delete(`/material/delete-site-checklist/${checklistId}`);
                fetchSiteChecklist();
                toast.success('Site checklist item deleted successfully ✅');
              } catch (error) {
                console.error('Error deleting site checklist:', error);
                toast.error('Failed to delete site checklist item ❌');
              }
            }}
          >
            Delete
          </Button>
          <Button
            className="h-8 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs px-3 rounded"
            onClick={() => toast.dismiss(t)}
          >
            Cancel
          </Button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleDeleteGeneralChecklist = (checklistId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Are you sure you want to delete this general checklist item?</p>
        <div className="flex gap-2">
          <Button
            className="h-8 bg-red-500 hover:bg-red-600 text-white text-xs px-3 rounded"
            onClick={async () => {
              toast.dismiss(t);
              try {
                await axios.delete(`/material/delete-general-checklist/${checklistId}`);
                fetchGeneralChecklist();
                toast.success('General checklist item deleted successfully ✅');
              } catch (error) {
                console.error('Error deleting general checklist:', error);
                toast.error('Failed to delete general checklist item ❌');
              }
            }}
          >
            Delete
          </Button>
          <Button
            className="h-8 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs px-3 rounded"
            onClick={() => toast.dismiss(t)}
          >
            Cancel
          </Button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleBackToList = () => {
    navigate(-1);
  };

  const unitOptions = [
    { value: 'hectopascal', label: 'Hectopascal(hPa)' },
    { value: 'pascal', label: 'Pascal(Pa)' },
    { value: 'bar', label: 'Bar' },
    { value: 'psi', label: 'PSI' },
    { value: 'kn', label: 'kN' },
    { value: 'na', label: 'NA' }
  ];

  // Filter data based on column-specific search
  const filteredSiteData = siteChecklistData.filter(item => {
    const matchesGlobalSearch = searchTerm === '' ||
      Object.values(item).some(val =>
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesColumnFilters = (
      (siteSearchFilters.discipline === '' || item.discipline_name?.toLowerCase().includes(siteSearchFilters.discipline.toLowerCase())) &&
      (siteSearchFilters.equipment === '' || item.instrument?.toLowerCase().includes(siteSearchFilters.equipment.toLowerCase())) &&
      (siteSearchFilters.generalCheck === '' || item.generalcheck?.toLowerCase().includes(siteSearchFilters.generalCheck.toLowerCase())) &&
      (siteSearchFilters.unit === '' || item.unit_description?.toLowerCase().includes(siteSearchFilters.unit.toLowerCase())) &&
      (siteSearchFilters.checkPoint === '' || item.checkpoint?.toString().includes(siteSearchFilters.checkPoint)) &&
      (siteSearchFilters.acceptanceLimit === '' || item.acceptancelimit?.toString().includes(siteSearchFilters.acceptanceLimit))
    );

    return matchesGlobalSearch && matchesColumnFilters;
  });

  const filteredGeneralData = generalChecklistData.filter(item => {
    const matchesGlobalSearch = generalSearchTerm === '' ||
      Object.values(item).some(val =>
        val?.toString().toLowerCase().includes(generalSearchTerm.toLowerCase())
      );

    const matchesColumnFilters = (
      (generalSearchFilters.accessories === '' || item.accessoriesname?.toLowerCase().includes(generalSearchFilters.accessories.toLowerCase())) &&
      (generalSearchFilters.quantity === '' || item.quantity?.toString().includes(generalSearchFilters.quantity)) &&
      (generalSearchFilters.condition === '' || item.condition?.toLowerCase().includes(generalSearchFilters.condition.toLowerCase())) &&
      (generalSearchFilters.remarks === '' || item.remark?.toLowerCase().includes(generalSearchFilters.remarks.toLowerCase()))
    );

    return matchesGlobalSearch && matchesColumnFilters;
  });

  return (
    <div className="bg-white">
      {/* Main Content */}
      <div className="p-4">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-700">Site Checklist</h1>
          <div className="flex space-x-2">
            <Button
              className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded"
              onClick={handleBackToList}
            >
              &lt;&lt; Back To Master&apos;s List
            </Button>
            <Button
              className="text-white px-4 py-2 rounded bg-indigo-500 hover:bg-fuchsia-500"
              onClick={() => navigate("/dashboards/material-list/electro-technical/add-new-master-matrix")}
            >
              Add New Master Matrix
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-4">
          <div className="flex items-center justify-end">
            <span className="mr-2">Search:</span>
            <Input
              type="text"
              className="border border-gray-300 px-2 py-1 rounded w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="border border-gray-300 mb-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">S No </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Discipline </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Equipment Use for Verification </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">General Check </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Unit </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Check Point </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Acceptance limit </th>
                <th className="px-3 py-2 text-left text-sm">Action </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-3 py-4 text-center">Loading...</td>
                </tr>
              ) : filteredSiteData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 py-4 text-center">No data available in table</td>
                </tr>
              ) : (
                filteredSiteData.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="px-3 py-2 border-r border-gray-300">{index + 1}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.discipline_name}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.instrument}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.generalcheck}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.unit_description}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.checkpoint}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.acceptancelimit}</td>
                    <td className="px-3 py-2">
                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleDeleteSiteChecklist(item.id)}
                      >
                        delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {/* Column Search Row */}
              <tr className="bg-white border-t-2 border-gray-400">
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search S No"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.sno}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, sno: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Discip"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.discipline}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, discipline: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Equipi"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.equipment}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, equipment: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Gener"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.generalCheck}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, generalCheck: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Select
                    options={unitOptions}
                    placeholder="Hectopascal(hPa)"
                    isClearable
                    className="text-xs"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: '28px',
                        height: '28px',
                        fontSize: '12px',
                        borderColor: '#d1d5db'
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        height: '28px',
                        padding: '0 6px'
                      }),
                      input: (provided) => ({
                        ...provided,
                        margin: '0px',
                      }),
                      indicatorSeparator: () => ({
                        display: 'none',
                      }),
                      indicatorsContainer: (provided) => ({
                        ...provided,
                        height: '28px',
                      }),
                      dropdownIndicator: (provided) => ({
                        ...provided,
                        padding: '0 4px',
                      }),
                    }}
                    onChange={(selected) => setSiteSearchFilters({ ...siteSearchFilters, unit: selected?.label || '' })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Check"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.checkPoint}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, checkPoint: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Accep"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.acceptanceLimit}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, acceptanceLimit: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="text"
                    placeholder="Search Action"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={siteSearchFilters.action}
                    onChange={(e) => setSiteSearchFilters({ ...siteSearchFilters, action: e.target.value })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Show entries and Pagination */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-sm">Show</span>
            <select className="border border-gray-300 px-2 py-1 rounded mr-2 text-sm">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-sm">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">First</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-blue-500 text-white">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">Next</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">Last</button>
          </div>
        </div>

        {/* General Checklist Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">General Checklist</h2>
          <Button
            className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded"
            onClick={() => navigate("/dashboards/material-list/electro-technical/add-new-general-checklist-matrix")}
          >
            Add New General Checklist Matrix
          </Button>
        </div>

        {/* Search Section */}
        <div className="mb-4">
          <div className="flex items-center justify-end">
            <span className="mr-2">Search:</span>
            <Input
              type="text"
              className="border border-gray-300 px-2 py-1 rounded w-48"
              value={generalSearchTerm}
              onChange={(e) => setGeneralSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* General Checklist Table */}
        <div className="border border-gray-300 mb-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">S No </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">General Equipment/Accessories </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Quantity </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">General Condition </th>
                <th className="px-3 py-2 text-left border-r border-gray-300 text-sm">Remarks </th>
                <th className="px-3 py-2 text-left text-sm">Action </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-3 py-4 text-center">Loading...</td>
                </tr>
              ) : filteredGeneralData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-4 text-center">No data available in table</td>
                </tr>
              ) : (
                filteredGeneralData.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="px-3 py-2 border-r border-gray-300">{index + 1}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.accessoriesname}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.quantity}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.condition}</td>
                    <td className="px-3 py-2 border-r border-gray-300">{item.remark}</td>
                    <td className="px-3 py-2">
                      <Button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleDeleteGeneralChecklist(item.id)}
                      >
                        delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {/* Column Search Row */}
              <tr className="bg-white border-t-2 border-gray-400">
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search S No"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={generalSearchFilters.sno}
                    onChange={(e) => setGeneralSearchFilters({ ...generalSearchFilters, sno: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Gener"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={generalSearchFilters.accessories}
                    onChange={(e) => setGeneralSearchFilters({ ...generalSearchFilters, accessories: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Quant"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={generalSearchFilters.quantity}
                    onChange={(e) => setGeneralSearchFilters({ ...generalSearchFilters, quantity: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Gener"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={generalSearchFilters.condition}
                    onChange={(e) => setGeneralSearchFilters({ ...generalSearchFilters, condition: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 border-r border-gray-300">
                  <Input
                    type="text"
                    placeholder="Search Remar"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={generalSearchFilters.remarks}
                    onChange={(e) => setGeneralSearchFilters({ ...generalSearchFilters, remarks: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="text"
                    placeholder="Search Action"
                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                    value={generalSearchFilters.action}
                    onChange={(e) => setGeneralSearchFilters({ ...generalSearchFilters, action: e.target.value })}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Show entries and Pagination */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-sm">Show</span>
            <select className="border border-gray-300 px-2 py-1 rounded mr-2 text-sm">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-sm">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">First</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-blue-500 text-white">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">Next</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 hover:bg-gray-100">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewChecklist;