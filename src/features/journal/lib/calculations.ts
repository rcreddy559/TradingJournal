import { Strategy, Trade } from "../types/trade";

export interface DashboardMetrics {
  totalTrades: number;
  netPnl: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  avgDailyPnl: number;
  bestStrategy: string;
  worstStrategy: string;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

export const calculateNetPnl = (
  sellPrice: number,
  buyPrice: number,
  quantity: number,
  charges: number,
): number => {
  return (sellPrice - buyPrice) * quantity - charges;
};

/**
 * Always recomputes the P&L from the trade's price/quantity/charges so totals
 * never drift from a stale stored `netPnl`.
 */
export const deriveNetPnl = (trade: Trade): number => {
  return calculateNetPnl(
    trade.sellPrice,
    trade.buyPrice,
    trade.quantity,
    trade.charges,
  );
};

/**
 * R-multiple = reward earned divided by the risk that was planned via the stop.
 * Returns null when no stop loss was recorded or the risk is non-positive.
 */
export const calculateRMultiple = (trade: Trade): number | null => {
  if (trade.stopLoss === undefined || trade.stopLoss === null) return null;
  const riskPerUnit = trade.buyPrice - trade.stopLoss;
  if (riskPerUnit <= 0) return null;
  const rewardPerUnit = trade.sellPrice - trade.buyPrice;
  return rewardPerUnit / riskPerUnit;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const chronological = (trades: Trade[]): Trade[] => {
  return [...trades].sort((a, b) => {
    const aTime = new Date(a.entryTime || a.tradeDate).getTime();
    const bTime = new Date(b.entryTime || b.tradeDate).getTime();
    return aTime - bTime;
  });
};

const longestStreak = (
  trades: Trade[],
  predicate: (pnl: number) => boolean,
): number => {
  let best = 0;
  let current = 0;
  chronological(trades).forEach((trade) => {
    if (predicate(trade.netPnl)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
};

export const calculateDashboardMetrics = (
  trades: Trade[],
  strategies: Strategy[],
): DashboardMetrics => {
  if (!trades.length) {
    return {
      totalTrades: 0,
      netPnl: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      avgDailyPnl: 0,
      bestStrategy: "-",
      worstStrategy: "-",
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 0,
      expectancy: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
    };
  }

  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0);
  const wins = trades.filter((t) => t.netPnl > 0);
  const losses = trades.filter((t) => t.netPnl < 0);
  const totalProfit = wins.reduce((sum, t) => sum + t.netPnl, 0);
  const totalLoss = losses.reduce((sum, t) => sum + t.netPnl, 0);
  const uniqueDays = new Set(trades.map((trade) => trade.tradeDate)).size;

  const strategyScores = strategies
    .map((strategy) => {
      const strategyTrades = trades.filter(
        (trade) => trade.strategyId === strategy.id,
      );
      const pnl = strategyTrades.reduce((sum, trade) => sum + trade.netPnl, 0);
      return { name: strategy.name, pnl, count: strategyTrades.length };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.pnl - a.pnl);

  const grossLossAbs = Math.abs(totalLoss);
  const winRate = (wins.length / trades.length) * 100;

  return {
    totalTrades: trades.length,
    netPnl,
    totalProfit,
    totalLoss,
    winRate,
    avgDailyPnl: uniqueDays ? netPnl / uniqueDays : 0,
    bestStrategy: strategyScores[0]?.name ?? "-",
    worstStrategy: strategyScores[strategyScores.length - 1]?.name ?? "-",
    winningTrades: wins.length,
    losingTrades: losses.length,
    profitFactor:
      grossLossAbs > 0
        ? totalProfit / grossLossAbs
        : totalProfit > 0
          ? Infinity
          : 0,
    expectancy: netPnl / trades.length,
    avgWin: wins.length ? totalProfit / wins.length : 0,
    avgLoss: losses.length ? totalLoss / losses.length : 0,
    largestWin: wins.length ? Math.max(...wins.map((t) => t.netPnl)) : 0,
    largestLoss: losses.length ? Math.min(...losses.map((t) => t.netPnl)) : 0,
    maxWinStreak: longestStreak(trades, (pnl) => pnl > 0),
    maxLossStreak: longestStreak(trades, (pnl) => pnl < 0),
  };
};

export interface EquityPoint {
  index: number;
  date: string;
  pnl: number;
  cumulative: number;
}

/**
 * Cumulative P&L curve in trade order (oldest first), used to draw the
 * dashboard equity curve.
 */
export const buildEquityCurve = (trades: Trade[]): EquityPoint[] => {
  let running = 0;
  return chronological(trades).map((trade, index) => {
    running += trade.netPnl;
    return {
      index,
      date: trade.tradeDate,
      pnl: trade.netPnl,
      cumulative: running,
    };
  });
};

export interface DailyPnl {
  date: string;
  pnl: number;
  trades: number;
}

/** P&L grouped per calendar day, sorted ascending, for the heatmap calendar. */
export const buildDailyPnl = (trades: Trade[]): DailyPnl[] => {
  const map = new Map<string, DailyPnl>();
  trades.forEach((trade) => {
    const existing = map.get(trade.tradeDate) ?? {
      date: trade.tradeDate,
      pnl: 0,
      trades: 0,
    };
    existing.pnl += trade.netPnl;
    existing.trades += 1;
    map.set(trade.tradeDate, existing);
  });
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
};

export interface StrategyStat {
  id: string;
  name: string;
  timeframe?: string;
  trades: number;
  netPnl: number;
  wins: number;
  losses: number;
  winRate: number;
  expectancy: number;
  profitFactor: number;
  avgRMultiple: number | null;
}

export const calculateStrategyStats = (
  trades: Trade[],
  strategies: Strategy[],
): StrategyStat[] => {
  return strategies
    .map((strategy) => {
      const scoped = trades.filter((t) => t.strategyId === strategy.id);
      const wins = scoped.filter((t) => t.netPnl > 0);
      const losses = scoped.filter((t) => t.netPnl < 0);
      const netPnl = scoped.reduce((sum, t) => sum + t.netPnl, 0);
      const grossProfit = wins.reduce((sum, t) => sum + t.netPnl, 0);
      const grossLossAbs = Math.abs(
        losses.reduce((sum, t) => sum + t.netPnl, 0),
      );
      const rValues = scoped
        .map(calculateRMultiple)
        .filter((value): value is number => value !== null);

      return {
        id: strategy.id,
        name: strategy.name,
        timeframe: strategy.timeframe,
        trades: scoped.length,
        netPnl,
        wins: wins.length,
        losses: losses.length,
        winRate: scoped.length ? (wins.length / scoped.length) * 100 : 0,
        expectancy: scoped.length ? netPnl / scoped.length : 0,
        profitFactor:
          grossLossAbs > 0
            ? grossProfit / grossLossAbs
            : grossProfit > 0
              ? Infinity
              : 0,
        avgRMultiple: rValues.length
          ? rValues.reduce((sum, value) => sum + value, 0) / rValues.length
          : null,
      };
    })
    .sort((a, b) => b.netPnl - a.netPnl);
};

export interface CategoryStat {
  key: string;
  trades: number;
  netPnl: number;
  winRate: number;
}

const buildCategoryStats = (
  trades: Trade[],
  keyOf: (trade: Trade) => string | undefined,
): CategoryStat[] => {
  const map = new Map<
    string,
    { trades: number; netPnl: number; wins: number }
  >();
  trades.forEach((trade) => {
    const key = keyOf(trade);
    if (!key) return;
    const existing = map.get(key) ?? { trades: 0, netPnl: 0, wins: 0 };
    existing.trades += 1;
    existing.netPnl += trade.netPnl;
    if (trade.netPnl > 0) existing.wins += 1;
    map.set(key, existing);
  });
  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      trades: value.trades,
      netPnl: value.netPnl,
      winRate: value.trades ? (value.wins / value.trades) * 100 : 0,
    }))
    .sort((a, b) => a.netPnl - b.netPnl);
};

export const calculateEmotionStats = (trades: Trade[]): CategoryStat[] => {
  return buildCategoryStats(trades, (trade) => trade.emotionBefore);
};

export const calculateMistakeStats = (trades: Trade[]): CategoryStat[] => {
  return buildCategoryStats(trades, (trade) =>
    trade.mistakeType && trade.mistakeType !== "NONE"
      ? trade.mistakeType
      : undefined,
  );
};
