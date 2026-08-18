import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useJournalActions, useJournalState } from "../store/hooks";
import { buildBackup, downloadBackup, parseBackup } from "../lib/backup";
import { useConfirm, useToast } from "../../../shared/ui";

export default function SettingsPage() {
  const { settings, trades, strategies, profile, instruments, exercises } =
    useJournalState();
  const { saveSettings, restoreBackup } = useJournalActions();
  const { notify } = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dailyLossLimit, setDailyLossLimit] = useState(
    String(settings.dailyLossLimit),
  );
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(
    String(settings.maxTradesPerDay),
  );

  useEffect(() => {
    setDailyLossLimit(String(settings.dailyLossLimit));
    setMaxTradesPerDay(String(settings.maxTradesPerDay));
  }, [settings.dailyLossLimit, settings.maxTradesPerDay]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveSettings({
      dailyLossLimit: Math.max(0, Number(dailyLossLimit || 0)),
      maxTradesPerDay: Math.max(1, Number(maxTradesPerDay || 1)),
    });
    notify("Settings saved.", "success");
  };

  const handleBackupExport = () => {
    const backup = buildBackup(
      trades,
      strategies,
      instruments,
      settings,
      profile,
      exercises,
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBackup(backup, `trading-journal-backup-${stamp}.json`);
    notify("Backup downloaded.", "success");
  };

  const handleBackupImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseBackup(text);
    event.target.value = "";

    if (!parsed) {
      notify("That file is not a valid journal backup.", "error");
      return;
    }

    const ok = await confirm({
      title: "Restore backup",
      message: `Replace all current data with ${parsed.trades.length} trades and ${parsed.strategies.length} strategies from this backup? This cannot be undone.`,
      confirmLabel: "Restore",
      danger: true,
    });
    if (!ok) return;

    restoreBackup(parsed);
    notify("Backup restored.", "success");
  };

  return (
    <section className="page">
      <h2>Risk Settings</h2>
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Daily Loss Limit (INR)
          <input
            type="number"
            min={0}
            value={dailyLossLimit}
            onChange={(event) => setDailyLossLimit(event.target.value)}
          />
        </label>
        <label>
          Max Trades Per Day
          <input
            type="number"
            min={1}
            value={maxTradesPerDay}
            onChange={(event) => setMaxTradesPerDay(event.target.value)}
          />
        </label>
        <button type="submit">Save Settings</button>
      </form>
      <p className="subtext">
        Warnings appear while adding trades when your daily limits are crossed.
      </p>

      <h2>Backup & Restore</h2>
      <div className="form-card">
        <p className="subtext">
          Export a complete JSON backup of every trade, strategy, and setting,
          or restore from a previous backup. CSV export is lossy; use JSON for
          full fidelity.
        </p>
        <div className="form-actions">
          <button type="button" onClick={handleBackupExport}>
            Download JSON Backup
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Restore From Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden-input"
            onChange={handleBackupImport}
          />
        </div>
      </div>
    </section>
  );
}
