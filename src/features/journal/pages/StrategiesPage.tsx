import { FormEvent, useState } from "react";
import { Strategy, StrategyTimeframe } from "../types/trade";
import { useJournalActions, useJournalState } from "../store/hooks";

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

const COMMON_OPTIONS_STRATEGIES: Array<Pick<Strategy, "name" | "timeframe" | "rules">> = [
  { name: "Bull Call Spread", timeframe: "INTRADAY", rules: "Moderately bullish view; buy ATM/ITM call and sell higher strike OTM call in same expiry." },
  { name: "Bull Put Spread", timeframe: "INTRADAY", rules: "Moderately bullish view; sell higher strike put and buy lower strike put for hedge." },
  { name: "Bear Put Spread", timeframe: "INTRADAY", rules: "Moderately bearish view; buy higher strike put and sell lower strike put." },
  { name: "Bear Call Spread", timeframe: "INTRADAY", rules: "Moderately bearish view; sell lower strike call and buy higher strike call." },
  { name: "Long Straddle", timeframe: "INTRADAY", rules: "Expect big move in any direction; buy ATM call and ATM put of same expiry." },
  { name: "Short Straddle", timeframe: "INTRADAY", rules: "Expect range-bound market; sell ATM call and ATM put with strict risk controls." },
  { name: "Long Strangle", timeframe: "INTRADAY", rules: "Expect large volatility expansion; buy OTM call and OTM put." },
  { name: "Short Strangle", timeframe: "INTRADAY", rules: "Expect low volatility/range; sell OTM call and OTM put with hedges." },
  { name: "Iron Condor", timeframe: "INTRADAY", rules: "Range strategy; combine bull put spread + bear call spread with defined risk." },
  { name: "Long Call Butterfly", timeframe: "INTRADAY", rules: "Neutral to low-volatility view around center strike; limited risk/reward strategy." }
];

export default function StrategiesPage() {
  const { strategies } = useJournalState();
  const { createStrategy } = useJournalActions();
  const [name, setName] = useState("");
  const [timeframe, setTimeframe] = useState<StrategyTimeframe>("INTRADAY");
  const [rules, setRules] = useState("");
  const [importMessage, setImportMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    createStrategy({
      id: generateId(),
      name: name.trim(),
      timeframe,
      rules: rules.trim(),
      createdAt: new Date().toISOString()
    });

    setName("");
    setRules("");
    setTimeframe("INTRADAY");
  };

  const handleAddCommonStrategies = () => {
    const existing = new Set(strategies.map((strategy) => strategy.name.trim().toLowerCase()));
    const toAdd = COMMON_OPTIONS_STRATEGIES.filter((strategy) => !existing.has(strategy.name.toLowerCase()));

    toAdd.forEach((strategy) => {
      createStrategy({
        id: generateId(),
        name: strategy.name,
        timeframe: strategy.timeframe,
        rules: strategy.rules,
        createdAt: new Date().toISOString()
      });
    });

    if (toAdd.length === 0) {
      setImportMessage("All common strategies are already added.");
      return;
    }
    setImportMessage(`Added ${toAdd.length} common strategies.`);
  };

  return (
    <section className="page">
      <h2>Strategies</h2>
      <form className="form-card" onSubmit={handleSubmit}>
        <button type="button" className="secondary" onClick={handleAddCommonStrategies}>
          Add Common Strategies (Web)
        </button>
        {importMessage && <p className="subtext">{importMessage}</p>}
        <label>
          Strategy Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="ORB Breakout" required />
        </label>
        <label>
          Timeframe
          <select value={timeframe} onChange={(event) => setTimeframe(event.target.value as StrategyTimeframe)}>
            <option value="SCALPING">Scalping</option>
            <option value="INTRADAY">Intraday</option>
            <option value="POSITIONAL">Positional</option>
          </select>
        </label>
        <label>
          Rules
          <textarea value={rules} onChange={(event) => setRules(event.target.value)} rows={3} placeholder="Entry/exit rules" />
        </label>
        <button type="submit">Add Strategy</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Timeframe</th>
              <th>Rules</th>
            </tr>
          </thead>
          <tbody>
            {strategies.length === 0 && (
              <tr>
                <td colSpan={3}>No strategies yet.</td>
              </tr>
            )}
            {strategies.map((strategy) => (
              <tr key={strategy.id}>
                <td>{strategy.name}</td>
                <td>{strategy.timeframe ?? "-"}</td>
                <td>{strategy.rules || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
