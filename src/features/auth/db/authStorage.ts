import { CURRENT_USER_STORAGE_KEY } from "../../../shared/constants";

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
