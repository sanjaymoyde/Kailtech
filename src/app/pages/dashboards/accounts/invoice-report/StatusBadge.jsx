// Status Badge — mirrors PHP badge styles
// status 99 = Canceled (red), 0 = Pending (yellow), else = Active (green)
export function StatusBadge({ status }) {
  const s = String(status);
  if (s === "99") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Canceled
      </span>
    );
  }
  if (s === "0") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </span>
  );
}
