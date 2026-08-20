// src/features/journal/components/calendar/MonthBlock.tsx
import { DailyPnl } from "../../lib/calculations";
import { buildDayLabel, buildMonthGrid, resolveDayStateClass } from "../../lib/calendarUtils";
import DayCell from "./DayCell";
import "./calendar.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOW = ["S","M","T","W","T","F","S"];

interface MonthBlockProps {
  year: number;
  month: number; // 0-indexed
  dayMap: Map<string, DailyPnl>;
  maxAbsPnl: number;
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  todayStr: string;
  onDayClick: (date: string) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function MonthBlock({
  year, month, dayMap, maxAbsPnl, dayNotes,
  selectedDate, todayStr, onDayClick,
}: MonthBlockProps) {
  const grid = buildMonthGrid(year, month);

  return (
    <div className="cal-month-block">
      <div className="cal-month-name">{MONTH_NAMES[month]}</div>
      <div className="cal-dow-row">
        {DOW.map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
      </div>
      <div className="cal-days-grid">
        {grid.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={i} className="cal-day empty" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
          const data = dayMap.get(dateStr);
          const colorClass = resolveDayStateClass(data, maxAbsPnl);
          return (
            <DayCell
              key={dateStr}
              dayNum={dayNum}
              colorClass={colorClass}
              isToday={dateStr === todayStr}
              isSelected={dateStr === selectedDate}
              hasNote={!!dayNotes[dateStr]}
              label={buildDayLabel(dateStr, data)}
              onClick={() => onDayClick(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}
