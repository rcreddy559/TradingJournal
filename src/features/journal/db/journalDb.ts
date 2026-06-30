import { CURRENT_USER_STORAGE_KEY } from "../../../shared/constants";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/**
 * Scopes a storage key to the currently logged-in user so that multiple
 * users on the same browser keep separate trades, strategies and settings.
 * Falls back to the bare key when no user is active.
 */
const scopedKey = (key: string): string => {
  const user = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  return user ? `u:${user}:${key}` : key;
};

const read = <T>(key: string, fallback: T): T => {
  return safeParse<T>(localStorage.getItem(scopedKey(key)), fallback);
};

const write = <T>(key: string, value: T): void => {
  localStorage.setItem(scopedKey(key), JSON.stringify(value));
};

export const journalDb = {
  read,
  write,
};
