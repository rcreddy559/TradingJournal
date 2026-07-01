# Trading Journal — Common Documentation

A single reference for developing, building, and shipping the Trading Journal
app. It works as a **web app**, an **installable PWA**, and an unpacked
**Chrome Extension (MV3)**. All data is stored locally in the browser — no
backend required.

- Chrome-first day trading journal for Bank Nifty, Nifty 50, and MCX Crude options.
- Stack: **React 18 + Vite + TypeScript**, feature-based modules with a
  context/reducer store.

For the end-user feature catalogue and backlog see [`.github/FEATURES.md`](.github/FEATURES.md).

---

## Project layout

```
TradingJournal/
├─ public/                 # Static assets copied as-is into dist/
│  ├─ manifest.json        # Chrome Extension (MV3) manifest
│  ├─ manifest.webmanifest # PWA manifest
│  ├─ background.js        # Extension service worker (opens/focuses app tab)
│  ├─ sw.js               # PWA service worker (offline app shell)
│  └─ icons/              # Generated PNG icons (16/32/48/128)
├─ scripts/
│  └─ generate-extension-icons.mjs  # SVG → PNG icon generation
├─ src/
│  ├─ features/
│  │  ├─ auth/             # Lightweight per-user login
│  │  └─ journal/          # Trades, strategies, settings, profile
│  │     ├─ api/           # journalService (localStorage persistence)
│  │     ├─ db/            # journalDb read/write helpers
│  │     ├─ lib/           # backup.ts (JSON backup/restore)
│  │     ├─ pages/         # ProfilePage, etc.
│  │     ├─ store/         # reducer, actions, hooks, types
│  │     └─ types/         # trade.ts (Trade, Strategy, TraderProfile, ...)
│  └─ shared/             # UI primitives, helpers, shared types
└─ dist/                   # Build output (load THIS folder as the extension)
```

---

## Common commands

```bash
# Install dependencies (see peer-deps note below)
npm install

# Run the dev server
npm run dev

# Type-check + production build → dist/
npm run build

# Build with regenerated extension icons → dist/
npm run build:extension

# Regenerate extension PNG icons only
npm run ext:icons

# Preview the production build
npm run preview

# Run tests / watch tests
npm run test
npm run test:watch
```

> Note: this project pins `vite@8` while `@vitejs/plugin-react` currently peers
> on `vite<=7`. If install fails on peer resolution, use
> `npm install --legacy-peer-deps`.

---

## Data & storage

All state lives in browser `localStorage`. Auth-scoped keys are prefixed with
`u:<user>:`. Clearing browser storage deletes the data.

| Data       | Key                                  |
| ---------- | ------------------------------------ |
| Trades     | `trading-journal-trades-v1`          |
| Strategies | `trading-journal-strategies-v1`      |
| Instruments| `trading-journal-instruments-v1`     |
| Settings   | `trading-journal-settings-v1`        |
| Profile    | `trading-journal-profile-v1`         |
| Theme      | `trading-journal-theme`              |

---

## Profile (CRUD)

The trader profile is a single upsert-style record managed through the journal
store and persisted via `journalService` (`getProfile` / `saveProfile` /
`deleteProfile`).

- UI: `src/features/journal/pages/ProfilePage.tsx`
- Actions: `SET_PROFILE` (create/update) and `DELETE_PROFILE` in the reducer.
- Model (`src/features/journal/types/trade.ts`):

```ts
export interface TraderProfile {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  role: string;
  bio: string;
  broker: string;
  baseCurrency: string;
  tradingCapital: number;
  riskPerTradePct: number;
  experienceLevel: ExperienceLevel; // BEGINNER | INTERMEDIATE | ADVANCED
  avatar?: string;                  // stored inline as a data URL
  createdAt: string;
  updatedAt: string;
}
```

Profile data is included in the full JSON backup (optional `profile` field), so
export/import is lossless.

---

## Backup & restore

`src/features/journal/lib/backup.ts` produces and parses a versioned JSON
backup:

```jsonc
{
  "version": 1,
  "exportedAt": "<ISO timestamp>",
  "trades": [ ... ],
  "strategies": [ ... ],
  "instruments": [ ... ],   // optional; older backups omit it
  "settings": { ... },
  "profile": { ... } | null   // optional; older backups omit it
}
```

CSV import/export is also available; required and optional CSV headers are
listed in [`README.md`](README.md).

---

## PWA

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js` (offline app shell, `SKIP_WAITING` update flow)
- The web service worker is **not** registered when running inside a
  `chrome-extension://` context, to avoid conflicts with the extension worker.

---

## Chrome Extension (MV3)

The extension reuses the full app in a browser tab. Clicking the toolbar icon
opens or focuses the app tab via `public/background.js`.

- Manifest: `public/manifest.json` (`manifest_version: 3`, `storage` permission)
- Background service worker: `public/background.js`
- Icons: `public/icons/icon{16,32,48,128}.png` (generated from SVG)

### Build & load

1. Build the extension bundle:
   ```bash
   npm run build:extension
   ```
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Remove any previously broken unpacked load of this app.
5. Click **Load unpacked** and select the **`TradingJournal/dist`** folder.

> Load `dist/`, **not** `public/`. Loading `public/` causes
> `ERR_FILE_NOT_FOUND` because the built `index.html` and hashed assets only
> exist in `dist/`.

The loaded folder should contain:

```
dist/index.html
dist/manifest.json
dist/background.js
dist/icons/*
```

### After any code change

```bash
npm run build:extension        # rebuild dist/
# then click "Reload" on the extension in chrome://extensions
```

Vite is configured with a relative `base` so hashed assets resolve correctly
under `chrome-extension://`.

---

## Follow-ups / ideas

- Add a release packaging flow (zip `dist/`) for Chrome Web Store submission.
- Add dedicated popup/options pages if the desired UX differs from the full-tab app.
- See the backlog in [`.github/FEATURES.md`](.github/FEATURES.md).
