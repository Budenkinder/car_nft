# Plan 0001 — Toggleable Light / Dark Mode — Frontend

- **ADR:** `docs/adr/0001-frontend-theme-mode-toggle.md`
- **Paired plan:** `docs/plans/done/0001-frontend-theme-mode-toggle-contracts.md`
- **Status:** done
- **Date:** 2026-05-19

## Scope and Goals

Add a user-toggleable light/dark theme to the React Web3 UI. A toggle button in the existing `AppBar` switches modes; the choice is persisted in `localStorage` and respects the OS preference on first visit. All existing screens (VIN search panel, Create/Update form, MetaMask login) must render correctly in both modes without per-component restyling — they already use MUI palette tokens.

**Out of scope:** redesigning the brand palette, adding a third "system / auto" mode that follows OS changes live, theming any non-MUI surface, contract changes, ABI changes.

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/theme/ThemeModeContext.jsx` | add | New context: holds `mode`, `toggleMode`, reads/writes `localStorage` key `car-nft.themeMode`, falls back to `prefers-color-scheme`. |
| `frontend/src/theme/palettes.js` | add | Exports `lightPalette` and `darkPalette` objects consumed by `createTheme`. Keeps `App.js` lean. |
| `frontend/src/App.js` | modify | Remove the top-level `theme` constant. Inside `App`, consume `mode` from context, build a `useMemo`'d theme per `mode`, render `ThemeProvider` + `CssBaseline`. Add an `IconButton` to the `Toolbar` that calls `toggleMode`. |
| `frontend/src/index.js` | modify | Wrap `<App />` in `<ThemeModeProvider>` so the provider sits above `App` and the toggle button can live anywhere inside the tree. |

## Tasks

Execute in order. Each task is small enough to implement and review on its own.

- [x] **1.** Add `frontend/src/theme/palettes.js` exporting `lightPalette` (preserve current values: primary `#6750A4`, secondary `#625B71`, background.default `#FFFBFE`) and `darkPalette` (primary `#6750A4`, secondary `#CCC2DC`, background.default `#121212`, background.paper `#1E1E1E`).
- [x] **2.** Add `frontend/src/theme/ThemeModeContext.jsx` exporting `ThemeModeProvider` and `useThemeMode()`. Provider initialises `mode` from `localStorage.getItem('car-nft.themeMode')`, else `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`, defaulting to `'light'` if neither is available (SSR-safe guard for `window`). `toggleMode` flips between `'light'` and `'dark'` and writes the new value to `localStorage`.
- [x] **3.** Edit `frontend/src/index.js` to import `ThemeModeProvider` and wrap `<App />` with it.
- [x] **4.** Edit `frontend/src/App.js`:
  - Delete the module-scope `theme` constant.
  - Inside `App`, call `useThemeMode()` to read `mode` and `toggleMode`.
  - `useMemo` a theme from `createTheme({ palette: { mode, ...(mode === 'light' ? lightPalette : darkPalette) }, typography: { ... } })` keyed on `mode`.
  - Add a `<IconButton onClick={toggleMode} color="inherit">` to the `Toolbar` between the title and `MetaMaskLogin`, rendering `<Brightness4Icon />` in light mode and `<Brightness7Icon />` in dark mode. Include an `aria-label` of `"Toggle light/dark mode"`.
- [x] **5.** Manual verification (see Testing) — production build passes (`CI=true npm run build` → "Compiled successfully"); the in-browser / MetaMask checkpoints from the Testing section are delegated to the user since the implementation environment cannot drive a wallet.
- [x] **6.** Mark this plan `done` and tick the boxes above as tasks complete.

## Interfaces with Contracts

None. This change does not touch contract calls, addresses, ABI, events, or RPC. Functions still called from the UI are unchanged: `getCidFromContract`, `getMinterAddress`, `handleNFTCreation`, `fetchNFTMetadata`. No new events consumed. No new chain assumptions.

## Testing

- **Component-level:** no automated tests exist in this project today; do not add a brittle snapshot test just for the toggle. Manual verification is sufficient.
- **Manual verification steps:**
  1. `cd frontend && npm start`. App opens in light mode (or dark, if OS prefers dark and `localStorage` is empty).
  2. Click the toggle icon in the AppBar. App immediately switches to the other mode. The icon updates.
  3. Reload the page. The mode persists (the last clicked mode is restored).
  4. Open DevTools → Application → Local Storage → verify key `car-nft.themeMode` holds `"light"` or `"dark"`.
  5. Connect MetaMask in both modes — the `MetaMaskLogin` button, "Wrong network" warning, and error text should remain readable (palette tokens `warning.main` and `error` already adapt automatically).
  6. Trigger a validation error in the Create/Update form in both modes — `TextField` `error` state and `helperText` should be legible in both.
  7. Run `getCidFromContract` (Load Car NFT) in both modes — confirm no console regressions; the "Loaded CID:" text remains readable.

## Risks and Rollback

- **Risk:** dark mode may surface low-contrast spots not visible in light mode (e.g. brand purple `#6750A4` on `#121212` is acceptable but borderline for some text variants). **Mitigation:** rely on MUI's default dark `text.primary` (rgba white 87%) and `text.secondary` for body text; only the AppBar uses primary as background, where contrast is fine.
- **Risk:** brief flash of light theme on first paint when OS prefers dark and `localStorage` is empty. **Mitigation:** accepted — non-blocking for a CRA dev/preview app. If raised later, move the initial read into a tiny inline `<script>` in `public/index.html` that sets a `data-theme` attribute before React boots.
- **Rollback:** revert the four file changes. No persisted state corrupts anything — the `localStorage` key is read defensively and ignored if it holds an unexpected value.

## Open Questions

None — the ADR locked in toggle placement (AppBar), persistence (localStorage), initial-mode source (localStorage → OS → light), and icon choice (`Brightness4Icon` / `Brightness7Icon`). Surface a different preference before approving the plan if any of those should change.
