import { useMemo, useState } from "react";
import { useJournalActions, useJournalState } from "../store/hooks";
import { formatCurrency } from "../lib/calculations";
import { applyTradeFilters } from "../lib/filters";
import { toTimeInputValue } from "../lib/trade-form/dateTime";
import {
  EMOTION_LABELS,
  EXECUTION_QUALITY_LABELS,
  MISTAKE_LABELS,
} from "../constants/tradeForm";
import { Instrument, MistakeType, Trade, TradeStatus } from "../types/trade";
import { useConfirm } from "../../../shared/ui";
import "./trades.css";

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

const formatPercent = (value: number): string =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

const DATE_PRESETS = [
  { key: "DAY", label: "Day" },
  { key: "WEEK", label: "Week" },
  { key: "MONTH", label: "Month" },
] as const;

function Metric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <div className="trade-metric">
      <span className="trade-metric-label">{label}</span>
      <span className="trade-metric-value">{value}</span>
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const strategyMap = useMemo(
    () => new Map(strategies.map((s) => [s.id, s.name])),
    [strategies],
  );

  const toDateInputValue = (date: Date): string => {
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };

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

  const activeFilterCount =
    (startDate || endDate ? 1 : 0) +
    (strategyFilter ? 1 : 0) +
    (instrumentFilter !== "ALL" ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (mistakeOnly ? 1 : 0) +
    (notesQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setNotesQuery("");
    setMistakeOnly(false);
    setStrategyFilter("");
    setInstrumentFilter("ALL");
    setStatusFilter("ALL");
    setActivePreset("CUSTOM");
  };

  const rangeLabel =
    startDate || endDate
      ? `${startDate ? formatDateIndian(startDate) : "Beginning"} → ${
          endDate ? formatDateIndian(endDate) : "Today"
        }`
      : "All time";

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
    const losers = totalTrades - winners;
    const winRate = totalTrades ? (winners / totalTrades) * 100 : 0;
    const avgCharges = totalTrades ? totalCharges / totalTrades : 0;
    const tradesWithNotes = filteredTrades.filter(
      (trade) => (trade.notes ?? "").trim().length > 0,
    ).length;
    const mistakeTrades = filteredTrades.filter(
      (trade) => trade.mistakeType && trade.mistakeType !== "NONE",
    ).length;

    const mistakeCounts = filteredTrades.reduce<
      Partial<Record<MistakeType, number>>
    >((acc, trade) => {
      const key = trade.mistakeType;
      if (!key || key === "NONE") return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topMistake =
      (Object.entries(mistakeCounts).sort(
        (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
      )[0]?.[0] as MistakeType | undefined) ?? null;

    return {
      totalTrades,
      netPnl,
      grossPnl,
      totalCharges,
      avgCharges,
      totalInvestment,
      totalSellValue,
      winRate,
      winners,
      losers,
      tradesWithNotes,
      mistakeTrades,
      topMistake,
    };
  }, [filteredTrades]);

  return (
    <section className="page trades-page">
      <header className="trades-header">
        <div className="trades-heading">
          <h2>Trades</h2>
          <p className="trades-subtitle">
            <span className="trades-count">{filteredTrades.length}</span>
            {filteredTrades.length === trades.length
              ? " trades"
              : ` of ${trades.length} trades`}
            <span className="trades-dot">•</span>
            {rangeLabel}
          </p>
        </div>
      </header>

      <div className="trades-toolbar">
        <div className="toolbar-primary">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={notesQuery}
              onChange={(event) => setNotesQuery(event.target.value)}
              placeholder="Search notes, entry, exit, lesson, tags"
              aria-label="Search trades"
            />
            {notesQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setNotesQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div
            className="segmented"
            role="group"
            aria-label="Quick date range"
          >
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={
                  activePreset === preset.key
                    ? "segmented-btn is-active"
                    : "segmented-btn"
                }
                aria-pressed={activePreset === preset.key}
                onClick={() => applyPreset(preset.key)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <select
            className="sort-select"
            value={dateSort}
            onChange={(event) =>
              setDateSort(event.target.value as "DESC" | "ASC")
            }
            aria-label="Sort by date"
          >
            <option value="DESC">Newest first</option>
            <option value="ASC">Oldest first</option>
          </select>

          <button
            type="button"
            className={`filter-toggle${filtersOpen ? " is-open" : ""}`}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
          >
            <span aria-hidden="true">⚙</span> Filters
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="toolbar-advanced">
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

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mistakeOnly}
                onChange={(event) => setMistakeOnly(event.target.checked)}
              />
              Mistake trades only
            </label>

            <button
              type="button"
              className="clear-filters"
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="kpi-grid">
        <article
          className={`kpi-card ${summary.netPnl >= 0 ? "tone-profit" : "tone-loss"}`}
        >
          <span className="kpi-label">Net P/L</span>
          <strong
            className={`kpi-value ${summary.netPnl >= 0 ? "profit" : "loss"}`}
          >
            {formatCurrency(summary.netPnl)}
          </strong>
          <span className="kpi-foot">
            Gross {formatCurrency(summary.grossPnl)}
          </span>
        </article>

        <article className="kpi-card tone-accent">
          <span className="kpi-label">Win Rate</span>
          <strong className="kpi-value">{summary.winRate.toFixed(0)}%</strong>
          <span className="kpi-bar" aria-hidden="true">
            <span
              className="kpi-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(0, summary.winRate))}%`,
              }}
            />
          </span>
        </article>

        <article className="kpi-card">
          <span className="kpi-label">Total Trades</span>
          <strong className="kpi-value">{summary.totalTrades}</strong>
          <span className="kpi-foot">
            <span className="profit">{summary.winners} win</span>
            <span className="kpi-foot-sep">/</span>
            <span className="loss">{summary.losers} loss</span>
          </span>
        </article>

        <article className="kpi-card">
          <span className="kpi-label">Total Charges</span>
          <strong className="kpi-value">
            {formatCurrency(summary.totalCharges)}
          </strong>
          <span className="kpi-foot">
            Avg {formatCurrency(summary.avgCharges)} / trade
          </span>
        </article>
      </div>

      <div className="stat-strip">
        <div className="stat-item">
          <span className="stat-label">Gross P/L</span>
          <span
            className={`stat-value ${summary.grossPnl >= 0 ? "profit" : "loss"}`}
          >
            {formatCurrency(summary.grossPnl)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Investment</span>
          <span className="stat-value">
            {formatCurrency(summary.totalInvestment)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sell Value</span>
          <span className="stat-value">
            {formatCurrency(summary.totalSellValue)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">With Notes</span>
          <span className="stat-value">{summary.tradesWithNotes}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Mistake Trades</span>
          <span
            className={`stat-value${summary.mistakeTrades > 0 ? " warn" : ""}`}
          >
            {summary.mistakeTrades}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Top Mistake</span>
          <span className="stat-value">
            {summary.topMistake ? MISTAKE_LABELS[summary.topMistake] : "—"}
          </span>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="trades-empty">
          <span className="trades-empty-icon" aria-hidden="true">
            📭
          </span>
          <h3>No trades match these filters</h3>
          <p>Try widening the date range or clearing the active filters.</p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={clearAllFilters}
            >
              Clear all filters
            </button>
          )}
        </div>
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
  const returnPct = invested > 0 ? (trade.netPnl / invested) * 100 : null;
  const hasJournal =
    !!trade.entryReason ||
    !!trade.exitReason ||
    !!trade.lessonLearned ||
    !!trade.screenshot;

  return (
    <article className={`trade-card ${isWin ? "is-win" : "is-loss"}`}>
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
            <span className="meta-item">
              <span aria-hidden="true">📅</span>{" "}
              {formatDateIndian(trade.tradeDate)}
            </span>
            {(entryTime || exitTime) && (
              <span className="meta-item">
                <span aria-hidden="true">🕒</span> {entryTime || "--:--"} →{" "}
                {exitTime || "--:--"}
              </span>
            )}
            <span className="meta-item">
              <span aria-hidden="true">🎯</span> {strategyName}
            </span>
          </div>
        </div>
        <div className="trade-head-right">
          <span className={`status-badge ${isWin ? "win" : "loss"}`}>
            {isWin ? "Win" : "Loss"}
          </span>
          <strong className={`trade-pnl ${isWin ? "profit" : "loss"}`}>
            {formatCurrency(trade.netPnl)}
          </strong>
          {returnPct !== null && (
            <span className={`trade-pnl-pct ${isWin ? "profit" : "loss"}`}>
              {formatPercent(returnPct)}
            </span>
          )}
        </div>
      </header>

      <div className="trade-metrics">
        <Metric label="Entry" value={formatPrice(trade.buyPrice)} />
        <Metric label="Exit" value={formatPrice(trade.sellPrice)} />
        <Metric label="Qty" value={trade.quantity} />
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
