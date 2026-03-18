import { useState } from "react";
import axios from "utils/axios";

const SalesReport = () => {
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    ctype: "",
    customerid: "",
    bd: "",
    specificpurpose: "",
  });

  const [data, setData] = useState([]);

  const fetchReport = async () => {
    try {
      const res = await axios.get("/sales-report", {
        params: filters,
      });
      const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setData(rows);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const totalAmount = data.reduce(
    (sum, row) => sum + Number(row.subtotal || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sales Report</h2>
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border px-4 py-2 hover:bg-gray-100"
          >
             Back
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          <input
            type="date"
            name="startdate"
            value={filters.startdate}
            onChange={handleChange}
            className="rounded-lg border p-2"
          />

          <input
            type="date"
            name="enddate"
            value={filters.enddate}
            onChange={handleChange}
            className="rounded-lg border p-2"
          />

          <input
            type="text"
            name="ctype"
            placeholder="Customer Type"
            value={filters.ctype}
            onChange={handleChange}
            className="rounded-lg border p-2"
          />

          <input
            type="text"
            name="customerid"
            placeholder="Customer ID"
            value={filters.customerid}
            onChange={handleChange}
            className="rounded-lg border p-2"
          />

          <input
            type="text"
            name="bd"
            placeholder="BD"
            value={filters.bd}
            onChange={handleChange}
            className="rounded-lg border p-2"
          />

          <input
            type="text"
            name="specificpurpose"
            placeholder="Specific Purpose"
            value={filters.specificpurpose}
            onChange={handleChange}
            className="rounded-lg border p-2"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full overflow-hidden rounded-lg border border-gray-200">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-3 text-left">Sr No</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Verticle</th>
                <th className="p-3 text-left">Specific Purpose</th>
                <th className="p-3 text-left">TRF/CRF</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">BD</th>
                <th className="p-3 text-left">Item Total</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {data.map((row, index) => (
                <tr key={index} className="border-t transition hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{row.customername}</td>
                  <td className="p-3">{row.department}</td>
                  <td className="p-3">{row.spname}</td>
                  <td className="p-3">{row.id}</td>
                  <td className="p-3">
                    {row.date
                      ? new Date(row.date).toLocaleDateString("en-GB")
                      : ""}
                  </td>
                  <td className="p-3">{row.name}</td>
                  <td className="p-3 font-medium">{row.subtotal}</td>
                </tr>
              ))}

              <tr className="bg-gray-100 font-semibold">
                <td colSpan="7" className="p-3 text-right">
                  Total Amount
                </td>
                <td className="p-3">{totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
