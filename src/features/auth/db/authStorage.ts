import {
  CURRENT_USER_STORAGE_KEY,
  KNOWN_USERS_STORAGE_KEY,
} from "../../../shared/constants";

/**
 * Persists the active username so the session survives page reloads and so the
 * journal storage layer can scope data per user.
 */
export const readCurrentUser = (): string | null => {
  const value = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  return value && value.trim() ? value : null;
};

export const writeCurrentUser = (username: string): void => {
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
};

/**
 * Registry of usernames that have signed in on this device, so the login screen
 * can offer them in a dropdown instead of retyping the name each time.
 */
export const readKnownUsers = (): string[] => {
  try {
    const raw = localStorage.getItem(KNOWN_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
  } catch {
    return [];
  }
};

const writeKnownUsers = (users: string[]): void => {
  localStorage.setItem(KNOWN_USERS_STORAGE_KEY, JSON.stringify(users));
};

export const addKnownUser = (username: string): string[] => {
  const trimmed = username.trim();
  if (!trimmed) return readKnownUsers();
  const existing = readKnownUsers();
  if (existing.some((user) => user.toLowerCase() === trimmed.toLowerCase())) {
    return existing;
  }
  const next = [...existing, trimmed].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  writeKnownUsers(next);
  return next;
};

export const removeKnownUser = (username: string): string[] => {
  const next = readKnownUsers().filter(
    (user) => user.toLowerCase() !== username.trim().toLowerCase(),
  );
  writeKnownUsers(next);
  return next;
};
