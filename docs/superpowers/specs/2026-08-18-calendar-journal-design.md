# Calendar Trading Journal — Design Spec

**Date:** 2026-08-18  
**Status:** Approved for implementation

---

## Overview

Replace the existing Dashboard page with a full-featured **Calendar Trading Journal** — a digital diary modelled after Fyers Journal. The calendar provides a year-at-a-glance view of every trading day, colour-coded by P&L intensity, with drill-down via a side drawer showing per-day trades, emotions, and notes.

The existing metrics (total trades, win rate, equity curve, etc.) move into a compact **summary strip** at the top of the calendar page so nothing is lost.

---

## Goals

- Replace `DashboardPage` with `CalendarJournalPage` as the `DASHBOARD` view.
- Show a full-year calendar with colour-coded P&L (4 green shades, 4 red shades, purple for unrealised/rejected).
- Support three view modes: **Year**, **Month**, **List**.
- Year navigation (previous / current / next year).
- Click a trading day → side drawer opens showing trades, emotion summary, and a per-day note field.
- Keep existing metrics visible in a compact summary strip above the calendar.
- No new nav item needed — the Dashboard nav entry becomes the Journal.

---

## Architecture

### New files

| Path | Purpose |
|---|---|
| `src/features/journal/pages/CalendarJournalPage.tsx` | Top-level page; replaces `DashboardPage` |
| `src/features/journal/components/calendar/YearCalendar.tsx` | 12-month grid, renders all `MonthBlock` cells |
| `src/features/journal/components/calendar/MonthCalendar.tsx` | Single-month grid view |
| `src/features/journal/components/calendar/CalendarListView.tsx` | Chronological list of trading days |
| `src/features/journal/components/calendar/DayCell.tsx` | Individual day square with colour + hover |
| `src/features/journal/components/calendar/DayDrawer.tsx` | Right-side panel for day detail |
| `src/features/journal/components/calendar/CalendarSummaryStrip.tsx` | Top stats bar (YTD P&L, win days, etc.) |
| `src/features/journal/lib/calendarUtils.ts` | Pure helpers: groupByDate, computeDayColor, buildCalendarGrid |

### Modified files

| Path | Change |
|---|---|
| `src/features/journal/pages/DashboardPage.tsx` | Replaced entirely — becomes a re-export of `CalendarJournalPage` |
| `src/shared/types/app.ts` | No change — `DASHBOARD` view is reused |

### Removed (or demoted)

`PnlCalendar.tsx` — the existing 70-day heatmap widget is superseded by the full calendar. It can stay in the codebase but is no longer rendered on the dashboard.

---

## Data Layer

### `buildDailyPnl` (existing, in `calculations.ts`)

Already returns `DailyPnl[]` (`{ date: string; pnl: number; trades: number }`). This is the primary data source — no new persistence needed.

### `calendarUtils.ts` — new pure helpers

```ts
// Groups DailyPnl by YYYY-MM-DD key for O(1) lookup in cell rendering
buildDayMap(daily: DailyPnl[]): Map<string, DailyPnl>

// Returns CSS class name: 'profit-1'..'profit-4', 'loss-1'..'loss-4', 'unrealised', or ''
computeDayColorClass(pnl: number, maxAbsPnl: number, hasUnrealised: boolean): string

// Builds a 7-column grid array for a given year+month (nulls for empty cells)
buildMonthGrid(year: number, month: number): (number | null)[]
```

**Colour intensity logic:**  
Divide the day's `|pnl|` by `maxAbsPnl` across the whole dataset → ratio in [0,1].  
- 0–0.25 → shade 1 (lightest)  
- 0.25–0.5 → shade 2  
- 0.5–0.75 → shade 3  
- 0.75–1.0 → shade 4 (darkest)

**Unrealised / rejected days:** Days with `trades === 0` but where the user has a note are marked with purple. (Future: when order data is available, purple will map to unexecuted orders. For now, purple is not used automatically — it can be manually set via a day note flag.)

---

## Components

### `CalendarJournalPage`

- Owns local state: `{ year, viewMode, selectedDate }`.
- `year` defaults to current year.
- Computes `daily = buildDailyPnl(filteredTrades)` and `dayMap = buildDayMap(daily)`.
- Computes `maxAbsPnl` once for the whole dataset (used by all cells for consistent intensity scale).
- Renders: `CalendarSummaryStrip` → view tab bar + year nav → `YearCalendar | MonthCalendar | CalendarListView` → `DayDrawer` (conditionally).

### `CalendarSummaryStrip`

Compact horizontal strip of 6 stat cards computed from `filteredTrades`:
- Net P&L (YTD) · Trading Days · Win Days · Loss Days · Best Day · Worst Day

### `YearCalendar`

- Renders 12 `MonthBlock` components in a CSS grid (6 columns, 2 rows).
- Passes `dayMap`, `maxAbsPnl`, `selectedDate`, `onDayClick` to each block.

### `DayCell`

- Receives `date`, `dayData | null`, `colorClass`, `isToday`, `isSelected`.
- Renders a small square with the day number.
- `onClick` → calls `onDayClick(date)`.
- No tooltip (hover state is handled via CSS `:hover` scale transform only).

### `DayDrawer`

- Slides in from the right when `selectedDate` is set.
- Shows:
  - Date heading + day of week.
  - Daily P&L total + trade count + win rate for that day.
  - **Trades list** — each trade shows instrument, side, net P&L (colour-coded), entry/exit time.
  - **Emotion summary** — `emotionBefore` of the first trade of that day (representative).
  - **Day note** — a `<textarea>` bound to a per-day note stored in `localStorage` under `u:<username>:dayNote:<date>`. This is separate from individual trade notes.
  - Close button (×).
- Clicking outside the drawer (calendar area) closes it.

### `MonthCalendar`

- Traditional single-month calendar grid.
- Larger cells — shows day number + P&L value + trade count per cell.
- Month navigation (prev/next month arrows).
- Same `DayDrawer` behaviour on click.

### `CalendarListView`

- Chronological list of days that have at least one trade.
- Each row: date · day-of-week · net P&L (coloured) · trade count · note preview (first 60 chars).
- Clicking a row opens the same `DayDrawer`.

---

## Per-Day Notes

A lightweight note per calendar date is stored separately from trade notes.

**Storage key:** `u:<username>:dayNotes` → JSON object `{ [YYYY-MM-DD]: string }`.

**journalService** gets two new methods:
```ts
getDayNotes(): Record<string, string>
saveDayNotes(notes: Record<string, string>): void
```

`DayDrawer` loads the full notes map once on mount and writes back on `textarea` blur/change with 300 ms debounce.

Days with a non-empty note get a small ✏ indicator dot on their `DayCell`.

---

## Styling

- Follow existing CSS variable conventions (`--color-profit`, `--color-loss`, etc.) from `src/shared/styles/`.
- New CSS file: `src/features/journal/components/calendar/calendar.css`.
- Four green shades and four red shades implemented as CSS classes: `.profit-1` through `.profit-4`, `.loss-1` through `.loss-4`.
- Purple shade: `.unrealised`.
- `.day-today` — blue ring via `box-shadow`.
- Drawer is `position: fixed; right: 0; top: var(--nav-height)` with a backdrop overlay `div` that closes on click.
- Responsive: on narrow screens (< 900 px) Year view falls back to 3-column grid; drawer becomes full-width bottom sheet.

---

## Error Handling

- No trades → calendar renders with all cells empty; summary strip shows zeroes; a helper message "No trades recorded yet." is shown below the calendar.
- `buildDailyPnl` is already null-safe (returns `[]` for empty input).

---

## What is NOT in scope

- Syncing day notes to a backend or Google Drive (only localStorage).
- Per-trade screenshots displayed in the drawer (trade notes + emotion are shown; screenshots remain on the Add Trade form).
- Adding/editing trades from the drawer (clicking a trade in the drawer navigates to the Trades page, filtered to that date, via existing `setView("TRADES")` + date filter).
- Any new nav item — the Dashboard nav entry is repurposed.
