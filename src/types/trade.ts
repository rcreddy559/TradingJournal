export type Instrument = "BANKNIFTY" | "NIFTY50" | "MCX_CRUDE";
export type Segment = "OPTIONS";
export type OptionType = "CE" | "PE";
export type TradeStatus = "SUCCESSFUL" | "FAILED";
export type StrategyTimeframe = "SCALPING" | "INTRADAY" | "POSITIONAL";

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
