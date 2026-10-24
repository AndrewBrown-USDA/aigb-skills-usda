# Orchestration 12 State

## Baseline checklist

- [x] Branch is `v040` based on updated `main`.
- [x] `npm run help` passes.
- [x] `npm run validate:skills` passes: 34 skills, 39 checks.
- [x] `npm run test:validate` passes.
- [x] `npm test` / `node scripts/smoke.js` passes: smoke checks passed for 34 skills.
- [x] Accepted ADRs reviewed: 0001, 0002, 0003, 0004.
- [x] Prior orchestration history through 11 inspected for numbering.

## Wave board

| Task | Wave | Status | Depends on |
|---|---:|---|---|
| 12.1.1 metadata-contract | 1 | done | baseline |
| 12.2.1 resolution-semantics | 2 | pending | 12.1.1 |
| 12.3.1 surface-and-catalog | 3 | pending | 12.2.1 |
| 12.4.1 validation-and-measurement | 4 | pending | 12.1.1, 12.2.1, 12.3.1 |
| 12.5.1 design-integration | 5 | pending | 12.3.1, 12.4.1 |

## Task reports

<!-- Worker reports are appended here during execution. -->

## 12.1.1

- Created `docs/design/skill-loadout-metadata.md`.
- Defined parser-compatible scalar fields for groups, loadouts, dependencies,
  optional dependencies, version, and canonical/upstream provenance.
- Documented naming, normalization, duplicate, conflict, self-reference, and
  source-of-truth invariants.
- Added valid and invalid frontmatter examples using no YAML arrays or nested
  structures beyond the existing parser contract.
- Specified compatibility and migration behavior for legacy provenance aliases.
- `npm run validate:skills` passed (34 skills, 39 checks).
