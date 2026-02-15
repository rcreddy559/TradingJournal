const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const read = <T>(key: string, fallback: T): T => {
  return safeParse<T>(localStorage.getItem(key), fallback);
};

const write = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const journalDb = {
  read,
  write,
};

