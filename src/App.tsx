import { ChangeEvent, useRef } from "react";
import Sidebar from "./features/journal/components/Sidebar";
import AddTradePage from "./features/journal/pages/AddTradePage";
import DashboardPage from "./features/journal/pages/DashboardPage";
import SettingsPage from "./features/journal/pages/SettingsPage";
import StrategiesPage from "./features/journal/pages/StrategiesPage";
import TradesPage from "./features/journal/pages/TradesPage";
import {
  useJournalActions,
  useJournalSelectors,
  useJournalState,
} from "./features/journal/store/hooks";
import { exportTradesCsv } from "./features/journal/lib/csv";

export default function App() {
  const { ui, strategies } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const { setView, importTradesFromCsvText } = useJournalActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = importTradesFromCsvText(text);

    if (result.importedTrades === 0) {
      window.alert("No valid rows found. Use CSV headers like tradeDate, instrument, buyPrice, sellPrice, quantity, strategy.");
      event.target.value = "";
      return;
    }

    window.alert(`Imported ${result.importedTrades} trades and ${result.importedStrategies} new strategies.`);
    event.target.value = "";
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={ui.view}
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
        {ui.view === "DASHBOARD" && <DashboardPage />}
        {ui.view === "ADD_TRADE" && <AddTradePage />}
        {ui.view === "TRADES" && <TradesPage />}
        {ui.view === "STRATEGIES" && <StrategiesPage />}
        {ui.view === "SETTINGS" && <SettingsPage />}
      </main>
    </div>
  );
}
