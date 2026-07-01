import { ExecutionQuality, MistakeType, TradeEmotion } from "../types/trade";

export const NOTES_MAX_LENGTH = 1000;

export const EMOTION_OPTIONS: TradeEmotion[] = [
  "CALM",
  "CONFIDENT",
  "FEAR",
  "GREED",
  "REVENGE",
  "FOMO",
  "HESITANT",
];

export const MISTAKE_OPTIONS: MistakeType[] = [
  "NONE",
  "OVERTRADING",
  "REVENGE_TRADE",
  "EARLY_EXIT",
  "LATE_ENTRY",
  "NO_STOP_LOSS",
  "RULE_BREAK",
];

export const QUICK_NOTE_TEMPLATES = [
  "Entry aligned with trend and setup checklist.",
  "Stop loss respected as per plan.",
  "Exited early due to fear.",
  "Overtrading signal: avoid next time.",
  "Followed risk per trade and position sizing.",
  "Lesson: wait for confirmation candle.",
];

/** Readable labels for the pre-trade emotion select. */
export const EMOTION_LABELS: Record<TradeEmotion, string> = {
  CALM: "Calm",
  CONFIDENT: "Confident",
  FEAR: "Fear",
  GREED: "Greed",
  REVENGE: "Revenge",
  FOMO: "FOMO",
  HESITANT: "Hesitant",
};

/** Readable labels for the mistake-type select. */
export const MISTAKE_LABELS: Record<MistakeType, string> = {
  NONE: "None",
  OVERTRADING: "Overtrading",
  REVENGE_TRADE: "Revenge trade",
  EARLY_EXIT: "Early exit",
  LATE_ENTRY: "Late entry",
  NO_STOP_LOSS: "No stop loss",
  RULE_BREAK: "Rule break",
};

export const EXECUTION_QUALITY_OPTIONS: ExecutionQuality[] = [
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "POOR",
  "VERY_POOR",
];

export const EXECUTION_QUALITY_LABELS: Record<ExecutionQuality, string> = {
  EXCELLENT: "Excellent - textbook execution",
  GOOD: "Good - minor slippage",
  AVERAGE: "Average - room to improve",
  POOR: "Poor - broke process",
  VERY_POOR: "Very poor - undisciplined",
};

/**
 * Two-level "reasons for trade" taxonomy. Picking a category chip reveals its
 * specific reasons; the chosen reason is stored on `entryReason`.
 */
export const TRADE_REASON_CATEGORIES: Record<string, string[]> = {
  "Experimental / Learning": [
    "Testing a new setup",
    "Paper-to-live transition",
    "Studying market behavior",
  ],
  "External Influence": [
    "Tip from someone",
    "News / media driven",
    "Social media signal",
  ],
  "Intuition / Discretionary": [
    "Gut feeling",
    "Discretionary read",
    "Pattern recognition",
  ],
  "Process & Discipline": [
    "Followed trading plan",
    "Setup checklist met",
    "A+ high-conviction setup",
  ],
  Psychological: ["FOMO entry", "Revenge trade", "Boredom trade"],
  "Risk Red Flags": [
    "No stop loss placed",
    "Oversized position",
    "Trading against the trend",
  ],
  Situational: [
    "Breakout",
    "Pullback to support",
    "Range reversal",
    "Trend continuation",
  ],
};
