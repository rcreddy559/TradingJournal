# Trading Journal (React + TypeScript)

Chrome-first day trading journal app for Bank Nifty, Nifty 50, and MCX Crude options.

## MVP Included

- Add, edit, and delete trades
- Save data in browser localStorage (no database)
- Strategy tagging
- Dashboard metrics
- Date-range trade filtering
- Export CSV
- Import CSV (matching app header format)
- Daily risk warnings (loss limit and max trades/day)

## Local Run

```bash
npm install
npm run dev
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

Optional headers: `strikePrice`, `optionType`, `entryTime`, `exitTime`, `charges`, `netPnl`, `status`, `notes`.
