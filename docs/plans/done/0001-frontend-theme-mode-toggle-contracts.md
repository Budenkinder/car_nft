# Plan 0001 — Toggleable Light / Dark Mode — Contracts

- **ADR:** `docs/adr/0001-frontend-theme-mode-toggle.md`
- **Paired plan:** `docs/plans/done/0001-frontend-theme-mode-toggle-frontend.md`
- **Status:** done
- **Date:** 2026-05-19

## Scope and Goals

**No changes required.** This is a UI-only theming change. The contract surface is not touched: no new functions, events, storage, or access-control rules; no ABI change; no script change; no redeploy.

Justification: the toggle reads/writes one `localStorage` key in the browser and switches MUI's palette `mode`. It does not call contracts, subscribe to events, or alter how `contract_abi.json` / addresses are consumed.
