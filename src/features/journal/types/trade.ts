export type Instrument = "BANKNIFTY" | "NIFTY50" | "MCX_CRUDE";
export type Segment = "OPTIONS";
export type OptionType = "CE" | "PE";
export type TradeStatus = "SUCCESSFUL" | "FAILED";
export type StrategyTimeframe = "SCALPING" | "INTRADAY" | "POSITIONAL";
export type TradeEmotion = "CALM" | "CONFIDENT" | "FEAR" | "GREED" | "REVENGE" | "FOMO" | "HESITANT";
export type MistakeType = "NONE" | "OVERTRADING" | "REVENGE_TRADE" | "EARLY_EXIT" | "LATE_ENTRY" | "NO_STOP_LOSS" | "RULE_BREAK";

export interface Strategy {
  id: string;
  name: string;
  rules?: string;
  timeframe?: StrategyTimeframe;
  createdAt: string;
}

export interface Trade {
  id: string;
  tradeDate: string;
  instrument: Instrument;
  segment: Segment;
  strikePrice?: number;
  optionType?: OptionType;
  entryTime: string;
  exitTime: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  charges: number;
  netPnl: number;
  strategyId: string;
  status: TradeStatus;
  notes?: string;
  emotionBefore?: TradeEmotion;
  emotionAfter?: TradeEmotion;
  confidenceScore?: number;
  mistakeType?: MistakeType;
  entryReason?: string;
  exitReason?: string;
  lessonLearned?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface AppSettings {
  dailyLossLimit: number;
  maxTradesPerDay: number;
}
