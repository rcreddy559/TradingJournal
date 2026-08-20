import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Strategy, StrategyTimeframe } from "../types/trade";
import { useJournalActions, useJournalState } from "../store/hooks";
import { generateId } from "../../../shared/lib/helpers";
import { Modal, useConfirm, useToast } from "../../../shared/ui";
import { formatCurrency } from "../lib/calculations";
import {
  STARTER_OPTION_STRATEGIES,
  STRATEGY_TIMEFRAMES,
  STRATEGY_TIMEFRAME_LABELS,
} from "../constants/strategies";
import {
  SortDirection,
  StrategyRow,
  StrategySortKey,
  StrategyTimeframeFilter,
  StrategyUsageFilter,
  buildDuplicateStrategyName,
  buildStrategyRows,
  countUnassignedTrades,
  filterStrategyRows,
  isDuplicateStrategyName,
  selectMissingStarters,
  sortStrategyRows,
  summarizeStrategyRows,
} from "../lib/strategies";
import "./strategies.css";

const EMPTY_FORM = {
  name: "",
  timeframe: "INTRADAY" as StrategyTimeframe,
  rules: "",
};

const RULES_CLAMP_LENGTH = 110;

const NUMERIC_SORT_KEYS: StrategySortKey[] = [
  "TRADES",
  "WIN_RATE",
  "NET_PNL",
  "CREATED",
];

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StrategiesPage() {
  const { strategies, trades } = useJournalState();
  const {
    createStrategy,
    createStrategies,
    updateStrategy,
    deleteStrategy,
    deleteStrategyWithReassign,
  } = useJournalActions();
  const { notify } = useToast();
  const confirm = useConfirm();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState(EMPTY_FORM.name);
  const [timeframe, setTimeframe] = useState<StrategyTimeframe>(
    EMPTY_FORM.timeframe,
  );
  const [rules, setRules] = useState(EMPTY_FORM.rules);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Strategy | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const [query, setQuery] = useState("");
  const [timeframeFilter, setTimeframeFilter] =
    useState<StrategyTimeframeFilter>("ALL");
  const [usageFilter, setUsageFilter] = useState<StrategyUsageFilter>("ALL");
  const [sortKey, setSortKey] = useState<StrategySortKey>("NAME");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId !== null;

  const rows = useMemo(
    () => buildStrategyRows(strategies, trades),
    [strategies, trades],
  );
  const summary = useMemo(() => summarizeStrategyRows(rows), [rows]);
  const unassignedTrades = useMemo(
    () => countUnassignedTrades(trades, strategies),
    [trades, strategies],
  );

  const visibleRows = useMemo(
    () =>
      sortStrategyRows(
        filterStrategyRows(rows, {
          query,
          timeframe: timeframeFilter,
          usage: usageFilter,
        }),
        sortKey,
        sortDirection,
      ),
    [rows, query, timeframeFilter, usageFilter, sortKey, sortDirection],
  );

  const missingStarters = useMemo(
    () => selectMissingStarters(strategies, STARTER_OPTION_STRATEGIES),
    [strategies],
  );

  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (timeframeFilter !== "ALL" ? 1 : 0) +
    (usageFilter !== "ALL" ? 1 : 0);

  // Keeps the edit form in view (and typeable) when the list is long.
  useEffect(() => {
    if (!editingId) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    nameInputRef.current?.focus();
  }, [editingId]);

  const resetForm = () => {
    setEditingId(null);
    setName(EMPTY_FORM.name);
    setTimeframe(EMPTY_FORM.timeframe);
    setRules(EMPTY_FORM.rules);
    setFormError("");
  };

  const clearFilters = () => {
    setQuery("");
    setTimeframeFilter("ALL");
    setUsageFilter("ALL");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Strategy name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (isDuplicateStrategyName(strategies, trimmedName, editingId)) {
      setFormError("A strategy with this name already exists.");
      nameInputRef.current?.focus();
      return;
    }

    if (isEditing) {
      const existing = strategies.find((strategy) => strategy.id === editingId);
      updateStrategy({
        id: editingId,
        name: trimmedName,
        timeframe,
        rules: rules.trim(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      notify(`Updated "${trimmedName}".`, "success");
    } else {
      createStrategy({
        id: generateId(),
        name: trimmedName,
        timeframe,
        rules: rules.trim(),
        createdAt: new Date().toISOString(),
      });
      notify(`Added "${trimmedName}".`, "success");
    }

    resetForm();
  };

  const handleEdit = (row: StrategyRow) => {
    setEditingId(row.id);
    setName(row.name);
    setTimeframe(row.timeframe ?? "INTRADAY");
    setRules(row.rules);
    setFormError("");
  };

  const handleDuplicate = (row: StrategyRow) => {
    const copyName = buildDuplicateStrategyName(strategies, row.name);
    createStrategy({
      id: generateId(),
      name: copyName,
      timeframe: row.timeframe ?? "INTRADAY",
      rules: row.rules,
      createdAt: new Date().toISOString(),
    });
    notify(`Created "${copyName}".`, "success");
  };

  const handleDelete = async (row: StrategyRow) => {
    const strategy = strategies.find((item) => item.id === row.id);
    if (!strategy) return;

    if (row.trades > 0) {
      setReassignTo("");
      setPendingDelete(strategy);
      return;
    }

    const confirmed = await confirm({
      title: "Delete strategy",
      message: `Delete "${strategy.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    deleteStrategy(strategy.id);
    if (editingId === strategy.id) resetForm();
    notify(`Deleted "${strategy.name}".`, "success");
  };

  const confirmReassignDelete = () => {
    if (!pendingDelete) return;
    deleteStrategyWithReassign(pendingDelete.id, reassignTo || null);
    if (editingId === pendingDelete.id) resetForm();
    notify(`Deleted "${pendingDelete.name}".`, "success");
    setPendingDelete(null);
  };

  const handleAddStarterStrategies = () => {
    if (missingStarters.length === 0) {
      notify("All starter strategies are already added.", "info");
      return;
    }

    createStrategies(
      missingStarters.map((starter) => ({
        id: generateId(),
        name: starter.name,
        timeframe: starter.timeframe,
        rules: starter.rules,
        createdAt: new Date().toISOString(),
      })),
    );
    notify(`Added ${missingStarters.length} starter strategies.`, "success");
  };

  const toggleSort = (key: StrategySortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "ASC" ? "DESC" : "ASC"));
      return;
    }
    setSortKey(key);
    setSortDirection(NUMERIC_SORT_KEYS.includes(key) ? "DESC" : "ASC");
  };

  const toggleRules = (id: string) => {
    setExpandedRules((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ariaSort = (key: StrategySortKey) => {
    if (sortKey !== key) return "none";
    return sortDirection === "ASC" ? "ascending" : "descending";
  };

  const sortableHeader = (key: StrategySortKey, label: string) => (
    <th aria-sort={ariaSort(key)}>
      <button
        type="button"
        className={`sort-header${sortKey === key ? " is-active" : ""}`}
        onClick={() => toggleSort(key)}
      >
        {label}
        <span aria-hidden="true" className="sort-arrow">
          {sortKey !== key ? "↕" : sortDirection === "ASC" ? "↑" : "↓"}
        </span>
      </button>
    </th>
  );

  const pendingUsage = pendingDelete
    ? (rows.find((row) => row.id === pendingDelete.id)?.trades ?? 0)
    : 0;

  return (
    <section className="page strategies-page">
      <header className="strategies-header">
        <div>
          <h2>Strategies</h2>
          <p className="subtext" aria-live="polite">
            {strategies.length === 0
              ? "No strategies yet"
              : `${visibleRows.length} of ${strategies.length} strategies`}
            <span className="strategies-dot">•</span>
            All-time performance
          </p>
        </div>
        {missingStarters.length > 0 && strategies.length > 0 && (
          <button
            type="button"
            className="secondary btn-sm"
            onClick={handleAddStarterStrategies}
          >
            + Add {missingStarters.length} starter strategies
          </button>
        )}
      </header>

      {strategies.length > 0 && (
        <div className="strategy-kpis">
          <article className="strategy-kpi">
            <span className="strategy-kpi-label">Strategies</span>
            <strong className="strategy-kpi-value">{summary.total}</strong>
            <span className="strategy-kpi-foot">
              {summary.used} traded · {summary.unused} unused
            </span>
          </article>

          <article className="strategy-kpi">
            <span className="strategy-kpi-label">Tagged Trades</span>
            <strong className="strategy-kpi-value">
              {summary.assignedTrades}
            </strong>
            <span className="strategy-kpi-foot">
              {unassignedTrades > 0
                ? `${unassignedTrades} unassigned`
                : "All trades tagged"}
            </span>
          </article>

          <article className="strategy-kpi">
            <span className="strategy-kpi-label">Best Performer</span>
            <strong className="strategy-kpi-value strategy-kpi-name">
              {summary.best ? summary.best.name : "-"}
            </strong>
            <span className="strategy-kpi-foot">
              {summary.best ? (
                <span className={summary.best.netPnl >= 0 ? "profit" : "loss"}>
                  {formatCurrency(summary.best.netPnl)} ·{" "}
                  {summary.best.winRate.toFixed(0)}% win
                </span>
              ) : (
                "No tagged trades yet"
              )}
            </span>
          </article>

          <article className="strategy-kpi">
            <span className="strategy-kpi-label">Needs Review</span>
            <strong className="strategy-kpi-value strategy-kpi-name">
              {summary.worst ? summary.worst.name : "-"}
            </strong>
            <span className="strategy-kpi-foot">
              {summary.worst ? (
                <span className={summary.worst.netPnl >= 0 ? "profit" : "loss"}>
                  {formatCurrency(summary.worst.netPnl)} ·{" "}
                  {summary.worst.winRate.toFixed(0)}% win
                </span>
              ) : (
                "Not enough data"
              )}
            </span>
          </article>
        </div>
      )}

      <form
        className="form-card strategy-form"
        onSubmit={handleSubmit}
        ref={formRef}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isEditing) resetForm();
        }}
      >
        <h3>{isEditing ? `Edit "${name || "Strategy"}"` : "Add Strategy"}</h3>
        {formError && (
          <p className="warning" role="alert">
            {formError}
          </p>
        )}
        <label>
          Strategy Name
          <input
            ref={nameInputRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (formError) setFormError("");
            }}
            placeholder="ORB Breakout"
            aria-invalid={formError ? true : undefined}
            required
          />
        </label>
        <label>
          Timeframe
          <select
            value={timeframe}
            onChange={(event) =>
              setTimeframe(event.target.value as StrategyTimeframe)
            }
          >
            {STRATEGY_TIMEFRAMES.map((value) => (
              <option key={value} value={value}>
                {STRATEGY_TIMEFRAME_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rules
          <textarea
            value={rules}
            onChange={(event) => setRules(event.target.value)}
            rows={3}
            placeholder="Entry trigger, exit plan, invalidation, position size"
          />
        </label>
        <div className="form-actions">
          <button type="submit">
            {isEditing ? "Update Strategy" : "Add Strategy"}
          </button>
          {isEditing && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {strategies.length === 0 ? (
        <div className="strategies-empty">
          <span className="strategies-empty-icon" aria-hidden="true">
            🎯
          </span>
          <h3>No strategies yet</h3>
          <p>
            Tag every trade with a strategy to learn which setups actually make
            money. Add your own above, or start from a ready-made pack.
          </p>
          <button type="button" onClick={handleAddStarterStrategies}>
            Add {STARTER_OPTION_STRATEGIES.length} starter option strategies
          </button>
        </div>
      ) : (
        <>
          <div className="strategies-toolbar">
            <div className="strategy-search">
              <span className="strategy-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or rules"
                aria-label="Search strategies"
              />
              {query && (
                <button
                  type="button"
                  className="strategy-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={timeframeFilter}
              onChange={(event) =>
                setTimeframeFilter(
                  event.target.value as StrategyTimeframeFilter,
                )
              }
              aria-label="Filter by timeframe"
            >
              <option value="ALL">All timeframes</option>
              {STRATEGY_TIMEFRAMES.map((value) => (
                <option key={value} value={value}>
                  {STRATEGY_TIMEFRAME_LABELS[value]}
                </option>
              ))}
              <option value="UNSET">No timeframe</option>
            </select>

            <select
              value={usageFilter}
              onChange={(event) =>
                setUsageFilter(event.target.value as StrategyUsageFilter)
              }
              aria-label="Filter by usage"
            >
              <option value="ALL">All strategies</option>
              <option value="USED">With trades</option>
              <option value="UNUSED">Unused</option>
            </select>

            <button
              type="button"
              className="secondary btn-sm"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear filters
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {sortableHeader("NAME", "Name")}
                  {sortableHeader("TIMEFRAME", "Timeframe")}
                  <th>Rules</th>
                  {sortableHeader("TRADES", "Trades")}
                  {sortableHeader("WIN_RATE", "Win Rate")}
                  {sortableHeader("NET_PNL", "Net P&L")}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="strategies-no-match">
                        <span>No strategies match the current filters.</span>
                        <button
                          type="button"
                          className="secondary btn-sm"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {visibleRows.map((row) => {
                  const expanded = expandedRules.has(row.id);
                  const isLongRules = row.rules.length > RULES_CLAMP_LENGTH;
                  return (
                    <tr
                      key={row.id}
                      className={editingId === row.id ? "is-editing" : undefined}
                    >
                      <td>
                        <div className="strategy-name-cell">
                          <span className="strategy-name">{row.name}</span>
                          {row.trades === 0 && (
                            <span className="strategy-badge">Unused</span>
                          )}
                        </div>
                        <span className="strategy-created">
                          Added {formatDate(row.createdAt)}
                        </span>
                      </td>
                      <td>
                        {row.timeframe ? (
                          <span className="strategy-timeframe">
                            {STRATEGY_TIMEFRAME_LABELS[row.timeframe]}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="strategy-rules-cell">
                        {row.rules ? (
                          <>
                            <p
                              className={`strategy-rules${
                                expanded || !isLongRules ? "" : " is-clamped"
                              }`}
                            >
                              {row.rules}
                            </p>
                            {isLongRules && (
                              <button
                                type="button"
                                className="strategy-rules-toggle"
                                onClick={() => toggleRules(row.id)}
                                aria-expanded={expanded}
                              >
                                {expanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="subtext">No rules added</span>
                        )}
                      </td>
                      <td>{row.trades}</td>
                      <td>
                        {row.trades === 0 ? (
                          "-"
                        ) : (
                          <div className="strategy-winrate">
                            <span>{row.winRate.toFixed(0)}%</span>
                            <span
                              className="strategy-winrate-bar"
                              aria-hidden="true"
                            >
                              <span
                                className="strategy-winrate-fill"
                                style={{
                                  width: `${Math.min(100, Math.max(0, row.winRate))}%`,
                                }}
                              />
                            </span>
                          </div>
                        )}
                      </td>
                      <td
                        className={
                          row.trades === 0
                            ? undefined
                            : row.netPnl >= 0
                              ? "profit"
                              : "loss"
                        }
                      >
                        {row.trades === 0 ? "-" : formatCurrency(row.netPnl)}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="secondary btn-sm"
                            onClick={() => handleEdit(row)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="secondary btn-sm"
                            onClick={() => handleDuplicate(row)}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="danger btn-sm"
                            onClick={() => handleDelete(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pendingDelete && (
        <Modal
          title={`Delete "${pendingDelete.name}"`}
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={confirmReassignDelete}
              >
                Delete Strategy
              </button>
            </>
          }
        >
          <p className="confirm-message">
            This strategy is linked to {pendingUsage} trade
            {pendingUsage === 1 ? "" : "s"}. The trades are kept — choose which
            strategy they should belong to.
          </p>
          <label>
            Reassign trades to
            <select
              value={reassignTo}
              onChange={(event) => setReassignTo(event.target.value)}
            >
              <option value="">Leave unassigned</option>
              {strategies
                .filter((strategy) => strategy.id !== pendingDelete.id)
                .map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
            </select>
          </label>
        </Modal>
      )}
    </section>
  );
}
