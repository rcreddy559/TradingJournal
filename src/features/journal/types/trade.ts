/**
 * Instruments are user-managed, so the stored value is a free-form symbol key
 * (see `InstrumentDef`). The three original built-ins remain the defaults.
 */
export type Instrument = string;
export type Segment = "OPTIONS";
export type OptionType = "CE" | "PE";
export type TradeSide = "BUY" | "SELL";
export type TradeStatus = "SUCCESSFUL" | "FAILED";
export type StrategyTimeframe = "SCALPING" | "INTRADAY" | "POSITIONAL";
export type TradeEmotion =
  "CALM" | "CONFIDENT" | "FEAR" | "GREED" | "REVENGE" | "FOMO" | "HESITANT";
export type MistakeType =
  | "NONE"
  | "OVERTRADING"
  | "REVENGE_TRADE"
  | "EARLY_EXIT"
  | "LATE_ENTRY"
  | "NO_STOP_LOSS"
  | "RULE_BREAK";
export type ExecutionQuality =
  "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "VERY_POOR";

export interface Strategy {
  id: string;
  name: string;
  rules?: string;
  timeframe?: StrategyTimeframe;
  createdAt: string;
}

/**
 * A user-managed instrument. `symbol` is the stable key stored on
 * `Trade.instrument`; `name` is the human-readable label shown in the UI.
 */
export interface InstrumentDef {
  id: string;
  symbol: string;
  name: string;
  createdAt: string;
}

export interface Trade {
  id: string;
  tradeDate: string;
  instrument: Instrument;
  segment: Segment;
  strikePrice?: number;
  optionType?: OptionType;
  side?: TradeSide;
  entryTime: string;
  exitTime: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  charges: number;
  netPnl: number;
  stopLoss?: number;
  target?: number;
  tags?: string[];
  screenshot?: string;
  strategyId: string;
  status: TradeStatus;
  notes?: string;
  emotionBefore?: TradeEmotion;
  emotionAfter?: TradeEmotion;
  confidenceScore?: number;
  mistakeType?: MistakeType;
  executionQuality?: ExecutionQuality;
  entryReason?: string;
  exitReason?: string;
  lessonLearned?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExperienceLevel =
  "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";

export interface TraderProfile {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  role: string;
  bio: string;
  broker: string;
  baseCurrency: string;
  tradingCapital: number;
  riskPerTradePct: number;
  experienceLevel: ExperienceLevel;
  avatar?: string;
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
