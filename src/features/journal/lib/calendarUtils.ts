import { DailyPnl } from "./calculations";

/** O(1) lookup of a day's data by YYYY-MM-DD key. */
export const buildDayMap = (daily: DailyPnl[]): Map<string, DailyPnl> => {
  const map = new Map<string, DailyPnl>();
  for (const d of daily) map.set(d.date, d);
  return map;
};

/**
 * Returns a CSS class encoding the P&L intensity for a single day cell.
 *
 * Intensity buckets (ratio = |pnl| / maxAbsPnl):
 *   0.00–0.25 → shade 1  (lightest)
 *   0.25–0.50 → shade 2
 *   0.50–0.75 → shade 3
 *   0.75–1.00 → shade 4  (darkest)
 */
export const computeDayColorClass = (
  pnl: number,
  maxAbsPnl: number,
  hasUnrealised: boolean,
): string => {
  if (hasUnrealised) return "unrealised";
  if (pnl === 0 || maxAbsPnl === 0) return "";
  const ratio = Math.abs(pnl) / maxAbsPnl;
  const shade = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
  return pnl > 0 ? `profit-${shade}` : `loss-${shade}`;
};

/**
 * Builds a flat array of day-numbers (1-based) padded with `null` for empty
 * cells before the 1st and after the last day.  Length is always 35 or 42
 * (5 or 6 full weeks).  Week starts on Sunday (index 0).
 *
 * @param year  Full 4-digit year
 * @param month 0-indexed month (0 = January)
 */
export const buildMonthGrid = (year: number, month: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const grid: (number | null)[] = [];
  for (let i = 0; i < total; i++) {
    const dayNum = i - firstDay + 1;
    grid.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }
  return grid;
};
