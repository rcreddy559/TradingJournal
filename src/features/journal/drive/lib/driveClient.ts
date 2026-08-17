import { DriveEntityKey } from "../types";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const APP_FOLDER_NAME = "TradingJournal";

/** File names for each synced entity, stored as CSV inside the app folder. */
export const FILE_NAMES: Record<DriveEntityKey, string> = {
  trades: "trades.csv",
  strategies: "strategies.csv",
  instruments: "instruments.csv",
  exercises: "chart_exercises.csv",
  settings: "settings.csv",
  profile: "profile.csv",
  syllabus: "syllabus_progress.csv",
};

export interface DriveFileMeta {
  id: string;
  modifiedTime: string;
}

class DriveApiError extends Error {}

const authFetch = async (
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new DriveApiError(
      `Google Drive request failed (${response.status}): ${body || response.statusText}`,
    );
  }
  return response;
};

/** Finds the visible "TradingJournal" folder in My Drive, creating it if missing. */
export const ensureAppFolder = async (accessToken: string): Promise<string> => {
  const query = encodeURIComponent(
    `name='${APP_FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and 'root' in parents and trashed=false`,
  );
  const listResponse = await authFetch(
    accessToken,
    `${DRIVE_FILES_URL}?q=${query}&fields=files(id,name)&spaces=drive`,
  );
  const listData = (await listResponse.json()) as {
    files?: { id: string; name: string }[];
  };
  if (listData.files && listData.files.length > 0) {
    return listData.files[0].id;
  }

  const createResponse = await authFetch(accessToken, DRIVE_FILES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: FOLDER_MIME,
      parents: ["root"],
    }),
  });
  const created = (await createResponse.json()) as { id: string };
  return created.id;
};

/** Finds a file by name within the given folder. */
const findFile = async (
  accessToken: string,
  folderId: string,
  name: string,
): Promise<DriveFileMeta | null> => {
  const query = encodeURIComponent(
    `name='${name}' and '${folderId}' in parents and trashed=false`,
  );
  const response = await authFetch(
    accessToken,
    `${DRIVE_FILES_URL}?q=${query}&fields=files(id,modifiedTime)&spaces=drive`,
  );
  const data = (await response.json()) as {
    files?: { id: string; modifiedTime: string }[];
  };
  if (!data.files || data.files.length === 0) return null;
  return { id: data.files[0].id, modifiedTime: data.files[0].modifiedTime };
};

const createFile = async (
  accessToken: string,
  folderId: string,
  name: string,
  content: string,
): Promise<DriveFileMeta> => {
  const boundary = `-------tj${Date.now()}`;
  const metadata = { name, parents: [folderId], mimeType: "text/csv" };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/csv; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const response = await authFetch(
    accessToken,
    `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,modifiedTime`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return (await response.json()) as DriveFileMeta;
};

/** Ensures a CSV file exists for the entity, creating an empty one if needed. */
export const ensureEntityFile = async (
  accessToken: string,
  folderId: string,
  key: DriveEntityKey,
  emptyContent: string,
): Promise<{ file: DriveFileMeta; existed: boolean }> => {
  const existing = await findFile(accessToken, folderId, FILE_NAMES[key]);
  if (existing) return { file: existing, existed: true };
  const created = await createFile(
    accessToken,
    folderId,
    FILE_NAMES[key],
    emptyContent,
  );
  return { file: created, existed: false };
};

export const getFileMetadata = async (
  accessToken: string,
  fileId: string,
): Promise<DriveFileMeta> => {
  const response = await authFetch(
    accessToken,
    `${DRIVE_FILES_URL}/${fileId}?fields=id,modifiedTime`,
  );
  return (await response.json()) as DriveFileMeta;
};

export const downloadFileContent = async (
  accessToken: string,
  fileId: string,
): Promise<string> => {
  const response = await authFetch(
    accessToken,
    `${DRIVE_FILES_URL}/${fileId}?alt=media`,
  );
  return response.text();
};

/** Overwrites a file's content in place, returning the new `modifiedTime`. */
export const updateFileContent = async (
  accessToken: string,
  fileId: string,
  content: string,
): Promise<DriveFileMeta> => {
  const response = await authFetch(
    accessToken,
    `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media&fields=id,modifiedTime`,
    {
      method: "PATCH",
      headers: { "Content-Type": "text/csv; charset=UTF-8" },
      body: content,
    },
  );
  return (await response.json()) as DriveFileMeta;
};
