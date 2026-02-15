import { ChangeEvent, useMemo, useRef, useState } from "react";
import Sidebar, { AppView } from "./components/Sidebar";
import AddTradePage from "./pages/AddTradePage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import StrategiesPage from "./pages/StrategiesPage";
import TradesPage from "./pages/TradesPage";
import {
  DEFAULT_SETTINGS,
  addStrategy,
  addTrade,
  deleteTrade,
  getSettings,
  getStrategies,
  getTrades,
  replaceAllStrategies,
  replaceAllTrades,
  saveSettings,
  updateTrade
} from "./services/storage";
import { AppSettings, MistakeType, Strategy, Trade, TradeEmotion } from "./types/trade";
import { exportTradesCsv, parseImportedTradesCsv } from "./utils/csv";

export default function App() {
  const [view, setView] = useState<AppView>("DASHBOARD");
  const [trades, setTrades] = useState<Trade[]>(() => getTrades());
  const [strategies, setStrategies] = useState<Strategy[]>(() => getStrategies());
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const inStart = !startDate || trade.tradeDate >= startDate;
      const inEnd = !endDate || trade.tradeDate <= endDate;
      return inStart && inEnd;
    });
  }, [trades, startDate, endDate]);

  const editingTrade = useMemo(() => {
    if (!editingTradeId) return null;
    return trades.find((trade) => trade.id === editingTradeId) ?? null;
  }, [editingTradeId, trades]);

  const handleCreateTrade = (trade: Trade) => {
    addTrade(trade);
    setTrades((prev) => [trade, ...prev]);
    setView("TRADES");
  };

  const handleUpdateTrade = (trade: Trade) => {
    updateTrade(trade);
    setTrades((prev) => prev.map((item) => (item.id === trade.id ? trade : item)));
    setView("TRADES");
  };

  const handleDeleteTrade = (tradeId: string) => {
    deleteTrade(tradeId);
    setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
    if (editingTradeId === tradeId) {
      setEditingTradeId(null);
    }
  };

  const handleCreateStrategy = (strategy: Strategy) => {
    addStrategy(strategy);
    setStrategies((prev) => [strategy, ...prev]);
  };

  const handleSaveSettings = (nextSettings: AppSettings) => {
    const normalized: AppSettings = {
      dailyLossLimit: Number.isFinite(nextSettings.dailyLossLimit) ? nextSettings.dailyLossLimit : DEFAULT_SETTINGS.dailyLossLimit,
      maxTradesPerDay: Number.isFinite(nextSettings.maxTradesPerDay) ? nextSettings.maxTradesPerDay : DEFAULT_SETTINGS.maxTradesPerDay
    };

    saveSettings(normalized);
    setSettings(normalized);
  };

  const handleEditTrade = (tradeId: string) => {
    setEditingTradeId(tradeId);
    setView("ADD_TRADE");
  };

  const handleCancelEdit = () => {
    setEditingTradeId(null);
    setView("TRADES");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsedTrades = parseImportedTradesCsv(text);

    if (parsedTrades.length === 0) {
      window.alert("No valid rows found. Use CSV headers like tradeDate, instrument, buyPrice, sellPrice, quantity, strategy.");
      event.target.value = "";
      return;
    }

    const generateId = () => {
      try {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
          return crypto.randomUUID();
        }
      } catch {
        // Fallback
      }
      return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    };

    const strategyByName = new Map(strategies.map((strategy) => [strategy.name.toLowerCase(), strategy]));
    const importedStrategies: Strategy[] = [];
    const emotionValues: TradeEmotion[] = ["CALM", "CONFIDENT", "FEAR", "GREED", "REVENGE", "FOMO", "HESITANT"];
    const mistakeValues: MistakeType[] = ["NONE", "OVERTRADING", "REVENGE_TRADE", "EARLY_EXIT", "LATE_ENTRY", "NO_STOP_LOSS", "RULE_BREAK"];

    parsedTrades.forEach((row) => {
      const strategyName = row.strategyName.trim() || "Imported";
      const key = strategyName.toLowerCase();
      if (!strategyByName.has(key)) {
        const newStrategy: Strategy = {
          id: generateId(),
          name: strategyName,
          createdAt: new Date().toISOString()
        };
        strategyByName.set(key, newStrategy);
        importedStrategies.push(newStrategy);
      }
    });

    const mergedStrategies = [...importedStrategies, ...strategies];

    const importedTrades: Trade[] = parsedTrades.map((row) => {
      const strategyKey = row.strategyName.trim().toLowerCase();
      const strategy = strategyByName.get(strategyKey);
      const emotionBefore = emotionValues.includes((row.emotionBefore ?? "") as TradeEmotion)
        ? (row.emotionBefore as TradeEmotion)
        : undefined;
      const emotionAfter = emotionValues.includes((row.emotionAfter ?? "") as TradeEmotion)
        ? (row.emotionAfter as TradeEmotion)
        : undefined;
      const mistakeType = mistakeValues.includes((row.mistakeType ?? "") as MistakeType)
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
        updatedAt: new Date().toISOString()
      };
    });

    const mergedTrades = [...importedTrades, ...trades];

    replaceAllStrategies(mergedStrategies);
    replaceAllTrades(mergedTrades);

    setStrategies(mergedStrategies);
    setTrades(mergedTrades);
    setView("TRADES");
    window.alert(`Imported ${importedTrades.length} trades and ${importedStrategies.length} new strategies.`);
    event.target.value = "";
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        onChange={setView}
        actions={
          <div className="sidebar-button-group">
            <button
              type="button"
              className="export-btn"
              onClick={() => exportTradesCsv(filteredTrades, strategies, "trading-journal-export.csv")}
            >
              Export CSV
            </button>
            <button type="button" className="export-btn" onClick={handleImportClick}>
              Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden-input"
              onChange={handleImportFile}
            />
          </div>
        }
      />

      <main>
        {view === "DASHBOARD" && <DashboardPage trades={filteredTrades} strategies={strategies} />}
        {view === "ADD_TRADE" && (
          <AddTradePage
            strategies={strategies}
            trades={trades}
            settings={settings}
            editingTrade={editingTrade}
            onCreate={handleCreateTrade}
            onUpdate={handleUpdateTrade}
            onCancelEdit={handleCancelEdit}
          />
        )}
        {view === "TRADES" && (
          <TradesPage
            trades={trades}
            strategies={strategies}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleDeleteTrade}
          />
        )}
        {view === "STRATEGIES" && <StrategiesPage strategies={strategies} onCreate={handleCreateStrategy} />}
        {view === "SETTINGS" && <SettingsPage settings={settings} onSave={handleSaveSettings} />}
      </main>
    </div>
  );
}
