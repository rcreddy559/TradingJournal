import { useMemo, useState } from "react";
import { useJournalActions, useJournalState } from "../store/hooks";
import { calculateRMultiple, formatCurrency } from "../lib/calculations";
import { applyTradeFilters } from "../lib/filters";
import { toTimeInputValue } from "../lib/trade-form/dateTime";
import {
  EMOTION_LABELS,
  EXECUTION_QUALITY_LABELS,
  MISTAKE_LABELS,
} from "../constants/tradeForm";
import { Instrument, Trade, TradeStatus } from "../types/trade";
import { useConfirm } from "../../../shared/ui";

const formatDateIndian = (dateValue: string): string => {
  if (!dateValue) return "-";
  const parts = dateValue.split("-");
  if (parts.length !== 3) return dateValue;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const formatPrice = (value: number | undefined): string =>
  value === undefined || value === null
    ? "-"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
        value,
      );

function Metric({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly tone?: "profit" | "loss";
}) {
  return (
    <div className="trade-metric">
      <span className="trade-metric-label">{label}</span>
      <span className={`trade-metric-value${tone ? ` ${tone}` : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function TradesPage() {
  const { trades, strategies, filters, instruments } = useJournalState();
  const { setStartDate, setEndDate, startEditTrade, deleteTrade } =
    useJournalActions();
  const confirm = useConfirm();
  const { startDate, endDate } = filters;

  const instrumentLabels = useMemo(() => {
    const map = new Map<string, string>();
    instruments.forEach((item) => map.set(item.symbol, item.name));
    return map;
  }, [instruments]);

  const [activePreset, setActivePreset] = useState<
    "CUSTOM" | "DAY" | "WEEK" | "MONTH"
  >("CUSTOM");
  const [notesQuery, setNotesQuery] = useState("");
  const [mistakeOnly, setMistakeOnly] = useState(false);
  const [dateSort, setDateSort] = useState<"DESC" | "ASC">("DESC");
  const [strategyFilter, setStrategyFilter] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState<Instrument | "ALL">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<TradeStatus | "ALL">("ALL");

  const strategyMap = useMemo(
    () => new Map(strategies.map((s) => [s.id, s.name])),
    [strategies],
  );

  const toDateInputValue = (date: Date): string =>
    date.toISOString().slice(0, 10);

  const applyPreset = (preset: "DAY" | "WEEK" | "MONTH") => {
    const now = new Date();
    const today = toDateInputValue(now);

    if (preset === "DAY") {
      setStartDate(today);
      setEndDate(today);
      setActivePreset("DAY");
      return;
    }

    if (preset === "WEEK") {
      const start = new Date(now);
      const day = start.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diffToMonday);
      setStartDate(toDateInputValue(start));
      setEndDate(today);
      setActivePreset("WEEK");
      return;
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(toDateInputValue(monthStart));
    setEndDate(today);
    setActivePreset("MONTH");
  };

  const filteredTrades = useMemo(() => {
    const filtered = applyTradeFilters(trades, {
      startDate,
      endDate,
      notesQuery,
      mistakeOnly,
      strategyId: strategyFilter || undefined,
      instrument: instrumentFilter,
      status: statusFilter,
    });

    filtered.sort((a, b) => {
      const aTime = new Date(a.tradeDate).getTime();
      const bTime = new Date(b.tradeDate).getTime();
      return dateSort === "DESC" ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [
    trades,
    startDate,
    endDate,
    notesQuery,
    mistakeOnly,
    strategyFilter,
    instrumentFilter,
    statusFilter,
    dateSort,
  ]);

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
    const winners = filteredTrades.filter((trade) => trade.netPnl >= 0).length;
    const winRate = totalTrades ? (winners / totalTrades) * 100 : 0;
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
      winRate,
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
              setStartDate(event.target.value);
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
              setEndDate(event.target.value);
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
          Strategy
          <select
            value={strategyFilter}
            onChange={(event) => setStrategyFilter(event.target.value)}
          >
            <option value="">All Strategies</option>
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Instrument
          <select
            value={instrumentFilter}
            onChange={(event) =>
              setInstrumentFilter(event.target.value as Instrument | "ALL")
            }
          >
            <option value="ALL">All Instruments</option>
            {instruments.map((item) => (
              <option key={item.id} value={item.symbol}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TradeStatus | "ALL")
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
          </select>
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
          <span>Win Rate</span>
          <strong>{summary.winRate.toFixed(0)}%</strong>
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

      {filteredTrades.length === 0 ? (
        <div className="trades-empty">No trades for the selected filters.</div>
      ) : (
        <div className="trades-list">
          {filteredTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              strategyName={strategyMap.get(trade.strategyId) ?? "Unassigned"}
              instrumentLabel={
                instrumentLabels.get(trade.instrument) ?? trade.instrument
              }
              onEdit={() => startEditTrade(trade.id)}
              onDelete={async () => {
                const ok = await confirm({
                  title: "Delete trade",
                  message: "Delete this trade? This cannot be undone.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (ok) deleteTrade(trade.id);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TradeCard({
  trade,
  strategyName,
  instrumentLabel,
  onEdit,
  onDelete,
}: {
  readonly trade: Trade;
  readonly strategyName: string;
  readonly instrumentLabel: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}) {
  const rMultiple = calculateRMultiple(trade);
  const isLong = trade.side !== "SELL";
  const isWin = trade.netPnl >= 0;
  const entryTime = toTimeInputValue(trade.entryTime);
  const exitTime = toTimeInputValue(trade.exitTime);
  const optionMeta = [
    trade.strikePrice ? formatPrice(trade.strikePrice) : "",
    trade.optionType ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const invested = trade.buyPrice * trade.quantity;
  const hasJournal =
    !!trade.entryReason ||
    !!trade.exitReason ||
    !!trade.lessonLearned ||
    !!trade.screenshot;

  return (
    <article className="trade-card">
      <header className="trade-card-head">
        <div className="trade-ident">
          <div className="trade-symbol-row">
            <strong className="trade-symbol">{instrumentLabel}</strong>
            <span className={`side-badge ${isLong ? "long" : "short"}`}>
              {isLong ? "Long" : "Short"}
            </span>
            {optionMeta && (
              <span className="trade-option-tag">{optionMeta}</span>
            )}
          </div>
          <div className="trade-submeta">
            <span>📅 {formatDateIndian(trade.tradeDate)}</span>
            {(entryTime || exitTime) && (
              <span>
                🕒 {entryTime || "--:--"} → {exitTime || "--:--"}
              </span>
            )}
            <span>🎯 {strategyName}</span>
          </div>
        </div>
        <div className="trade-head-right">
          <span className={`status-badge ${isWin ? "win" : "loss"}`}>
            {isWin ? "Win" : "Loss"}
          </span>
          <strong className={`trade-pnl ${isWin ? "profit" : "loss"}`}>
            {formatCurrency(trade.netPnl)}
          </strong>
        </div>
      </header>

      <div className="trade-metrics">
        <Metric label="Entry" value={formatPrice(trade.buyPrice)} />
        <Metric label="Exit" value={formatPrice(trade.sellPrice)} />
        <Metric label="Qty" value={trade.quantity} />
        <Metric label="Stop" value={formatPrice(trade.stopLoss)} />
        <Metric label="Target" value={formatPrice(trade.target)} />
        <Metric
          label="R Multiple"
          value={rMultiple === null ? "-" : `${rMultiple.toFixed(2)}R`}
          tone={
            rMultiple === null ? undefined : rMultiple >= 0 ? "profit" : "loss"
          }
        />
        <Metric label="Charges" value={formatCurrency(trade.charges)} />
        <Metric label="Invested" value={formatCurrency(invested)} />
      </div>

      <div className="trade-chips">
        {trade.executionQuality && (
          <span className="note-chip">
            Execution: {EXECUTION_QUALITY_LABELS[trade.executionQuality]}
          </span>
        )}
        {trade.emotionBefore && (
          <span className="note-chip">
            Before: {EMOTION_LABELS[trade.emotionBefore]}
          </span>
        )}
        {trade.emotionAfter && (
          <span className="note-chip">
            After: {EMOTION_LABELS[trade.emotionAfter]}
          </span>
        )}
        {!!trade.confidenceScore && (
          <span className="note-chip">Conf: {trade.confidenceScore}/5</span>
        )}
        {trade.mistakeType && trade.mistakeType !== "NONE" && (
          <span className="note-chip note-chip-warn">
            Mistake: {MISTAKE_LABELS[trade.mistakeType]}
          </span>
        )}
        {trade.entryReason && (
          <span className="note-chip">Reason: {trade.entryReason}</span>
        )}
        {(trade.tags ?? []).map((tag) => (
          <span key={tag} className="note-chip tag-chip">
            #{tag}
          </span>
        ))}
      </div>

      {trade.notes && <p className="trade-note-text">{trade.notes}</p>}

      {hasJournal && (
        <details className="trade-journal">
          <summary>View journal details</summary>
          <div className="trade-journal-body">
            {trade.entryReason && (
              <p>
                <strong>Entry:</strong> {trade.entryReason}
              </p>
            )}
            {trade.exitReason && (
              <p>
                <strong>Exit:</strong> {trade.exitReason}
              </p>
            )}
            {trade.lessonLearned && (
              <p>
                <strong>Lesson:</strong> {trade.lessonLearned}
              </p>
            )}
            {trade.screenshot && (
              <img
                src={trade.screenshot}
                alt="Trade chart"
                className="screenshot-preview"
              />
            )}
          </div>
        </details>
      )}

      <footer className="trade-card-foot">
        <button type="button" className="secondary" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Delete
        </button>
      </footer>
    </article>
  );
}
