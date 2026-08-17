/**
 * Google Drive sync: every journal entity is mirrored into its own CSV file
 * inside a "TradingJournal" folder in the signed-in user's My Drive.
 */

export type DriveConnectionStatus =
  | "unconfigured"
  | "disconnected"
  | "connecting"
  | "syncing"
  | "connected"
  | "error";

export interface AccessTokenInfo {
  accessToken: string;
  /** Epoch ms; refreshed slightly before Google's real expiry. */
  expiresAt: number;
}

/** Bookkeeping for one synced CSV file, used for conflict detection. */
export interface DriveFileRecord {
  fileId: string;
  /** Drive's `modifiedTime` the last time *this device* read or wrote the file. */
  lastKnownModifiedTime: string;
}

export type DriveEntityKey =
  | "trades"
  | "strategies"
  | "instruments"
  | "exercises"
  | "settings"
  | "profile"
  | "syllabus";

export interface DriveSyncState {
  connected: boolean;
  folderId: string | null;
  files: Partial<Record<DriveEntityKey, DriveFileRecord>>;
  lastSyncedAt: string | null;
  accountEmail?: string;
}

export const EMPTY_DRIVE_SYNC_STATE: DriveSyncState = {
  connected: false,
  folderId: null,
  files: {},
  lastSyncedAt: null,
};
