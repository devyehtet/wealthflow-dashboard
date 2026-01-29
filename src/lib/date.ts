// src/lib/date.ts
// Month utilities for WealthFlow (YYYY-MM handling)

export function ymNow(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseYM(ym: string): { y: number; m: number } {
  const [yRaw, mRaw] = (ym || "").split("-");
  const y = Number(yRaw);
  const m = Number(mRaw);

  if (!y || !m || m < 1 || m > 12) {
    const now = ymNow();
    const [yy, mm] = now.split("-");
    return { y: Number(yy), m: Number(mm) };
  }
  return { y, m };
}

export function startOfMonthYM(ym: string): Date {
  const { y, m } = parseYM(ym);
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
}

export function endOfMonthYM(ym: string): Date {
  const { y, m } = parseYM(ym);
  return new Date(y, m, 0, 23, 59, 59, 999);
}

export function monthRange(ym: string): { from: Date; to: Date } {
  return { from: startOfMonthYM(ym), to: endOfMonthYM(ym) };
}

export function addMonthsYM(ym: string, delta: number): string {
  const { y, m } = parseYM(ym);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

// compatibility (some files import addMonths)
export function addMonths(ym: string, delta: number): string {
  return addMonthsYM(ym, delta);
}

// "January 2026"
export function prettyMonth(ym: string): string {
  const { y, m } = parseYM(ym);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// what MonthBar expects
export function formatMonthLabel(ym: string): string {
  return prettyMonth(ym);
}
