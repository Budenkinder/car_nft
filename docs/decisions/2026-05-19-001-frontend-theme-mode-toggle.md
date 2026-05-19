---
date: 2026-05-19
scope: frontend
status: proposed
related_adr: 0001-frontend-theme-mode-toggle
supersedes: none
---

# Theme mode toggle: context + localStorage + AppBar IconButton

## Context

The frontend hard-codes a single MUI light theme at module scope in `App.js`. The user asked for a toggleable light/dark mode. We needed to pick (a) where state lives, (b) where the toggle button appears, (c) what the initial mode is, and (d) whether the choice persists.

## Decision

- **State:** a small React context (`ThemeModeContext`) wrapping `App` from `index.js`, exposing `mode` and `toggleMode`.
- **Toggle UI:** an `IconButton` in the existing `AppBar` `Toolbar`, between the title and `MetaMaskLogin`, using `Brightness4Icon` (light) / `Brightness7Icon` (dark) from the already-installed `@mui/icons-material`.
- **Initial mode resolution:** `localStorage['car-nft.themeMode']` → `prefers-color-scheme` media query → `"light"`.
- **Persistence:** every toggle writes to `localStorage`. We do not subscribe to live OS preference changes after first load — once the user clicks, their choice wins.
- **Theme construction:** a `useMemo`'d `createTheme({ palette: { mode, ... } })` inside `App`, with `lightPalette` / `darkPalette` extracted to `src/theme/palettes.js`. Brand purple `#6750A4` stays primary in both modes.

## Alternatives Considered

- **MUI 5 `CssVarsProvider` / `extendTheme`** — still flagged experimental in MUI 5; the SSR-safety upside doesn't apply to this CRA client app. Rejected as extra API surface for no gain.
- **Plain CSS variables + `data-theme` on `<html>`** — would bypass MUI's theme and force hand-rolled overrides on every MUI component. Rejected; fights the framework.
- **Three-mode toggle (light / dark / system)** — useful but not asked for, and "follow OS live" introduces a media-query listener we'd otherwise not need. Rejected for v1; can be added later by reading the media query inside the provider.
- **No persistence (session-only)** — rejected; users expect their choice to survive a reload.

## Consequences

- **Positive:** zero new dependencies, idiomatic MUI 5, single small context, no contract churn, existing components keep working because they already use palette tokens (`text.secondary`, `warning.main`, `error`).
- **Negative / accepted costs:** `App.js` grows slightly; brief flash of light theme on first paint is possible if `localStorage` is empty and OS prefers dark — acceptable for a CRA preview app.
- **Follow-ups required:** none. If the palette grows or SSR is introduced, revisit `CssVarsProvider`. If a third "system / auto" mode is requested, extend the provider to subscribe to `matchMedia` change events.
