import { useMemo } from "react";
import { useJournalSelectors } from "../store/hooks";
import {
  calculateEmotionStats,
  calculateMistakeStats,
  CategoryStat,
  formatCurrency,
} from "../lib/calculations";

const LABELS: Record<string, string> = {
  CALM: "Calm",
  CONFIDENT: "Confident",
  FEAR: "Fear",
  GREED: "Greed",
  REVENGE: "Revenge",
  FOMO: "FOMO",
  HESITANT: "Hesitant",
  OVERTRADING: "Overtrading",
  REVENGE_TRADE: "Revenge Trade",
  EARLY_EXIT: "Early Exit",
  LATE_ENTRY: "Late Entry",
  NO_STOP_LOSS: "No Stop Loss",
  RULE_BREAK: "Rule Break",
};

function StatTable({
  title,
  caption,
  rows,
  headLabel,
}: {
  title: string;
  caption: string;
  rows: CategoryStat[];
  headLabel: string;
}) {
  return (
    <div className="analytics-block">
      <h3>{title}</h3>
      <p className="subtext">{caption}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{headLabel}</th>
              <th>Trades</th>
              <th>Win Rate</th>
              <th>Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>No data in the selected range.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{LABELS[row.key] ?? row.key}</td>
                <td>{row.trades}</td>
                <td>{row.winRate.toFixed(1)}%</td>
                <td className={row.netPnl >= 0 ? "profit" : "loss"}>
                  {formatCurrency(row.netPnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PsychologyPage() {
  const { filteredTrades } = useJournalSelectors();
  const emotions = useMemo(
    () => calculateEmotionStats(filteredTrades),
    [filteredTrades],
  );
  const mistakes = useMemo(
    () => calculateMistakeStats(filteredTrades),
    [filteredTrades],
  );

  const worstEmotion = emotions[0];
  const topMistake = mistakes[0];

  return (
    <section className="page">
      <h2>Psychology & Mistakes</h2>

      <div className="metrics-grid">
        <article className="metric-card">
          <span>Most Costly Emotion</span>
          <strong>{worstEmotion ? LABELS[worstEmotion.key] ?? worstEmotion.key : "-"}</strong>
        </article>
        <article className="metric-card">
          <span>Most Frequent Mistake</span>
          <strong>{topMistake ? LABELS[topMistake.key] ?? topMistake.key : "-"}</strong>
        </article>
        <article className="metric-card">
          <span>Mistake Trades</span>
          <strong>
            {mistakes.reduce((sum, mistake) => sum + mistake.trades, 0)}
          </strong>
        </article>
      </div>

      <StatTable
        title="By Emotion Before Trade"
        caption="Sorted by net P&L so the most damaging emotional state is on top."
        rows={emotions}
        headLabel="Emotion"
      />
      <StatTable
        title="By Mistake Type"
        caption="Only trades tagged with a mistake are included."
        rows={mistakes}
        headLabel="Mistake"
      />
    </section>
  );
}
