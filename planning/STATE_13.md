# Orchestration 13 State

## Baseline checklist

- [x] Branch `v040`; working tree clean before plan drafting.
- [x] `npm run help` passed.
- [x] `npm run validate:skills` passed: 34 skills, 39 checks.
- [x] `npm run test:validate` passed.
- [x] `npm test` passed: smoke checks passed for 34 skills.
- [x] Accepted ADRs 0001–0005 reviewed; proposed ADRs 0006–0007 are
  implementation targets.

## Wave board

| Task | Wave | Status | Depends on |
|---|---:|---|---|
| 13.1.1 metadata-contract | 1 | done | baseline |
| 13.2.1 catalog-generation | 2 | done | 13.1.1 |
| 13.2.2 resolver-core | 2 | done | 13.1.1 |
| 13.3.1 install-api | 3 | done | 13.2.1, 13.2.2 |
| 13.3.2 cli-surface | 3 | done | 13.2.1, 13.2.2 |
| 13.4.1 resolver-install-acceptance | 4 | pending | 13.3.1, 13.3.2 |
| 13.4.2 cli-catalog-acceptance | 4 | pending | 13.3.1, 13.3.2 |
| 13.4.3 measurement-tooling | 4 | pending | 13.3.1, 13.3.2 |
| 13.5.1 docs-and-adr-acceptance | 5 | pending | 13.4.1, 13.4.2, 13.4.3 |

## Task reports

<!-- Worker reports are appended here during execution. -->

## 13.3.2
- Updated the public CLI help for skill/loadout roots, include/exclude
  overrides, source, mode, force, and the install/sync boundary.
- Documented `loadout:<name>`, omitted-selection compatibility, deterministic
  diagnostics, and the packaged-install versus maintainer-sync boundary.
- `npm run help` passed.
- `npm run test:validate` passed.
- Deviation: translated only `install: invalid skill selection` to the
  established `Skill(s) not found` compatibility diagnostic in `src/cli.js`;
  loadout resolution behavior remains unchanged. One retry of `npm test` was
  permitted by the wave verification instructions.

## 13.3.1
- Integrated catalog loading and deterministic resolver results with the existing offline installer.
- Exported `readCatalog`, `resolveLoadout`, `installResolved`, and `buildCatalog` while preserving materialization, overlap, conflict, force, and target safety checks.
- Added `scripts/install-loadouts-test.js` covering API exports, dependency ordering, copy installation, and atomic no-target-on-resolution-failure behavior.
- `node scripts/install-loadouts-test.js` passed: `Install loadout tests passed.`
- Escalation deviation (wave-three verification): restored legacy invalid-selection compatibility in `scripts/install.js` for direct script invocation by emitting `Skill(s) not found in ...` for unresolved plain-root selections while preserving resolver-driven loadout behavior and diagnostics for loadout tokens.
- Verification rerun after deviation: `node scripts/install-loadouts-test.js`, `npm run help`, `npm run test:validate`, and `npm test` all passed.

## 13.2.2
- Implemented offline catalog loading, normalization, packaged source-path validation, deterministic loadout expansion, dependency traversal, override precedence, cycle diagnostics, and explicit constraint rejection.
- Added focused resolver tests.
- `node scripts/skill-loadouts-test.js` passed: Skill loadout tests passed.

## 13.2.1
- Catalog generation completed using the approved metadata contract and generated ownership/order rules.
- `catalog/skills.lock.json` regenerated exclusively with `npm run catalog:mine`.
- `npm run catalog:mine` passed.
- `npm run validate:skills` passed: 34 packaged skills, 39 checks.
- No deviations from the approved plan; no additional smoke assertions were needed.

## 13.1.1
- Implemented scalar normalization for group, loadout, dependencies, optional dependencies, and version.
- Added identifier, empty-token, duplicate, overlap, self-reference, and provenance alias conflict validation.
- Preserved legacy provenance aliases and unresolved catalog version records.
- Added distinct required and optional unknown dependency diagnostics at validator integration.
- No catalog generation or install behavior was changed.
- `npm run validate:skills` passed: 34 packaged skills, 39 checks.
- `npm run test:validate` passed: Validator tests passed.
- Approved question resolved: both unresolved dependency classes remain validator failures with distinct diagnostics.
- Escalation follow-up fixed wave-one regression in `scripts/skill-metadata.js`: `validateMetadata(normalizeMetadata(entry))` now accepts the normalized `version:null` sentinel produced from legacy `{status:"missing",value:null}` catalog records while preserving rejection of empty version strings.
- Added coupled regression assertions in `scripts/validate-skills-test.js` for direct legacy object acceptance, pre-normalized null acceptance, and empty-string rejection.
- `npm test` passed after fix: smoke checks passed for 34 skills.
