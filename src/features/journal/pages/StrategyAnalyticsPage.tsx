import { useMemo } from "react";
import { useJournalSelectors, useJournalState } from "../store/hooks";
import {
  calculateStrategyStats,
  formatCurrency,
} from "../lib/calculations";

const formatFactor = (value: number): string => {
  if (!Number.isFinite(value)) return "\u221e";
  return value.toFixed(2);
};

const formatR = (value: number | null): string =>
  value === null ? "-" : `${value.toFixed(2)}R`;

export default function StrategyAnalyticsPage() {
  const { strategies } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const stats = useMemo(
    () => calculateStrategyStats(filteredTrades, strategies),
    [filteredTrades, strategies],
  );
  const used = stats.filter((stat) => stat.trades > 0);

  return (
    <section className="page">
      <h2>Strategy Analytics</h2>
      <p className="subtext">
        Performance per strategy within the selected date range. Retire
        strategies with a negative expectancy.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Strategy</th>
              <th>Trades</th>
              <th>Win Rate</th>
              <th>Net P&L</th>
              <th>Expectancy</th>
              <th>Profit Factor</th>
              <th>Avg R</th>
            </tr>
          </thead>
          <tbody>
            {used.length === 0 && (
              <tr>
                <td colSpan={7}>No trades in the selected range.</td>
              </tr>
            )}
            {used.map((stat) => (
              <tr key={stat.id}>
                <td>{stat.name}</td>
                <td>{stat.trades}</td>
                <td>{stat.winRate.toFixed(1)}%</td>
                <td className={stat.netPnl >= 0 ? "profit" : "loss"}>
                  {formatCurrency(stat.netPnl)}
                </td>
                <td className={stat.expectancy >= 0 ? "profit" : "loss"}>
                  {formatCurrency(stat.expectancy)}
                </td>
                <td>{formatFactor(stat.profitFactor)}</td>
                <td>{formatR(stat.avgRMultiple)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
