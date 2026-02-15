import { MistakeType, TradeEmotion } from "../types/trade";

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
