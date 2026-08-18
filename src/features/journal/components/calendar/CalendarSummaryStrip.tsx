import { useMemo } from "react";
import { Trade } from "../../types/trade";
import { buildDailyPnl, formatCurrency } from "../../lib/calculations";
import "./calendar.css";

interface CalendarSummaryStripProps {
  trades: Trade[];
}

export default function CalendarSummaryStrip({ trades }: CalendarSummaryStripProps) {
  const stats = useMemo(() => {
    const daily = buildDailyPnl(trades);
    const netPnl = daily.reduce((s, d) => s + d.pnl, 0);
    const tradingDays = daily.length;
    const winDays = daily.filter(d => d.pnl > 0).length;
    const lossDays = daily.filter(d => d.pnl < 0).length;
    const bestDay = daily.length ? Math.max(...daily.map(d => d.pnl)) : 0;
    const worstDay = daily.length ? Math.min(...daily.map(d => d.pnl)) : 0;
    return { netPnl, tradingDays, winDays, lossDays, bestDay, worstDay };
  }, [trades]);

  const cards: { label: string; value: string; cls?: string }[] = [
    { label: "Net P&L (YTD)", value: formatCurrency(stats.netPnl), cls: stats.netPnl >= 0 ? "profit" : "loss" },
    { label: "Trading Days", value: String(stats.tradingDays) },
    { label: "Win Days",     value: String(stats.winDays),    cls: "profit" },
    { label: "Loss Days",    value: String(stats.lossDays),   cls: "loss" },
    { label: "Best Day",     value: formatCurrency(stats.bestDay),  cls: "profit" },
    { label: "Worst Day",    value: formatCurrency(stats.worstDay), cls: "loss" },
  ];

  return (
    <div className="cal-summary-strip">
      {cards.map(c => (
        <div key={c.label} className="cal-summary-card">
          <div className="label">{c.label}</div>
          <div className={`value ${c.cls ?? ""}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
