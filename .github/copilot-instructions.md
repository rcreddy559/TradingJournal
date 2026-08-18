# Copilot Instructions for TradingJournal

## Build, test, and lint commands

```bash
# Install dependencies (vite/plugin-react peer mismatch may require this)
npm install
# if peer resolution fails:
npm install --legacy-peer-deps

# Dev server
npm run dev

# Production build (TypeScript project build + Vite)
npm run build

# Chrome extension build (regenerates icons, then builds dist/)
npm run build:extension

# Regenerate extension icons only
npm run ext:icons

# Preview built app
npm run preview

# Full test suite
npm run test

# Watch mode
npm run test:watch

# Single test file
npm run test -- tests/calculations.test.ts

# Single test case by name
npm run test -- tests/calculations.test.ts -t "calculateRMultiple"
```

There is currently **no lint script** in `package.json`.

## High-level architecture

- This is a **React 18 + Vite + TypeScript** client-only app with no backend; state is persisted in browser `localStorage`.
- App composition starts in `src/main.tsx` and wraps `<App />` with shared providers (`ErrorBoundary`, `ThemeProvider`, `ToastProvider`, `ConfirmProvider`, `AuthProvider`) and `PwaManager`.
- `src/App.tsx` gates the journal behind auth. When logged in, `JournalProvider` is keyed by `user.username`, forcing a remount so each user gets isolated in-memory state.
- Journal state is managed in `features/journal/store` via context + reducer:
  - `journalContext.tsx` hydrates initial state from `journalService`.
  - `journalReducer.ts` is pure state transitions.
  - `hooks.ts` is the mutation boundary (business actions + selectors).
- Persistence flow is `hooks.ts` -> `journalService.ts` -> `journalDb.ts`:
  - `journalDb` scopes keys as `u:<username>:<key>` when a user is active.
  - `journalService` owns storage keys, defaults (strategies/instruments/settings), and read/write API for trades, strategies, instruments, exercises, settings, and profile.
- Navigation is not route-driven; page selection is `state.ui.view` (`AppView` union in `shared/types/app.ts`).
  - `ADD_TRADE` renders `TradesPage` and `AddTradePage` together (trade form behaves like a modal over list context).
- The app targets both **PWA** and **Chrome Extension (MV3)**:
  - `vite.config.ts` uses `base: "./"` so extension asset URLs resolve correctly, and its `copy-extension-artifacts` plugin copies `extension/` into `dist/` on every build.
  - `extension/manifest.json` + `extension/background.js` are the MV3 artifacts; they are kept out of `public/` so that folder can never be loaded as an unpacked extension by mistake.
  - `public/sw.js` powers offline PWA behavior; `useServiceWorker` skips SW registration on `chrome-extension:` protocol.

## Key codebase conventions

- Keep feature logic inside `src/features/{auth,journal}` and shared primitives in `src/shared`; prefer existing module boundaries and barrel exports (`index.ts`) instead of cross-feature leakage.
- For journal mutations, use `useJournalActions()` in `features/journal/store/hooks.ts` rather than dispatching directly from pages/components:
  - Actions typically persist first via `journalService`, then dispatch reducer events.
  - For multi-entity updates, use `REPLACE_ALL_DATA` to keep related slices in sync.
- Auth/user context is storage-backed:
  - current user key: `trading-journal-current-user`
  - known users key: `trading-journal-known-users`
  - journal data keys are user-scoped by `journalDb.scopedKey(...)`.
- Prefer existing domain constants/types instead of ad-hoc strings:
  - `TradeEmotion`, `MistakeType`, `ExecutionQuality`, `AppView`, etc.
  - Human-readable labels live in `features/journal/constants/tradeForm.ts`.
- Trade form behavior in `AddTradePage.tsx` is opinionated:
  - `netPnl` is computed from prices/qty/charges.
  - `status` is derived from computed P&L (`SUCCESSFUL` vs `FAILED`).
  - Instrument symbols are normalized to uppercase underscore format via local `deriveSymbol`.
- CSV/backup compatibility is handled in `features/journal/lib`:
  - CSV import allows canonical and normalized instrument names, with required headers enforced by parser.
  - Backup parser is version-tolerant for optional fields (`instruments`, `exercises`, `profile`, `settings`) to support older exports.
- Existing tests (`tests/calculations.test.ts`) validate pure calculation helpers in `features/journal/lib/calculations.ts` under a Node Vitest environment (`vitest.config.ts`), not browser component rendering.
