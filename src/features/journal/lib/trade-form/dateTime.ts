export const toIsoFromDateTime = (date: string, time: string): string => {
  try {
    if (!date) return new Date().toISOString();
    const timeToUse = time && time.includes(":") ? time : "00:00:00";
    const normalizedTime =
      timeToUse.split(":").length === 2 ? `${timeToUse}:00` : timeToUse;
    const d = new Date(`${date}T${normalizedTime}`);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export const toTimeInputValue = (iso: string): string => {
  if (!iso) return "";
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const getCurrentTimeInputValue = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const getTodayDateValue = (): string => new Date().toISOString().slice(0, 10);
