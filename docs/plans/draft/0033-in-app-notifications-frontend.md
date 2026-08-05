# Plan 0033 — In-app notifications — Frontend

- **ADR:** `docs/adr/0033-in-app-notifications.md`
- **Paired plan:** `docs/plans/draft/0033-in-app-notifications-contracts.md`
- **GitHub Issue:** [#39](https://github.com/Budenkinder/car_nft/issues/39)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

Add a wallet-scoped, client-computed notification bell: transfer alerts (either direction) and service-due reminders. The transfer-alert half only depends on ADR 0029 and can ship first; the service-reminder half depends on ADR 0030's `RecordEntryAdded`/`SERVICE` entries and should ship after (or be feature-gated until) that lands. Out of scope: any email/push delivery (ADR 0033's Option B, not chosen).

## Files to Add / Modify

| Path | Action | Notes |
|------|--------|-------|
| `frontend/src/utils/notifications.js` | add | `getTransferNotifications(address, chainId)`: scans `Transfer` events where `from` or `to` matches the connected address, reverse-looks-up the VIN per `tokenId` (via `getAllVins`/`_tokenIdFromVin` matching, or a small on-demand map), returns `[{ vin, direction: "sent"|"received", counterparty, txHash, blockNumber }]`. `getServiceReminders(address, chainId)` (added once ADR 0030 ships): for each VIN currently owned by `address`, reads `getRecordEntries`, finds the latest `SERVICE` entry's timestamp, flags a reminder if older than a configurable interval constant. |
| `frontend/src/components/NotificationBell.js` | add | Badge + dropdown rendering both notification types; dismiss/read state persisted to `localStorage` per connected address, following the existing theme-mode `localStorage` precedent. |
| `frontend/src/App.js` | modify | Render `NotificationBell` in the app's header/AppBar, next to the existing theme toggle. |

## Tasks

- [ ] **1.** Add `getTransferNotifications` to `notifications.js`, reusing `getPastEventsChunked`/the ownership-history read from ADR 0029.
- [ ] **2.** Add `frontend/src/components/NotificationBell.js`: badge count, dropdown list, `localStorage`-backed dismiss state keyed by connected address.
- [ ] **3.** Wire `NotificationBell` into `App.js`'s header, refreshing on wallet connect/account change.
- [ ] **4.** *(Depends on ADR 0030 shipping first.)* Add `getServiceReminders` to `notifications.js` and merge its results into `NotificationBell`'s dropdown.

## Interfaces with Contracts

- Functions called: `getAllVins()` (existing); `getRecordEntries(vin)` (from ADR 0030, task 4 only).
- Events consumed: `Transfer` (existing); `RecordEntryAdded` (from ADR 0030, task 4 only).
- ABI / address handoff: unchanged — reuses existing `contract_abi.json`/address resolution.
- Network assumptions: unchanged.

## Testing

- No new unit tests (matches project convention).
- Manual verification: transfer a VIN between two test wallets (via ADR 0031's flow); confirm both the sender and receiver see a transfer notification on next connect. Once ADR 0030 ships: add a `SERVICE` entry, then manually adjust the reminder interval constant down for testing and confirm the reminder appears; confirm it disappears after a fresh `SERVICE` entry is added.

## Risks and Rollback

- Risk: scanning `Transfer` events for an arbitrary connected address (not filtered by VIN) could match a large number of unrelated token transfers if the interval/block range is too wide — bound the scan the same way `getTransactionHistoryForVin` already does (chunked, `fromBlock` from `getContractDeployBlock`).
- Risk: users may expect this to be a real push notification given the feature name — mitigate with in-UI copy clarifying it's an in-app alert only, visible when you reconnect this wallet.
- Rollback: additive UI; removing `NotificationBell` fully reverts with no data impact.

## Open Questions

- What service-due interval should the reminder use by default (e.g. 6 months / 5,000 miles), and should it be configurable per VIN? Not committed — needs a product decision from the user before task 4 is implemented.
