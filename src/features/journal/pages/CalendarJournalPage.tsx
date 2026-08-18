// src/features/journal/pages/CalendarJournalPage.tsx
import { useCallback, useMemo, useState } from "react";
import { useJournalSelectors, useJournalState, useJournalActions } from "../store/hooks";
import { buildDailyPnl } from "../lib/calculations";
import { buildDayMap } from "../lib/calendarUtils";
import { journalService } from "../api/journalService";
import CalendarSummaryStrip from "../components/calendar/CalendarSummaryStrip";
import YearCalendar from "../components/calendar/YearCalendar";
import MonthCalendar from "../components/calendar/MonthCalendar";
import CalendarListView from "../components/calendar/CalendarListView";
import DayDrawer from "../components/calendar/DayDrawer";
import "../components/calendar/calendar.css";

type CalViewMode = "year" | "month" | "list";

const todayStr = (): string => new Date().toISOString().slice(0, 10);

export default function CalendarJournalPage() {
  const { trades } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const { startEditTrade } = useJournalActions();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<CalViewMode>("year");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Day notes — loaded once, mutated in place and written to localStorage
  const [dayNotes, setDayNotes] = useState<Record<string, string>>(
    () => journalService.getDayNotes()
  );

  const daily = useMemo(() => buildDailyPnl(filteredTrades), [filteredTrades]);
  const dayMap = useMemo(() => buildDayMap(daily), [daily]);
  const maxAbsPnl = useMemo(
    () => daily.reduce((m, d) => Math.max(m, Math.abs(d.pnl)), 1),
    [daily]
  );

  const tradesForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => t.tradeDate === selectedDate);
  }, [trades, selectedDate]);

  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(d => d === date ? null : date);
  }, []);

  const handleNoteChange = useCallback((note: string) => {
    if (!selectedDate) return;
    const date = selectedDate; // capture at call time
    setDayNotes(prev => {
      const next = { ...prev, [date]: note };
      journalService.saveDayNotes(next);
      return next;
    });
  }, [selectedDate]);

  const handleTradeClick = useCallback((tradeId: string) => {
    startEditTrade(tradeId);
  }, [startEditTrade]);

  const handleAddNote = () => {
    const today = todayStr();
    setSelectedDate(today);
  };

  return (
    <section className="page">
      <CalendarSummaryStrip trades={filteredTrades} />

      {/* Top bar */}
      <div className="cal-topbar">
        <div className="cal-year-nav">
          <button className="nav-btn" onClick={() => setYear(y => y - 1)}>
            ← {year - 1}
          </button>
          <span className="year-label">{year}</span>
          <button className="nav-btn" onClick={() => setYear(y => y + 1)}>
            {year + 1} →
          </button>
        </div>

        <div className="cal-view-tabs">
          {(["year", "month", "list"] as CalViewMode[]).map(mode => (
            <button
              key={mode}
              className={`cal-tab${viewMode === mode ? " active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <button className="cal-add-note-btn" onClick={handleAddNote}>
          📝 Add Note
        </button>
      </div>

      {/* Calendar body */}
      {viewMode === "year" && (
        <YearCalendar
          year={year}
          dayMap={dayMap}
          maxAbsPnl={maxAbsPnl}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          todayStr={todayStr()}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === "month" && (
        <MonthCalendar
          initialYear={year}
          initialMonth={now.getMonth()}
          dayMap={dayMap}
          maxAbsPnl={maxAbsPnl}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          todayStr={todayStr()}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === "list" && (
        <CalendarListView
          daily={daily}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
        />
      )}

      {/* Legend */}
      <div className="cal-legend">
        <div className="cal-legend-group">
          <span>Min loss</span>
          <div className="cal-swatch-row">
            {[0.22, 0.42, 0.65, 1].map((a, i) => (
              <div key={i} className="cal-swatch"
                style={{ background: `rgba(255,106,106,${a})` }} />
            ))}
          </div>
          <span>Max loss</span>
        </div>
        <div className="cal-legend-group">
          <span>Min profit</span>
          <div className="cal-swatch-row">
            {[0.22, 0.42, 0.65, 1].map((a, i) => (
              <div key={i} className="cal-swatch"
                style={{ background: a === 1 ? "var(--green)" : `rgba(50,210,150,${a})` }} />
            ))}
          </div>
          <span>Max profit</span>
        </div>
        <div className="cal-legend-group">
          <div className="cal-swatch" style={{ background: "rgba(139,92,246,0.38)" }} />
          <span>Unrealised / Rejected</span>
        </div>
        <div className="cal-legend-group">
          <div className="cal-swatch"
            style={{ boxShadow: "0 0 0 2px var(--accent)", background: "var(--panel)" }} />
          <span>Today</span>
        </div>
      </div>

      {/* Day drawer */}
      {selectedDate && (
        <DayDrawer
          dateStr={selectedDate}
          trades={tradesForSelected}
          note={dayNotes[selectedDate] ?? ""}
          onNoteChange={handleNoteChange}
          onClose={() => setSelectedDate(null)}
          onTradeClick={handleTradeClick}
        />
      )}
    </section>
  );
}
