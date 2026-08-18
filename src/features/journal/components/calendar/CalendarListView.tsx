import { DailyPnl, formatCurrency } from "../../lib/calculations";
import "./calendar.css";

interface CalendarListViewProps {
  daily: DailyPnl[];
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

const formatDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export default function CalendarListView({
  daily, dayNotes, selectedDate, onDayClick,
}: CalendarListViewProps) {
  const sorted = [...daily].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return <p className="subtext">No trading days recorded yet.</p>;
  }

  return (
    <div className="cal-list-view">
      {sorted.map(day => {
        const note = dayNotes[day.date] ?? "";
        return (
          <div
            key={day.date}
            className={`cal-list-row${selectedDate === day.date ? " selected" : ""}`}
            onClick={() => onDayClick(day.date)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDayClick(day.date); } }}
          >
            <span className="cal-list-date">{formatDateLabel(day.date)}</span>
            <span className="cal-list-count">{day.trades} trade{day.trades !== 1 ? "s" : ""}</span>
            <span className="cal-list-note">{note || "—"}</span>
            <span className={`cal-list-pnl ${day.pnl >= 0 ? "profit" : "loss"}`}>
              {day.pnl >= 0 ? "+" : ""}{formatCurrency(day.pnl)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
