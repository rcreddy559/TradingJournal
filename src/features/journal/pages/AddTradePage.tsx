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
import { calculateNetPnl, formatCurrency } from "../lib/calculations";
import { generateId } from "../../../shared/lib/helpers";
import {
  getCurrentTimeInputValue,
  toIsoFromDateTime,
  toTimeInputValue,
} from "../lib/trade-form/dateTime";

const REASON_CATEGORIES = Object.keys(TRADE_REASON_CATEGORIES);

export default function AddTradePage() {
  const { strategies, trades, settings, profile, instruments } =
    useJournalState();
  const { editingTrade } = useJournalSelectors();
  const {
    createTrade,
    updateTrade,
    cancelEditTrade,
    setView,
    createInstrument,
    updateInstrument,
    deleteInstrument,
  } = useJournalActions();
  const nowDate = new Date().toISOString().slice(0, 10);
  const [tradeDate, setTradeDate] = useState(nowDate);
  const [instrument, setInstrument] = useState<Trade["instrument"]>(
    instruments[0]?.symbol ?? "NIFTY50",
  );
  const [strikePrice, setStrikePrice] = useState("");
  const [optionType, setOptionType] = useState<Trade["optionType"]>("CE");
  const [side, setSide] = useState<TradeSide>("BUY");
  const [entryTime, setEntryTime] = useState(getCurrentTimeInputValue);
  const [exitTime, setExitTime] = useState(getCurrentTimeInputValue);
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState("75");
  const [charges, setCharges] = useState("0");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [tags, setTags] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [notes, setNotes] = useState("");

  const [emotionBefore, setEmotionBefore] = useState<TradeEmotion>("CALM");
  const [emotionAfter, setEmotionAfter] = useState<TradeEmotion>("CALM");
  const [mistakeType, setMistakeType] = useState<MistakeType>("NONE");
  const [executionQuality, setExecutionQuality] =
    useState<ExecutionQuality>("GOOD");
  const [confidenceScore, setConfidenceScore] = useState("3");
  const [entryReason, setEntryReason] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");

  const [reasonCategory, setReasonCategory] = useState("");

  // Inline instrument management (dynamic CRUD from within the Add Trade form).
  const [managingInstruments, setManagingInstruments] = useState(false);
  const [instrumentDraft, setInstrumentDraft] = useState("");
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(
    null,
  );

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
    setQuantity(String(editingTrade.quantity));
    setCharges(String(editingTrade.charges));
    setStopLoss(
      editingTrade.stopLoss !== undefined ? String(editingTrade.stopLoss) : "",
    );
    setTarget(
      editingTrade.target !== undefined ? String(editingTrade.target) : "",
    );
    setTags((editingTrade.tags ?? []).join(", "));
    setScreenshot(editingTrade.screenshot ?? "");
    setStrategyId(editingTrade.strategyId);
    setNotes(editingTrade.notes ?? "");

    setEmotionBefore(editingTrade.emotionBefore ?? "CALM");
    setEmotionAfter(editingTrade.emotionAfter ?? "CALM");
    setMistakeType(editingTrade.mistakeType ?? "NONE");
    setExecutionQuality(editingTrade.executionQuality ?? "GOOD");
    setConfidenceScore(String(editingTrade.confidenceScore ?? 3));
    setEntryReason(editingTrade.entryReason ?? "");
    setExitReason(editingTrade.exitReason ?? "");
    setLessonLearned(editingTrade.lessonLearned ?? "");
  }, [editingTrade]);

  const pnlPreview = useMemo(() => {
    return calculateNetPnl(
      Number(sellPrice || 0),
      Number(buyPrice || 0),
      Number(quantity || 0),
      Number(charges || 0),
    );
  }, [buyPrice, sellPrice, quantity, charges]);

  const riskReward = useMemo(() => {
    const entry = Number(buyPrice || 0);
    const stop = Number(stopLoss || 0);
    const goal = Number(target || 0);
    if (!entry || !stop || stop >= entry) return null;
    const risk = entry - stop;
    const reward = goal > entry ? goal - entry : 0;
    return {
      risk,
      reward,
      ratio: reward > 0 ? reward / risk : 0,
    };
  }, [buyPrice, stopLoss, target]);

  // Recommended quantity = (portfolio × risk %) ÷ per-unit risk, using the
  // trader profile's capital and risk-per-trade settings.
  const portfolio = profile?.tradingCapital ?? 0;
  const riskPct = profile?.riskPerTradePct ?? 0;
  const positionSizing = useMemo(() => {
    const entry = Number(buyPrice || 0);
    const stop = Number(stopLoss || 0);
    const perUnitRisk = Math.abs(entry - stop);
    if (!portfolio || !riskPct || !perUnitRisk || !entry || !stop) return null;
    const riskAmount = (portfolio * riskPct) / 100;
    return {
      riskAmount,
      perUnitRisk,
      qty: Math.max(0, Math.floor(riskAmount / perUnitRisk)),
    };
  }, [buyPrice, stopLoss, portfolio, riskPct]);

  const selectedStrategyRules = useMemo(() => {
    return (
      strategies.find((strategy) => strategy.id === strategyId)?.rules ?? ""
    );
  }, [strategies, strategyId]);

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
    setQuantity("75");
    setCharges("0");
    setStopLoss("");
    setTarget("");
    setTags("");
    setScreenshot("");
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
    setExitReason("");
    setLessonLearned("");
    setReasonCategory("");
  };

  const handleScreenshot = (file: File | undefined) => {
    if (!file) {
      setScreenshot("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(String(reader.result ?? ""));
    reader.readAsDataURL(file);
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
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      target: target ? Number(target) : undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      screenshot: screenshot || undefined,
      strategyId,
      status: pnlPreview >= 0 ? "SUCCESSFUL" : "FAILED",
      notes: notes.trim(),
      emotionBefore,
      emotionAfter,
      mistakeType,
      executionQuality,
      confidenceScore: Number(confidenceScore || 0),
      entryReason: entryReason.trim(),
      exitReason: exitReason.trim(),
      lessonLearned: lessonLearned.trim(),
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
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      <form
        className="trade-modal"
        role="dialog"
        aria-modal="true"
        aria-label={editingTrade ? "Edit Trade" : "Add New Trade"}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="trade-modal-head">
          <h2>{editingTrade ? "Edit Trade" : "Add New Trade"}</h2>
          <button
            type="button"
            className="trade-modal-close"
            aria-label="Close"
            onClick={handleClose}
          >
            ×
          </button>
        </header>

        <div className="trade-modal-body">
          {strategies.length === 0 && (
            <p className="warning">
              Create at least one strategy before adding trades.
            </p>
          )}

          {/* Pre-Trade Analysis — position sizing calculator */}
          <section className="pre-trade-card">
            <div className="pre-trade-head">
              <strong>📈 Pre-Trade Analysis</strong>
              <span className="pre-trade-portfolio">
                Portfolio: {portfolio ? formatCurrency(portfolio) : "—"}
              </span>
            </div>
            <p className="subtext">
              Supports unit-based instruments; enter a plan to size the
              position.
            </p>
            <div className="form-row form-row-2">
              <label className="tf-field">
                <span className="field-caption">Entry Price *</span>
                <input
                  type="number"
                  step="0.01"
                  value={buyPrice}
                  onChange={(event) => setBuyPrice(event.target.value)}
                  placeholder="500.00"
                  required
                />
              </label>
              <label className="tf-field">
                <span className="field-caption">Stop Loss</span>
                <input
                  type="number"
                  step="0.01"
                  value={stopLoss}
                  onChange={(event) => setStopLoss(event.target.value)}
                  placeholder="480.00"
                />
              </label>
            </div>
            {positionSizing ? (
              <div className="pre-trade-result">
                <span>
                  Recommended Qty: <strong>{positionSizing.qty}</strong> ·
                  risking {formatCurrency(positionSizing.riskAmount)} (
                  {formatCurrency(positionSizing.perUnitRisk)}/unit)
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setQuantity(String(positionSizing.qty))}
                >
                  Use Qty
                </button>
              </div>
            ) : (
              <p className="info-hint">
                ⓘ Enter Entry Price &amp; Stop Loss to calculate recommended Qty
                as per your portfolio amount and risk limits
                {(!portfolio || !riskPct) &&
                  " (set trading capital & risk % in your Profile)"}
                .
              </p>
            )}
          </section>

          {/* Trade basics */}
          <div className="form-row form-row-4">
            <label className="tf-field">
              <span className="field-caption tf-field-caption-row">
                Symbol *
                <button
                  type="button"
                  className="tf-manage-link"
                  onClick={() => {
                    setManagingInstruments((open) => !open);
                    resetInstrumentDraft();
                  }}
                >
                  {managingInstruments ? "Done" : "Manage"}
                </button>
              </span>
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
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="10"
                required
              />
            </label>
            <label className="tf-field">
              <span className="field-caption">Exit</span>
              <input
                type="number"
                step="0.01"
                value={sellPrice}
                onChange={(event) => setSellPrice(event.target.value)}
                placeholder="2550.00"
              />
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

          {/* Strategy on its own line with rules shown beside it */}
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
              <p>
                {selectedStrategyRules || "Select a strategy to see its rules."}
              </p>
            </div>
          </div>

          {/* Option / cost details */}
          <div className="form-row form-row-4">
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
              <span className="field-caption">Target</span>
              <input
                type="number"
                step="0.01"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder="Planned target"
              />
            </label>
            <label className="tf-field">
              <span className="field-caption">Charges</span>
              <input
                type="number"
                step="0.01"
                value={charges}
                onChange={(event) => setCharges(event.target.value)}
              />
            </label>
          </div>

          {/* Dates */}
          <div className="form-divider">Dates</div>
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

          {/* Execution & discipline */}
          <div className="form-divider">
            Trade Execution &amp; Exit Discipline
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

          {/* Extra journaling */}
          <div className="form-divider">More Detail (optional)</div>
          <div className="form-row form-row-2">
            <label className="tf-field">
              <span className="field-caption">Exit Reason</span>
              <textarea
                value={exitReason}
                onChange={(event) => setExitReason(event.target.value)}
                rows={2}
                placeholder="Why did you exit this trade?"
              />
            </label>
            <label className="tf-field">
              <span className="field-caption">Lesson Learned</span>
              <textarea
                value={lessonLearned}
                onChange={(event) => setLessonLearned(event.target.value)}
                rows={2}
                placeholder="What will you improve next time?"
              />
            </label>
          </div>
          <div className="form-row form-row-2">
            <label className="tf-field">
              <span className="field-caption">Tags (comma separated)</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="breakout, morning, high-conviction"
              />
            </label>
            <label className="tf-field">
              <span className="field-caption">Chart Screenshot</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleScreenshot(event.target.files?.[0])}
              />
              {screenshot && (
                <img
                  src={screenshot}
                  alt="Trade chart"
                  className="screenshot-preview"
                />
              )}
            </label>
          </div>
        </div>

        <footer className="trade-modal-foot">
          <div className="pnl-preview">
            Calculated Net P&amp;L:{" "}
            <strong className={pnlPreview >= 0 ? "profit" : "loss"}>
              {formatCurrency(pnlPreview)}
            </strong>
            {riskReward && (
              <span className="rr-preview">
                {" "}
                | Planned R:R{" "}
                <strong>
                  {riskReward.ratio > 0
                    ? `1 : ${riskReward.ratio.toFixed(2)}`
                    : "set a target"}
                </strong>
              </span>
            )}
          </div>
          {riskWarnings.length > 0 && (
            <div className="risk-alert">
              {riskWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
          <div className="action-row">
            <button type="submit" disabled={!strategies.length}>
              {editingTrade ? "Update Trade" : "Save Trade"}
            </button>
            <button type="button" className="secondary" onClick={handleClose}>
              {editingTrade ? "Cancel Edit" : "Cancel"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
