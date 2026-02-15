import { Fragment, useMemo, useState } from "react";
import { Strategy, Trade } from "../types/trade";
import { formatCurrency } from "../utils/calculations";

interface TradesPageProps {
  trades: Trade[];
  strategies: Strategy[];
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEditTrade: (tradeId: string) => void;
  onDeleteTrade: (tradeId: string) => void;
}

export default function TradesPage({
  trades,
  strategies,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onEditTrade,
  onDeleteTrade,
}: TradesPageProps) {
  const formatDateIndian = (dateValue: string): string => {
    if (!dateValue) return "-";
    const parts = dateValue.split("-");
    if (parts.length !== 3) return dateValue;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const [activePreset, setActivePreset] = useState<
    "CUSTOM" | "DAY" | "WEEK" | "MONTH"
  >("CUSTOM");
  const [notesQuery, setNotesQuery] = useState("");
  const [mistakeOnly, setMistakeOnly] = useState(false);
  const [dateSort, setDateSort] = useState<"DESC" | "ASC">("DESC");
  const strategyMap = useMemo(
    () => new Map(strategies.map((s) => [s.id, s.name])),
    [strategies],
  );

  const toDateInputValue = (date: Date): string => {
    return date.toISOString().slice(0, 10);
  };

  const applyPreset = (preset: "DAY" | "WEEK" | "MONTH") => {
    const now = new Date();
    const today = toDateInputValue(now);

    if (preset === "DAY") {
      onStartDateChange(today);
      onEndDateChange(today);
      setActivePreset("DAY");
      return;
    }

    if (preset === "WEEK") {
      const start = new Date(now);
      const day = start.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diffToMonday);
      onStartDateChange(toDateInputValue(start));
      onEndDateChange(today);
      setActivePreset("WEEK");
      return;
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    onStartDateChange(toDateInputValue(monthStart));
    onEndDateChange(today);
    setActivePreset("MONTH");
  };

  const filteredTrades = useMemo(() => {
    const filtered = trades.filter((trade) => {
      const inStart = !startDate || trade.tradeDate >= startDate;
      const inEnd = !endDate || trade.tradeDate <= endDate;
      const query = notesQuery.trim().toLowerCase();
      const notesText = [
        trade.notes ?? "",
        trade.entryReason ?? "",
        trade.exitReason ?? "",
        trade.lessonLearned ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesNotes = !query || notesText.includes(query);
      const matchesMistake =
        !mistakeOnly || (trade.mistakeType && trade.mistakeType !== "NONE");
      return inStart && inEnd && matchesNotes && matchesMistake;
    });

    filtered.sort((a, b) => {
      const aTime = new Date(a.tradeDate).getTime();
      const bTime = new Date(b.tradeDate).getTime();
      return dateSort === "DESC" ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [trades, startDate, endDate, notesQuery, mistakeOnly, dateSort]);

  const summary = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const netPnl = filteredTrades.reduce((sum, trade) => sum + trade.netPnl, 0);
    const totalCharges = filteredTrades.reduce(
      (sum, trade) => sum + trade.charges,
      0,
    );
    const totalInvestment = filteredTrades.reduce(
      (sum, trade) => sum + trade.buyPrice * trade.quantity,
      0,
    );
    const totalSellValue = filteredTrades.reduce(
      (sum, trade) => sum + trade.sellPrice * trade.quantity,
      0,
    );
    const grossPnl = netPnl + totalCharges;
    const tradesWithNotes = filteredTrades.filter(
      (trade) => (trade.notes ?? "").trim().length > 0,
    ).length;
    const mistakeTrades = filteredTrades.filter(
      (trade) => trade.mistakeType && trade.mistakeType !== "NONE",
    ).length;

    const mistakeCounts = filteredTrades.reduce<Record<string, number>>(
      (acc, trade) => {
        const key = trade.mistakeType;
        if (!key || key === "NONE") return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const topMistake =
      Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    return {
      totalTrades,
      netPnl,
      grossPnl,
      totalCharges,
      totalInvestment,
      totalSellValue,
      tradesWithNotes,
      mistakeTrades,
      topMistake,
    };
  }, [filteredTrades]);

  return (
    <section className="page">
      <h2>Trades</h2>
      <div className="filters-row">
        <div className="quick-filter-row">
          <button
            type="button"
            className={
              activePreset === "DAY" ? "secondary active-pill" : "secondary"
            }
            onClick={() => applyPreset("DAY")}
          >
            Day
          </button>
          <button
            type="button"
            className={
              activePreset === "WEEK" ? "secondary active-pill" : "secondary"
            }
            onClick={() => applyPreset("WEEK")}
          >
            Week
          </button>
          <button
            type="button"
            className={
              activePreset === "MONTH" ? "secondary active-pill" : "secondary"
            }
            onClick={() => applyPreset("MONTH")}
          >
            Month
          </button>
        </div>
        <label>
          Start Date
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setActivePreset("CUSTOM");
              onStartDateChange(event.target.value);
            }}
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setActivePreset("CUSTOM");
              onEndDateChange(event.target.value);
            }}
          />
        </label>
        <label>
          Notes Search
          <input
            type="text"
            value={notesQuery}
            onChange={(event) => setNotesQuery(event.target.value)}
            placeholder="Search notes, entry, exit, lesson"
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={mistakeOnly}
            onChange={(event) => setMistakeOnly(event.target.checked)}
          />
          Show Mistake Trades Only
        </label>
        <label>
          Sort by Date
          <select
            value={dateSort}
            onChange={(event) =>
              setDateSort(event.target.value as "DESC" | "ASC")
            }
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </select>
        </label>
      </div>

      <div className="metrics-grid trades-summary-grid">
        <article className="metric-card">
          <span>Net P/L</span>
          <strong className={summary.netPnl >= 0 ? "profit" : "loss"}>
            {formatCurrency(summary.netPnl)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Total Investment</span>
          <strong>{formatCurrency(summary.totalInvestment)}</strong>
        </article>
        <article className="metric-card">
          <span>Total Sell Value</span>
          <strong>{formatCurrency(summary.totalSellValue)}</strong>
        </article>
        <article className="metric-card">
          <span>Gross P/L (Before Charges)</span>
          <strong className={summary.grossPnl >= 0 ? "profit" : "loss"}>
            {formatCurrency(summary.grossPnl)}
          </strong>
        </article>
        <article className="metric-card">
          <span>Total Charges</span>
          <strong>{formatCurrency(summary.totalCharges)}</strong>
        </article>
        <article className="metric-card">
          <span>Total Trades</span>
          <strong>{summary.totalTrades}</strong>
        </article>
        <article className="metric-card">
          <span>Trades With Notes</span>
          <strong>{summary.tradesWithNotes}</strong>
        </article>
        <article className="metric-card">
          <span>Mistake Trades</span>
          <strong>{summary.mistakeTrades}</strong>
        </article>
        <article className="metric-card">
          <span>Top Mistake</span>
          <strong>{summary.topMistake}</strong>
        </article>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Instrument</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Qty</th>
              <th>Charges</th>
              <th>P&L</th>
              <th>Strategy</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 && (
              <tr>
                <td colSpan={10}>No trades for selected range.</td>
              </tr>
            )}
            {filteredTrades.map((trade) => (
              <Fragment key={trade.id}>
                <tr className="trade-main-row">
                  <td>{formatDateIndian(trade.tradeDate)}</td>
                  <td>{trade.instrument}</td>
                  <td>{trade.buyPrice}</td>
                  <td>{trade.sellPrice}</td>
                  <td>{trade.quantity}</td>
                  <td>{trade.charges}</td>
                  <td className={trade.netPnl >= 0 ? "profit" : "loss"}>
                    {formatCurrency(trade.netPnl)}
                  </td>
                  <td>{strategyMap.get(trade.strategyId) ?? "Unknown"}</td>
                  <td>{trade.status}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onEditTrade(trade.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this trade? This cannot be undone.",
                            )
                          ) {
                            onDeleteTrade(trade.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="trade-notes-row">
                  <td colSpan={10}>
                    <div className="notes-cell">
                      <div className="notes-main">
                        <span className="subtext">Notes:</span>
                        <div className="notes-full">{trade.notes || "-"}</div>
                      </div>
                      <div className="note-tags">
                        {trade.mistakeType && trade.mistakeType !== "NONE" && (
                          <span className="note-chip">
                            Mistake: {trade.mistakeType}
                          </span>
                        )}
                        {trade.emotionBefore && (
                          <span className="note-chip">
                            Before: {trade.emotionBefore}
                          </span>
                        )}
                        {trade.emotionAfter && (
                          <span className="note-chip">
                            After: {trade.emotionAfter}
                          </span>
                        )}
                        {!!trade.confidenceScore && (
                          <span className="note-chip">
                            Conf: {trade.confidenceScore}/5
                          </span>
                        )}
                      </div>
                      {(trade.entryReason ||
                        trade.exitReason ||
                        trade.lessonLearned) && (
                        <details>
                          <summary className="subtext">
                            View Journal Details
                          </summary>
                          {trade.entryReason && (
                            <div className="subtext">
                              Entry: {trade.entryReason}
                            </div>
                          )}
                          {trade.exitReason && (
                            <div className="subtext">
                              Exit: {trade.exitReason}
                            </div>
                          )}
                          {trade.lessonLearned && (
                            <div className="subtext">
                              Lesson: {trade.lessonLearned}
                            </div>
                          )}
                        </details>
                      )}
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
