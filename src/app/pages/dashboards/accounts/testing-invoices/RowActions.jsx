import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { Button } from "components/ui";

export function RowActions({ row }) {
  const navigate = useNavigate();
  const { id } = row.original;

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        color="primary"
        className="h-7 rounded px-3 text-xs"
        onClick={() => navigate(`/dashboards/accounts/testing-invoices/view/${id}`)}
      >
        View
      </Button>
      <Button
        size="sm"
        color="warning"
        className="h-7 rounded px-3 text-xs"
        onClick={() => navigate(`/dashboards/accounts/testing-invoices/edit/${id}`)}
      >
        Edit
      </Button>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
