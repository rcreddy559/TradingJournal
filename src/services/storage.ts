import { AppSettings, Strategy, Trade } from "../types/trade";

const TRADES_KEY = "trading-journal-trades-v1";
const STRATEGIES_KEY = "trading-journal-strategies-v1";
const SETTINGS_KEY = "trading-journal-settings-v1";

export const DEFAULT_SETTINGS: AppSettings = {
  dailyLossLimit: 5000,
  maxTradesPerDay: 5
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getTrades = (): Trade[] => {
  return safeParse<Trade[]>(localStorage.getItem(TRADES_KEY), []);
};

export const saveTrades = (trades: Trade[]): void => {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
};

export const addTrade = (trade: Trade): void => {
  const trades = getTrades();
  saveTrades([trade, ...trades]);
};

export const updateTrade = (updatedTrade: Trade): void => {
  const trades = getTrades();
  const nextTrades = trades.map((trade) => (trade.id === updatedTrade.id ? updatedTrade : trade));
  saveTrades(nextTrades);
};

export const deleteTrade = (tradeId: string): void => {
  const trades = getTrades();
  const nextTrades = trades.filter((trade) => trade.id !== tradeId);
  saveTrades(nextTrades);
};

export const replaceAllTrades = (trades: Trade[]): void => {
  saveTrades(trades);
};

export const getStrategies = (): Strategy[] => {
  return safeParse<Strategy[]>(localStorage.getItem(STRATEGIES_KEY), []);
};

export const saveStrategies = (strategies: Strategy[]): void => {
  localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies));
};

export const addStrategy = (strategy: Strategy): void => {
  const strategies = getStrategies();
  saveStrategies([strategy, ...strategies]);
};

export const replaceAllStrategies = (strategies: Strategy[]): void => {
  saveStrategies(strategies);
};

export const getSettings = (): AppSettings => {
  const settings = safeParse<AppSettings | null>(localStorage.getItem(SETTINGS_KEY), null);
  if (!settings) return DEFAULT_SETTINGS;

  return {
    dailyLossLimit: Number.isFinite(settings.dailyLossLimit) ? settings.dailyLossLimit : DEFAULT_SETTINGS.dailyLossLimit,
    maxTradesPerDay: Number.isFinite(settings.maxTradesPerDay) ? settings.maxTradesPerDay : DEFAULT_SETTINGS.maxTradesPerDay
  };
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
