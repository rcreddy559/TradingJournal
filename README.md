# Trading Journal (React + TypeScript)

Chrome-first day trading journal app for Bank Nifty, Nifty 50, and MCX Crude options.

## Features Included

- Add, edit, and delete trades
- Save data in browser localStorage (no database)
- Strategy tagging
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
- Common strategy quick-add button in Strategies page

## Local Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Storage

All data is stored in browser localStorage keys:

- `trading-journal-trades-v1`
- `trading-journal-strategies-v1`
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
