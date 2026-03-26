import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "components/ui";
import axios from "utils/axios";
import { ConfirmModal } from "components/shared/ConfirmModal";

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this calibration price? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Calibration Price Deleted",
  },
};

export default function CalibrationPriceList() {
  const navigate = useNavigate();
  const { instrumentId } = useParams(); // Get instrumentId from route params
  const [priceData, setPriceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search states
  const [searchFilters, setSearchFilters] = useState({
    id: "",
    packageName: "",
    packageDescription: "",
    accreditation: "",
    location: "",
    daysRequired: "",
    rate: "",
  });

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState(null);

  const fetchPriceData = useCallback(async () => {
    setLoading(true);
    try {
      // Use instrumentId from route params
      const response = await axios.get(`/calibrationoperations/get-calibrationprice-byid/${instrumentId}`);

      if (response.data.status) {
        setPriceData(response.data.data || []);
        setFilteredData(response.data.data || []);
      } else {
        toast.error("Failed to fetch price data");
        setPriceData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching price data:", error);
      toast.error("Error loading price data");
      setPriceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [instrumentId]);

  const filterData = useCallback(() => {
    let filtered = [...priceData];

    Object.keys(searchFilters).forEach((key) => {
      const searchValue = searchFilters[key].toLowerCase().trim();
      if (searchValue) {
        filtered = filtered.filter((item) => {
          let itemValue = "";

          switch (key) {
            case "id":
              itemValue = String(item.id || "");
              break;
            case "packageName":
              itemValue = String(item.packagename || "");
              break;
            case "packageDescription":
              itemValue = String(item.packagedesc || "");
              break;
            case "accreditation":
              itemValue = String(item.accreditation || "");
              break;
            case "location":
              itemValue = String(item.location || "");
              break;
            case "daysRequired":
              itemValue = String(item.daysrequired || "");
              break;
            case "rate":
              itemValue = String(item.rate || "");
              break;
            default:
              itemValue = "";
          }

          return itemValue.toLowerCase().includes(searchValue);
        });
      }
    });

    setFilteredData(filtered);
  }, [priceData, searchFilters]);

  useEffect(() => {
    fetchPriceData();
  }, [fetchPriceData]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const handleSearchChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleViewMatrix = (priceId) => {
    // Navigate to view matrix page using instrumentId from params and priceId from the row
    navigate(`/dashboards/calibration-operations/instrument-list/view-matrix/${instrumentId}/${priceId}`);
  };



  const openDeleteModal = (priceId) => {
    setSelectedPriceId(priceId);
    setDeleteModalOpen(true);
    setDeleteError(false);
    setDeleteSuccess(false);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedPriceId(null);
  };

  const handleDelete = async () => {
    if (!selectedPriceId) return;

    setConfirmDeleteLoading(true);
    try {
      await axios.delete(
        `/calibrationoperations/delete-Calibration-price/${selectedPriceId}`
      );

      setDeleteSuccess(true);
      toast.success("Calibration price deleted successfully ✅", {
        duration: 1000,
        icon: "🗑️",
      });

      // Remove deleted item from state
      setPriceData((prev) => prev.filter((item) => item.id !== selectedPriceId));

      setTimeout(() => {
        closeDeleteModal();
      }, 1000);
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(true);
      toast.error("Failed to delete calibration price ❌", {
        duration: 2000,
      });
    } finally {
      setConfirmDeleteLoading(false);
    }
  };

  const deleteState = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-dark-100">
          Calibration Price List
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-dark-300">
          Manage all calibration prices for Instrument ID: {instrumentId}
        </p>
        <Button
          variant="outlined"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() =>

            navigate(`/dashboards/calibration-operations/instrument-list/view-prices/${instrumentId}`)
          }
        >
          Back to List
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-dark-500 dark:bg-dark-750">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 animate-spin text-blue-600"
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
              <span className="text-gray-600 dark:text-dark-300">
                Loading price data...
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-dark-300">
              Showing {filteredData.length} of {priceData.length} entries
            </div>

            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Package Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Package Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Accreditation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Days Required
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Actions
                  </th>
                </tr>
                {/* Search Row */}
                <tr className="bg-white dark:bg-dark-750">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search ID"
                      value={searchFilters.id}
                      onChange={(e) => handleSearchChange("id", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Package"
                      value={searchFilters.packageName}
                      onChange={(e) => handleSearchChange("packageName", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Package"
                      value={searchFilters.packageDescription}
                      onChange={(e) => handleSearchChange("packageDescription", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Accreditation"
                      value={searchFilters.accreditation}
                      onChange={(e) => handleSearchChange("accreditation", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Location"
                      value={searchFilters.location}
                      onChange={(e) => handleSearchChange("location", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Days Required"
                      value={searchFilters.daysRequired}
                      onChange={(e) => handleSearchChange("daysRequired", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Rate"
                      value={searchFilters.rate}
                      onChange={(e) => handleSearchChange("rate", e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search Actions"
                      disabled
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm opacity-50 focus:border-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                    />
                  </td>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-500 dark:bg-dark-750">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-dark-400"
                    >
                      No price data available
                    </td>
                  </tr>
                ) : (
                  filteredData.map((price, index) => (
                    <tr
                      key={price.id}
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-dark-750"
                          : "bg-gray-50 dark:bg-dark-700/50"
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-dark-100">
                        {price.id}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-100">
                        {price.packagename || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-300">
                        {price.packagedesc || "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${price.accreditation === "Nabl"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {price.accreditation || "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${price.location === "Site"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            }`}
                        >
                          {price.location || "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-dark-100">
                        {price.daysrequired || "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900 dark:text-dark-100">
                        ₹{price.rate || "0"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewMatrix(price.id)}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            View Matrix
                          </button>
                          <button
                            onClick={() => openDeleteModal(price.id)}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeDeleteModal}
        messages={confirmMessages}
        onOk={handleDelete}
        confirmLoading={confirmDeleteLoading}
        state={deleteState}
      />
    </div>
  );
}