export function ymNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(ym?: string) {
  const safe = ym && /^\d{4}-\d{2}$/.test(ym) ? ym : ymNow();
  const [y, m] = safe.split("-").map(Number);

  // start = 1st day 00:00:00
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  // end = next month 1st day 00:00:00 (exclusive)
  const end = new Date(y, m, 1, 0, 0, 0, 0);

  return { ym: safe, start, end };
}

export function addMonths(ym: string, diff: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function prettyMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
