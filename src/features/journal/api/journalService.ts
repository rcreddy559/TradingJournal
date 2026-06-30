import { journalDb } from "../db/journalDb";
import { AppSettings, Strategy, Trade } from "../types/trade";

const TRADES_KEY = "trading-journal-trades-v1";
const STRATEGIES_KEY = "trading-journal-strategies-v1";
const SETTINGS_KEY = "trading-journal-settings-v1";

export const DEFAULT_SETTINGS: AppSettings = {
  dailyLossLimit: 5000,
  maxTradesPerDay: 5,
};

export const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: "strategy-orb",
    name: "Opening Range Breakout",
    rules:
      "Mark the first 15-minute high/low. Enter on a breakout with volume confirmation.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-vwap-scalp",
    name: "VWAP Scalping",
    rules:
      "Trade pullbacks to VWAP in the direction of trend. Quick targets, tight stops.",
    timeframe: "SCALPING",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-trend-following",
    name: "Trend Following",
    rules:
      "Enter on higher highs / lower lows aligned with the 20 & 50 EMA. Trail the stop.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-support-resistance",
    name: "Support / Resistance Reversal",
    rules:
      "Fade key levels with a confirmation candle and a defined invalidation point.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-gap-fade",
    name: "Gap Fade",
    rules: "Fade exhausted opening gaps back toward the previous close.",
    timeframe: "SCALPING",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-narrow-breakout",
    name: "Narrow CPR Breakout",
    rules:
      "Narrow CPR (TC-BC close together) signals a trending day. Enter on a breakout above TC for longs or below BC for shorts with volume.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-wide-range",
    name: "Wide CPR Range",
    rules:
      "Wide CPR signals a range-bound/sideways day. Fade moves: buy near BC support, sell near TC resistance.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-virgin",
    name: "Virgin CPR",
    rules:
      "Untouched (virgin) CPR from the prior day acts as a strong magnet/reversal zone. Trade reversals as price tests the virgin pivot.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-pivot-bounce",
    name: "CPR Pivot Bounce",
    rules:
      "Use the central pivot (PP) as dynamic support/resistance. Enter on a confirmation candle bouncing off PP toward R1/S1.",
    timeframe: "SCALPING",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-trend-continuation",
    name: "CPR Trend Continuation",
    rules:
      "Price holding above CPR stays bullish; below CPR stays bearish. Add to the move on pullbacks to TC (long) or BC (short).",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-two-day-overlap",
    name: "Two-Day CPR Overlap",
    rules:
      "Overlapping CPR vs the previous day signals sideways/non-trending; higher CPR signals bullish, lower CPR bearish. Trade in that bias.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-tc-bc-rejection",
    name: "CPR TC/BC Rejection",
    rules:
      "Fade rejections at Top Central (TC) for shorts and Bottom Central (BC) for longs, with stop just beyond the level.",
    timeframe: "SCALPING",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-cpr-pivot-confluence",
    name: "CPR + Pivot Confluence",
    rules:
      "Take high-probability trades where CPR levels align with classic pivots (R1/R2/S1/S2) or prior day high/low.",
    timeframe: "INTRADAY",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "strategy-swing-positional",
    name: "Swing Positional",
    rules:
      "Hold multi-session positions based on higher-timeframe structure and momentum.",
    timeframe: "POSITIONAL",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

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
  return journalDb.read<Strategy[]>(STRATEGIES_KEY, DEFAULT_STRATEGIES);
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
