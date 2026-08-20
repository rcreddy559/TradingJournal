import { Strategy, StrategyTimeframe } from "../types/trade";

export const STRATEGY_TIMEFRAMES: StrategyTimeframe[] = [
  "SCALPING",
  "INTRADAY",
  "POSITIONAL",
];

export const STRATEGY_TIMEFRAME_LABELS: Record<StrategyTimeframe, string> = {
  SCALPING: "Scalping",
  INTRADAY: "Intraday",
  POSITIONAL: "Positional",
};

export type StarterStrategy = Pick<Strategy, "name" | "timeframe" | "rules">;

/** Ready-made option structures offered as a one-click starter pack. */
export const STARTER_OPTION_STRATEGIES: StarterStrategy[] = [
  {
    name: "Bull Call Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bullish view; buy ATM/ITM call and sell higher strike OTM call in same expiry.",
  },
  {
    name: "Bull Put Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bullish view; sell higher strike put and buy lower strike put for hedge.",
  },
  {
    name: "Bear Put Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bearish view; buy higher strike put and sell lower strike put.",
  },
  {
    name: "Bear Call Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bearish view; sell lower strike call and buy higher strike call.",
  },
  {
    name: "Long Straddle",
    timeframe: "INTRADAY",
    rules:
      "Expect big move in any direction; buy ATM call and ATM put of same expiry.",
  },
  {
    name: "Short Straddle",
    timeframe: "INTRADAY",
    rules:
      "Expect range-bound market; sell ATM call and ATM put with strict risk controls.",
  },
  {
    name: "Long Strangle",
    timeframe: "INTRADAY",
    rules: "Expect large volatility expansion; buy OTM call and OTM put.",
  },
  {
    name: "Short Strangle",
    timeframe: "INTRADAY",
    rules:
      "Expect low volatility/range; sell OTM call and OTM put with hedges.",
  },
  {
    name: "Iron Condor",
    timeframe: "POSITIONAL",
    rules:
      "Range strategy; combine bull put spread + bear call spread with defined risk.",
  },
  {
    name: "Long Call Butterfly",
    timeframe: "POSITIONAL",
    rules:
      "Neutral to low-volatility view around center strike; limited risk/reward strategy.",
  },
];
