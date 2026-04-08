// Import Dependencies
import dayjs from "dayjs";
import PropTypes from "prop-types";
import { Highlight } from "components/shared/Highlight";
import { useLocaleContext } from "app/contexts/locale/context";
import { ensureString } from "utils/ensureString";

// ----------------------------------------------------------------------

export function DateCell({ getValue }) {
  const { locale } = useLocaleContext();
  const timestamp = getValue();
  const date = dayjs(timestamp).locale(locale).format("DD MMM YYYY");
  const time = dayjs(timestamp).locale(locale).format("hh:mm A");
  return (
    <>
      <p className="font-medium">{date}</p>
      <p className="mt-0.5 text-xs text-gray-400 dark:text-dark-300">{time}</p>
    </>
  );
}

export function HighlightingCell({ getValue, column, table }) {
  const globalQuery = ensureString(table.getState().globalFilter);
  const columnQuery = ensureString(column.getFilterValue());
  const val = getValue();

  return (
    <span className="font-medium text-gray-800 dark:text-dark-100">
      <Highlight query={[globalQuery, columnQuery]}>{val}</Highlight>
    </span>
  );
}

export function StatusCell({ getValue }) {
    const val = getValue();
    const color = val === "Pending" ? "warning" : val === "Resolved" ? "success" : "info";
    
    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold bg-${color}-100 text-${color}-800 dark:bg-${color}-900/40 dark:text-${color}-100`}>
            {val}
        </span>
    );
}

DateCell.propTypes = {
  getValue: PropTypes.func,
};

HighlightingCell.propTypes = {
  getValue: PropTypes.func,
  column: PropTypes.object,
  table: PropTypes.object,
};

StatusCell.propTypes = {
    getValue: PropTypes.func
};
