---
date: 2026-05-19
scope: frontend
status: accepted
related_adr: 0001-frontend-theme-mode-toggle
supersedes: none
---

# Plan 0001 transitioned in-progress → done; ADR 0001 bumped proposed → accepted

## Context

All implementation tasks (1–6) in plan 0001 (toggleable light/dark mode) completed during the autonomous run: `frontend/src/theme/palettes.js` and `frontend/src/theme/ThemeModeContext.jsx` added; `frontend/src/index.js` wraps `<App />` in `ThemeModeProvider`; `frontend/src/App.js` uses `useThemeMode()` + a `useMemo`'d theme and renders a Brightness4/7 IconButton in the Toolbar. `CI=true npm run build` compiled successfully. Browser/MetaMask verification steps from the plan's Testing section are deferred to the user.

## Decision

Move the plan trio from `docs/plans/in-progress/` to `docs/plans/done/`, update each plan's `Status:` + `Paired plan:`, repoint the ADR's `Related plans:` paths, and bump the ADR's `Status:` from `proposed` to `accepted` since the decision is now realised in code.

## Alternatives Considered

- **Leave ADR at `proposed`** — rejected. With both plans `done` and the change shipped in `frontend/src/`, `proposed` would misrepresent the decision's state.
- **Tick task boxes but leave the trio in `in-progress/`** — rejected. Strict folder rule: frontmatter and folder must match, and the folder must reflect lifecycle.

## Consequences

- **Positive:** `ls docs/plans/done/` now shows the shipped 0001 trio; the ADR no longer claims to be merely proposed; future plans searching for prior art can find this one via the `done/` folder.
- **Negative / accepted costs:** the browser-level Testing steps (toggle click, reload persistence, MetaMask render in both modes, form validation legibility) are unverified by the implementation run and remain on the user's side.
- **Follow-ups required:** user should run `cd frontend && npm start` and walk through the Testing section of the frontend plan to confirm visual correctness in both modes.
