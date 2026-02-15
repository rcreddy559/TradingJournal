import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AppSettings,
  MistakeType,
  Strategy,
  Trade,
  TradeEmotion,
} from "../types/trade";
import { calculateNetPnl, formatCurrency } from "../utils/calculations";

interface AddTradePageProps {
  strategies: Strategy[];
  trades: Trade[];
  settings: AppSettings;
  editingTrade: Trade | null;
  onCreate: (trade: Trade) => void;
  onUpdate: (trade: Trade) => void;
  onCancelEdit: () => void;
}

const NOTES_MAX_LENGTH = 1000;

const EMOTION_OPTIONS: TradeEmotion[] = [
  "CALM",
  "CONFIDENT",
  "FEAR",
  "GREED",
  "REVENGE",
  "FOMO",
  "HESITANT",
];
const MISTAKE_OPTIONS: MistakeType[] = [
  "NONE",
  "OVERTRADING",
  "REVENGE_TRADE",
  "EARLY_EXIT",
  "LATE_ENTRY",
  "NO_STOP_LOSS",
  "RULE_BREAK",
];

const QUICK_NOTE_TEMPLATES = [
  "Entry aligned with trend and setup checklist.",
  "Stop loss respected as per plan.",
  "Exited early due to fear.",
  "Overtrading signal: avoid next time.",
  "Followed risk per trade and position sizing.",
  "Lesson: wait for confirmation candle.",
];

const toIsoFromDateTime = (date: string, time: string): string => {
  try {
    if (!date) return new Date().toISOString();
    const timeToUse = time && time.includes(":") ? time : "00:00:00";
    const normalizedTime =
      timeToUse.split(":").length === 2 ? `${timeToUse}:00` : timeToUse;
    const d = new Date(`${date}T${normalizedTime}`);
    if (Number.isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const toTimeInputValue = (iso: string): string => {
  if (!iso) return "";
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const getCurrentTimeInputValue = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const generateId = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export default function AddTradePage({
  strategies,
  trades,
  settings,
  editingTrade,
  onCreate,
  onUpdate,
  onCancelEdit,
}: AddTradePageProps) {
  const nowDate = new Date().toISOString().slice(0, 10);

  const [tradeDate, setTradeDate] = useState(nowDate);
  const [instrument, setInstrument] =
    useState<Trade["instrument"]>("BANKNIFTY");
  const [strikePrice, setStrikePrice] = useState("");
  const [optionType, setOptionType] = useState<Trade["optionType"]>("CE");
  const [entryTime, setEntryTime] = useState(getCurrentTimeInputValue);
  const [exitTime, setExitTime] = useState(getCurrentTimeInputValue);
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState("15");
  const [charges, setCharges] = useState("0");
  const [strategyId, setStrategyId] = useState("");
  const [status, setStatus] = useState<Trade["status"]>("SUCCESSFUL");
  const [notes, setNotes] = useState("");

  const [emotionBefore, setEmotionBefore] = useState<TradeEmotion>("CALM");
  const [emotionAfter, setEmotionAfter] = useState<TradeEmotion>("CALM");
  const [mistakeType, setMistakeType] = useState<MistakeType>("NONE");
  const [confidenceScore, setConfidenceScore] = useState("3");
  const [entryReason, setEntryReason] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");

  useEffect(() => {
    if (!editingTrade) return;

    setTradeDate(editingTrade.tradeDate);
    setInstrument(editingTrade.instrument);
    setStrikePrice(
      editingTrade.strikePrice ? String(editingTrade.strikePrice) : "",
    );
    setOptionType(editingTrade.optionType ?? "CE");
    setEntryTime(toTimeInputValue(editingTrade.entryTime));
    setExitTime(toTimeInputValue(editingTrade.exitTime));
    setBuyPrice(String(editingTrade.buyPrice));
    setSellPrice(String(editingTrade.sellPrice));
    setQuantity(String(editingTrade.quantity));
    setCharges(String(editingTrade.charges));
    setStrategyId(editingTrade.strategyId);
    setStatus(editingTrade.status);
    setNotes(editingTrade.notes ?? "");

    setEmotionBefore(editingTrade.emotionBefore ?? "CALM");
    setEmotionAfter(editingTrade.emotionAfter ?? "CALM");
    setMistakeType(editingTrade.mistakeType ?? "NONE");
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
    setQuantity("15");
    setCharges("0");
    setStatus("SUCCESSFUL");
    setOptionType("CE");
    setInstrument("BANKNIFTY");
    setStrategyId("");
    setTradeDate(nowDate);

    setEmotionBefore("CALM");
    setEmotionAfter("CALM");
    setMistakeType("NONE");
    setConfidenceScore("3");
    setEntryReason("");
    setExitReason("");
    setLessonLearned("");
  };

  const appendQuickNote = (snippet: string) => {
    setNotes((prev) => {
      const next = prev.trim().length > 0 ? `${prev}\n${snippet}` : snippet;
      return next.slice(0, NOTES_MAX_LENGTH);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
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
        entryTime: entryDateTime,
        exitTime: exitDateTime,
        buyPrice: Number(buyPrice || 0),
        sellPrice: Number(sellPrice || 0),
        quantity: Number(quantity || 0),
        charges: Number(charges || 0),
        netPnl: pnlPreview,
        strategyId,
        status,
        notes: notes.trim(),
        emotionBefore,
        emotionAfter,
        mistakeType,
        confidenceScore: Number(confidenceScore || 0),
        entryReason: entryReason.trim(),
        exitReason: exitReason.trim(),
        lessonLearned: lessonLearned.trim(),
        createdAt: editingTrade?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingTrade) {
        onUpdate(baseTrade);
        onCancelEdit();
      } else {
        onCreate(baseTrade);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save trade:", error);
      window.alert(
        "An error occurred while saving the trade. Please check if the date and time are valid.",
      );
    }
  };

  return (
    <section className="page">
      <h2>{editingTrade ? "Edit Trade" : "Add Trade"}</h2>
      {strategies.length === 0 && (
        <p className="warning">
          Create at least one strategy before adding trades.
        </p>
      )}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Trade Date
          <input
            type="date"
            value={tradeDate}
            onChange={(event) => setTradeDate(event.target.value)}
            required
          />
        </label>
        <label>
          Instrument
          <select
            value={instrument}
            onChange={(event) =>
              setInstrument(event.target.value as Trade["instrument"])
            }
          >
            <option value="BANKNIFTY">Bank Nifty</option>
            <option value="NIFTY50">Nifty 50</option>
            <option value="MCX_CRUDE">MCX Crude Oil</option>
          </select>
        </label>
        <label>
          Strike Price
          <input
            type="number"
            value={strikePrice}
            onChange={(event) => setStrikePrice(event.target.value)}
            placeholder="Optional"
          />
        </label>
        <label>
          Option Type
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
        <label>
          Entry Time
          <input
            type="time"
            value={entryTime}
            onChange={(event) => setEntryTime(event.target.value)}
          />
        </label>
        <label>
          Exit Time
          <input
            type="time"
            value={exitTime}
            onChange={(event) => setExitTime(event.target.value)}
          />
        </label>
        <label>
          Buy Price
          <input
            type="number"
            step="0.01"
            value={buyPrice}
            onChange={(event) => setBuyPrice(event.target.value)}
            required
          />
        </label>
        <label>
          Sell Price
          <input
            type="number"
            step="0.01"
            value={sellPrice}
            onChange={(event) => setSellPrice(event.target.value)}
            required
          />
        </label>
        <label>
          Quantity
          <input
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </label>
        <label>
          Charges
          <input
            type="number"
            step="0.01"
            value={charges}
            onChange={(event) => setCharges(event.target.value)}
          />
        </label>
        <label>
          Strategy
          <select
            value={strategyId}
            onChange={(event) => setStrategyId(event.target.value)}
            required
          >
            <option value="">Select strategy</option>
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Trade["status"])
            }
          >
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>

        <label>
          Emotion Before Trade
          <select
            value={emotionBefore}
            onChange={(event) =>
              setEmotionBefore(event.target.value as TradeEmotion)
            }
          >
            {EMOTION_OPTIONS.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </label>
        <label>
          Emotion After Trade
          <select
            value={emotionAfter}
            onChange={(event) =>
              setEmotionAfter(event.target.value as TradeEmotion)
            }
          >
            {EMOTION_OPTIONS.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mistake Type
          <select
            value={mistakeType}
            onChange={(event) =>
              setMistakeType(event.target.value as MistakeType)
            }
          >
            {MISTAKE_OPTIONS.map((mistake) => (
              <option key={mistake} value={mistake}>
                {mistake}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={confidenceScore}
            onChange={(event) => setConfidenceScore(event.target.value)}
          />
        </label>

        <label className="full-width">
          Entry Reason
          <textarea
            value={entryReason}
            onChange={(event) => setEntryReason(event.target.value)}
            rows={2}
            placeholder="Why did you enter this trade?"
          />
        </label>
        <label className="full-width">
          Exit Reason
          <textarea
            value={exitReason}
            onChange={(event) => setExitReason(event.target.value)}
            rows={2}
            placeholder="Why did you exit this trade?"
          />
        </label>
        <label className="full-width">
          Lesson Learned
          <textarea
            value={lessonLearned}
            onChange={(event) => setLessonLearned(event.target.value)}
            rows={2}
            placeholder="What will you improve next time?"
          />
        </label>

        <div className="full-width quick-note-row">
          {QUICK_NOTE_TEMPLATES.map((snippet) => (
            <button
              key={snippet}
              type="button"
              className="secondary"
              onClick={() => appendQuickNote(snippet)}
            >
              + {snippet.slice(0, 20)}...
            </button>
          ))}
        </div>

        <label className="full-width">
          Notes
          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value.slice(0, NOTES_MAX_LENGTH))
            }
            rows={4}
            maxLength={NOTES_MAX_LENGTH}
            placeholder="Write detailed context, execution quality, and market behavior"
          />
          <span className="char-counter">
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </label>

        <div className="pnl-preview">
          Calculated Net P&L:{" "}
          <strong className={pnlPreview >= 0 ? "profit" : "loss"}>
            {formatCurrency(pnlPreview)}
          </strong>
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
          {editingTrade && (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
