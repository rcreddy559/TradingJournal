import { Instrument, Trade, TradeStatus } from "../types/trade";

export interface TradeFilterOptions {
  startDate?: string;
  endDate?: string;
  notesQuery?: string;
  mistakeOnly?: boolean;
  strategyId?: string;
  instrument?: Instrument | "ALL";
  status?: TradeStatus | "ALL";
}

const matchesDateRange = (trade: Trade, options: TradeFilterOptions): boolean => {
  const inStart = !options.startDate || trade.tradeDate >= options.startDate;
  const inEnd = !options.endDate || trade.tradeDate <= options.endDate;
  return inStart && inEnd;
};

const matchesNotes = (trade: Trade, query?: string): boolean => {
  const normalized = (query ?? "").trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [
    trade.notes ?? "",
    trade.entryReason ?? "",
    trade.exitReason ?? "",
    trade.lessonLearned ?? "",
    ...(trade.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
};

/**
 * Single source of truth for filtering trades. Both the Trades page and the
 * global date selector build on this so filters can never drift apart.
 */
export const applyTradeFilters = (
  trades: Trade[],
  options: TradeFilterOptions,
): Trade[] => {
  return trades.filter((trade) => {
    if (!matchesDateRange(trade, options)) return false;
    if (!matchesNotes(trade, options.notesQuery)) return false;
    if (
      options.mistakeOnly &&
      (!trade.mistakeType || trade.mistakeType === "NONE")
    ) {
      return false;
    }
    if (options.strategyId && trade.strategyId !== options.strategyId) {
      return false;
    }
    if (
      options.instrument &&
      options.instrument !== "ALL" &&
      trade.instrument !== options.instrument
    ) {
      return false;
    }
    if (
      options.status &&
      options.status !== "ALL" &&
      trade.status !== options.status
    ) {
      return false;
    }
    return true;
  });
};
