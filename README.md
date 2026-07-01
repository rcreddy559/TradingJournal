# Trading Journal (React + TypeScript)

Chrome-first day trading journal app for Bank Nifty, Nifty 50, and MCX Crude options.

## Features Included

- Add, edit, and delete trades
- Save data in browser localStorage (no database)
- Strategy tagging
- User-managed instruments (add/edit/delete symbols inline from the Add Trade form)
- Dashboard metrics
- Date-range trade filtering (`Start Date`, `End Date`)
- Quick filters (`Day`, `Week`, `Month`)
- Sort by date (`Newest First`, `Oldest First`)
- Indian date display format in trade list (`DD/MM/YYYY`)
- Export CSV
- Import CSV (matching app header format)
- Daily risk warnings (loss limit and max trades/day)
- Structured trading journal fields:
  - Emotion before/after
  - Mistake type
  - Confidence score
  - Entry reason
  - Exit reason
  - Lesson learned
- Trades list notes displayed in second line per trade row (full-width)
- Notes search and mistake-only filter
- Strategy, instrument, and status filters on the Trades page
- Common strategy quick-add button in Strategies page
- Stop loss / target capture with automatic R-multiple and risk:reward preview
- Pre-Trade Analysis position-sizing calculator (recommended qty from capital + risk %)
- Add/Edit trade as a focused modal with At Entry / At Exit discipline sections
- Per-trade tags and chart screenshot attachment
- Strategy Analytics (win rate, expectancy, profit factor, avg R per strategy)
- Psychology & Mistakes analytics (P&L grouped by emotion and mistake type)
- Equity curve and daily P&L calendar on the dashboard
- Full JSON backup and restore (lossless) in Settings
- Light / dark theme toggle, in-app toasts and modal confirmations
- Installable PWA with offline app shell

See `.github/FEATURES.md` for the full feature catalogue and backlog.

## Local Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tests

```bash
npm run test
```

> Note: this project pins `vite@8` while `@vitejs/plugin-react` currently peers
> on `vite<=7`, so install dev dependencies with `npm install --legacy-peer-deps`.

## Storage

All data is stored in browser localStorage keys:

- `trading-journal-trades-v1`
- `trading-journal-strategies-v1`
- `trading-journal-instruments-v1`
- `trading-journal-settings-v1`

If you clear browser storage, data is deleted.

## CSV Import Required Headers

- `tradeDate`
- `instrument`
- `buyPrice`
- `sellPrice`
- `quantity`
- `strategy`

Optional headers:

- `strikePrice`
- `optionType`
- `entryTime`
- `exitTime`
- `charges`
- `netPnl`
- `status`
- `notes`
- `emotionBefore`
- `emotionAfter`
- `confidenceScore`
- `mistakeType`
- `entryReason`
- `exitReason`
- `lessonLearned`
