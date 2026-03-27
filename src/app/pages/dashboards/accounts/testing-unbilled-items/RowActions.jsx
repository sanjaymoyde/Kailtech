// rowActions.js — Unbilled Testing Items
// PHP: No explicit action button existed
// React: Added "View TRF" button to navigate to the TRF detail page

import { useNavigate } from "react-router";

/**
 * useUnbilledRowActions
 * @returns {Function} getActions(row) → array of action objects
 */
export function useUnbilledRowActions() {
  const navigate = useNavigate();

  const getActions = (row) => [
    {
      label: "View TRF",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      onClick: () => navigate(`/dashboards/lab/trf/${row.trf}`),
      className:
        "inline-flex items-center gap-1.5 rounded bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600 transition-colors",
    },
  ];

  return getActions;
}
