import { useJournalSelectors, useJournalState } from "../store/hooks";
import { calculateDashboardMetrics, formatCurrency } from "../lib/calculations";

export default function DashboardPage() {
  const { strategies } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const metrics = calculateDashboardMetrics(filteredTrades, strategies);

  return (
    <section className="page">
      <h2>Dashboard</h2>
      <div className="metrics-grid">
        <article className="metric-card"><span>Total Trades</span><strong>{metrics.totalTrades}</strong></article>
        <article className="metric-card"><span>Net P&L</span><strong className={metrics.netPnl >= 0 ? "profit" : "loss"}>{formatCurrency(metrics.netPnl)}</strong></article>
        <article className="metric-card"><span>Total Profit</span><strong className="profit">{formatCurrency(metrics.totalProfit)}</strong></article>
        <article className="metric-card"><span>Total Loss</span><strong className="loss">{formatCurrency(metrics.totalLoss)}</strong></article>
        <article className="metric-card"><span>Win Rate</span><strong>{metrics.winRate.toFixed(1)}%</strong></article>
        <article className="metric-card"><span>Avg Daily P&L</span><strong>{formatCurrency(metrics.avgDailyPnl)}</strong></article>
        <article className="metric-card"><span>Best Strategy</span><strong>{metrics.bestStrategy}</strong></article>
        <article className="metric-card"><span>Worst Strategy</span><strong>{metrics.worstStrategy}</strong></article>
      </div>
    </section>
  );
}
