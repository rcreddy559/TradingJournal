import { useMemo } from "react";
import { useJournalSelectors, useJournalState } from "../store/hooks";
import {
  buildDailyPnl,
  buildEquityCurve,
  calculateDashboardMetrics,
  formatCurrency,
} from "../lib/calculations";
import EquityCurveChart from "../components/charts/EquityCurveChart";
import PnlCalendar from "../components/charts/PnlCalendar";

const formatFactor = (value: number): string => {
  if (!Number.isFinite(value)) return "\u221e";
  return value.toFixed(2);
};

export default function DashboardPage() {
  const { strategies } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const metrics = calculateDashboardMetrics(filteredTrades, strategies);
  const equity = useMemo(
    () => buildEquityCurve(filteredTrades),
    [filteredTrades],
  );
  const daily = useMemo(() => buildDailyPnl(filteredTrades), [filteredTrades]);

  return (
    <section className="page">
      <h2>Dashboard</h2>
      <div className="metrics-grid">
        <article className="metric-card">
          <span>Total Trades</span>
          <strong>{metrics.totalTrades}</strong>
        </article>
        <article className="metric-card">
          <span>Net P&L</span>
          <strong className={metrics.netPnl >= 0 ? "profit" : "loss"}>
            {formatCurrency(metrics.netPnl)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Win Rate</span>
          <strong>{metrics.winRate.toFixed(1)}%</strong>
        </article>
        <article className="metric-card">
          <span>Profit Factor</span>
          <strong>{formatFactor(metrics.profitFactor)}</strong>
        </article>
        <article className="metric-card">
          <span>Expectancy / Trade</span>
          <strong className={metrics.expectancy >= 0 ? "profit" : "loss"}>
            {formatCurrency(metrics.expectancy)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Avg Daily P&L</span>
          <strong className={metrics.avgDailyPnl >= 0 ? "profit" : "loss"}>
            {formatCurrency(metrics.avgDailyPnl)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Avg Win</span>
          <strong className="profit">{formatCurrency(metrics.avgWin)}</strong>
        </article>
        <article className="metric-card">
          <span>Avg Loss</span>
          <strong className="loss">{formatCurrency(metrics.avgLoss)}</strong>
        </article>
        <article className="metric-card">
          <span>Largest Win</span>
          <strong className="profit">
            {formatCurrency(metrics.largestWin)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Largest Loss</span>
          <strong className="loss">
            {formatCurrency(metrics.largestLoss)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Win / Loss Streak</span>
          <strong>
            {metrics.maxWinStreak}W / {metrics.maxLossStreak}L
          </strong>
        </article>
        <article className="metric-card">
          <span>Best Strategy</span>
          <strong>{metrics.bestStrategy}</strong>
        </article>
        <article className="metric-card">
          <span>Worst Strategy</span>
          <strong>{metrics.worstStrategy}</strong>
        </article>
      </div>

      <div className="charts-column">
        <EquityCurveChart points={equity} />
        <PnlCalendar daily={daily} />
      </div>
    </section>
  );
}
