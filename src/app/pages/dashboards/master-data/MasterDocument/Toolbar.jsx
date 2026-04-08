import { Button, Input, Select } from "components/ui";
import { HiRefresh, HiPlus } from "react-icons/hi";
import { BiSearch } from "react-icons/bi";
import { useNavigate } from "react-router";

export function Toolbar({ table }) {
  const navigate = useNavigate();

  const {
    docType,
    setDocType,
    searchField,
    setSearchField,
    searchValue,
    setSearchValue,
    handleSearch,
    handleResetFilters,
    fetchDocuments,
  } = table.options.meta;

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddDocument = () => {
    navigate("/dashboards/master-data/document-master/add");
  };

  return (
    <div className="px-(--margin-x) space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            View Master Document
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and view all master documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            color="primary"
            onClick={handleAddDocument}
            className="flex items-center gap-2"
          >
            <HiPlus className="h-4 w-4" />
            Add Master Document
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDocuments}
            className="flex items-center gap-2"
          >
            <HiRefresh className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          {/* Doc Type Filter */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Doc in:
            </label>
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full"
            >
              <option value="active">Active</option>
              <option value="obsolete">Obsolete</option>
              <option value="pending">Pending</option>
              <option value="saved">Saved</option>
            </Select>
          </div>

          {/* Search Field Type */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search in:
            </label>
            <Select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="w-full"
            >
              <option value="All">All</option>
              <option value="name">Name</option>
              <option value="Code">Document No./Procedure No</option>
            </Select>
          </div>

          {/* Search Value */}
          <div className="md:col-span-5">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Value:
            </label>
            <Input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter search value..."
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex gap-2">
            <Button
              onClick={handleSearch}
              className="flex-1 flex items-center justify-center gap-2"
              color="primary"
            >
              <BiSearch className="h-4 w-4" />
              Go
            </Button>
            <Button
              onClick={handleResetFilters}
              variant="outlined"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Current Filter:</span>
          <span className="rounded bg-primary-100 px-2 py-1 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {docType.charAt(0).toUpperCase() + docType.slice(1)}
          </span>
          {searchValue && (
            <>
              <span>|</span>
              <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {searchField === "All"
                  ? "All Fields"
                  : searchField === "Code"
                    ? "Document No."
                    : searchField}{" "}
                = {searchValue}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getCoreRowModel().rows.length} documents
        </span>
      </div>
    </div>
  );
}