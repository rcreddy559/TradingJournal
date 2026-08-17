import { useSyncExternalStore } from "react";

/**
 * Syllabus progress lives outside the main journal reducer (it's a simple
 * set of completed day ids). Since persistence now flows through Google
 * Drive instead of localStorage, this tiny external store lets the
 * `SyllabusPage` and the Drive sync provider share the same in-memory value
 * without wiring a full reducer action for it.
 */
let completedDayIds: string[] = [];
const listeners = new Set<() => void>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

export const syllabusStore = {
  get: (): string[] => completedDayIds,
  set: (next: string[]): void => {
    completedDayIds = next;
    notify();
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useSyllabusProgress = (): [string[], (next: string[]) => void] => {
  const value = useSyncExternalStore(
    syllabusStore.subscribe,
    syllabusStore.get,
  );
  return [value, syllabusStore.set];
};
