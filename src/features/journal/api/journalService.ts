import { journalDb } from "../db/journalDb";
import { AppSettings, Strategy, Trade } from "../types/trade";

const TRADES_KEY = "trading-journal-trades-v1";
const STRATEGIES_KEY = "trading-journal-strategies-v1";
const SETTINGS_KEY = "trading-journal-settings-v1";

export const DEFAULT_SETTINGS: AppSettings = {
  dailyLossLimit: 5000,
  maxTradesPerDay: 5,
};

const normalizeSettings = (settings: AppSettings): AppSettings => {
  return {
    dailyLossLimit: Number.isFinite(settings.dailyLossLimit)
      ? settings.dailyLossLimit
      : DEFAULT_SETTINGS.dailyLossLimit,
    maxTradesPerDay: Number.isFinite(settings.maxTradesPerDay)
      ? settings.maxTradesPerDay
      : DEFAULT_SETTINGS.maxTradesPerDay,
  };
};

const getTrades = (): Trade[] => {
  return journalDb.read<Trade[]>(TRADES_KEY, []);
};

const saveTrades = (trades: Trade[]): void => {
  journalDb.write(TRADES_KEY, trades);
};

const getStrategies = (): Strategy[] => {
  return journalDb.read<Strategy[]>(STRATEGIES_KEY, []);
};

const saveStrategies = (strategies: Strategy[]): void => {
  journalDb.write(STRATEGIES_KEY, strategies);
};

const getSettings = (): AppSettings => {
  const settings = journalDb.read<AppSettings | null>(SETTINGS_KEY, null);
  if (!settings) return DEFAULT_SETTINGS;
  return normalizeSettings(settings);
};

const saveSettings = (settings: AppSettings): void => {
  journalDb.write(SETTINGS_KEY, normalizeSettings(settings));
};

export const journalService = {
  getTrades,
  saveTrades,
  getStrategies,
  saveStrategies,
  getSettings,
  saveSettings,
};

