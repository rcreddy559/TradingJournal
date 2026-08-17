import Papa from "papaparse";
import { DriveEntityKey } from "../types";
import {
  AppSettings,
  ChartExercise,
  InstrumentDef,
  Strategy,
  Trade,
  TraderProfile,
} from "../../types/trade";

/**
 * Converts the in-app JSON shapes to/from the CSV text stored in each Drive
 * file. Binary/base64 fields (trade screenshots, exercise screenshots, the
 * profile avatar) are intentionally dropped: Drive's simple upload path used
 * here is capped around 5MB per request, and embedding images would risk
 * breaking sync for otherwise small text payloads.
 */
export interface JournalSnapshot {
  trades: Trade[];
  strategies: Strategy[];
  instruments: InstrumentDef[];
  exercises: ChartExercise[];
  settings: AppSettings;
  profile: TraderProfile | null;
  syllabus: string[];
}

const s = (value: unknown): string => (value === undefined || value === null ? "" : String(value));
const optStr = (value: string | undefined): string | undefined =>
  value && value.trim() ? value : undefined;
const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const optNum = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const joinList = (list?: string[]): string => (list && list.length ? list.join("|") : "");
const splitList = (value: string | undefined): string[] | undefined => {
  if (!value) return undefined;
  const parts = value.split("|").filter(Boolean);
  return parts.length ? parts : undefined;
};

const unparse = (rows: Record<string, unknown>[]): string =>
  Papa.unparse(rows, { header: true });

const parse = (text: string): Record<string, string>[] => {
  if (!text || !text.trim()) return [];
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
};

// --- Trades -----------------------------------------------------------

const tradesToCsv = (trades: Trade[]): string =>
  unparse(
    trades.map((trade) => ({
      id: trade.id,
      tradeDate: trade.tradeDate,
      instrument: trade.instrument,
      segment: trade.segment,
      strikePrice: trade.strikePrice ?? "",
      optionType: trade.optionType ?? "",
      side: trade.side ?? "",
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      buyPrice: trade.buyPrice,
      sellPrice: trade.sellPrice,
      quantity: trade.quantity,
      charges: trade.charges,
      netPnl: trade.netPnl,
      stopLoss: trade.stopLoss ?? "",
      target: trade.target ?? "",
      tags: joinList(trade.tags),
      strategyId: trade.strategyId,
      status: trade.status,
      notes: trade.notes ?? "",
      emotionBefore: trade.emotionBefore ?? "",
      emotionAfter: trade.emotionAfter ?? "",
      confidenceScore: trade.confidenceScore ?? "",
      mistakeType: trade.mistakeType ?? "",
      executionQuality: trade.executionQuality ?? "",
      entryReason: trade.entryReason ?? "",
      exitReason: trade.exitReason ?? "",
      lessonLearned: trade.lessonLearned ?? "",
      createdAt: trade.createdAt,
      updatedAt: trade.updatedAt,
    })),
  );

const tradesFromCsv = (text: string): Trade[] =>
  parse(text).map((row) => ({
    id: s(row.id),
    tradeDate: s(row.tradeDate),
    instrument: s(row.instrument),
    segment: "OPTIONS",
    strikePrice: optNum(row.strikePrice),
    optionType: optStr(row.optionType) as Trade["optionType"],
    side: optStr(row.side) as Trade["side"],
    entryTime: s(row.entryTime),
    exitTime: s(row.exitTime),
    buyPrice: num(row.buyPrice),
    sellPrice: num(row.sellPrice),
    quantity: num(row.quantity),
    charges: num(row.charges),
    netPnl: num(row.netPnl),
    stopLoss: optNum(row.stopLoss),
    target: optNum(row.target),
    tags: splitList(row.tags),
    strategyId: s(row.strategyId),
    status: (s(row.status) || "SUCCESSFUL") as Trade["status"],
    notes: optStr(row.notes),
    emotionBefore: optStr(row.emotionBefore) as Trade["emotionBefore"],
    emotionAfter: optStr(row.emotionAfter) as Trade["emotionAfter"],
    confidenceScore: optNum(row.confidenceScore),
    mistakeType: optStr(row.mistakeType) as Trade["mistakeType"],
    executionQuality: optStr(row.executionQuality) as Trade["executionQuality"],
    entryReason: optStr(row.entryReason),
    exitReason: optStr(row.exitReason),
    lessonLearned: optStr(row.lessonLearned),
    createdAt: s(row.createdAt) || new Date().toISOString(),
    updatedAt: s(row.updatedAt) || new Date().toISOString(),
  }));

// --- Strategies ---------------------------------------------------------

const strategiesToCsv = (strategies: Strategy[]): string =>
  unparse(
    strategies.map((strategy) => ({
      id: strategy.id,
      name: strategy.name,
      rules: strategy.rules ?? "",
      timeframe: strategy.timeframe ?? "",
      createdAt: strategy.createdAt,
    })),
  );

const strategiesFromCsv = (text: string): Strategy[] =>
  parse(text).map((row) => ({
    id: s(row.id),
    name: s(row.name),
    rules: optStr(row.rules),
    timeframe: optStr(row.timeframe) as Strategy["timeframe"],
    createdAt: s(row.createdAt) || new Date().toISOString(),
  }));

// --- Instruments ----------------------------------------------------------

const instrumentsToCsv = (instruments: InstrumentDef[]): string =>
  unparse(
    instruments.map((instrument) => ({
      id: instrument.id,
      symbol: instrument.symbol,
      name: instrument.name,
      createdAt: instrument.createdAt,
    })),
  );

const instrumentsFromCsv = (text: string): InstrumentDef[] =>
  parse(text).map((row) => ({
    id: s(row.id),
    symbol: s(row.symbol),
    name: s(row.name),
    createdAt: s(row.createdAt) || new Date().toISOString(),
  }));

// --- Chart exercises --------------------------------------------------------

const exercisesToCsv = (exercises: ChartExercise[]): string =>
  unparse(
    exercises.map((exercise) => ({
      id: exercise.id,
      exerciseDate: exercise.exerciseDate,
      instrument: exercise.instrument,
      title: exercise.title,
      bias: exercise.bias,
      timeframe: exercise.timeframe ?? "",
      description: exercise.description,
      strategy: exercise.strategy ?? "",
      keyLevels: exercise.keyLevels ?? "",
      outcome: exercise.outcome ?? "",
      confidence: exercise.confidence ?? "",
      tags: joinList(exercise.tags),
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    })),
  );

const exercisesFromCsv = (text: string): ChartExercise[] =>
  parse(text).map((row) => ({
    id: s(row.id),
    exerciseDate: s(row.exerciseDate),
    instrument: s(row.instrument),
    title: s(row.title),
    bias: (s(row.bias) || "NEUTRAL") as ChartExercise["bias"],
    timeframe: optStr(row.timeframe),
    description: s(row.description),
    strategy: optStr(row.strategy),
    keyLevels: optStr(row.keyLevels),
    outcome: optStr(row.outcome),
    confidence: optNum(row.confidence),
    tags: splitList(row.tags),
    createdAt: s(row.createdAt) || new Date().toISOString(),
    updatedAt: s(row.updatedAt) || new Date().toISOString(),
  }));

// --- Settings (single row) --------------------------------------------------

const settingsToCsv = (settings: AppSettings): string =>
  unparse([
    {
      dailyLossLimit: settings.dailyLossLimit,
      maxTradesPerDay: settings.maxTradesPerDay,
    },
  ]);

const settingsFromCsv = (
  text: string,
  fallback: AppSettings,
): AppSettings => {
  const rows = parse(text);
  if (rows.length === 0) return fallback;
  return {
    dailyLossLimit: num(rows[0].dailyLossLimit, fallback.dailyLossLimit),
    maxTradesPerDay: num(rows[0].maxTradesPerDay, fallback.maxTradesPerDay),
  };
};

// --- Profile (single row, may be absent) -----------------------------------

const profileToCsv = (profile: TraderProfile | null): string => {
  if (!profile) return unparse([]);
  return unparse([
    {
      id: profile.id,
      fullName: profile.fullName,
      displayName: profile.displayName,
      email: profile.email,
      role: profile.role,
      bio: profile.bio,
      broker: profile.broker,
      baseCurrency: profile.baseCurrency,
      tradingCapital: profile.tradingCapital,
      riskPerTradePct: profile.riskPerTradePct,
      experienceLevel: profile.experienceLevel,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
  ]);
};

const profileFromCsv = (text: string): TraderProfile | null => {
  const rows = parse(text);
  if (rows.length === 0) return null;
  const row = rows[0];
  if (!row.id) return null;
  return {
    id: s(row.id),
    fullName: s(row.fullName),
    displayName: s(row.displayName),
    email: s(row.email),
    role: s(row.role),
    bio: s(row.bio),
    broker: s(row.broker),
    baseCurrency: s(row.baseCurrency) || "INR",
    tradingCapital: num(row.tradingCapital),
    riskPerTradePct: num(row.riskPerTradePct),
    experienceLevel: (s(row.experienceLevel) ||
      "BEGINNER") as TraderProfile["experienceLevel"],
    createdAt: s(row.createdAt) || new Date().toISOString(),
    updatedAt: s(row.updatedAt) || new Date().toISOString(),
  };
};

// --- Syllabus progress (one completed day id per row) -----------------------

const syllabusToCsv = (completedDayIds: string[]): string =>
  unparse(completedDayIds.map((dayId) => ({ dayId })));

const syllabusFromCsv = (text: string): string[] =>
  parse(text)
    .map((row) => s(row.dayId))
    .filter(Boolean);

/** Serializes one entity slice of a snapshot to CSV text. */
export const entityToCsv = (
  key: DriveEntityKey,
  snapshot: JournalSnapshot,
): string => {
  switch (key) {
    case "trades":
      return tradesToCsv(snapshot.trades);
    case "strategies":
      return strategiesToCsv(snapshot.strategies);
    case "instruments":
      return instrumentsToCsv(snapshot.instruments);
    case "exercises":
      return exercisesToCsv(snapshot.exercises);
    case "settings":
      return settingsToCsv(snapshot.settings);
    case "profile":
      return profileToCsv(snapshot.profile);
    case "syllabus":
      return syllabusToCsv(snapshot.syllabus);
    default:
      return "";
  }
};

/** Parses CSV text for one entity back into its JSON shape. */
export const csvToTrades = tradesFromCsv;
export const csvToStrategies = strategiesFromCsv;
export const csvToInstruments = instrumentsFromCsv;
export const csvToExercises = exercisesFromCsv;
export const csvToSettings = settingsFromCsv;
export const csvToProfile = profileFromCsv;
export const csvToSyllabus = syllabusFromCsv;
