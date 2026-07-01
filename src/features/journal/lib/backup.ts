import { AppSettings, Strategy, Trade, TraderProfile } from "../types/trade";

export interface JournalBackup {
  version: 1;
  exportedAt: string;
  trades: Trade[];
  strategies: Strategy[];
  settings: AppSettings;
  profile?: TraderProfile | null;
}

export const buildBackup = (
  trades: Trade[],
  strategies: Strategy[],
  settings: AppSettings,
  profile: TraderProfile | null,
): JournalBackup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  trades,
  strategies,
  settings,
  profile,
});

export const downloadBackup = (
  backup: JournalBackup,
  fileName: string,
): void => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

export interface ParsedBackup {
  trades: Trade[];
  strategies: Strategy[];
  settings?: AppSettings;
  profile?: TraderProfile | null;
}

/**
 * Validates and normalizes a JSON backup file. Returns null when the payload is
 * not a recognisable journal backup so callers can surface a clear error.
 */
export const parseBackup = (text: string): ParsedBackup | null => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<JournalBackup>;
  if (
    !Array.isArray(candidate.trades) ||
    !Array.isArray(candidate.strategies)
  ) {
    return null;
  }

  return {
    trades: candidate.trades as Trade[],
    strategies: candidate.strategies as Strategy[],
    settings:
      candidate.settings && typeof candidate.settings === "object"
        ? (candidate.settings as AppSettings)
        : undefined,
    profile:
      candidate.profile && typeof candidate.profile === "object"
        ? (candidate.profile as TraderProfile)
        : undefined,
  };
};
