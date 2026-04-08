export function parseUserPermissions(raw) {
  if (!raw) return [];

  const normalizeCsv = (value) =>
    String(value)
      .replace(/^"+|"+$/g, "")
      .split(",")
      .map((item) => Number(String(item).trim()))
      .filter((item) => Number.isFinite(item));

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));
    }
    if (typeof parsed === "string") {
      return normalizeCsv(parsed);
    }
  } catch {
    return normalizeCsv(raw);
  }

  return normalizeCsv(raw);
}
