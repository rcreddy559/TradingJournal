import { describe, expect, it } from "vitest";
import {
  buildDayMap,
  buildMonthGrid,
  computeDayColorClass,
} from "../src/features/journal/lib/calendarUtils";
import { DailyPnl } from "../src/features/journal/lib/calculations";

const daily: DailyPnl[] = [
  { date: "2024-03-05", pnl: 1200, trades: 2 },
  { date: "2024-03-12", pnl: -800, trades: 3 },
  { date: "2024-03-20", pnl: 5000, trades: 1 },
  { date: "2024-03-28", pnl: -5000, trades: 4 },
];

describe("buildDayMap", () => {
  it("indexes daily data by date string", () => {
    const map = buildDayMap(daily);
    expect(map.get("2024-03-05")).toEqual({ date: "2024-03-05", pnl: 1200, trades: 2 });
    expect(map.get("2024-03-99")).toBeUndefined();
  });

  it("returns empty map for empty input", () => {
    expect(buildDayMap([]).size).toBe(0);
  });
});

describe("computeDayColorClass", () => {
  it("returns profit-1 for the smallest profit", () => {
    expect(computeDayColorClass(1200, 5000, false)).toBe("profit-1");
  });

  it("returns profit-4 for the max profit", () => {
    expect(computeDayColorClass(5000, 5000, false)).toBe("profit-4");
  });

  it("returns loss-1 for small loss", () => {
    expect(computeDayColorClass(-800, 5000, false)).toBe("loss-1");
  });

  it("returns loss-4 for max loss", () => {
    expect(computeDayColorClass(-5000, 5000, false)).toBe("loss-4");
  });

  it("returns unrealised when flag is set", () => {
    expect(computeDayColorClass(0, 5000, true)).toBe("unrealised");
  });

  it("returns empty string when pnl is 0 and not unrealised", () => {
    expect(computeDayColorClass(0, 5000, false)).toBe("");
  });
});

describe("buildMonthGrid", () => {
  it("returns 35 or 42 cells (5 or 6 weeks) for any month", () => {
    const grid = buildMonthGrid(2024, 2); // March 2024 (month is 0-indexed)
    expect([35, 42]).toContain(grid.length);
  });

  it("first day of March 2024 is on correct weekday (Friday = index 5)", () => {
    const grid = buildMonthGrid(2024, 2);
    // March 1 2024 is a Friday — first 5 cells should be null
    expect(grid[5]).toBe(1);
    for (let i = 0; i < 5; i++) expect(grid[i]).toBeNull();
  });

  it("last cell for March has value 31", () => {
    const grid = buildMonthGrid(2024, 2);
    const lastDay = [...grid].reverse().find((v) => v !== null);
    expect(lastDay).toBe(31);
  });
});
