import { useCallback, useEffect, useRef } from "react";
import { Trade } from "../../types/trade";
import { formatCurrency } from "../../lib/calculations";
import "./calendar.css";

interface DayDrawerProps {
  dateStr: string;        // YYYY-MM-DD
  trades: Trade[];        // trades for this day (already filtered)
  note: string;
  onNoteChange: (note: string) => void;
  onClose: () => void;
  onTradeClick: (tradeId: string) => void;
}

const EMOTION_LABELS: Record<string, string> = {
  CALM: "😌 Calm", CONFIDENT: "😎 Confident", FEAR: "😨 Fear",
  GREED: "🤑 Greed", REVENGE: "😤 Revenge", FOMO: "😰 FOMO", HESITANT: "😟 Hesitant",
};

const formatDateHeading = (dateStr: string): { label: string; dayOfWeek: string } => {
  const d = new Date(dateStr + "T00:00:00");
  return {
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    dayOfWeek: d.toLocaleDateString("en-IN", { weekday: "long" }),
  };
};

export default function DayDrawer({
  dateStr, trades, note, onNoteChange, onClose, onTradeClick,
}: DayDrawerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { label, dayOfWeek } = formatDateHeading(dateStr);

  const dayPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const wins = trades.filter(t => t.netPnl > 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const emotion = trades[0]?.emotionBefore;

  const handleNoteInput = useCallback((val: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onNoteChange(val), 300);
  }, [onNoteChange]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <div className="cal-drawer-backdrop" onClick={onClose} />
      <aside className="cal-drawer">
        <button className="cal-drawer-close" onClick={onClose} aria-label="Close">✕</button>

        <div>
          <div className="cal-drawer-date">{label} · {dayOfWeek}</div>
          <div className={`cal-drawer-pnl ${dayPnl >= 0 ? "profit" : "loss"}`}>
            {dayPnl >= 0 ? "+" : ""}{formatCurrency(dayPnl)}
          </div>
          <div className="cal-drawer-meta">
            {trades.length} trade{trades.length !== 1 ? "s" : ""} · Win rate {winRate}%
          </div>
        </div>

        {trades.length > 0 && (
          <div>
            <div className="cal-drawer-section-title">Trades</div>
            {trades.map(t => (
              <div key={t.id} className="cal-trade-row" onClick={() => onTradeClick(t.id)}>
                <div>
                  <div className="cal-trade-sym">{t.instrument}</div>
                  <div className="cal-trade-meta">{t.optionType ?? t.side ?? ""} · {t.entryTime.slice(11, 16)}–{t.exitTime.slice(11, 16)}</div>
                </div>
                <div className={`cal-trade-pnl ${t.netPnl >= 0 ? "profit" : "loss"}`}>
                  {t.netPnl >= 0 ? "+" : ""}{formatCurrency(t.netPnl)}
                </div>
              </div>
            ))}
          </div>
        )}

        {emotion && (
          <div>
            <div className="cal-drawer-section-title">Emotion Before</div>
            <span className="cal-emotion-tag">{EMOTION_LABELS[emotion] ?? emotion}</span>
          </div>
        )}

        <div>
          <div className="cal-drawer-section-title">Day Note</div>
          <textarea
            className="cal-note-textarea"
            defaultValue={note}
            placeholder="Add a note for this trading day…"
            onChange={e => handleNoteInput(e.target.value)}
          />
        </div>
      </aside>
    </>
  );
}
