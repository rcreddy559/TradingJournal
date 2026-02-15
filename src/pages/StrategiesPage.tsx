import { FormEvent, useState } from "react";
import { Strategy, StrategyTimeframe } from "../types/trade";

interface StrategiesPageProps {
  strategies: Strategy[];
  onCreate: (strategy: Strategy) => void;
}

export default function StrategiesPage({ strategies, onCreate }: StrategiesPageProps) {
  const [name, setName] = useState("");
  const [timeframe, setTimeframe] = useState<StrategyTimeframe>("INTRADAY");
  const [rules, setRules] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

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

    onCreate({
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

  return (
    <section className="page">
      <h2>Strategies</h2>
      <form className="form-card" onSubmit={handleSubmit}>
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
