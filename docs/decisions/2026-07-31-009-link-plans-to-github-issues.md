---
date: 2026-07-31
scope: both
status: accepted
related_adr: none
supersedes: none
---

## Context

GitHub issues #35–#39 were filed to track ADRs 0029–0033 (ownership history/public lookup, structured vehicle record, in-app transfer flow, escrow marketplace, in-app notifications), one issue per ADR. The corresponding plan trio files under `docs/plans/draft/` had no reference back to these issues, so there was no way to jump from a plan file to its tracking issue without searching GitHub by title.

## Decision

Add a `**GitHub Issue:**` line to each plan file's header block (frontend and contracts), right after `**Paired plan:**`, linking to the issue that tracks the parent ADR:

- 0029-* → [#35](https://github.com/Budenkinder/car_nft/issues/35)
- 0030-* → [#36](https://github.com/Budenkinder/car_nft/issues/36)
- 0031-* → [#37](https://github.com/Budenkinder/car_nft/issues/37)
- 0032-* → [#38](https://github.com/Budenkinder/car_nft/issues/38)
- 0033-* → [#39](https://github.com/Budenkinder/car_nft/issues/39)

Also added the same field (as an `#NN` placeholder, omittable when no issue exists yet) to `docs/plans/draft/_template-frontend.md` and `_template-contracts.md` so future plan trios carry the reference by convention rather than as a one-off backfill.

## Alternatives considered

- **Put the issue link only on the ADR, not the plans.** Rejected: plans are what implementers open day-to-day (task checklists live there), and the ADR already has a `Related plans:` block — cross-linking from the plan is the more useful direction.
- **Leave the template field mandatory (no "omit if none" note).** Rejected: several existing plans (0014, 0019, 0021) predate this convention and have no filed issue; a mandatory field would force placeholder churn instead of an honest gap.

## Consequences

- Both plan files in each trio (0029–0033) now link directly to their GitHub issue.
- Future `NNNN-<slug>-frontend.md` / `-contracts.md` pairs created from the templates will include a `GitHub Issue` line by default.
- Older plan trios (0014, 0019, 0021) were left unchanged — no matching issues exist for them; backfilling was out of scope for this request.
