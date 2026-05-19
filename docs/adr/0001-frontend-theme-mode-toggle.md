# ADR 0001: Toggleable Light / Dark Mode in the Frontend

- **Status:** accepted
- **Date:** 2026-05-19
- **Scope:** frontend
- **Related plans:**
  - `docs/plans/done/0001-frontend-theme-mode-toggle-frontend.md`
  - `docs/plans/done/0001-frontend-theme-mode-toggle-contracts.md`
- **Related decisions:** `docs/decisions/2026-05-19-001-frontend-theme-mode-toggle.md`

## Context

The frontend currently hard-codes a single MUI light theme inside `frontend/src/App.js` (`createTheme({ palette: { mode: "light", ... } })`). The user has asked for a user-toggleable light / dark mode.

Constraints and observations:

- Stack already supports theming natively: `@mui/material` 5.16 + `@emotion/react`/`@emotion/styled`. No new runtime dependency is required.
- The theme is created at module scope, outside the `App` component, so toggling needs the theme to move inside React state (or a memoised hook) for re-renders to pick up the change.
- There is exactly one entry point (`src/index.js` → `App`) and one consumer of `ThemeProvider` (App.js), so the surface area for the change is small.
- Two surfaces render outside any MUI `Paper`: the `AppBar` and the page `background.default`. Both need a sensible dark variant — the current light palette uses brand purple `#6750A4` (primary) and `#FFFBFE` (background); these need dark counterparts.
- The contracts side is entirely untouched: no ABI, address, event, or RPC change.
- Wallet UX (`MetaMaskLogin`) currently uses `color="warning.main"` and `color="error"` Typography — those palette tokens already adapt to mode automatically; no per-component restyling is needed beyond using palette tokens (which the code already does).

The decision is needed now because we want a coherent first cut (initial mode source, persistence, toggle placement) before anyone reads the implementation, so subsequent UI work can rely on the convention.

## Decision

Introduce a single React context (`ThemeModeContext`) inside `frontend/src/`, owning a `mode` state of `"light" | "dark"`. `App` reads the mode, memoises a `createTheme({ palette: { mode, ... } })` per mode, and wraps the existing tree in `ThemeProvider` + `CssBaseline`. A toggle `IconButton` is added to the existing `AppBar` `Toolbar`, swapping between `Brightness4Icon` (in light mode) and `Brightness7Icon` (in dark mode) from `@mui/icons-material` (already a dependency).

Initial mode resolution order:

1. `localStorage` key `car-nft.themeMode` if it holds `"light"` or `"dark"`.
2. Otherwise, the OS preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
3. Otherwise, `"light"`.

Every user toggle writes the new value to `localStorage` so the choice persists across reloads. We do **not** subscribe to live OS preference changes after first load — once the user has clicked the toggle, their explicit choice wins.

The brand purple stays as the primary colour in both modes; dark mode adopts MUI's default dark `background.default` (`#121212`) and `background.paper` (`#1E1E1E`) so no further per-component restyling is needed.

## Options Considered

### Option A — React Context + `useMemo`'d theme, localStorage persistence, AppBar IconButton (chosen)

- **Pros:** zero new dependencies, idiomatic MUI 5, minimal diff (one new file + edits to `App.js`), persists user choice, respects OS default for first-time visitors, theme rebuild is cheap (one `createTheme` call per toggle).
- **Cons:** the palette definitions for light and dark sit side-by-side in the same module; if palette config grows we may later want to split it.

### Option B — MUI 5 experimental `CssVarsProvider` / `extendTheme`

- **Pros:** SSR-safe, no flash of wrong theme, single theme object with `colorSchemes`.
- **Cons:** still flagged "experimental" in MUI 5; this is a client-rendered CRA app with no SSR, so the upside doesn't apply. Adds API surface we don't need.

### Option C — Plain CSS variables + a `data-theme` attribute on `<html>`

- **Pros:** framework-independent, smallest possible runtime.
- **Cons:** would bypass MUI's theme, forcing us to override component styles by hand. The app is built almost entirely from MUI components; this fights the framework.

## Consequences

- **Positive:** users get a working light/dark toggle that persists; the convention (context + palette token usage) is in place for future UI work; no contracts churn.
- **Negative:** `App.js` grows slightly (palette definitions for two modes + context wiring). A brief flash of light theme on first paint is possible if `localStorage` is empty and the OS prefers dark — acceptable for a CRA dev/preview app.
- **Frontend impact:** new `src/theme/ThemeModeContext.jsx` (or similar), edits to `App.js` to host the provider and the toggle button, no changes to existing components since they already consume MUI palette tokens.
- **Contracts impact:** none. ABI unchanged, no new events, no script changes. The contracts plan documents this with a one-line justification.
- **Follow-ups:** none required. If the palette grows, consider splitting `lightPalette` / `darkPalette` into `src/theme/palettes.js`. If we ever add SSR, revisit Option B.

## References

- MUI 5 dark mode guide — palette `mode` field on `createTheme`.
- Existing theme definition: [frontend/src/App.js:28-47](../../frontend/src/App.js#L28-L47).
- Existing AppBar/Toolbar that will host the toggle: [frontend/src/App.js:226-236](../../frontend/src/App.js#L226-L236).
