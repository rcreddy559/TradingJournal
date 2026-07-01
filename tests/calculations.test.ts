import { describe, expect, it } from "vitest";
import {
  buildEquityCurve,
  calculateDashboardMetrics,
  calculateRMultiple,
  calculateStrategyStats,
  deriveNetPnl,
} from "../src/features/journal/lib/calculations";
import { Strategy, Trade } from "../src/features/journal/types/trade";

const makeTrade = (overrides: Partial<Trade>): Trade => ({
  id: Math.random().toString(36).slice(2),
  tradeDate: "2024-01-01",
  instrument: "BANKNIFTY",
  segment: "OPTIONS",
  entryTime: "2024-01-01T09:20:00.000Z",
  exitTime: "2024-01-01T09:40:00.000Z",
  buyPrice: 100,
  sellPrice: 120,
  quantity: 15,
  charges: 0,
  netPnl: 300,
  strategyId: "s1",
  status: "SUCCESSFUL",
  createdAt: "2024-01-01T09:20:00.000Z",
  updatedAt: "2024-01-01T09:40:00.000Z",
  ...overrides,
});

const strategies: Strategy[] = [
  { id: "s1", name: "Alpha", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "s2", name: "Beta", createdAt: "2024-01-01T00:00:00.000Z" },
];

describe("deriveNetPnl", () => {
  it("recomputes P&L from prices, quantity, and charges", () => {
    const trade = makeTrade({
      buyPrice: 100,
      sellPrice: 110,
      quantity: 10,
      charges: 20,
      netPnl: 999,
    });
    expect(deriveNetPnl(trade)).toBe(80);
  });
});

describe("calculateRMultiple", () => {
  it("returns reward divided by planned risk", () => {
    const trade = makeTrade({ buyPrice: 100, sellPrice: 130, stopLoss: 90 });
    expect(calculateRMultiple(trade)).toBeCloseTo(3);
  });

  it("returns null without a valid stop", () => {
    expect(calculateRMultiple(makeTrade({ stopLoss: undefined }))).toBeNull();
    expect(
      calculateRMultiple(makeTrade({ buyPrice: 100, stopLoss: 100 })),
    ).toBeNull();
  });
});

describe("calculateDashboardMetrics", () => {
  it("returns zeroed metrics for no trades", () => {
    const metrics = calculateDashboardMetrics([], strategies);
    expect(metrics.totalTrades).toBe(0);
    expect(metrics.winRate).toBe(0);
    expect(metrics.profitFactor).toBe(0);
  });

  it("derives win rate, profit factor, and streaks from P&L", () => {
    const trades = [
      makeTrade({ netPnl: 300, tradeDate: "2024-01-01" }),
      makeTrade({ netPnl: 200, tradeDate: "2024-01-02" }),
      makeTrade({ netPnl: -100, tradeDate: "2024-01-03" }),
    ];
    const metrics = calculateDashboardMetrics(trades, strategies);
    expect(metrics.totalTrades).toBe(3);
    expect(metrics.netPnl).toBe(400);
    expect(metrics.winningTrades).toBe(2);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.winRate).toBeCloseTo((2 / 3) * 100);
    expect(metrics.profitFactor).toBeCloseTo(5);
    expect(metrics.maxWinStreak).toBe(2);
    expect(metrics.maxLossStreak).toBe(1);
    expect(metrics.bestStrategy).toBe("Alpha");
  });
});

describe("buildEquityCurve", () => {
  it("accumulates P&L in chronological order", () => {
    const trades = [
      makeTrade({ netPnl: 100, entryTime: "2024-01-02T09:20:00.000Z" }),
      makeTrade({ netPnl: -40, entryTime: "2024-01-01T09:20:00.000Z" }),
    ];
    const curve = buildEquityCurve(trades);
    expect(curve.map((p) => p.cumulative)).toEqual([-40, 60]);
  });
});

describe("calculateStrategyStats", () => {
  it("scopes metrics per strategy and sorts by net P&L", () => {
    const trades = [
      makeTrade({ strategyId: "s1", netPnl: 300 }),
      makeTrade({ strategyId: "s1", netPnl: -100 }),
      makeTrade({ strategyId: "s2", netPnl: 50 }),
    ];
    const stats = calculateStrategyStats(trades, strategies);
    expect(stats[0].id).toBe("s1");
    expect(stats[0].netPnl).toBe(200);
    expect(stats[0].winRate).toBeCloseTo(50);
    expect(stats[1].id).toBe("s2");
  });
});
