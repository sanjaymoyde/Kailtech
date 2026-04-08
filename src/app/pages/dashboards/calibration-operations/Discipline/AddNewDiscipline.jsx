import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'utils/axios';
import { toast } from 'sonner';

export default function AddDiscipline() {
  const navigate = useNavigate();
  const [disciplineName, setDisciplineName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!disciplineName.trim()) {
      toast.error('Discipline name is required');
      return;
    }

    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/calibrationoperations/add-disciplines', {
        name: disciplineName,
        description: description,
      });

      if (response.data.status) {
        toast.success('Discipline added successfully!');
        // Reset form
        setDisciplineName('');
        setDescription('');
        // Navigate back to discipline list
        setTimeout(() => {
          navigate('/dashboards/calibration-operations/discipline');
        }, 1000);
      } else {
        toast.error(response.data.message || 'Failed to add discipline');
      }
    } catch (error) {
      console.error('Error adding discipline:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to add discipline. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-normal text-gray-800">Add discipline</h1>
          <button 
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded transition-colors"
            onClick={() => navigate("/dashboards/calibration-operations/discipline")}
            disabled={loading}
          >
            &lt;&lt; Back to Discipline
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Discipline Name Field */}
            <div className="mb-6">
              <div className="flex items-start">
                <label className="w-48 pt-2 text-gray-700 font-medium">
                  Discipline Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={disciplineName}
                  onChange={(e) => setDisciplineName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter discipline name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description Field */}
            <div className="mb-8">
              <div className="flex items-start">
                <label className="w-48 pt-2 text-gray-700 font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter description"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Add Method Button */}
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => navigate("/dashboards/calibration-operations/discipline")}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2.5 rounded font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded font-medium transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                  </svg>
                )}
                {loading ? 'Adding...' : 'Add Discipline'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}