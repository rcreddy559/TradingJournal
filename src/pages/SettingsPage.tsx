import { FormEvent, useState } from "react";
import { AppSettings } from "../types/trade";

interface SettingsPageProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsPage({ settings, onSave }: SettingsPageProps) {
  const [dailyLossLimit, setDailyLossLimit] = useState(String(settings.dailyLossLimit));
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(String(settings.maxTradesPerDay));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSave({
      dailyLossLimit: Math.max(0, Number(dailyLossLimit || 0)),
      maxTradesPerDay: Math.max(1, Number(maxTradesPerDay || 1))
    });
  };

  return (
    <section className="page">
      <h2>Risk Settings</h2>
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Daily Loss Limit (INR)
          <input type="number" min={0} value={dailyLossLimit} onChange={(event) => setDailyLossLimit(event.target.value)} />
        </label>
        <label>
          Max Trades Per Day
          <input type="number" min={1} value={maxTradesPerDay} onChange={(event) => setMaxTradesPerDay(event.target.value)} />
        </label>
        <button type="submit">Save Settings</button>
      </form>
      <p className="subtext">Warnings appear while adding trades when your daily limits are crossed.</p>
    </section>
  );
}
