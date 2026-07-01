import { ChangeEvent, useRef } from "react";
import Sidebar from "./features/journal/components/Sidebar";
import AddTradePage from "./features/journal/pages/AddTradePage";
import DashboardPage from "./features/journal/pages/DashboardPage";
import SettingsPage from "./features/journal/pages/SettingsPage";
import StrategiesPage from "./features/journal/pages/StrategiesPage";
import StrategyAnalyticsPage from "./features/journal/pages/StrategyAnalyticsPage";
import PsychologyPage from "./features/journal/pages/PsychologyPage";
import ProfilePage from "./features/journal/pages/ProfilePage";
import TradesPage from "./features/journal/pages/TradesPage";
import { JournalProvider } from "./features/journal/store/journalContext";
import {
  useJournalActions,
  useJournalSelectors,
  useJournalState,
} from "./features/journal/store/hooks";
import { exportTradesCsv } from "./features/journal/lib/csv";
import { LoginModal, useAuth } from "./features/auth";
import { useToast } from "./shared/ui";

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return <LoginModal />;
  }

  // Re-mount the journal when the active user changes so each user loads
  // their own trades, strategies and settings.
  return (
    <JournalProvider key={user.username}>
      <JournalShell />
    </JournalProvider>
  );
}

function JournalShell() {
  const { user, logout } = useAuth();
  const { ui, strategies, profile } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const { setView, importTradesFromCsvText } = useJournalActions();
  const { notify } = useToast();
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
      notify(
        "No valid rows found. Use headers like tradeDate, instrument, buyPrice, sellPrice, quantity, strategy.",
        "error",
      );
      event.target.value = "";
      return;
    }

    notify(
      `Imported ${result.importedTrades} trades and ${result.importedStrategies} new strategies.`,
      "success",
    );
    event.target.value = "";
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={ui.view}
        onChange={setView}
        userName={user?.username ?? ""}
        profileName={profile?.displayName}
        profileRole={profile?.role}
        profileAvatar={profile?.avatar}
        onLogout={logout}
        actions={
          <div className="sidebar-button-group">
            <button
              type="button"
              className="export-btn"
              onClick={() =>
                exportTradesCsv(
                  filteredTrades,
                  strategies,
                  "trading-journal-export.csv",
                )
              }
            >
              Export CSV
            </button>
            <button
              type="button"
              className="export-btn"
              onClick={handleImportClick}
            >
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
        {ui.view === "STRATEGY_ANALYTICS" && <StrategyAnalyticsPage />}
        {ui.view === "PSYCHOLOGY" && <PsychologyPage />}
        {ui.view === "PROFILE" && <ProfilePage />}
        {ui.view === "SETTINGS" && <SettingsPage />}
      </main>
    </div>
  );
}
