import { useState } from "react";
import { DailyPnl, formatCurrency } from "../../lib/calculations";
import { buildDayLabel, buildMonthGrid, resolveDayStateClass } from "../../lib/calendarUtils";
import "./calendar.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOW_FULL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const pad = (n: number) => String(n).padStart(2, "0");

interface MonthCalendarProps {
  initialYear: number;
  initialMonth: number; // 0-indexed
  dayMap: Map<string, DailyPnl>;
  maxAbsPnl: number;
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  todayStr: string;
  onDayClick: (date: string) => void;
}

export default function MonthCalendar({
  initialYear, initialMonth, dayMap, maxAbsPnl,
  dayNotes, selectedDate, todayStr, onDayClick,
}: MonthCalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const grid = buildMonthGrid(year, month);

  return (
    <div className="cal-month-view">
      <div className="cal-month-view-header">
        <button className="nav-btn" onClick={prevMonth}>‹</button>
        <span>{MONTH_NAMES[month]} {year}</span>
        <button className="nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-month-large-grid">
        {DOW_FULL.map(d => (
          <div key={d} className="cal-month-large-dow">{d}</div>
        ))}
        {grid.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={i} className="cal-large-day empty" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
          const data = dayMap.get(dateStr);
          const colorClass = resolveDayStateClass(data, maxAbsPnl);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const cls = ["cal-large-day", colorClass, isToday ? "today" : "", isSelected ? "selected" : ""]
            .filter(Boolean).join(" ");
          const label = buildDayLabel(dateStr, data);

          return (
            <div key={dateStr} className={cls}
              onClick={() => onDayClick(dateStr)}
              role="button"
              tabIndex={0}
              title={label}
              aria-label={label}
              aria-pressed={isSelected}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDayClick(dateStr); } }}>
              <div className="day-num">{dayNum}</div>
              {data && (
                <>
                  <div className={`day-pnl ${data.pnl >= 0 ? "profit" : "loss"}`}>
                    {data.pnl >= 0 ? "+" : ""}{formatCurrency(data.pnl)}
                  </div>
                  <div className="day-count">{data.trades} trade{data.trades !== 1 ? "s" : ""}</div>
                </>
              )}
              {dayNotes[dateStr] && <span className="note-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
