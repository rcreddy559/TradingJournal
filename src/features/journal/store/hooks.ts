import { useMemo } from "react";
import { DEFAULT_SETTINGS, journalService } from "../api/journalService";
import { AppView } from "../../../shared/types/app";
import {
  AppSettings,
  MistakeType,
  Strategy,
  Trade,
  TradeEmotion,
  TraderProfile,
} from "../types/trade";
import { parseImportedTradesCsv } from "../lib/csv";
import { applyTradeFilters } from "../lib/filters";
import { ParsedBackup } from "../lib/backup";
import { generateId } from "../../../shared/lib/helpers";
import { useJournalContext } from "./journalContext";

export const useJournalState = () => {
  return useJournalContext().state;
};

export const useJournalActions = () => {
  const { state, dispatch } = useJournalContext();

  const setView = (view: AppView) => {
    dispatch({ type: "SET_VIEW", payload: view });
  };

  const setStartDate = (value: string) => {
    dispatch({ type: "SET_START_DATE", payload: value });
  };

  const setEndDate = (value: string) => {
    dispatch({ type: "SET_END_DATE", payload: value });
  };

  const startEditTrade = (tradeId: string) => {
    dispatch({ type: "SET_EDITING_TRADE_ID", payload: tradeId });
    dispatch({ type: "SET_VIEW", payload: "ADD_TRADE" });
  };

  const cancelEditTrade = () => {
    dispatch({ type: "SET_EDITING_TRADE_ID", payload: null });
    dispatch({ type: "SET_VIEW", payload: "TRADES" });
  };

  const createTrade = (trade: Trade) => {
    const nextTrades = [trade, ...state.trades];
    journalService.saveTrades(nextTrades);
    dispatch({ type: "ADD_TRADE", payload: trade });
    dispatch({ type: "SET_VIEW", payload: "TRADES" });
  };

  const updateTrade = (trade: Trade) => {
    const nextTrades = state.trades.map((item) =>
      item.id === trade.id ? trade : item,
    );
    journalService.saveTrades(nextTrades);
    dispatch({ type: "UPDATE_TRADE", payload: trade });
    dispatch({ type: "SET_VIEW", payload: "TRADES" });
  };

  const deleteTrade = (tradeId: string) => {
    const nextTrades = state.trades.filter((trade) => trade.id !== tradeId);
    journalService.saveTrades(nextTrades);
    dispatch({ type: "DELETE_TRADE", payload: tradeId });

    if (state.ui.editingTradeId === tradeId) {
      dispatch({ type: "SET_EDITING_TRADE_ID", payload: null });
    }
  };

  const createStrategy = (strategy: Strategy) => {
    const nextStrategies = [strategy, ...state.strategies];
    journalService.saveStrategies(nextStrategies);
    dispatch({ type: "ADD_STRATEGY", payload: strategy });
  };

  const updateStrategy = (strategy: Strategy) => {
    const nextStrategies = state.strategies.map((item) =>
      item.id === strategy.id ? strategy : item,
    );
    journalService.saveStrategies(nextStrategies);
    dispatch({ type: "UPDATE_STRATEGY", payload: strategy });
  };

  const deleteStrategy = (strategyId: string) => {
    const nextStrategies = state.strategies.filter(
      (strategy) => strategy.id !== strategyId,
    );
    journalService.saveStrategies(nextStrategies);
    dispatch({ type: "DELETE_STRATEGY", payload: strategyId });
  };

  /**
   * Deletes a strategy and reassigns its trades. When `reassignToId` is null the
   * trades keep their data but become unassigned (empty strategyId).
   */
  const deleteStrategyWithReassign = (
    strategyId: string,
    reassignToId: string | null,
  ) => {
    const nextStrategies = state.strategies.filter(
      (strategy) => strategy.id !== strategyId,
    );
    const nextTrades = state.trades.map((trade) =>
      trade.strategyId === strategyId
        ? {
            ...trade,
            strategyId: reassignToId ?? "",
            updatedAt: new Date().toISOString(),
          }
        : trade,
    );
    journalService.saveStrategies(nextStrategies);
    journalService.saveTrades(nextTrades);
    dispatch({
      type: "REPLACE_ALL_DATA",
      payload: { trades: nextTrades, strategies: nextStrategies },
    });
  };

  const saveSettings = (settings: AppSettings) => {
    const normalized: AppSettings = {
      dailyLossLimit: Number.isFinite(settings.dailyLossLimit)
        ? settings.dailyLossLimit
        : DEFAULT_SETTINGS.dailyLossLimit,
      maxTradesPerDay: Number.isFinite(settings.maxTradesPerDay)
        ? settings.maxTradesPerDay
        : DEFAULT_SETTINGS.maxTradesPerDay,
    };
    journalService.saveSettings(normalized);
    dispatch({ type: "SET_SETTINGS", payload: normalized });
  };

  /** Creates or updates the trader profile (upsert). */
  const saveProfile = (profile: TraderProfile) => {
    journalService.saveProfile(profile);
    dispatch({ type: "SET_PROFILE", payload: profile });
  };

  /** Removes the trader profile and reverts the sidebar to defaults. */
  const deleteProfile = () => {
    journalService.deleteProfile();
    dispatch({ type: "DELETE_PROFILE" });
  };

  /** Replaces the entire journal from a validated backup file. */
  const restoreBackup = (backup: ParsedBackup) => {
    const settings = backup.settings
      ? {
          dailyLossLimit: Number.isFinite(backup.settings.dailyLossLimit)
            ? backup.settings.dailyLossLimit
            : DEFAULT_SETTINGS.dailyLossLimit,
          maxTradesPerDay: Number.isFinite(backup.settings.maxTradesPerDay)
            ? backup.settings.maxTradesPerDay
            : DEFAULT_SETTINGS.maxTradesPerDay,
        }
      : state.settings;

    journalService.saveTrades(backup.trades);
    journalService.saveStrategies(backup.strategies);
    journalService.saveSettings(settings);

    // Only overwrite the profile when the backup actually carries one, so an
    // older backup without a profile leaves the current profile untouched.
    const nextProfile =
      backup.profile !== undefined ? backup.profile : state.profile;
    if (backup.profile !== undefined) {
      if (backup.profile) {
        journalService.saveProfile(backup.profile);
      } else {
        journalService.deleteProfile();
      }
    }

    dispatch({
      type: "REPLACE_ALL_DATA",
      payload: {
        trades: backup.trades,
        strategies: backup.strategies,
        settings,
        profile: nextProfile,
      },
    });
    dispatch({ type: "SET_VIEW", payload: "DASHBOARD" });
  };

  const importTradesFromCsvText = (
    text: string,
  ): { importedTrades: number; importedStrategies: number } => {
    const parsedTrades = parseImportedTradesCsv(text);
    if (parsedTrades.length === 0) {
      return { importedTrades: 0, importedStrategies: 0 };
    }

    const strategyByName = new Map(
      state.strategies.map((strategy) => [
        strategy.name.toLowerCase(),
        strategy,
      ]),
    );
    const importedStrategies: Strategy[] = [];
    const emotionValues: TradeEmotion[] = [
      "CALM",
      "CONFIDENT",
      "FEAR",
      "GREED",
      "REVENGE",
      "FOMO",
      "HESITANT",
    ];
    const mistakeValues: MistakeType[] = [
      "NONE",
      "OVERTRADING",
      "REVENGE_TRADE",
      "EARLY_EXIT",
      "LATE_ENTRY",
      "NO_STOP_LOSS",
      "RULE_BREAK",
    ];

    parsedTrades.forEach((row) => {
      const strategyName = row.strategyName.trim() || "Imported";
      const key = strategyName.toLowerCase();
      if (!strategyByName.has(key)) {
        const newStrategy: Strategy = {
          id: generateId(),
          name: strategyName,
          createdAt: new Date().toISOString(),
        };
        strategyByName.set(key, newStrategy);
        importedStrategies.push(newStrategy);
      }
    });

    const mergedStrategies = [...importedStrategies, ...state.strategies];
    const importedTrades: Trade[] = parsedTrades.map((row) => {
      const strategyKey = row.strategyName.trim().toLowerCase();
      const strategy = strategyByName.get(strategyKey);
      const emotionBefore = emotionValues.includes(
        (row.emotionBefore ?? "") as TradeEmotion,
      )
        ? (row.emotionBefore as TradeEmotion)
        : undefined;
      const emotionAfter = emotionValues.includes(
        (row.emotionAfter ?? "") as TradeEmotion,
      )
        ? (row.emotionAfter as TradeEmotion)
        : undefined;
      const mistakeType = mistakeValues.includes(
        (row.mistakeType ?? "") as MistakeType,
      )
        ? (row.mistakeType as MistakeType)
        : undefined;

      return {
        id: generateId(),
        tradeDate: row.tradeDate,
        instrument: row.instrument,
        segment: "OPTIONS",
        strikePrice: row.strikePrice,
        optionType: row.optionType,
        entryTime: row.entryTime,
        exitTime: row.exitTime,
        buyPrice: row.buyPrice,
        sellPrice: row.sellPrice,
        quantity: row.quantity,
        charges: row.charges,
        netPnl: row.netPnl,
        strategyId: strategy?.id ?? "",
        status: row.status,
        notes: row.notes,
        emotionBefore,
        emotionAfter,
        confidenceScore: row.confidenceScore,
        mistakeType,
        entryReason: row.entryReason,
        exitReason: row.exitReason,
        lessonLearned: row.lessonLearned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const mergedTrades = [...importedTrades, ...state.trades];
    journalService.saveStrategies(mergedStrategies);
    journalService.saveTrades(mergedTrades);
    dispatch({
      type: "REPLACE_ALL_DATA",
      payload: { trades: mergedTrades, strategies: mergedStrategies },
    });
    dispatch({ type: "SET_VIEW", payload: "TRADES" });

    return {
      importedTrades: importedTrades.length,
      importedStrategies: importedStrategies.length,
    };
  };

  return {
    setView,
    setStartDate,
    setEndDate,
    startEditTrade,
    cancelEditTrade,
    createTrade,
    updateTrade,
    deleteTrade,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    deleteStrategyWithReassign,
    saveSettings,
    saveProfile,
    deleteProfile,
    restoreBackup,
    importTradesFromCsvText,
  };
};

export const useJournalSelectors = () => {
  const state = useJournalState();

  const filteredTrades = useMemo(() => {
    return applyTradeFilters(state.trades, {
      startDate: state.filters.startDate,
      endDate: state.filters.endDate,
    });
  }, [state.trades, state.filters.startDate, state.filters.endDate]);

  const editingTrade = useMemo(() => {
    if (!state.ui.editingTradeId) return null;
    return (
      state.trades.find((trade) => trade.id === state.ui.editingTradeId) ?? null
    );
  }, [state.trades, state.ui.editingTradeId]);

  return {
    filteredTrades,
    editingTrade,
  };
};
