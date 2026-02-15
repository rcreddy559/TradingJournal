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
}

export const calculateNetPnl = (sellPrice: number, buyPrice: number, quantity: number, charges: number): number => {
  return (sellPrice - buyPrice) * quantity - charges;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
};

export const calculateDashboardMetrics = (trades: Trade[], strategies: Strategy[]): DashboardMetrics => {
  if (!trades.length) {
    return {
      totalTrades: 0,
      netPnl: 0,
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      avgDailyPnl: 0,
      bestStrategy: "-",
      worstStrategy: "-"
    };
  }

  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0);
  const totalProfit = trades.filter((t) => t.netPnl > 0).reduce((sum, t) => sum + t.netPnl, 0);
  const totalLoss = trades.filter((t) => t.netPnl < 0).reduce((sum, t) => sum + t.netPnl, 0);
  const successfulTrades = trades.filter((t) => t.status === "SUCCESSFUL").length;
  const uniqueDays = new Set(trades.map((trade) => trade.tradeDate)).size;

  const strategyScores = strategies
    .map((strategy) => {
      const strategyTrades = trades.filter((trade) => trade.strategyId === strategy.id);
      const pnl = strategyTrades.reduce((sum, trade) => sum + trade.netPnl, 0);
      return {
        name: strategy.name,
        pnl,
        count: strategyTrades.length
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.pnl - a.pnl);

  return {
    totalTrades: trades.length,
    netPnl,
    totalProfit,
    totalLoss,
    winRate: (successfulTrades / trades.length) * 100,
    avgDailyPnl: uniqueDays ? netPnl / uniqueDays : 0,
    bestStrategy: strategyScores[0]?.name ?? "-",
    worstStrategy: strategyScores[strategyScores.length - 1]?.name ?? "-"
  };
};
