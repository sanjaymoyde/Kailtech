import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { Button } from "components/ui";

export function RowActions({ row }) {
  const navigate = useNavigate();
  const { id, invoiceid } = row.original;

  return (
    <Button
      size="sm"
      color="success"
      className="h-8 rounded px-3 text-xs"
      onClick={() => navigate(`/dashboards/accounts/canceled-invoices/view/${invoiceid ?? id}`)}
    >
      View Invoice
    </Button>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
