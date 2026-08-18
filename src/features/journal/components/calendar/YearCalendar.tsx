// src/features/journal/components/calendar/YearCalendar.tsx
import { DailyPnl } from "../../lib/calculations";
import MonthBlock from "./MonthBlock";
import "./calendar.css";

interface YearCalendarProps {
  year: number;
  dayMap: Map<string, DailyPnl>;
  maxAbsPnl: number;
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  todayStr: string;
  onDayClick: (date: string) => void;
}

export default function YearCalendar({
  year, dayMap, maxAbsPnl, dayNotes,
  selectedDate, todayStr, onDayClick,
}: YearCalendarProps) {
  return (
    <div className="cal-year-grid">
      {Array.from({ length: 12 }, (_, m) => (
        <MonthBlock
          key={m}
          year={year}
          month={m}
          dayMap={dayMap}
          maxAbsPnl={maxAbsPnl}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          todayStr={todayStr}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
