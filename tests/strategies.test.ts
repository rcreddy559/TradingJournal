import { describe, expect, it } from "vitest";
import {
  buildDuplicateStrategyName,
  buildStrategyRows,
  countUnassignedTrades,
  filterStrategyRows,
  isDuplicateStrategyName,
  selectMissingStarters,
  sortStrategyRows,
  summarizeStrategyRows,
} from "../src/features/journal/lib/strategies";
import { journalReducer } from "../src/features/journal/store/journalReducer";
import { JournalState } from "../src/features/journal/store/journalTypes";
import { Strategy, Trade } from "../src/features/journal/types/trade";

const strategy = (
  id: string,
  overrides: Partial<Strategy> = {},
): Strategy => ({
  id,
  name: id,
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const trade = (id: string, overrides: Partial<Trade> = {}): Trade => ({
  id,
  tradeDate: "2024-03-01",
  instrument: "NIFTY",
  segment: "OPTIONS",
  entryTime: "09:30",
  exitTime: "10:00",
  buyPrice: 100,
  sellPrice: 110,
  quantity: 50,
  charges: 0,
  netPnl: 500,
  strategyId: "s1",
  status: "SUCCESSFUL",
  createdAt: "2024-03-01T04:00:00.000Z",
  updatedAt: "2024-03-01T04:00:00.000Z",
  ...overrides,
});

const strategies: Strategy[] = [
  strategy("s1", { name: "Breakout", timeframe: "INTRADAY", rules: "Trade the opening range" }),
  strategy("s2", { name: "Mean Reversion", timeframe: "SCALPING", rules: "Fade extremes" }),
  strategy("s3", { name: "Swing Hold" }),
];

const trades: Trade[] = [
  trade("t1", { strategyId: "s1", netPnl: 1000 }),
  trade("t2", { strategyId: "s1", netPnl: -400 }),
  trade("t3", { strategyId: "s2", netPnl: -600 }),
  trade("t4", { strategyId: "" }),
  trade("t5", { strategyId: "deleted-strategy" }),
];

describe("isDuplicateStrategyName", () => {
  it("matches ignoring case and surrounding spaces", () => {
    expect(isDuplicateStrategyName(strategies, "  breakout ")).toBe(true);
  });

  it("ignores the strategy currently being edited", () => {
    expect(isDuplicateStrategyName(strategies, "Breakout", "s1")).toBe(false);
  });

  it("treats blank input as not duplicated", () => {
    expect(isDuplicateStrategyName(strategies, "   ")).toBe(false);
  });
});

describe("buildDuplicateStrategyName", () => {
  it("appends (copy) and keeps counting until the name is free", () => {
    expect(buildDuplicateStrategyName(strategies, "Breakout")).toBe(
      "Breakout (copy)",
    );

    const withCopy = [...strategies, strategy("s4", { name: "Breakout (copy)" })];
    expect(buildDuplicateStrategyName(withCopy, "Breakout")).toBe(
      "Breakout (copy 2)",
    );
  });
});

describe("selectMissingStarters", () => {
  it("skips starters that already exist, case-insensitively", () => {
    const missing = selectMissingStarters(strategies, [
      { name: "breakout" },
      { name: "Iron Condor" },
    ]);
    expect(missing.map((item) => item.name)).toEqual(["Iron Condor"]);
  });

  it("does not return the same starter twice", () => {
    const missing = selectMissingStarters([], [
      { name: "Iron Condor" },
      { name: "iron condor" },
    ]);
    expect(missing).toHaveLength(1);
  });
});

describe("buildStrategyRows", () => {
  it("joins each strategy with its all-time stats", () => {
    const rows = buildStrategyRows(strategies, trades);
    const breakout = rows.find((row) => row.id === "s1");

    expect(rows).toHaveLength(3);
    expect(breakout?.trades).toBe(2);
    expect(breakout?.netPnl).toBe(600);
    expect(breakout?.winRate).toBe(50);
  });

  it("returns zeroed stats for strategies without trades", () => {
    const rows = buildStrategyRows(strategies, trades);
    const unused = rows.find((row) => row.id === "s3");

    expect(unused?.trades).toBe(0);
    expect(unused?.netPnl).toBe(0);
    expect(unused?.avgRMultiple).toBeNull();
  });
});

describe("filterStrategyRows", () => {
  const rows = buildStrategyRows(strategies, trades);
  const base = { query: "", timeframe: "ALL", usage: "ALL" } as const;

  it("searches names and rules", () => {
    expect(
      filterStrategyRows(rows, { ...base, query: "opening range" }).map(
        (row) => row.id,
      ),
    ).toEqual(["s1"]);
    expect(
      filterStrategyRows(rows, { ...base, query: "swing" }).map((row) => row.id),
    ).toEqual(["s3"]);
  });

  it("filters by timeframe including the unset bucket", () => {
    expect(
      filterStrategyRows(rows, { ...base, timeframe: "SCALPING" }).map(
        (row) => row.id,
      ),
    ).toEqual(["s2"]);
    expect(
      filterStrategyRows(rows, { ...base, timeframe: "UNSET" }).map(
        (row) => row.id,
      ),
    ).toEqual(["s3"]);
  });

  it("filters by usage", () => {
    expect(
      filterStrategyRows(rows, { ...base, usage: "UNUSED" }).map(
        (row) => row.id,
      ),
    ).toEqual(["s3"]);
    expect(
      filterStrategyRows(rows, { ...base, usage: "USED" }).map((row) => row.id),
    ).toEqual(["s1", "s2"]);
  });
});

describe("sortStrategyRows", () => {
  const rows = buildStrategyRows(strategies, trades);

  it("sorts by name ascending", () => {
    expect(sortStrategyRows(rows, "NAME", "ASC").map((row) => row.name)).toEqual(
      ["Breakout", "Mean Reversion", "Swing Hold"],
    );
  });

  it("sorts by net P&L descending", () => {
    expect(
      sortStrategyRows(rows, "NET_PNL", "DESC").map((row) => row.id),
    ).toEqual(["s1", "s3", "s2"]);
  });

  it("does not mutate the input array", () => {
    const original = [...rows];
    sortStrategyRows(rows, "TRADES", "DESC");
    expect(rows).toEqual(original);
  });
});

describe("summarizeStrategyRows", () => {
  it("counts usage and picks best/worst traded strategies", () => {
    const summary = summarizeStrategyRows(buildStrategyRows(strategies, trades));

    expect(summary.total).toBe(3);
    expect(summary.used).toBe(2);
    expect(summary.unused).toBe(1);
    expect(summary.assignedTrades).toBe(3);
    expect(summary.best?.id).toBe("s1");
    expect(summary.worst?.id).toBe("s2");
  });

  it("has no worst strategy when only one has trades", () => {
    const summary = summarizeStrategyRows(
      buildStrategyRows(strategies, [trade("t1", { strategyId: "s1" })]),
    );
    expect(summary.best?.id).toBe("s1");
    expect(summary.worst).toBeNull();
  });
});

describe("countUnassignedTrades", () => {
  it("counts blank and dangling strategy references", () => {
    expect(countUnassignedTrades(trades, strategies)).toBe(2);
  });
});

describe("journalReducer ADD_STRATEGIES", () => {
  it("prepends every strategy in a single action", () => {
    const state = { strategies: [strategy("existing")] } as JournalState;
    const next = journalReducer(state, {
      type: "ADD_STRATEGIES",
      payload: [strategy("a"), strategy("b")],
    });

    expect(next.strategies.map((item) => item.id)).toEqual([
      "a",
      "b",
      "existing",
    ]);
  });
});
