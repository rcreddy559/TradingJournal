import { useMemo } from "react";
import { DailyPnl, formatCurrency } from "../../lib/calculations";

interface PnlCalendarProps {
  daily: DailyPnl[];
}

interface Cell {
  date: string;
  pnl: number;
  trades: number;
  intensity: number;
}

const formatLabel = (date: string): string => {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}`;
};

export default function PnlCalendar({ daily }: PnlCalendarProps) {
  const cells = useMemo<Cell[]>(() => {
    if (daily.length === 0) return [];
    const maxAbs = Math.max(...daily.map((day) => Math.abs(day.pnl)), 1);
    return daily
      .slice(-70)
      .map((day) => ({
        date: day.date,
        pnl: day.pnl,
        trades: day.trades,
        intensity: Math.min(1, Math.abs(day.pnl) / maxAbs),
      }));
  }, [daily]);

  if (cells.length === 0) {
    return <p className="subtext">No daily results yet.</p>;
  }

  return (
    <div className="chart-card">
      <div className="chart-head">
        <span>Daily P&L (last {cells.length} trading days)</span>
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const positive = cell.pnl >= 0;
          const alpha = 0.2 + cell.intensity * 0.8;
          const background = positive
            ? `rgba(50, 210, 150, ${alpha})`
            : `rgba(255, 106, 106, ${alpha})`;
          return (
            <div
              key={cell.date}
              className="calendar-cell"
              style={{ background }}
              title={`${cell.date} • ${formatCurrency(cell.pnl)} • ${cell.trades} trade(s)`}
            >
              <span className="calendar-date">{formatLabel(cell.date)}</span>
              <span className="calendar-pnl">
                {cell.pnl >= 0 ? "+" : ""}
                {Math.round(cell.pnl)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
