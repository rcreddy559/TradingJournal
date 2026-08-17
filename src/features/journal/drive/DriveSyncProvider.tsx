import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useConfirm, useToast } from "../../../shared/ui";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useJournalActions, useJournalState } from "../store/hooks";
import { DEFAULT_SETTINGS } from "../api/journalService";
import { DriveConnectionStatus, DriveEntityKey, DriveFileRecord } from "./types";
import {
  clearAccessToken,
  fetchAccountEmail,
  requestAccessToken,
} from "./lib/googleAuth";
import {
  DriveFileMeta,
  downloadFileContent,
  ensureAppFolder,
  ensureEntityFile,
  getFileMetadata,
  updateFileContent,
} from "./lib/driveClient";
import {
  JournalSnapshot,
  csvToExercises,
  csvToInstruments,
  csvToProfile,
  csvToSettings,
  csvToStrategies,
  csvToSyllabus,
  csvToTrades,
  entityToCsv,
} from "./lib/csvMappers";
import { syllabusStore, useSyllabusProgress } from "./syllabusStore";
import { ConnectDriveScreen } from "./ConnectDriveScreen";

const DRIVE_ENTITY_KEYS: DriveEntityKey[] = [
  "trades",
  "strategies",
  "instruments",
  "exercises",
  "settings",
  "profile",
  "syllabus",
];

const AUTO_PUSH_DEBOUNCE_MS = 4000;

interface DriveSyncContextValue {
  status: DriveConnectionStatus;
  isConfigured: boolean;
  accountEmail: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  syncNow: () => Promise<void>;
}

const DriveSyncContext = createContext<DriveSyncContextValue | null>(null);

export const useDriveSync = (): DriveSyncContextValue => {
  const context = useContext(DriveSyncContext);
  if (!context) {
    throw new Error("useDriveSync must be used within DriveSyncProvider");
  }
  return context;
};

const buildSnapshot = (
  state: ReturnType<typeof useJournalState>,
  syllabus: string[],
): JournalSnapshot => ({
  trades: state.trades,
  strategies: state.strategies,
  instruments: state.instruments,
  exercises: state.exercises,
  settings: state.settings,
  profile: state.profile,
  syllabus,
});

export function DriveSyncProvider({ children }: { children: ReactNode }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(clientId);

  const state = useJournalState();
  const { restoreBackup, applyRemoteSnapshot } = useJournalActions();
  const [syllabus] = useSyllabusProgress();
  const { notify } = useToast();
  const confirm = useConfirm();

  const [status, setStatus] = useState<DriveConnectionStatus>(
    isConfigured ? "disconnected" : "unconfigured",
  );
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const folderIdRef = useRef<string | null>(null);
  const fileRecordsRef = useRef<Partial<Record<DriveEntityKey, DriveFileRecord>>>(
    {},
  );

  const ensureFolderId = async (accessToken: string): Promise<string> => {
    if (folderIdRef.current) return folderIdRef.current;
    const id = await ensureAppFolder(accessToken);
    folderIdRef.current = id;
    return id;
  };

  /** Downloads (creating empty files as needed) every entity file at once. */
  const downloadAll = async (
    accessToken: string,
    folderId: string,
  ): Promise<{
    snapshot: JournalSnapshot;
    records: Partial<Record<DriveEntityKey, DriveFileRecord>>;
  }> => {
    const records: Partial<Record<DriveEntityKey, DriveFileRecord>> = {};
    const raw: Partial<Record<DriveEntityKey, string>> = {};

    await Promise.all(
      DRIVE_ENTITY_KEYS.map(async (key) => {
        const { file, existed } = await ensureEntityFile(
          accessToken,
          folderId,
          key,
          "",
        );
        records[key] = { fileId: file.id, lastKnownModifiedTime: file.modifiedTime };
        raw[key] = existed ? await downloadFileContent(accessToken, file.id) : "";
      }),
    );

    const snapshot: JournalSnapshot = {
      trades: csvToTrades(raw.trades ?? ""),
      strategies: csvToStrategies(raw.strategies ?? ""),
      instruments: csvToInstruments(raw.instruments ?? ""),
      exercises: csvToExercises(raw.exercises ?? ""),
      settings: csvToSettings(raw.settings ?? "", DEFAULT_SETTINGS),
      profile: csvToProfile(raw.profile ?? ""),
      syllabus: csvToSyllabus(raw.syllabus ?? ""),
    };

    return { snapshot, records };
  };

  /** Applies a freshly-downloaded remote value for one entity onto local state. */
  const applyRemoteEntity = (
    key: DriveEntityKey,
    text: string,
    current: JournalSnapshot,
  ): void => {
    if (key === "syllabus") {
      syllabusStore.set(csvToSyllabus(text));
      return;
    }
    const patch: Partial<JournalSnapshot> = {};
    if (key === "trades") patch.trades = csvToTrades(text);
    if (key === "strategies") patch.strategies = csvToStrategies(text);
    if (key === "instruments") patch.instruments = csvToInstruments(text);
    if (key === "exercises") patch.exercises = csvToExercises(text);
    if (key === "settings") patch.settings = csvToSettings(text, current.settings);
    if (key === "profile") patch.profile = csvToProfile(text);

    applyRemoteSnapshot({
      trades: patch.trades ?? current.trades,
      strategies: patch.strategies ?? current.strategies,
      instruments: patch.instruments ?? current.instruments,
      exercises: patch.exercises ?? current.exercises,
      settings: patch.settings ?? current.settings,
      profile: patch.profile !== undefined ? patch.profile : current.profile,
    });
  };

  /**
   * Pushes one entity, first checking whether the remote file changed since
   * we last touched it. If it did, we back off and adopt the remote version
   * instead of overwriting a device we haven't seen yet.
   */
  const pushEntity = async (
    accessToken: string,
    folderId: string,
    key: DriveEntityKey,
    snapshot: JournalSnapshot,
  ): Promise<{ conflict: boolean }> => {
    let record = fileRecordsRef.current[key];
    if (!record) {
      const { file } = await ensureEntityFile(accessToken, folderId, key, "");
      record = { fileId: file.id, lastKnownModifiedTime: file.modifiedTime };
      fileRecordsRef.current[key] = record;
    }

    const meta: DriveFileMeta = await getFileMetadata(accessToken, record.fileId);
    const knownTime = record.lastKnownModifiedTime;
    const remoteChanged =
      Boolean(knownTime) &&
      new Date(meta.modifiedTime).getTime() > new Date(knownTime).getTime();

    if (remoteChanged) {
      const remoteText = await downloadFileContent(accessToken, record.fileId);
      applyRemoteEntity(key, remoteText, snapshot);
      fileRecordsRef.current[key] = {
        fileId: record.fileId,
        lastKnownModifiedTime: meta.modifiedTime,
      };
      return { conflict: true };
    }

    const csvText = entityToCsv(key, snapshot);
    const updated = await updateFileContent(accessToken, record.fileId, csvText);
    fileRecordsRef.current[key] = {
      fileId: record.fileId,
      lastKnownModifiedTime: updated.modifiedTime,
    };
    return { conflict: false };
  };

  const pushAll = async (): Promise<void> => {
    if (!clientId) return;
    try {
      setStatus("syncing");
      setError(null);
      let accessToken: string;
      try {
        accessToken = await requestAccessToken(clientId, false);
      } catch {
        accessToken = await requestAccessToken(clientId, true);
      }
      const folderId = await ensureFolderId(accessToken);
      const snapshot = buildSnapshot(state, syllabus);
      let hadConflict = false;
      for (const key of DRIVE_ENTITY_KEYS) {
        const result = await pushEntity(accessToken, folderId, key, snapshot);
        if (result.conflict) hadConflict = true;
      }
      setLastSyncedAt(new Date().toISOString());
      setStatus("connected");
      if (hadConflict) {
        notify("Some data was just updated from another device.", "info");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google Drive sync failed.",
      );
      setStatus("error");
    }
  };

  const connect = async (): Promise<void> => {
    if (!clientId) return;
    setStatus("connecting");
    setError(null);
    try {
      const accessToken = await requestAccessToken(clientId, true);
      const email = await fetchAccountEmail(accessToken);
      setAccountEmail(email);

      const folderId = await ensureFolderId(accessToken);
      const { snapshot: remoteSnapshot, records } = await downloadAll(
        accessToken,
        folderId,
      );
      fileRecordsRef.current = records;

      const localHasData = state.trades.length > 0 || state.profile !== null;
      const remoteHasData =
        remoteSnapshot.trades.length > 0 || remoteSnapshot.profile !== null;

      if (localHasData && remoteHasData) {
        const proceed = await confirm({
          title: "Google Drive already has journal data",
          message:
            "Your TradingJournal folder in Google Drive already contains data. Connecting will replace what's shown here with the data from Drive. If you want to keep both, download a JSON backup from Settings first.",
          confirmLabel: "Replace with Drive data",
          danger: true,
        });
        if (!proceed) {
          setStatus("disconnected");
          return;
        }
        restoreBackup(remoteSnapshot);
        syllabusStore.set(remoteSnapshot.syllabus);
      } else if (remoteHasData && !localHasData) {
        restoreBackup(remoteSnapshot);
        syllabusStore.set(remoteSnapshot.syllabus);
      } else if (localHasData && !remoteHasData) {
        const localSnapshot = buildSnapshot(state, syllabus);
        for (const key of DRIVE_ENTITY_KEYS) {
          await pushEntity(accessToken, folderId, key, localSnapshot);
        }
      }

      setStatus("connected");
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to Google Drive.",
      );
      setStatus("error");
    }
  };

  const disconnect = (): void => {
    clearAccessToken();
    setAccountEmail(null);
    setError(null);
    setStatus("disconnected");
  };

  // Batch every local change into one debounced push (~4s of quiet) instead
  // of hitting the Drive API on every keystroke.
  const snapshotKey = useMemo(
    () => JSON.stringify(buildSnapshot(state, syllabus)),
    [
      state.trades,
      state.strategies,
      state.instruments,
      state.exercises,
      state.settings,
      state.profile,
      syllabus,
    ],
  );
  const debouncedSnapshotKey = useDebounce(snapshotKey, AUTO_PUSH_DEBOUNCE_MS);
  const skipNextPush = useRef(true);

  useEffect(() => {
    if (status !== "connected" && status !== "syncing") {
      skipNextPush.current = true;
      return;
    }
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    void pushAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSnapshotKey, status]);

  const contextValue: DriveSyncContextValue = {
    status,
    isConfigured,
    accountEmail,
    lastSyncedAt,
    error,
    connect,
    disconnect,
    syncNow: pushAll,
  };

  return (
    <DriveSyncContext.Provider value={contextValue}>
      {status === "connected" || status === "syncing" ? (
        children
      ) : (
        <ConnectDriveScreen
          status={status}
          isConfigured={isConfigured}
          error={error}
          connect={connect}
        />
      )}
    </DriveSyncContext.Provider>
  );
}
