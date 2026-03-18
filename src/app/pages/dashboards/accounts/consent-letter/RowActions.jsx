// Import Dependencies
import PropTypes from "prop-types";
import { useNavigate } from "react-router";



// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const navigate = useNavigate();
  const handleView = () => {
    const id = row.original.id;
    navigate(`/dashboards/accounts/consent-letter/view/${id}`);
  };

  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={handleView}
          className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          View
        </button>
      </div>
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
