# spx-pivot-react — Change Log

---

## 2026-08-10 — "Remember me" on the login page

### Summary
Added a "Remember me" checkbox to `src/pages/Login.jsx`. When checked at
successful sign-in, the entered email is saved to `localStorage` and
pre-fills the Email field on the next visit; unchecking clears any
previously remembered email. Only the email is persisted — the password is
never stored, in any form.

### Implementation
- `src/data/auth.js` — added `loadRememberedEmail` / `saveRememberedEmail` /
  `clearRememberedEmail`, following the file's existing load/save/clear
  helper pattern. Stored under its own `remembered_email` localStorage key,
  kept deliberately separate from the `auth_session` blob (JWT/token/role)
  so it's unaffected by login/logout/session-expiry handling.
- `src/pages/Login.jsx` — `email` and a new `rememberMe` state both
  initialize from `loadRememberedEmail()` on mount; on successful
  `POST /auth/login`, saves or clears the remembered email based on the
  checkbox state.

### Deploy
Built and deployed via `bash deploy-react.sh` (prod `:3001` + staging
`:3002`) from `ohlc_fetcher`. Verified working by the user.

### Files Changed
- `src/data/auth.js`
- `src/pages/Login.jsx`

---

## 2026-08-09 — Home page cards, per-strategy trading guides, and unified PageGuide modal

### Summary
Four related changes made in one session: added a Home page card for QE Squeeze
Scanner and reordered the grid; added a "How to Trade this Strategy" explainer
modal to the four main strategy pages; converted the existing "How to Use this
Page" guide from an inline expand/collapse card into a modal to match; and
standardized both buttons' colors to a single fixed scheme site-wide after a
screenshot comparison showed EOD-Accounting rendering amber while SPX Pivots
rendered cyan.

### 1. Home page cards (`ac5a8cd`)
- Added a **QE Squeeze Scanner** card (`src/pages/Home.jsx`), linking to
  `/squeeze-scanner`, rose accent.
- Reordered the card grid to: SPX Pivots → QE Squeeze Scanner → Pre-Earnings
  Runners → EOD-Accounting → System Monitor (admin) → Admin (admin).
- Removed the **SPX Backtester** card and its now-orphaned `PageGuide` step
  (explicit user decision — kept the page/route itself, just dropped from the
  Home grid).

### 2. "How to Trade this Strategy" modal (`8c575d8`)
- New component `src/components/StrategyThesisModal.jsx` — a reusable modal
  (fixed overlay, rounded card, pill header, ✕ close) that shows a strategy's
  plain-language thesis and 5 numbered trading ideas.
- Added a trigger button + modal instance to the 4 major strategy pages:
  `SPXPivots.jsx`, `squeeze-scanner/SqueezeScanner.jsx`,
  `PreEarningsRunners.jsx` (both summary and all-signals views),
  `EodMocSignal.jsx`.
- Copy was written subscriber-safe per the platform's IP-protection rule —
  EOD-Accounting's explanation avoids "dealer gamma" / GEX ratio / MAG7
  specifics, matching the wording precedent already used on that page.

### 3. Home page guide steps updated to match (`aa8dc78`)
- Reordered `Home.jsx`'s `PageGuide` steps to follow the new card order and
  added a QE Squeeze Scanner step.
- Updated the intro description from "three trading tools" to "four."

### 4. PageGuide converted to a modal (`f2f839c`)
- `src/components/PageGuide.jsx` ("How to Use this Page") no longer renders
  an inline expand/collapse card — it now opens the same modal chrome as
  `StrategyThesisModal`. This is a shared component used on **12 pages**, so
  the change applied everywhere automatically.
- Capitalization standardized: "How to use this page" → **"How to Use this
  Page"**, matching "How to Trade this Strategy."
- Added an `extra` prop so the two buttons can sit in one horizontal row
  (used on the 4 strategy pages); pages without a paired button are
  unaffected.
- The step-jump-to-section behavior (numbered buttons that scroll to and
  glow-highlight a target element) still works — clicking a step now closes
  the modal first, then scrolls, since the target is behind the modal.

### 5. Fixed cyan color standardization (`53fda77`)
- Screenshot comparison (`spxpivot.png` vs `eod.png` in `C:\st`) showed SPX
  Pivots rendering both guide buttons cyan and EOD-Accounting rendering both
  amber — each page had been using its own accent color by original design.
  User decided both buttons should always match SPX Pivots' cyan, everywhere.
- `PageGuide.jsx` and `StrategyThesisModal.jsx` no longer take an `accent`
  prop — both are hardcoded to the cyan scheme now.
- Removed the now-dead `accent="..."` prop from all 16 call sites across the
  site (12 `PageGuide` + 4 `StrategyThesisModal`) rather than leave it as
  misleading dead code.
- **Caught and reverted a bad intermediate fix**: initially tried switching
  the button's default text color from `text-amber-500/70` (Tailwind's
  static palette) to `text-[var(--c-amber)]/70` (CSS variable + opacity
  modifier), assuming the static palette wasn't theme-adaptive. Verified via
  direct Tailwind CLI probe that `text-[var(--x)]/NN` compiles to **no CSS
  rule at all** in this project's Tailwind 3.4.19 setup — it would have made
  the button render with no explicit color (a regression). Reverted before
  deploying. See `feedback_tailwind_var_opacity_broken` in the assistant's
  memory for detail; a few pre-existing files (`TradeModal.jsx`,
  `HistoricalPerformance.jsx`, `PreEarningsTicker.jsx`) use this same broken
  pattern and are candidates for a future cleanup pass.

### Files Changed
- `src/pages/Home.jsx`
- `src/components/StrategyThesisModal.jsx` (new)
- `src/components/PageGuide.jsx`
- `src/pages/SPXPivots.jsx`
- `src/pages/squeeze-scanner/SqueezeScanner.jsx`
- `src/pages/PreEarningsRunners.jsx`
- `src/pages/EodMocSignal.jsx`
- `src/pages/SectorTracker.jsx`, `EarningsCalendar.jsx`, `PreEarningsTicker.jsx`,
  `SPXBacktest.jsx`, `HotPicksPage.jsx`, `KeyLevels.jsx`,
  `EarningsHistoricalPerformance.jsx` (dead `accent` prop removal only)

### Deploy
All five commits built and deployed via `bash deploy-react.sh` (prod
`:3001` + staging `:3002`) from `ohlc_fetcher`.
