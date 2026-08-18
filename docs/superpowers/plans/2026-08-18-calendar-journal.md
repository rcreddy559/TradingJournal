# Calendar Trading Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Dashboard page with a full-featured calendar trading journal — year/month/list views with colour-coded P&L cells, year navigation, side drawer for day detail, and per-day notes stored in localStorage.

**Architecture:** `CalendarJournalPage` owns local UI state (year, view mode, selected date) and drives three view components (`YearCalendar`, `MonthCalendar`, `CalendarListView`) from the same `buildDailyPnl` data already available in the store. A `DayDrawer` slides in from the right on day-click. All calendar colour logic lives in a pure helper module `calendarUtils.ts` that is independently testable. Per-day notes are persisted via two new methods on `journalService`.

**Tech Stack:** React 18, TypeScript, CSS custom properties (existing design tokens), Vitest (existing test runner)

---

## File Map

### New files
| Path | Responsibility |
|---|---|
| `src/features/journal/lib/calendarUtils.ts` | Pure helpers: `buildDayMap`, `computeDayColorClass`, `buildMonthGrid` |
| `src/features/journal/components/calendar/calendar.css` | Calendar-specific styles (colour classes, grid, drawer) |
| `src/features/journal/components/calendar/DayCell.tsx` | Single coloured day square |
| `src/features/journal/components/calendar/MonthBlock.tsx` | One month's 7-col grid (used inside YearCalendar) |
| `src/features/journal/components/calendar/YearCalendar.tsx` | 12 MonthBlocks in a 6×2 CSS grid |
| `src/features/journal/components/calendar/MonthCalendar.tsx` | Single-month large-cell grid with prev/next |
| `src/features/journal/components/calendar/CalendarListView.tsx` | Chronological list of trading days |
| `src/features/journal/components/calendar/DayDrawer.tsx` | Right-side detail panel |
| `src/features/journal/components/calendar/CalendarSummaryStrip.tsx` | Top stats strip (6 cards) |
| `src/features/journal/pages/CalendarJournalPage.tsx` | Top-level page wiring everything together |

### Modified files
| Path | Change |
|---|---|
| `src/features/journal/api/journalService.ts` | Add `getDayNotes`, `saveDayNotes` |
| `src/features/journal/pages/DashboardPage.tsx` | Replace body — re-export `CalendarJournalPage` |
| `tests/calculations.test.ts` | Add tests for `buildDayMap`, `computeDayColorClass`, `buildMonthGrid` (added to `calendarUtils.ts`, not `calculations.ts`) |

---

## Task 1: Pure calendar utilities (`calendarUtils.ts`)

**Files:**
- Create: `src/features/journal/lib/calendarUtils.ts`
- Test: `tests/calendarUtils.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// tests/calendarUtils.test.ts
import { describe, expect, it } from "vitest";
import {
  buildDayMap,
  buildMonthGrid,
  computeDayColorClass,
} from "../src/features/journal/lib/calendarUtils";
import { DailyPnl } from "../src/features/journal/lib/calculations";

const daily: DailyPnl[] = [
  { date: "2024-03-05", pnl: 1200, trades: 2 },
  { date: "2024-03-12", pnl: -800, trades: 3 },
  { date: "2024-03-20", pnl: 5000, trades: 1 },
  { date: "2024-03-28", pnl: -5000, trades: 4 },
];

describe("buildDayMap", () => {
  it("indexes daily data by date string", () => {
    const map = buildDayMap(daily);
    expect(map.get("2024-03-05")).toEqual({ date: "2024-03-05", pnl: 1200, trades: 2 });
    expect(map.get("2024-03-99")).toBeUndefined();
  });

  it("returns empty map for empty input", () => {
    expect(buildDayMap([]).size).toBe(0);
  });
});

describe("computeDayColorClass", () => {
  it("returns profit-1 for the smallest profit", () => {
    expect(computeDayColorClass(1200, 5000, false)).toBe("profit-1");
  });

  it("returns profit-4 for the max profit", () => {
    expect(computeDayColorClass(5000, 5000, false)).toBe("profit-4");
  });

  it("returns loss-1 for small loss", () => {
    expect(computeDayColorClass(-800, 5000, false)).toBe("loss-1");
  });

  it("returns loss-4 for max loss", () => {
    expect(computeDayColorClass(-5000, 5000, false)).toBe("loss-4");
  });

  it("returns unrealised when flag is set", () => {
    expect(computeDayColorClass(0, 5000, true)).toBe("unrealised");
  });

  it("returns empty string when pnl is 0 and not unrealised", () => {
    expect(computeDayColorClass(0, 5000, false)).toBe("");
  });
});

describe("buildMonthGrid", () => {
  it("returns 35 or 42 cells (5 or 6 weeks) for any month", () => {
    const grid = buildMonthGrid(2024, 2); // March 2024 (month is 0-indexed)
    expect([35, 42]).toContain(grid.length);
  });

  it("first day of March 2024 is on correct weekday (Friday = index 5)", () => {
    const grid = buildMonthGrid(2024, 2);
    // March 1 2024 is a Friday — first 5 cells should be null
    expect(grid[5]).toBe(1);
    for (let i = 0; i < 5; i++) expect(grid[i]).toBeNull();
  });

  it("last cell for March has value 31", () => {
    const grid = buildMonthGrid(2024, 2);
    const lastDay = [...grid].reverse().find((v) => v !== null);
    expect(lastDay).toBe(31);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- tests/calendarUtils.test.ts
```

Expected: FAIL — `Cannot find module '../src/features/journal/lib/calendarUtils'`

- [ ] **Step 3: Create `calendarUtils.ts`**

```ts
// src/features/journal/lib/calendarUtils.ts
import { DailyPnl } from "./calculations";

/** O(1) lookup of a day's data by YYYY-MM-DD key. */
export const buildDayMap = (daily: DailyPnl[]): Map<string, DailyPnl> => {
  const map = new Map<string, DailyPnl>();
  for (const d of daily) map.set(d.date, d);
  return map;
};

/**
 * Returns a CSS class encoding the P&L intensity for a single day cell.
 *
 * Intensity buckets (ratio = |pnl| / maxAbsPnl):
 *   0.00–0.25 → shade 1  (lightest)
 *   0.25–0.50 → shade 2
 *   0.50–0.75 → shade 3
 *   0.75–1.00 → shade 4  (darkest)
 */
export const computeDayColorClass = (
  pnl: number,
  maxAbsPnl: number,
  hasUnrealised: boolean,
): string => {
  if (hasUnrealised) return "unrealised";
  if (pnl === 0 || maxAbsPnl === 0) return "";
  const ratio = Math.abs(pnl) / maxAbsPnl;
  const shade = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
  return pnl > 0 ? `profit-${shade}` : `loss-${shade}`;
};

/**
 * Builds a flat array of day-numbers (1-based) padded with `null` for empty
 * cells before the 1st and after the last day.  Length is always 35 or 42
 * (5 or 6 full weeks).  Week starts on Sunday (index 0).
 *
 * @param year  Full 4-digit year
 * @param month 0-indexed month (0 = January)
 */
export const buildMonthGrid = (year: number, month: number): (number | null)[] => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const grid: (number | null)[] = [];
  for (let i = 0; i < total; i++) {
    const dayNum = i - firstDay + 1;
    grid.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }
  return grid;
};
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm run test -- tests/calendarUtils.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/journal/lib/calendarUtils.ts tests/calendarUtils.test.ts
git commit -m "feat: add calendarUtils pure helpers with tests"
```

---

## Task 2: Per-day notes in `journalService`

**Files:**
- Modify: `src/features/journal/api/journalService.ts`

- [ ] **Step 1: Add the storage key and two methods**

Open `src/features/journal/api/journalService.ts`. After the `PROFILE_KEY` constant add:

```ts
const DAY_NOTES_KEY = "trading-journal-day-notes-v1";
```

After the `deleteProfile` function add:

```ts
const getDayNotes = (): Record<string, string> => {
  return journalDb.read<Record<string, string>>(DAY_NOTES_KEY, {});
};

const saveDayNotes = (notes: Record<string, string>): void => {
  journalDb.write(DAY_NOTES_KEY, notes);
};
```

Add `getDayNotes` and `saveDayNotes` to the exported `journalService` object:

```ts
export const journalService = {
  getTrades,
  saveTrades,
  getStrategies,
  saveStrategies,
  getInstruments,
  saveInstruments,
  getSettings,
  saveSettings,
  getProfile,
  saveProfile,
  deleteProfile,
  getDayNotes,
  saveDayNotes,
};
```

- [ ] **Step 2: Build to confirm no TypeScript errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/api/journalService.ts
git commit -m "feat: add getDayNotes/saveDayNotes to journalService"
```

---

## Task 3: Calendar CSS

**Files:**
- Create: `src/features/journal/components/calendar/calendar.css`

- [ ] **Step 1: Create the CSS file**

```css
/* src/features/journal/components/calendar/calendar.css */

/* ── Colour classes ─────────────────────────────────────── */
.profit-1 { background: rgba(50, 210, 150, 0.22); color: var(--green); }
.profit-2 { background: rgba(50, 210, 150, 0.42); color: #fff; }
.profit-3 { background: rgba(50, 210, 150, 0.65); color: #fff; }
.profit-4 { background: var(--green); color: #052e1c; font-weight: 700; }
.loss-1   { background: rgba(255, 106, 106, 0.22); color: var(--red); }
.loss-2   { background: rgba(255, 106, 106, 0.42); color: #fff; }
.loss-3   { background: rgba(255, 106, 106, 0.65); color: #fff; }
.loss-4   { background: var(--red); color: #fff; font-weight: 700; }
.unrealised { background: rgba(139, 92, 246, 0.38); color: #c4b5fd; }

/* ── Summary strip ──────────────────────────────────────── */
.cal-summary-strip {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.cal-summary-card {
  flex: 1 1 130px;
  background: var(--panel);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.7rem 1rem;
}
.cal-summary-card .label {
  font-size: 0.7rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cal-summary-card .value {
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

/* ── Top bar (year nav + view tabs + add note) ──────────── */
.cal-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.cal-year-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.cal-year-nav .year-label {
  font-size: 1.25rem;
  font-weight: 700;
}
.cal-view-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--panel-strong);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  padding: 0.25rem;
}
.cal-tab {
  padding: 0.35rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--muted);
  border: none;
  background: transparent;
  transition: background 0.15s, color 0.15s;
}
.cal-tab.active {
  background: var(--accent);
  color: #fff;
}
.cal-add-note-btn {
  padding: 0.4rem 1rem;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
}

/* ── Year grid (6 columns × 2 rows of month blocks) ─────── */
.cal-year-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.875rem;
}
@media (max-width: 1100px) { .cal-year-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 780px)  { .cal-year-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 520px)  { .cal-year-grid { grid-template-columns: repeat(2, 1fr); } }

/* ── Month block ────────────────────────────────────────── */
.cal-month-block {
  background: var(--panel-strong);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.625rem;
}
.cal-month-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
}
.cal-dow-row,
.cal-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal-dow {
  font-size: 0.6rem;
  color: var(--muted);
  text-align: center;
  padding-bottom: 2px;
}

/* ── Day cell ───────────────────────────────────────────── */
.cal-day {
  aspect-ratio: 1;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  cursor: pointer;
  background: var(--panel);
  color: var(--muted);
  transition: transform 0.1s;
  position: relative;
}
.cal-day:hover { transform: scale(1.25); z-index: 5; }
.cal-day.empty { background: transparent; cursor: default; pointer-events: none; }
.cal-day.today { box-shadow: 0 0 0 2px var(--accent); }
.cal-day.selected { outline: 2px solid var(--accent-strong); }
.cal-day .note-dot {
  position: absolute;
  bottom: 1px;
  right: 2px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent);
}

/* ── Month view (large cells) ───────────────────────────── */
.cal-month-view {
  width: 100%;
}
.cal-month-view-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}
.cal-month-large-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-month-large-dow {
  font-size: 0.72rem;
  color: var(--muted);
  text-align: center;
  padding: 0.25rem 0;
  font-weight: 600;
}
.cal-large-day {
  min-height: 64px;
  border-radius: 6px;
  border: 1px solid var(--line-soft);
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  background: var(--panel);
  color: var(--text);
  transition: border-color 0.15s;
  position: relative;
}
.cal-large-day:hover { border-color: var(--accent); }
.cal-large-day.empty { background: transparent; border-color: transparent; cursor: default; pointer-events: none; }
.cal-large-day.today { border-color: var(--accent); }
.cal-large-day .day-num { font-size: 0.75rem; color: var(--muted); }
.cal-large-day .day-pnl { font-size: 0.82rem; font-weight: 700; margin-top: 0.2rem; }
.cal-large-day .day-count { font-size: 0.65rem; color: var(--muted); }

/* ── List view ──────────────────────────────────────────── */
.cal-list-view { display: flex; flex-direction: column; gap: 0.4rem; }
.cal-list-row {
  display: grid;
  grid-template-columns: 120px 80px 1fr 80px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: var(--panel);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.cal-list-row:hover { border-color: var(--accent); }
.cal-list-date { font-size: 0.82rem; font-weight: 600; }
.cal-list-pnl  { font-size: 0.9rem; font-weight: 700; text-align: right; }
.cal-list-note { font-size: 0.75rem; color: var(--muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.cal-list-count { font-size: 0.72rem; color: var(--muted); text-align: right; }

/* ── Day drawer ─────────────────────────────────────────── */
.cal-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(5, 10, 15, 0.45);
}
.cal-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 340px;
  z-index: 50;
  background: var(--panel-strong);
  border-left: 1px solid var(--line);
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: slideInRight 0.22s ease;
}
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@media (max-width: 520px) {
  .cal-drawer { width: 100%; top: auto; height: 70vh; border-left: none; border-top: 1px solid var(--line); animation: slideInUp 0.22s ease; }
  @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
}
.cal-drawer-close {
  align-self: flex-end;
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
}
.cal-drawer-date   { font-size: 0.75rem; color: var(--muted); }
.cal-drawer-title  { font-size: 1rem; font-weight: 700; margin-top: 0.15rem; }
.cal-drawer-pnl    { font-size: 1.5rem; font-weight: 700; }
.cal-drawer-meta   { font-size: 0.75rem; color: var(--muted); margin-top: 0.1rem; }
.cal-drawer-section-title {
  font-size: 0.68rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.5rem;
}
.cal-trade-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--panel);
  border: 1px solid var(--line-soft);
  border-radius: 7px;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  margin-top: 0.3rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.cal-trade-row:hover { border-color: var(--accent); }
.cal-trade-sym  { font-weight: 600; color: var(--accent); }
.cal-trade-meta { font-size: 0.68rem; color: var(--muted); margin-top: 0.1rem; }
.cal-trade-pnl  { font-weight: 700; }
.cal-emotion-tag {
  display: inline-block;
  background: var(--chip-bg);
  border: 1px solid var(--chip-border);
  color: var(--accent);
  border-radius: 999px;
  padding: 0.15rem 0.65rem;
  font-size: 0.72rem;
}
.cal-note-textarea {
  width: 100%;
  min-height: 80px;
  background: var(--input-bg);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 0.6rem 0.75rem;
  resize: vertical;
  margin-top: 0.3rem;
}
.cal-note-textarea:focus { outline: none; border-color: var(--accent); }

/* ── Legend ─────────────────────────────────────────────── */
.cal-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  margin-top: 1rem;
}
.cal-legend-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--muted);
}
.cal-swatch-row { display: flex; gap: 3px; }
.cal-swatch { width: 10px; height: 10px; border-radius: 2px; }
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/calendar.css
git commit -m "feat: add calendar CSS with P&L colour classes and layout"
```

---

## Task 4: `DayCell` component

**Files:**
- Create: `src/features/journal/components/calendar/DayCell.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/DayCell.tsx
import "./calendar.css";

interface DayCellProps {
  dayNum: number;
  colorClass: string;
  isToday: boolean;
  isSelected: boolean;
  hasNote: boolean;
  onClick: () => void;
}

export default function DayCell({
  dayNum,
  colorClass,
  isToday,
  isSelected,
  hasNote,
  onClick,
}: DayCellProps) {
  const cls = ["cal-day", colorClass, isToday ? "today" : "", isSelected ? "selected" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}>
      {dayNum}
      {hasNote && <span className="note-dot" aria-hidden="true" />}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/DayCell.tsx
git commit -m "feat: add DayCell component"
```

---

## Task 5: `MonthBlock` component

**Files:**
- Create: `src/features/journal/components/calendar/MonthBlock.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/MonthBlock.tsx
import { DailyPnl } from "../../lib/calculations";
import { buildMonthGrid, computeDayColorClass } from "../../lib/calendarUtils";
import DayCell from "./DayCell";
import "./calendar.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOW = ["S","M","T","W","T","F","S"];

interface MonthBlockProps {
  year: number;
  month: number; // 0-indexed
  dayMap: Map<string, DailyPnl>;
  maxAbsPnl: number;
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  todayStr: string;
  onDayClick: (date: string) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function MonthBlock({
  year, month, dayMap, maxAbsPnl, dayNotes,
  selectedDate, todayStr, onDayClick,
}: MonthBlockProps) {
  const grid = buildMonthGrid(year, month);

  return (
    <div className="cal-month-block">
      <div className="cal-month-name">{MONTH_NAMES[month]}</div>
      <div className="cal-dow-row">
        {DOW.map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
      </div>
      <div className="cal-days-grid">
        {grid.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={i} className="cal-day empty" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
          const data = dayMap.get(dateStr);
          const colorClass = data
            ? computeDayColorClass(data.pnl, maxAbsPnl, false)
            : "";
          return (
            <DayCell
              key={dateStr}
              dayNum={dayNum}
              colorClass={colorClass}
              isToday={dateStr === todayStr}
              isSelected={dateStr === selectedDate}
              hasNote={!!dayNotes[dateStr]}
              onClick={() => onDayClick(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/MonthBlock.tsx
git commit -m "feat: add MonthBlock component"
```

---

## Task 6: `YearCalendar` component

**Files:**
- Create: `src/features/journal/components/calendar/YearCalendar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/YearCalendar.tsx
import { DailyPnl } from "../../lib/calculations";
import MonthBlock from "./MonthBlock";
import "./calendar.css";

interface YearCalendarProps {
  year: number;
  dayMap: Map<string, DailyPnl>;
  maxAbsPnl: number;
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  todayStr: string;
  onDayClick: (date: string) => void;
}

export default function YearCalendar({
  year, dayMap, maxAbsPnl, dayNotes,
  selectedDate, todayStr, onDayClick,
}: YearCalendarProps) {
  return (
    <div className="cal-year-grid">
      {Array.from({ length: 12 }, (_, m) => (
        <MonthBlock
          key={m}
          year={year}
          month={m}
          dayMap={dayMap}
          maxAbsPnl={maxAbsPnl}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          todayStr={todayStr}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/YearCalendar.tsx
git commit -m "feat: add YearCalendar (12-month grid)"
```

---

## Task 7: `MonthCalendar` component

**Files:**
- Create: `src/features/journal/components/calendar/MonthCalendar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/MonthCalendar.tsx
import { useState } from "react";
import { DailyPnl, formatCurrency } from "../../lib/calculations";
import { buildMonthGrid, computeDayColorClass } from "../../lib/calendarUtils";
import "./calendar.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOW_FULL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const pad = (n: number) => String(n).padStart(2, "0");

interface MonthCalendarProps {
  initialYear: number;
  initialMonth: number; // 0-indexed
  dayMap: Map<string, DailyPnl>;
  maxAbsPnl: number;
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  todayStr: string;
  onDayClick: (date: string) => void;
}

export default function MonthCalendar({
  initialYear, initialMonth, dayMap, maxAbsPnl,
  dayNotes, selectedDate, todayStr, onDayClick,
}: MonthCalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const grid = buildMonthGrid(year, month);

  return (
    <div className="cal-month-view">
      <div className="cal-month-view-header">
        <button className="nav-btn" onClick={prevMonth}>‹</button>
        <span>{MONTH_NAMES[month]} {year}</span>
        <button className="nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-month-large-grid">
        {DOW_FULL.map(d => (
          <div key={d} className="cal-month-large-dow">{d}</div>
        ))}
        {grid.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={i} className="cal-large-day empty" />;
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
          const data = dayMap.get(dateStr);
          const colorClass = data
            ? computeDayColorClass(data.pnl, maxAbsPnl, false)
            : "";
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const cls = ["cal-large-day", colorClass, isToday ? "today" : "", isSelected ? "selected" : ""]
            .filter(Boolean).join(" ");

          return (
            <div key={dateStr} className={cls} onClick={() => onDayClick(dateStr)}>
              <div className="day-num">{dayNum}</div>
              {data && (
                <>
                  <div className={`day-pnl ${data.pnl >= 0 ? "profit" : "loss"}`}>
                    {data.pnl >= 0 ? "+" : ""}{formatCurrency(data.pnl)}
                  </div>
                  <div className="day-count">{data.trades} trade{data.trades !== 1 ? "s" : ""}</div>
                </>
              )}
              {dayNotes[dateStr] && <span className="note-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/MonthCalendar.tsx
git commit -m "feat: add MonthCalendar (single-month large-cell view)"
```

---

## Task 8: `CalendarListView` component

**Files:**
- Create: `src/features/journal/components/calendar/CalendarListView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/CalendarListView.tsx
import { DailyPnl, formatCurrency } from "../../lib/calculations";
import "./calendar.css";

interface CalendarListViewProps {
  daily: DailyPnl[];
  dayNotes: Record<string, string>;
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

const formatDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export default function CalendarListView({
  daily, dayNotes, selectedDate, onDayClick,
}: CalendarListViewProps) {
  const sorted = [...daily].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return <p className="subtext">No trading days recorded yet.</p>;
  }

  return (
    <div className="cal-list-view">
      {sorted.map(day => {
        const note = dayNotes[day.date] ?? "";
        return (
          <div
            key={day.date}
            className={`cal-list-row${selectedDate === day.date ? " selected" : ""}`}
            onClick={() => onDayClick(day.date)}
          >
            <span className="cal-list-date">{formatDateLabel(day.date)}</span>
            <span className="cal-list-count">{day.trades} trade{day.trades !== 1 ? "s" : ""}</span>
            <span className="cal-list-note">{note || "—"}</span>
            <span className={`cal-list-pnl ${day.pnl >= 0 ? "profit" : "loss"}`}>
              {day.pnl >= 0 ? "+" : ""}{formatCurrency(day.pnl)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/CalendarListView.tsx
git commit -m "feat: add CalendarListView component"
```

---

## Task 9: `DayDrawer` component

**Files:**
- Create: `src/features/journal/components/calendar/DayDrawer.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/DayDrawer.tsx
import { useCallback, useEffect, useRef } from "react";
import { Trade } from "../../types/trade";
import { formatCurrency } from "../../lib/calculations";
import "./calendar.css";

interface DayDrawerProps {
  dateStr: string;        // YYYY-MM-DD
  trades: Trade[];        // trades for this day (already filtered)
  note: string;
  onNoteChange: (note: string) => void;
  onClose: () => void;
  onTradeClick: (tradeId: string) => void;
}

const EMOTION_LABELS: Record<string, string> = {
  CALM: "😌 Calm", CONFIDENT: "😎 Confident", FEAR: "😨 Fear",
  GREED: "🤑 Greed", REVENGE: "😤 Revenge", FOMO: "😰 FOMO", HESITANT: "😟 Hesitant",
};

const formatDateHeading = (dateStr: string): { label: string; dayOfWeek: string } => {
  const d = new Date(dateStr + "T00:00:00");
  return {
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    dayOfWeek: d.toLocaleDateString("en-IN", { weekday: "long" }),
  };
};

export default function DayDrawer({
  dateStr, trades, note, onNoteChange, onClose, onTradeClick,
}: DayDrawerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { label, dayOfWeek } = formatDateHeading(dateStr);

  const dayPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const wins = trades.filter(t => t.netPnl > 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const emotion = trades[0]?.emotionBefore;

  const handleNoteInput = useCallback((val: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onNoteChange(val), 300);
  }, [onNoteChange]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div className="cal-drawer-backdrop" onClick={onClose} />
      <aside className="cal-drawer">
        <button className="cal-drawer-close" onClick={onClose} aria-label="Close">✕</button>

        <div>
          <div className="cal-drawer-date">{label} · {dayOfWeek}</div>
          <div className={`cal-drawer-pnl ${dayPnl >= 0 ? "profit" : "loss"}`}>
            {dayPnl >= 0 ? "+" : ""}{formatCurrency(dayPnl)}
          </div>
          <div className="cal-drawer-meta">
            {trades.length} trade{trades.length !== 1 ? "s" : ""} · Win rate {winRate}%
          </div>
        </div>

        {trades.length > 0 && (
          <div>
            <div className="cal-drawer-section-title">Trades</div>
            {trades.map(t => (
              <div key={t.id} className="cal-trade-row" onClick={() => onTradeClick(t.id)}>
                <div>
                  <div className="cal-trade-sym">{t.instrument}</div>
                  <div className="cal-trade-meta">{t.optionType ?? t.side ?? ""} · {t.entryTime.slice(11, 16)}–{t.exitTime.slice(11, 16)}</div>
                </div>
                <div className={`cal-trade-pnl ${t.netPnl >= 0 ? "profit" : "loss"}`}>
                  {t.netPnl >= 0 ? "+" : ""}{formatCurrency(t.netPnl)}
                </div>
              </div>
            ))}
          </div>
        )}

        {emotion && (
          <div>
            <div className="cal-drawer-section-title">Emotion Before</div>
            <span className="cal-emotion-tag">{EMOTION_LABELS[emotion] ?? emotion}</span>
          </div>
        )}

        <div>
          <div className="cal-drawer-section-title">Day Note</div>
          <textarea
            className="cal-note-textarea"
            defaultValue={note}
            placeholder="Add a note for this trading day…"
            onChange={e => handleNoteInput(e.target.value)}
          />
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/DayDrawer.tsx
git commit -m "feat: add DayDrawer side panel component"
```

---

## Task 10: `CalendarSummaryStrip` component

**Files:**
- Create: `src/features/journal/components/calendar/CalendarSummaryStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/features/journal/components/calendar/CalendarSummaryStrip.tsx
import { useMemo } from "react";
import { Trade } from "../../types/trade";
import { buildDailyPnl, formatCurrency } from "../../lib/calculations";
import "./calendar.css";

interface CalendarSummaryStripProps {
  trades: Trade[];
}

export default function CalendarSummaryStrip({ trades }: CalendarSummaryStripProps) {
  const stats = useMemo(() => {
    const daily = buildDailyPnl(trades);
    const netPnl = daily.reduce((s, d) => s + d.pnl, 0);
    const tradingDays = daily.length;
    const winDays = daily.filter(d => d.pnl > 0).length;
    const lossDays = daily.filter(d => d.pnl < 0).length;
    const bestDay = daily.length ? Math.max(...daily.map(d => d.pnl)) : 0;
    const worstDay = daily.length ? Math.min(...daily.map(d => d.pnl)) : 0;
    return { netPnl, tradingDays, winDays, lossDays, bestDay, worstDay };
  }, [trades]);

  const cards: { label: string; value: string; cls?: string }[] = [
    { label: "Net P&L (YTD)", value: formatCurrency(stats.netPnl), cls: stats.netPnl >= 0 ? "profit" : "loss" },
    { label: "Trading Days", value: String(stats.tradingDays) },
    { label: "Win Days",     value: String(stats.winDays),    cls: "profit" },
    { label: "Loss Days",    value: String(stats.lossDays),   cls: "loss" },
    { label: "Best Day",     value: formatCurrency(stats.bestDay),  cls: "profit" },
    { label: "Worst Day",    value: formatCurrency(stats.worstDay), cls: "loss" },
  ];

  return (
    <div className="cal-summary-strip">
      {cards.map(c => (
        <div key={c.label} className="cal-summary-card">
          <div className="label">{c.label}</div>
          <div className={`value ${c.cls ?? ""}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/components/calendar/CalendarSummaryStrip.tsx
git commit -m "feat: add CalendarSummaryStrip component"
```

---

## Task 11: `CalendarJournalPage` — wire everything together

**Files:**
- Create: `src/features/journal/pages/CalendarJournalPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/features/journal/pages/CalendarJournalPage.tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { useJournalSelectors, useJournalState, useJournalActions } from "../store/hooks";
import { buildDailyPnl } from "../lib/calculations";
import { buildDayMap } from "../lib/calendarUtils";
import { journalService } from "../api/journalService";
import CalendarSummaryStrip from "../components/calendar/CalendarSummaryStrip";
import YearCalendar from "../components/calendar/YearCalendar";
import MonthCalendar from "../components/calendar/MonthCalendar";
import CalendarListView from "../components/calendar/CalendarListView";
import DayDrawer from "../components/calendar/DayDrawer";
import "../components/calendar/calendar.css";

type CalViewMode = "year" | "month" | "list";

const todayStr = (): string => new Date().toISOString().slice(0, 10);
const pad = (n: number) => String(n).padStart(2, "0");

export default function CalendarJournalPage() {
  const { trades } = useJournalState();
  const { filteredTrades } = useJournalSelectors();
  const { startEditTrade, setView } = useJournalActions();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<CalViewMode>("year");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Day notes — loaded once, mutated in place and written to localStorage
  const [dayNotes, setDayNotes] = useState<Record<string, string>>(
    () => journalService.getDayNotes()
  );

  const daily = useMemo(() => buildDailyPnl(filteredTrades), [filteredTrades]);
  const dayMap = useMemo(() => buildDayMap(daily), [daily]);
  const maxAbsPnl = useMemo(
    () => daily.reduce((m, d) => Math.max(m, Math.abs(d.pnl)), 1),
    [daily]
  );

  const tradesForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => t.tradeDate === selectedDate);
  }, [trades, selectedDate]);

  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(d => d === date ? null : date);
  }, []);

  const handleNoteChange = useCallback((note: string) => {
    if (!selectedDate) return;
    const next = { ...dayNotes, [selectedDate]: note };
    setDayNotes(next);
    journalService.saveDayNotes(next);
  }, [selectedDate, dayNotes]);

  const handleTradeClick = useCallback((tradeId: string) => {
    startEditTrade(tradeId);
  }, [startEditTrade]);

  const handleAddNote = () => {
    const today = todayStr();
    setSelectedDate(today);
  };

  return (
    <section className="page">
      <CalendarSummaryStrip trades={filteredTrades} />

      {/* Top bar */}
      <div className="cal-topbar">
        <div className="cal-year-nav">
          <button className="nav-btn" onClick={() => setYear(y => y - 1)}>
            ← {year - 1}
          </button>
          <span className="year-label">{year}</span>
          <button className="nav-btn" onClick={() => setYear(y => y + 1)}>
            {year + 1} →
          </button>
        </div>

        <div className="cal-view-tabs">
          {(["year", "month", "list"] as CalViewMode[]).map(mode => (
            <button
              key={mode}
              className={`cal-tab${viewMode === mode ? " active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <button className="cal-add-note-btn" onClick={handleAddNote}>
          📝 Add Note
        </button>
      </div>

      {/* Calendar body */}
      {viewMode === "year" && (
        <YearCalendar
          year={year}
          dayMap={dayMap}
          maxAbsPnl={maxAbsPnl}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          todayStr={todayStr()}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === "month" && (
        <MonthCalendar
          initialYear={year}
          initialMonth={now.getMonth()}
          dayMap={dayMap}
          maxAbsPnl={maxAbsPnl}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          todayStr={todayStr()}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === "list" && (
        <CalendarListView
          daily={daily}
          dayNotes={dayNotes}
          selectedDate={selectedDate}
          onDayClick={handleDayClick}
        />
      )}

      {/* Legend */}
      <div className="cal-legend">
        <div className="cal-legend-group">
          <span>Min loss</span>
          <div className="cal-swatch-row">
            {[0.22, 0.42, 0.65, 1].map((a, i) => (
              <div key={i} className="cal-swatch"
                style={{ background: `rgba(255,106,106,${a})` }} />
            ))}
          </div>
          <span>Max loss</span>
        </div>
        <div className="cal-legend-group">
          <span>Min profit</span>
          <div className="cal-swatch-row">
            {[0.22, 0.42, 0.65, 1].map((a, i) => (
              <div key={i} className="cal-swatch"
                style={{ background: a === 1 ? "var(--green)" : `rgba(50,210,150,${a})` }} />
            ))}
          </div>
          <span>Max profit</span>
        </div>
        <div className="cal-legend-group">
          <div className="cal-swatch" style={{ background: "rgba(139,92,246,0.38)" }} />
          <span>Unrealised / Rejected</span>
        </div>
        <div className="cal-legend-group">
          <div className="cal-swatch"
            style={{ boxShadow: "0 0 0 2px var(--accent)", background: "var(--panel)" }} />
          <span>Today</span>
        </div>
      </div>

      {/* Day drawer */}
      {selectedDate && (
        <DayDrawer
          dateStr={selectedDate}
          trades={tradesForSelected}
          note={dayNotes[selectedDate] ?? ""}
          onNoteChange={handleNoteChange}
          onClose={() => setSelectedDate(null)}
          onTradeClick={handleTradeClick}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/features/journal/pages/CalendarJournalPage.tsx
git commit -m "feat: add CalendarJournalPage top-level page"
```

---

## Task 12: Replace `DashboardPage`

**Files:**
- Modify: `src/features/journal/pages/DashboardPage.tsx`

- [ ] **Step 1: Replace the file contents**

Replace the entire content of `src/features/journal/pages/DashboardPage.tsx` with:

```tsx
// DashboardPage now delegates to the Calendar Trading Journal.
export { default } from "./CalendarJournalPage";
```

- [ ] **Step 2: Run full build and all tests**

```bash
npm run build 2>&1 | tail -10
npm run test
```

Expected: build succeeds, all tests pass.

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Open the app, navigate to Dashboard. Verify:
- Summary strip shows 6 stat cards
- Year calendar renders 12 month blocks
- Clicking a day with trades opens the drawer with trade list and note textarea
- Year ← / → navigation changes the year and re-renders
- View tabs switch between Year / Month / List
- Day note typed in drawer persists after page refresh (stored in localStorage)
- "Add Note" button selects today and opens drawer

- [ ] **Step 4: Commit**

```bash
git add src/features/journal/pages/DashboardPage.tsx
git commit -m "feat: replace Dashboard with Calendar Trading Journal

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 13: `useJournalActions` — expose `setView` for drawer trade navigation

> Check if `setView` is already exported from `useJournalActions`. If it is (it is — see `hooks.ts`), skip to Step 3.

- [ ] **Step 1: Verify `setView` is already in `useJournalActions`**

Open `src/features/journal/store/hooks.ts`. Confirm the `setView` function exists inside `useJournalActions`.

- [ ] **Step 2: (Skip if already present)** If `setView` is missing, add it:

```ts
const setView = (view: AppView) => {
  dispatch({ type: "SET_VIEW", payload: view });
};
```

And include it in the return object of `useJournalActions`.

- [ ] **Step 3: Final build + test run**

```bash
npm run build 2>&1 | tail -5
npm run test
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify setView wiring for calendar drawer trade navigation"
```
