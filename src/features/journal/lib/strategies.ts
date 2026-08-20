import { Strategy, StrategyTimeframe, Trade } from "../types/trade";
import { calculateStrategyStats } from "./calculations";

export type StrategySortKey =
  | "NAME"
  | "TIMEFRAME"
  | "TRADES"
  | "WIN_RATE"
  | "NET_PNL"
  | "CREATED";

export type SortDirection = "ASC" | "DESC";
export type StrategyUsageFilter = "ALL" | "USED" | "UNUSED";
export type StrategyTimeframeFilter = "ALL" | "UNSET" | StrategyTimeframe;

/** A strategy joined with its all-time performance so the list can rank them. */
export interface StrategyRow {
  id: string;
  name: string;
  rules: string;
  timeframe?: StrategyTimeframe;
  createdAt: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  expectancy: number;
  profitFactor: number;
  avgRMultiple: number | null;
}

export interface StrategyFilters {
  query: string;
  timeframe: StrategyTimeframeFilter;
  usage: StrategyUsageFilter;
}

export interface StrategySummary {
  total: number;
  used: number;
  unused: number;
  assignedTrades: number;
  netPnl: number;
  best: StrategyRow | null;
  worst: StrategyRow | null;
}

export const normalizeStrategyName = (value: string): string =>
  value.trim().toLowerCase();

export const isDuplicateStrategyName = (
  strategies: Strategy[],
  candidate: string,
  ignoreId: string | null = null,
): boolean => {
  const normalized = normalizeStrategyName(candidate);
  if (!normalized) return false;
  return strategies.some(
    (strategy) =>
      strategy.id !== ignoreId &&
      normalizeStrategyName(strategy.name) === normalized,
  );
};

/** Suggests "Name (copy)", "Name (copy 2)", ... until the name is free. */
export const buildDuplicateStrategyName = (
  strategies: Strategy[],
  baseName: string,
): string => {
  const trimmed = baseName.trim();
  let candidate = `${trimmed} (copy)`;
  let counter = 2;
  while (isDuplicateStrategyName(strategies, candidate)) {
    candidate = `${trimmed} (copy ${counter})`;
    counter += 1;
  }
  return candidate;
};

/** Returns only the starter templates whose names aren't taken yet. */
export const selectMissingStarters = <T extends { name: string }>(
  strategies: Strategy[],
  starters: T[],
): T[] => {
  const existing = new Set(strategies.map((s) => normalizeStrategyName(s.name)));
  const seen = new Set<string>();
  return starters.filter((starter) => {
    const key = normalizeStrategyName(starter.name);
    if (existing.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildStrategyRows = (
  strategies: Strategy[],
  trades: Trade[],
): StrategyRow[] => {
  const statsById = new Map(
    calculateStrategyStats(trades, strategies).map((stat) => [stat.id, stat]),
  );

  return strategies.map((strategy) => {
    const stat = statsById.get(strategy.id);
    return {
      id: strategy.id,
      name: strategy.name,
      rules: strategy.rules ?? "",
      timeframe: strategy.timeframe,
      createdAt: strategy.createdAt,
      trades: stat?.trades ?? 0,
      wins: stat?.wins ?? 0,
      losses: stat?.losses ?? 0,
      winRate: stat?.winRate ?? 0,
      netPnl: stat?.netPnl ?? 0,
      expectancy: stat?.expectancy ?? 0,
      profitFactor: stat?.profitFactor ?? 0,
      avgRMultiple: stat?.avgRMultiple ?? null,
    };
  });
};

export const filterStrategyRows = (
  rows: StrategyRow[],
  { query, timeframe, usage }: StrategyFilters,
): StrategyRow[] => {
  const needle = query.trim().toLowerCase();

  return rows.filter((row) => {
    if (needle) {
      const haystack = `${row.name} ${row.rules}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (timeframe === "UNSET" && row.timeframe) return false;
    if (timeframe !== "ALL" && timeframe !== "UNSET") {
      if (row.timeframe !== timeframe) return false;
    }
    if (usage === "USED" && row.trades === 0) return false;
    if (usage === "UNUSED" && row.trades > 0) return false;
    return true;
  });
};

const compareRows = (
  a: StrategyRow,
  b: StrategyRow,
  key: StrategySortKey,
): number => {
  switch (key) {
    case "NAME":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "TIMEFRAME":
      return (a.timeframe ?? "").localeCompare(b.timeframe ?? "");
    case "TRADES":
      return a.trades - b.trades;
    case "WIN_RATE":
      return a.winRate - b.winRate;
    case "NET_PNL":
      return a.netPnl - b.netPnl;
    case "CREATED":
      return a.createdAt.localeCompare(b.createdAt);
    default:
      return 0;
  }
};

export const sortStrategyRows = (
  rows: StrategyRow[],
  key: StrategySortKey,
  direction: SortDirection,
): StrategyRow[] => {
  const factor = direction === "ASC" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const result = compareRows(a, b, key);
    // Names keep the list stable when the primary key ties.
    if (result === 0) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    return result * factor;
  });
};

export const summarizeStrategyRows = (rows: StrategyRow[]): StrategySummary => {
  const traded = rows.filter((row) => row.trades > 0);
  const ranked = [...traded].sort((a, b) => b.netPnl - a.netPnl);

  return {
    total: rows.length,
    used: traded.length,
    unused: rows.length - traded.length,
    assignedTrades: rows.reduce((sum, row) => sum + row.trades, 0),
    netPnl: rows.reduce((sum, row) => sum + row.netPnl, 0),
    best: ranked[0] ?? null,
    worst: ranked.length > 1 ? (ranked[ranked.length - 1] ?? null) : null,
  };
};

/** Trades pointing at no strategy, or at a strategy that no longer exists. */
export const countUnassignedTrades = (
  trades: Trade[],
  strategies: Strategy[],
): number => {
  const known = new Set(strategies.map((strategy) => strategy.id));
  return trades.filter((trade) => !trade.strategyId || !known.has(trade.strategyId))
    .length;
};
