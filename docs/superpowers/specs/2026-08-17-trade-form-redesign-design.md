# Trade Form Redesign — Two-Pane Layout with Live Rail

**Date:** 2026-08-17
**Status:** Approved
**Scope:** The Add / Edit Trade modal (`AddTradePage.tsx`) and its styles.

## Problem

The Add / Edit Trade modal is the most-used surface in the app and the least
considered. Three problems:

1. **No visual hierarchy.** Fields run together in undifferentiated rows. Section
   dividers are unlabelled or generic, so nothing signals where one concern ends
   and the next begins.
2. **Key information is out of sight.** The strategy Rules — the whole point of a
   discipline journal — sit inline beside the Strategy dropdown and scroll away as
   soon as you move down the form. Net P&L and risk warnings live in the footer.
3. **The page is one 880-line file.** Layout, state, derived values, and handlers
   are tangled together, so any change touches everything.

## Goals

- Give the form a clear visual hierarchy without changing any field or behaviour.
- Keep the strategy Rules, live P&L, and risk warnings visible while the user
  fills the form.
- Split the page into focused units that can each be understood on their own.

## Non-Goals

- No changes to the field set, validation, or persistence behaviour.
- No changes to the app-wide colour palette. The redesign uses only the existing
  CSS custom properties in `app.css`.
- No new dependencies.
- No changes to any other page.

## Design

### Layout

The modal body becomes two panes: the form on the left, a sticky rail on the
right. The rail stays in view while the left pane scrolls.

```
┌──────────────────────────────────────────────────────────┐
│ Edit Trade                                            ✕  │
│ NIFTY_24500_CE · 12 Feb 2026 · 09:45                     │
├────────────────────────────────────┬─────────────────────┤
│ POSITION ───────────────────────   │  NET P&L            │
│ [Instrument][Strike][Qty*]         │  +₹2,062            │
│ [Entry*][Exit]                     │  75 qty · 27.50 pts │
│ [Strategy*][Type][L/S][Charges]    │                     │
│                                    │  ⚠ RISK CHECK       │
│ TIMING ─────────────────────────   │  Position size      │
│ [Entry Date][Entry Time][Exit]     │  exceeds 2%.        │
│                                    │                     │
│ EXECUTION & EXIT DISCIPLINE ────   │  STRATEGY RULES Edit│
│ ┌─ At Entry ──┐ ┌─ At Exit ─────┐  │  Wait for the       │
│ │ reasons     │ │ quality       │  │  retest. Volume     │
│ │ emotion     │ │ emotion       │  │  above 20MA.        │
│ │ confidence  │ │ mistake/notes │  │                     │
│ └─────────────┘ └───────────────┘  │                     │
├────────────────────────────────────┴─────────────────────┤
│                            [Cancel Edit] [Update Trade]  │
└──────────────────────────────────────────────────────────┘
```

Specific changes:

- **Modal width** grows from `940px` to `1120px` so the At Entry / At Exit
  columns keep their current breathing room alongside the rail.
- **Header** gains a monospace subtitle identifying the trade being edited
  (symbol, date, entry time). Omitted when adding a new trade.
- **Section dividers** are labelled `Position`, `Timing`, and
  `Execution & Exit Discipline`.
- **Strategy** moves out of its own row and joins Option Type, Long/Short, and
  Charges in a four-column row, because Rules no longer needs to sit beside it.
- **Footer** reduces to the two action buttons on desktop.
- **Field captions** share one style: uppercase, letter-spaced, muted. Required
  fields are marked with an accent-coloured asterisk.
- **Focus states** become visible on every input: accent border plus a soft
  accent ring.

### The Rail

Three cards, top to bottom:

1. **Net P&L** — the value in the existing monospace face at display size,
   tinted green or red via a gradient using `--green` / `--red`. A muted line
   below shows the derivation (quantity, points, charges).
2. **Risk check** — rendered only when `riskWarnings` is non-empty. Amber, using
   `--warn`. Advisory only; it never blocks submit.
3. **Strategy Rules** — the existing inline editor moved verbatim. The `Edit`
   link swaps the text for a textarea with Save and Cancel, Ctrl/Cmd+Enter saves,
   Escape cancels, and the empty state reads
   "No rules yet — use Edit to add them."

### Responsive Behaviour

Below `900px` the panes collapse to a single column. In that state:

- The rail's P&L and risk-check cards hide; equivalent read-only elements in the
  footer become visible, restoring today's behaviour.
- The Rules card falls directly after the Strategy row, because that is its
  position in DOM order.

This is achieved with CSS grid areas over a single DOM tree:

```
.trade-form-panes (desktop)
  grid-template-columns: 1fr 250px;
  grid-template-areas:
    "position   rail"
    "timing     rail"
    "discipline rail";
```

DOM order is Position → Rail → Timing → Discipline. Grid areas place the rail in
column two regardless of DOM order, so the single-column collapse needs no
reordering rules.

The existing `@media (max-width: 520px)` block in `app.css` is unaffected and
stays as-is. The `900px` breakpoint is additive.

Only the read-only P&L and warnings markup exists in two places — once in the
rail, once in the footer — toggled by CSS. No interactive element, and no
element that holds focus, is duplicated.

## Architecture

All new files live in `src/features/journal/components/trade-form/`.

| File | Responsibility |
| --- | --- |
| `useTradeForm.ts` | All form state, the `editingTrade` hydration effect, derived values, and every handler. Returns grouped slices. |
| `TradePositionSection.tsx` | Position row, strategy row, and the instrument manager panel. |
| `TradeTimingSection.tsx` | Entry date, entry time, exit time. |
| `TradeDisciplineSection.tsx` | The At Entry and At Exit columns. |
| `TradeFormRail.tsx` | P&L card, risk-check card, Rules card. |
| `TradeFormActions.tsx` | Footer actions plus the mobile-only summary readout. |
| `TradeSummaryReadout.tsx` | The one shared read-only P&L and risk-warnings element. Takes `variant: "rail" \| "footer"`, which selects between the tinted card presentation and the compact footer line. Rendered once in the rail and once in the footer; CSS decides which is visible. |

`AddTradePage.tsx` reduces to the modal shell and section layout only. It holds
no field state and no derived values.

### Hook Interface

`useTradeForm` returns grouped slices rather than one flat object, so each
section receives a narrow, typed interface:

```ts
const form = useTradeForm({ editingTrade, onClose });

form.position    // instrument, strike, qty, entry, exit, strategy, optionType,
                 // direction, charges, strategies, instruments, manager state
form.timing      // entryDate, entryTime, exitTime
form.discipline  // reasonCategory, entryReason, emotionBefore, confidence,
                 // executionQuality, emotionAfter, mistakeType, notes
form.summary     // pnlPreview, riskWarnings, selectedStrategy, rules edit API
form.submit      // handleSubmit, handleClose, canSubmit
```

`form.position` also carries the instrument manager's open state and its add,
rename, and delete handlers, since that panel renders inside the position
section.

Each slice type is exported from the hook module and used directly as the
corresponding section's props type. Sections are presentational: they render
what they are given and call the handlers they are given.

This is deliberately unlike the four existing files in that directory, which
take twenty-plus individual props each. Those files
(`TradeBasicsSection.tsx`, `TradeJournalSection.tsx`,
`TradePsychologySection.tsx`, `TradeFormFooter.tsx`) are stale — nothing imports
them and they reference `buyPrice` / `sellPrice` props the form no longer has —
and are deleted as part of this work.

## Data Flow

Unchanged from today. Stated here so the implementation preserves it exactly.

1. `useTradeForm` hydrates every field from `editingTrade` on mount and whenever
   `editingTrade` changes. Adding a new trade starts from defaults.
2. Field edits update local state only. Nothing persists until submit.
3. `pnlPreview` is `calculateNetPnl(exit, entry, quantity, charges)` in a memo.
4. `riskWarnings` derives from `settings.maxTradesPerDay` and
   `settings.dailyLossLimit` against today's trades.
5. On submit the hook builds the `Trade`, derives `status` from the computed
   P&L, normalises the instrument symbol to uppercase underscore form, and calls
   `addTrade` or `updateTrade` from `useJournalActions()`, which persists through
   `journalService` before dispatching.
6. **Legacy field preservation.** `stopLoss`, `target`, `tags`, `screenshot`,
   `exitReason`, and `lessonLearned` were removed from this form but are still
   read by `TradesPage`, CSV import/export, `calculations.ts`, and search
   filters. On edit, submit carries their stored values through from
   `editingTrade` rather than dropping them. This behaviour must survive the
   refactor.
7. **Rules editing is the exception.** Saving Rules calls `updateStrategy`
   immediately, because it edits the shared `Strategy` record and not the trade.
   A toast confirms. Saving a value that is unchanged after trimming is a no-op.

## Error Handling

- Required fields keep their existing native validation and guards. No new
  validation is introduced.
- Submit stays disabled when no strategies exist.
- Risk warnings are advisory. They surface in the rail and never block submit.
- The instrument manager keeps its current duplicate and empty-name guards.

## Testing

- `tests/calculations.test.ts` is untouched and must continue to pass.
- `tests/modal-layout.test.ts` currently fails: it asserts `max-height: 92vh` on
  `.modal-card` when that rule actually sits on `.trade-modal`. Move that
  assertion to `.trade-modal` and extend the file, in its existing
  CSS-source-grep style, to assert that `.trade-form-panes` defines a two-column
  grid and that a `900px` media query collapses it to one column.
- Manual verification through the running app: add a trade, edit a trade that
  carries legacy field values and confirm every one survives the round trip,
  confirm rail stickiness while scrolling, and confirm the single-column collapse
  below 900px.
- Type-check with `npx tsc --noEmit -p tsconfig.json` and confirm zero errors in
  the changed files. Note that `tsconfig.app.json` does not exist; passing it to
  `tsc` silently succeeds without checking anything.

## Risks

- **Unrelated build failures.** `npm run build` currently reports pre-existing
  errors in untracked work-in-progress files (`ChartExercisesPage.tsx`,
  `drive/DriveSyncProvider.tsx`, `drive/lib/csvMappers.ts`). These are outside
  this work. Filter type-check output to the changed files.
- **Regression surface.** Moving every field into new components risks dropping a
  handler or an effect. Mitigated by verifying a full round trip on a trade
  carrying legacy values before declaring the work done.

## Cleanup

The following CSS rules become unused once the redesign lands and are removed:
`.pre-trade-card`, `.pre-trade-head`, `.pre-trade-portfolio`, `.pre-trade-result`,
`.info-hint`, `.rr-preview`. They are leftovers from the Pre-Trade Analysis card
removed in earlier work.
