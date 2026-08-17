import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EMOTION_LABELS,
  EMOTION_OPTIONS,
  EXECUTION_QUALITY_LABELS,
  EXECUTION_QUALITY_OPTIONS,
  MISTAKE_LABELS,
  MISTAKE_OPTIONS,
  NOTES_MAX_LENGTH,
  TRADE_REASON_CATEGORIES,
} from "../constants/tradeForm";
import {
  useJournalActions,
  useJournalSelectors,
  useJournalState,
} from "../store/hooks";
import {
  ExecutionQuality,
  InstrumentDef,
  MistakeType,
  Trade,
  TradeEmotion,
  TradeSide,
} from "../types/trade";
import { useToast } from "../../../shared/ui";
import { calculateNetPnl, formatCurrency } from "../lib/calculations";
import { generateId } from "../../../shared/lib/helpers";
import {
  getCurrentTimeInputValue,
  toIsoFromDateTime,
  toTimeInputValue,
} from "../lib/trade-form/dateTime";
import { getDefaultQuantityForInstrument } from "../lib/trade-form/quantity";

const REASON_CATEGORIES = Object.keys(TRADE_REASON_CATEGORIES);
const DEFAULT_INSTRUMENT = "NIFTY50";

const getQuantityForSymbol = (
  instruments: InstrumentDef[],
  symbol: Trade["instrument"],
): string => {
  const matchedInstrument = instruments.find((item) => item.symbol === symbol);
  if (matchedInstrument) {
    return String(getDefaultQuantityForInstrument(matchedInstrument));
  }
  return String(
    getDefaultQuantityForInstrument({
      symbol,
      name: symbol,
    }),
  );
};

export default function AddTradePage() {
  const { strategies, trades, settings, instruments } = useJournalState();
  const { editingTrade } = useJournalSelectors();
  const {
    createTrade,
    updateTrade,
    cancelEditTrade,
    setView,
    createInstrument,
    updateInstrument,
    deleteInstrument,
    updateStrategy,
  } = useJournalActions();
  const { notify } = useToast();
  const nowDate = new Date().toISOString().slice(0, 10);
  const [tradeDate, setTradeDate] = useState(nowDate);
  const initialInstrument = instruments[0]?.symbol ?? DEFAULT_INSTRUMENT;
  const [instrument, setInstrument] = useState<Trade["instrument"]>(
    initialInstrument,
  );
  const [strikePrice, setStrikePrice] = useState("");
  const [optionType, setOptionType] = useState<Trade["optionType"]>("CE");
  const [side, setSide] = useState<TradeSide>("BUY");
  const [entryTime, setEntryTime] = useState(getCurrentTimeInputValue);
  const [exitTime, setExitTime] = useState(getCurrentTimeInputValue);
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [charges, setCharges] = useState("0");
  const [strategyId, setStrategyId] = useState("");
  const [notes, setNotes] = useState("");

  const [emotionBefore, setEmotionBefore] = useState<TradeEmotion>("CALM");
  const [emotionAfter, setEmotionAfter] = useState<TradeEmotion>("CALM");
  const [mistakeType, setMistakeType] = useState<MistakeType>("NONE");
  const [executionQuality, setExecutionQuality] =
    useState<ExecutionQuality>("GOOD");
  const [confidenceScore, setConfidenceScore] = useState("3");
  const [entryReason, setEntryReason] = useState("");

  const [reasonCategory, setReasonCategory] = useState("");
  const quantity = useMemo(
    () => getQuantityForSymbol(instruments, instrument),
    [instruments, instrument],
  );

  // Inline instrument management (dynamic CRUD from within the Add Trade form).
  const [managingInstruments, setManagingInstruments] = useState(false);
  const [instrumentDraft, setInstrumentDraft] = useState("");
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(
    null,
  );

  // Inline editing of the selected strategy's rules (shared strategy record).
  const [editingRules, setEditingRules] = useState(false);
  const [rulesDraft, setRulesDraft] = useState("");

  useEffect(() => {
    if (!editingTrade) return;

    setTradeDate(editingTrade.tradeDate);
    setInstrument(editingTrade.instrument);
    setStrikePrice(
      editingTrade.strikePrice ? String(editingTrade.strikePrice) : "",
    );
    setOptionType(editingTrade.optionType ?? "CE");
    setSide(editingTrade.side ?? "BUY");
    setEntryTime(toTimeInputValue(editingTrade.entryTime));
    setExitTime(toTimeInputValue(editingTrade.exitTime));
    setBuyPrice(String(editingTrade.buyPrice));
    setSellPrice(String(editingTrade.sellPrice));
    setCharges(String(editingTrade.charges));
    setStrategyId(editingTrade.strategyId);
    setNotes(editingTrade.notes ?? "");

    setEmotionBefore(editingTrade.emotionBefore ?? "CALM");
    setEmotionAfter(editingTrade.emotionAfter ?? "CALM");
    setMistakeType(editingTrade.mistakeType ?? "NONE");
    setExecutionQuality(editingTrade.executionQuality ?? "GOOD");
    setConfidenceScore(String(editingTrade.confidenceScore ?? 3));
    setEntryReason(editingTrade.entryReason ?? "");
  }, [editingTrade]);

  const pnlPreview = useMemo(() => {
    return calculateNetPnl(
      Number(sellPrice || 0),
      Number(buyPrice || 0),
      Number(quantity || 0),
      Number(charges || 0),
    );
  }, [buyPrice, sellPrice, quantity, charges]);

  const grossPnl = useMemo(() => {
    return (
      (Number(sellPrice || 0) - Number(buyPrice || 0)) * Number(quantity || 0)
    );
  }, [buyPrice, sellPrice, quantity]);

  const pointsCaptured = Number(sellPrice || 0) - Number(buyPrice || 0);

  // Stays neutral until both legs are priced so an untouched form never reads
  // as a loss.
  const pnlTone =
    buyPrice.trim() === "" || sellPrice.trim() === ""
      ? "tone-flat"
      : pnlPreview >= 0
        ? "tone-profit"
        : "tone-loss";

  const headerSummary = useMemo(() => {
    const label =
      instruments.find((item) => item.symbol === instrument)?.name ||
      instrument ||
      "No instrument";
    const contract = strikePrice ? `${strikePrice} ${optionType}` : optionType;
    return `${label} · ${contract} · ${side === "BUY" ? "Long" : "Short"}`;
  }, [instruments, instrument, strikePrice, optionType, side]);

  const selectedStrategy = useMemo(() => {
    return strategies.find((strategy) => strategy.id === strategyId) ?? null;
  }, [strategies, strategyId]);

  const selectedStrategyRules = selectedStrategy?.rules ?? "";

  // Leaving edit mode when the strategy changes avoids saving a draft against
  // the wrong strategy.
  useEffect(() => {
    setEditingRules(false);
    setRulesDraft("");
  }, [strategyId]);

  const todayTradeCount = useMemo(() => {
    const currentEditingId = editingTrade?.id;
    return trades.filter(
      (trade) => trade.tradeDate === tradeDate && trade.id !== currentEditingId,
    ).length;
  }, [trades, tradeDate, editingTrade]);

  const todayPnl = useMemo(() => {
    const currentEditingId = editingTrade?.id;
    const existingPnl = trades
      .filter(
        (trade) =>
          trade.tradeDate === tradeDate && trade.id !== currentEditingId,
      )
      .reduce((sum, trade) => sum + trade.netPnl, 0);
    return existingPnl + pnlPreview;
  }, [trades, tradeDate, pnlPreview, editingTrade]);

  const riskWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (todayTradeCount + 1 > settings.maxTradesPerDay) {
      warnings.push(
        `Max trades per day exceeded (${todayTradeCount + 1}/${settings.maxTradesPerDay}).`,
      );
    }

    if (todayPnl < 0 && Math.abs(todayPnl) > settings.dailyLossLimit) {
      warnings.push(
        `Daily loss limit exceeded (${formatCurrency(Math.abs(todayPnl))} > ${formatCurrency(settings.dailyLossLimit)}).`,
      );
    }

    return warnings;
  }, [
    todayTradeCount,
    settings.maxTradesPerDay,
    settings.dailyLossLimit,
    todayPnl,
  ]);

  const resetForm = () => {
    setBuyPrice("");
    setSellPrice("");
    setStrikePrice("");
    setNotes("");
    setEntryTime(getCurrentTimeInputValue());
    setExitTime(getCurrentTimeInputValue());
    setCharges("0");
    setOptionType("CE");
    setSide("BUY");
    setInstrument(instruments[0]?.symbol ?? "");
    setStrategyId("");
    setTradeDate(nowDate);

    setEmotionBefore("CALM");
    setEmotionAfter("CALM");
    setMistakeType("NONE");
    setExecutionQuality("GOOD");
    setConfidenceScore("3");
    setEntryReason("");
    setReasonCategory("");
  };

  const handleClose = () => {
    if (editingTrade) {
      cancelEditTrade();
    } else {
      setView("TRADES");
    }
  };

  /** Builds a stable, unique symbol key from a free-form instrument name. */
  const deriveSymbol = (name: string, ignoreId?: string): string => {
    const base =
      name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "INSTRUMENT";
    const taken = new Set(
      instruments
        .filter((item) => item.id !== ignoreId)
        .map((item) => item.symbol),
    );
    if (!taken.has(base)) return base;
    let suffix = 2;
    while (taken.has(`${base}_${suffix}`)) suffix += 1;
    return `${base}_${suffix}`;
  };

  const resetInstrumentDraft = () => {
    setInstrumentDraft("");
    setEditingInstrumentId(null);
  };

  const handleSaveInstrument = () => {
    const name = instrumentDraft.trim();
    if (!name) return;

    if (editingInstrumentId) {
      const existing = instruments.find(
        (item) => item.id === editingInstrumentId,
      );
      if (!existing) return;
      const updated: InstrumentDef = { ...existing, name };
      updateInstrument(updated);
    } else {
      const created: InstrumentDef = {
        id: generateId(),
        symbol: deriveSymbol(name),
        name,
        createdAt: new Date().toISOString(),
      };
      createInstrument(created);
      setInstrument(created.symbol);
    }
    resetInstrumentDraft();
  };

  const handleEditInstrument = (item: InstrumentDef) => {
    setEditingInstrumentId(item.id);
    setInstrumentDraft(item.name);
  };

  const handleStartEditRules = () => {
    if (!selectedStrategy) return;
    setRulesDraft(selectedStrategy.rules ?? "");
    setEditingRules(true);
  };

  const handleCancelEditRules = () => {
    setEditingRules(false);
    setRulesDraft("");
  };

  const handleSaveRules = () => {
    if (!selectedStrategy) return;
    const trimmed = rulesDraft.trim();

    if (trimmed !== (selectedStrategy.rules ?? "")) {
      updateStrategy({ ...selectedStrategy, rules: trimmed });
      notify(`Rules updated for "${selectedStrategy.name}".`, "success");
    }

    handleCancelEditRules();
  };

  const handleDeleteInstrument = (item: InstrumentDef) => {
    deleteInstrument(item.id);
    if (editingInstrumentId === item.id) resetInstrumentDraft();
    if (instrument === item.symbol) {
      const fallback = instruments.find(
        (candidate) => candidate.id !== item.id,
      );
      setInstrument(fallback?.symbol ?? "");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!strategyId) {
      window.alert("Please select a strategy first.");
      return;
    }

    if (notes.length > NOTES_MAX_LENGTH) {
      window.alert(`Notes cannot exceed ${NOTES_MAX_LENGTH} characters.`);
      return;
    }

    if (riskWarnings.length > 0) {
      const proceed = window.confirm(
        `${riskWarnings.join("\n")}\n\nDo you want to save this trade anyway?`,
      );
      if (!proceed) return;
    }

    const entryDateTime = toIsoFromDateTime(tradeDate, entryTime);
    const exitDateTime = toIsoFromDateTime(tradeDate, exitTime);

    const baseTrade: Trade = {
      id: editingTrade?.id ?? generateId(),
      tradeDate,
      instrument,
      segment: "OPTIONS",
      strikePrice: strikePrice ? Number(strikePrice) : undefined,
      optionType,
      side,
      entryTime: entryDateTime,
      exitTime: exitDateTime,
      buyPrice: Number(buyPrice || 0),
      sellPrice: Number(sellPrice || 0),
      quantity: Number(quantity || 0),
      charges: Number(charges || 0),
      netPnl: pnlPreview,
      // These fields no longer have inputs on this form, so carry the stored
      // values through on edit instead of wiping them.
      stopLoss: editingTrade?.stopLoss,
      target: editingTrade?.target,
      tags: editingTrade?.tags ?? [],
      screenshot: editingTrade?.screenshot,
      strategyId,
      status: pnlPreview >= 0 ? "SUCCESSFUL" : "FAILED",
      notes: notes.trim(),
      emotionBefore,
      emotionAfter,
      mistakeType,
      executionQuality,
      confidenceScore: Number(confidenceScore || 0),
      entryReason: entryReason.trim(),
      exitReason: editingTrade?.exitReason ?? "",
      lessonLearned: editingTrade?.lessonLearned ?? "",
      createdAt: editingTrade?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTrade) {
      updateTrade(baseTrade);
      cancelEditTrade();
    } else {
      createTrade(baseTrade);
      resetForm();
    }
  };

  const reasonOptions = reasonCategory
    ? TRADE_REASON_CATEGORIES[reasonCategory]
    : [];
  const reasonHasCustomValue =
    !!entryReason && !reasonOptions.includes(entryReason);

  return (
    <div
      className="modal-overlay trade-modal-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <form
        className="trade-modal"
        role="dialog"
        aria-modal="true"
        aria-label={editingTrade ? "Edit Trade" : "Add New Trade"}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="trade-modal-head">
          <div className="tm-head-left">
            <span className="tm-head-badge" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 20.5h18" />
                <rect x="5.5" y="10" width="4" height="7" rx="1" />
                <path d="M7.5 7v3M7.5 17v2" />
                <rect x="14.5" y="6" width="4" height="8" rx="1" />
                <path d="M16.5 3.5v2.5M16.5 14v3" />
              </svg>
            </span>
            <div className="tm-head-text">
              <h2>{editingTrade ? "Edit Trade" : "Add New Trade"}</h2>
              <p className="tm-head-sub">{headerSummary}</p>
            </div>
          </div>

          <div className="tm-head-right">
            <span className={`tm-live-pnl ${pnlTone}`}>
              <span>Net P&amp;L</span>
              <strong>{formatCurrency(pnlPreview)}</strong>
            </span>
            <button
              type="button"
              className="trade-modal-close"
              aria-label="Close"
              onClick={handleClose}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="trade-modal-body">
          {strategies.length === 0 && (
            <p className="tm-inline-warning">
              Create at least one strategy before adding trades.
            </p>
          )}

          {/* Trade basics */}
          <section className="tf-card">
            <div className="tf-card-head">
              <span className="tf-card-dot position" aria-hidden="true" />
              <h3>Position</h3>
              <span className="tf-card-hint">
                Instrument, size and price levels
              </span>
              <button
                type="button"
                className="tf-manage-link"
                onClick={() => {
                  setManagingInstruments((open) => !open);
                  resetInstrumentDraft();
                }}
              >
                {managingInstruments ? "Done" : "Manage symbols"}
              </button>
            </div>

            <div className="form-row form-row-5">
              <label className="tf-field">
                <span className="field-caption">Symbol *</span>
                <select
                  value={instrument}
                  onChange={(event) =>
                    setInstrument(event.target.value as Trade["instrument"])
                  }
                >
                  {instruments.length === 0 && (
                    <option value="">No instruments — add one</option>
                  )}
                  {instruments.map((item) => (
                    <option key={item.id} value={item.symbol}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tf-field">
                <span className="field-caption">Strike Level</span>
                <input
                  type="number"
                  value={strikePrice}
                  onChange={(event) => setStrikePrice(event.target.value)}
                  placeholder="e.g. 24500"
                />
              </label>
              <label className="tf-field">
                <span className="field-caption">Qty *</span>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  placeholder="10"
                  required
                />
              </label>
              <label className="tf-field">
                <span className="field-caption">Entry Price *</span>
                <span className="tf-input-wrap" data-adorn="₹">
                  <input
                    type="number"
                    step="0.01"
                    value={buyPrice}
                    onChange={(event) => setBuyPrice(event.target.value)}
                    placeholder="500.00"
                    required
                  />
                </span>
              </label>
              <label className="tf-field">
                <span className="field-caption">Exit Price</span>
                <span className="tf-input-wrap" data-adorn="₹">
                  <input
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={(event) => setSellPrice(event.target.value)}
                    placeholder="2550.00"
                  />
                </span>
              </label>
            </div>

            {managingInstruments && (
              <div className="instrument-manager">
                <div className="instrument-manager-head">
                  <span>Manage instruments</span>
                  <small>Add the symbols you trade so they appear above.</small>
                </div>
                <div className="instrument-manager-add">
                  <input
                    type="text"
                    value={instrumentDraft}
                    onChange={(event) => setInstrumentDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSaveInstrument();
                      }
                    }}
                    placeholder="e.g. FinNifty, Sensex, Reliance"
                  />
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={handleSaveInstrument}
                    disabled={!instrumentDraft.trim()}
                  >
                    {editingInstrumentId ? "Save" : "Add"}
                  </button>
                  {editingInstrumentId && (
                    <button
                      type="button"
                      className="secondary btn-sm"
                      onClick={resetInstrumentDraft}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <ul className="instrument-manager-list">
                  {instruments.map((item) => (
                    <li key={item.id} className="instrument-chip-row">
                      <span className="instrument-chip-name">
                        {item.name}
                        <code>{item.symbol}</code>
                      </span>
                      <span className="instrument-chip-actions">
                        <button
                          type="button"
                          className="chip-action"
                          onClick={() => handleEditInstrument(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="chip-action chip-action-danger"
                          onClick={() => handleDeleteInstrument(item)}
                          disabled={instruments.length <= 1}
                          title={
                            instruments.length <= 1
                              ? "Keep at least one instrument"
                              : "Remove instrument"
                          }
                        >
                          Delete
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Strategy on its own line with rules shown beside it */}
          <section className="tf-card">
            <div className="tf-card-head">
              <span className="tf-card-dot strategy" aria-hidden="true" />
              <h3>Strategy &amp; Rules</h3>
              <span className="tf-card-hint">
                Edits save back to the shared strategy
              </span>
              {selectedStrategy && !editingRules && (
                <button
                  type="button"
                  className="tf-manage-link"
                  onClick={handleStartEditRules}
                >
                  Edit rules
                </button>
              )}
            </div>

            <div className="strategy-row">
              <label className="tf-field">
                <span className="field-caption">Strategy *</span>
                <select
                  value={strategyId}
                  onChange={(event) => setStrategyId(event.target.value)}
                  required
                >
                  <option value="">Select strategy…</option>
                  {strategies.map((strategy) => (
                    <option
                      key={strategy.id}
                      value={strategy.id}
                      title={strategy.rules}
                    >
                      {strategy.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="strategy-rules-beside">
                <span className="field-caption">Rules</span>
                {editingRules && selectedStrategy ? (
                  <div className="strategy-rules-editor">
                    <textarea
                      value={rulesDraft}
                      onChange={(event) => setRulesDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          handleCancelEditRules();
                        }
                        if (
                          event.key === "Enter" &&
                          (event.ctrlKey || event.metaKey)
                        ) {
                          event.preventDefault();
                          handleSaveRules();
                        }
                      }}
                      rows={3}
                      placeholder="Entry/exit rules for this strategy"
                      autoFocus
                    />
                    <div className="strategy-rules-actions">
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={handleSaveRules}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="secondary btn-sm"
                        onClick={handleCancelEditRules}
                      >
                        Cancel
                      </button>
                      <small>
                        {`Updates the "${selectedStrategy.name}" strategy everywhere.`}
                      </small>
                    </div>
                  </div>
                ) : (
                  <p>
                    {selectedStrategy
                      ? selectedStrategyRules ||
                        "No rules yet — use Edit rules to add them."
                      : "Select a strategy to see its rules."}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Option / cost details */}
          <section className="tf-card">
            <div className="tf-card-head">
              <span className="tf-card-dot contract" aria-hidden="true" />
              <h3>Contract &amp; Costs</h3>
              <span className="tf-card-hint">
                Charges are deducted from gross P&amp;L
              </span>
            </div>

            <div className="form-row form-row-3">
              <label className="tf-field">
                <span className="field-caption">Option Type</span>
                <select
                  value={optionType}
                  onChange={(event) =>
                    setOptionType(event.target.value as Trade["optionType"])
                  }
                >
                  <option value="CE">CE</option>
                  <option value="PE">PE</option>
                </select>
              </label>
              <label className="tf-field">
                <span className="field-caption">Long / Short</span>
                <select
                  value={side}
                  onChange={(event) => setSide(event.target.value as TradeSide)}
                >
                  <option value="BUY">Long</option>
                  <option value="SELL">Short</option>
                </select>
              </label>
              <label className="tf-field">
                <span className="field-caption">Charges</span>
                <span className="tf-input-wrap" data-adorn="₹">
                  <input
                    type="number"
                    step="0.01"
                    value={charges}
                    onChange={(event) => setCharges(event.target.value)}
                  />
                </span>
              </label>
            </div>
          </section>

          {/* Dates */}
          <section className="tf-card">
            <div className="tf-card-head">
              <span className="tf-card-dot timing" aria-hidden="true" />
              <h3>Timing</h3>
              <span className="tf-card-hint">
                When the position was opened and closed
              </span>
            </div>

            <div className="form-row form-row-3">
              <label className="tf-field">
                <span className="field-caption">Entry Date</span>
                <input
                  type="date"
                  value={tradeDate}
                  onChange={(event) => setTradeDate(event.target.value)}
                  required
                />
              </label>
              <label className="tf-field">
                <span className="field-caption">Entry Time</span>
                <input
                  type="time"
                  value={entryTime}
                  onChange={(event) => setEntryTime(event.target.value)}
                />
              </label>
              <label className="tf-field">
                <span className="field-caption">Exit Time</span>
                <input
                  type="time"
                  value={exitTime}
                  onChange={(event) => setExitTime(event.target.value)}
                />
              </label>
            </div>
          </section>

          {/* Execution & discipline */}
          <div className="tf-section-head">
            <span className="tf-card-dot discipline" aria-hidden="true" />
            <h3>Trade Execution &amp; Exit Discipline</h3>
            <span className="tf-card-hint">
              Capture your mindset before and after the trade
            </span>
          </div>

          <div className="discipline-grid">
            <section className="discipline-col at-entry">
              <div className="col-head">
                <span className="col-dot entry" />
                At Entry
              </div>

              <div className="field-caption">Reasons for Trade *</div>
              <div className="reason-chips">
                {REASON_CATEGORIES.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`reason-chip${
                      reasonCategory === category ? " active" : ""
                    }`}
                    aria-pressed={reasonCategory === category}
                    onClick={() =>
                      setReasonCategory((prev) =>
                        prev === category ? "" : category,
                      )
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
              <select
                value={entryReason}
                onChange={(event) => setEntryReason(event.target.value)}
                aria-label="Reason for trade"
              >
                <option value="">
                  {reasonCategory
                    ? "Select a reason…"
                    : "Select a category above…"}
                </option>
                {reasonHasCustomValue && (
                  <option value={entryReason}>{entryReason}</option>
                )}
                {reasonOptions.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <label className="tf-field">
                <span className="field-caption">
                  Emotion While Taking Trade
                </span>
                <select
                  value={emotionBefore}
                  onChange={(event) =>
                    setEmotionBefore(event.target.value as TradeEmotion)
                  }
                >
                  {EMOTION_OPTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {EMOTION_LABELS[emotion]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tf-field">
                <span className="field-caption">Confidence (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={confidenceScore}
                  onChange={(event) => setConfidenceScore(event.target.value)}
                />
              </label>
            </section>

            <section className="discipline-col at-exit">
              <div className="col-head">
                <span className="col-dot exit" />
                At Exit
              </div>

              <label className="tf-field">
                <span className="field-caption">
                  Execution Quality of Trade
                </span>
                <select
                  value={executionQuality}
                  onChange={(event) =>
                    setExecutionQuality(event.target.value as ExecutionQuality)
                  }
                >
                  {EXECUTION_QUALITY_OPTIONS.map((quality) => (
                    <option key={quality} value={quality}>
                      {EXECUTION_QUALITY_LABELS[quality]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tf-field">
                <span className="field-caption">Emotion After Trade</span>
                <select
                  value={emotionAfter}
                  onChange={(event) =>
                    setEmotionAfter(event.target.value as TradeEmotion)
                  }
                >
                  {EMOTION_OPTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {EMOTION_LABELS[emotion]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tf-field">
                <span className="field-caption">Mistake Type</span>
                <select
                  value={mistakeType}
                  onChange={(event) =>
                    setMistakeType(event.target.value as MistakeType)
                  }
                >
                  {MISTAKE_OPTIONS.map((mistake) => (
                    <option key={mistake} value={mistake}>
                      {MISTAKE_LABELS[mistake]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tf-field">
                <span className="field-caption">
                  Notes / Learnings from Trade
                </span>
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value.slice(0, NOTES_MAX_LENGTH))
                  }
                  rows={4}
                  maxLength={NOTES_MAX_LENGTH}
                  placeholder="Trade rationale, lessons learned…"
                />
                <span className="char-counter">
                  {notes.length}/{NOTES_MAX_LENGTH}
                </span>
              </label>
            </section>
          </div>
        </div>

        <footer className="trade-modal-foot">
          {riskWarnings.length > 0 && (
            <div className="risk-alert">
              <span className="risk-alert-icon" aria-hidden="true">
                !
              </span>
              <div>
                {riskWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          )}

          <div className="tm-foot-main">
            <div className={`pnl-preview ${pnlTone}`}>
              <span className="pnl-preview-label">Calculated Net P&amp;L</span>
              <strong className="pnl-preview-value">
                {formatCurrency(pnlPreview)}
              </strong>
              <div className="pnl-preview-stats">
                <span>
                  <em>Gross</em>
                  <b>{formatCurrency(grossPnl)}</b>
                </span>
                <span>
                  <em>Charges</em>
                  <b>{formatCurrency(Number(charges || 0))}</b>
                </span>
                <span>
                  <em>Points</em>
                  <b>{pointsCaptured.toFixed(2)}</b>
                </span>
                <span>
                  <em>Today</em>
                  <b>
                    {todayTradeCount + 1} · {formatCurrency(todayPnl)}
                  </b>
                </span>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="secondary" onClick={handleClose}>
                {editingTrade ? "Cancel Edit" : "Cancel"}
              </button>
              <button
                type="submit"
                className="tm-submit"
                disabled={!strategies.length}
              >
                {editingTrade ? "Update Trade" : "Save Trade"}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
