# Trading Journal — Features

A Chrome-first day trading journal for Bank Nifty, Nifty 50, and MCX Crude
options. All data is stored locally in the browser (per user) — no backend
required.

## Core

- **Auth** — lightweight per-user login; each user's trades, strategies, and
  settings are isolated in `localStorage` via user-scoped keys.
- **Trades CRUD** — add, edit, and delete trades with a rich journaling form
  (emotions, mistakes, confidence, entry/exit reasons, lesson learned).
- **Strategies CRUD** — add, edit, and delete strategies with timeframe and
  rules. Deleting an in-use strategy prompts to reassign its trades or leave
  them unassigned.
- **Instruments CRUD** — user-managed instrument list, editable inline from the
  Add Trade form ("Manage" beside the Symbol field). Everyone can add the
  symbols they trade; the three built-ins (Bank Nifty, Nifty 50, MCX Crude) are
  the defaults. Instruments flow through the filters, CSV import, and backups.
- **Risk settings** — daily loss limit and max trades/day, with live warnings
  while adding trades.

## Trade capture

- **Add New Trade** opens as a focused modal over the trade list with grouped
  sections: Pre-Trade Analysis, trade basics, dates, and execution discipline.
- **Pre-Trade Analysis** position-sizing card computes a recommended quantity
  from the profile's trading capital and risk-per-trade %, given a planned entry
  and stop; one click applies the size to the trade.
- **At Entry / At Exit** two-column discipline layout: reason taxonomy
  (category chips → specific reason), primary strategy, pre-trade emotion, plus
  execution quality, post-trade emotion, mistake type, and notes/learnings.
- Stop loss and target fields → automatic **R-multiple** and planned **risk /
  reward** preview.
- Free-form **tags** for slicing beyond strategy/instrument.
- **Chart screenshot** attachment per trade (stored inline as a data URL).
- Live net P&L preview and daily risk warnings.

## Analytics

- **Dashboard** — total/net P&L, win rate, profit factor, expectancy, average
  win/loss, largest win/loss, and win/loss streaks.
- **Equity curve** — cumulative P&L rendered as an inline SVG chart.
- **Daily P&L calendar** — heatmap of recent trading days.
- **Strategy Analytics** — per-strategy win rate, net P&L, expectancy, profit
  factor, and average R.
- **Psychology & Mistakes** — performance grouped by pre-trade emotion and by
  mistake type, surfacing the most costly patterns.

## Data & filtering

- Date range + quick presets (Day/Week/Month), notes search, mistake-only
  filter, plus strategy / instrument / status filters (single shared filter
  engine).
- **CSV** import/export.
- **Full JSON backup & restore** for lossless backups (trades + strategies +
  settings).

## Experience

- **Light / dark theme** toggle (persisted).
- **Toasts** and **modal confirmations** replace native browser dialogs.
- **Error boundary** keeps a crash from wiping the screen; data stays safe.
- **PWA**: installable, offline-capable app shell via a service worker.

## Storage keys

- `u:<user>:trading-journal-trades-v1`
- `u:<user>:trading-journal-strategies-v1`
- `u:<user>:trading-journal-instruments-v1`
- `u:<user>:trading-journal-settings-v1`
- `trading-journal-theme`

## Ideas / backlog

- Per-day rule-adherence / discipline score.
- Multi-leg options positions (spreads, straddles) as first-class trades.
- Cloud sync / multi-device backup.
- Automated tests expansion (see `tests/`).
