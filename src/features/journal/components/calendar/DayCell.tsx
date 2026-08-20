// src/features/journal/components/calendar/DayCell.tsx
import "./calendar.css";

interface DayCellProps {
  dayNum: number;
  colorClass: string;
  isToday: boolean;
  isSelected: boolean;
  hasNote: boolean;
  label: string;
  onClick: () => void;
}

export default function DayCell({
  dayNum,
  colorClass,
  isToday,
  isSelected,
  hasNote,
  label,
  onClick,
}: DayCellProps) {
  const cls = ["cal-day", colorClass, isToday ? "today" : "", isSelected ? "selected" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} onClick={onClick} role="button" tabIndex={0}
      title={label}
      aria-label={label}
      aria-pressed={isSelected}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}>
      {dayNum}
      {hasNote && <span className="note-dot" aria-hidden="true" />}
    </div>
  );
}
