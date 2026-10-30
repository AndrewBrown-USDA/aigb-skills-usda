# Execution Plan 12: Skill Loadout System Design

## Goal & Scope

### Goal

Design a skill-loadout system that groups related skills, resolves transitive dependencies automatically with user overrides, and exposes the capability through the package's existing metadata, generated catalog, CLI, and reusable API surfaces. This orchestration produces a reviewed design and executable acceptance criteria only; implementation follows a later approved plan.

### In scope

- Extend existing `SKILL.md` metadata with loadout/group and dependency declarations.
- Preserve frontmatter as the canonical source and derive catalog metadata from it.
- Define transitive dependency resolution, override precedence, cycles, missing skills, optional dependencies, and version/provenance behavior.
- Define CLI and reusable API contracts.
- Define validation, catalog-generation, documentation, regression, and full-smoke acceptance criteria.
- Define a baseline and target method for runtime context reduction.
- Produce a reviewed design artifact and implementation-ready acceptance matrix.

### Out of scope

- Runtime implementation before design approval.
- Claiming a context-reduction result before baseline and target measurement.
- The mistakenly supplied `RESEARCH_EVAL_AGENT_WORKBENCH_TRACKS.md`; it is not present and is not an input to this plan.

### Verbatim constraints and decisions

- "Frontmatter as the source of truth, with derived catalog metadata."
- "Automatic transitive dependency resolution."
- "User overrides for dependency inclusion."
- "CLI and reusable metadata/API surfaces."
- "Existing `SKILL.md` metadata remains authoritative."
- "`catalog/skills.lock.json` remains generated."
- "Dependency cycles, overrides, missing skills, and version/provenance behavior must be specified explicitly."
- Design-only: implementation is deferred until a later approved plan.
- Schema and dependency semantics are the foundation.
- Add loadout fields to the existing skill metadata contract; do not introduce a sidecar format or new dependency.
- Future implementation planning assumes at most two concurrent workers and serializes tasks touching shared metadata/catalog files.
- Acceptance requires existing suites, focused loadout tests, and the full maintainer smoke suite.

## Reconnaissance log

- Current branch: `v040`, based on updated `main`.
- Prior orchestration plans exist through 11; this is orchestration 12.
- Canonical metadata is in `skills/*/SKILL.md`; `catalog/skills.lock.json` is generated.
- Entry points and sizes: `src/cli.js` 72 lines; `scripts/install.js` 298; `scripts/validate-skills.js` 385; `scripts/mine-history.js` 180; `scripts/validate-skills-test.js` 416; `scripts/smoke.js` 677; `README.md` 170.
- CLI currently exposes `install` and maintainer-only `sync`; `src/cli.js` is the command-dispatch reference.
- `scripts/mine-history.js` scans frontmatter and generates the catalog; it is the catalog reference.
- `scripts/validate-skills.js` and `scripts/validate-skills-test.js` are the metadata/validator references.
- Baseline passed: `npm run help`; `npm run validate:skills` (34 skills, 39 checks); `npm run test:validate`.
- Full maintainer smoke was not run during reconnaissance; it is a pre-wave-1 or final acceptance command and may require sibling source checkouts.
- Accepted ADRs 0001-0004 require recorded decisions, direct packaging without network sync, separated canonical/upstream metadata, and a maintainer sync boundary. The design must comply; no ADR is superseded.
- No e2e server or shared network port was found in the package scripts; the full smoke suite remains serial.

## Decision log

| Date | Decision | Impact |
|---|---|---|
| 2026-10-23 | Use design-only orchestration; defer implementation. | Tasks produce design artifacts and acceptance criteria, not runtime code. |
| 2026-10-23 | Schema and dependency semantics are the foundation. | Surface, validation, and measurement tasks depend on the contract task. |
| 2026-10-23 | Extend existing metadata without a new parser, sidecar, or dependency. | Design must fit the current frontmatter parser's supported subset. |
| 2026-10-23 | Future implementation uses at most two workers; shared metadata/catalog files are serialized. | Wave table must keep shared-file work in one task or sequential waves. |
| 2026-10-23 | Acceptance includes focused tests and the full maintainer smoke suite. | Acceptance matrix must name both targeted and full commands. |

## Wave and dependency table

| Wave | Tasks | Depends on | Purpose |
|---|---|---|---|
| 1 | 12.1.1 metadata-contract | baseline | Define loadout/group/dependency metadata and invariants. |
| 2 | 12.2.1 resolution-semantics | 12.1.1 | Define deterministic resolution behavior. |
| 3 | 12.3.1 surface-and-catalog | 12.2.1 | Define CLI/API/catalog contracts against settled semantics. |
| 4 | 12.4.1 validation-and-measurement | 12.1.1, 12.2.1, 12.3.1 | Define acceptance matrix, failure cases, and context measurement. |
| 5 | 12.5.1 design-integration | 12.3.1, 12.4.1 | Produce the single reviewed design specification and traceability matrix. |

## Hazard notes

- The current frontmatter parser supports a deliberately small YAML subset; designs requiring arrays or nested structures beyond that subset must explicitly justify parser changes, which are out of scope here.
- Catalog generation and canonical/upstream metadata must remain separate per ADR 0003.
- Packaging and maintainer synchronization must not be conflated per ADRs 0002 and 0004.
- Full smoke may depend on unavailable sibling repositories; record that limitation rather than weakening the acceptance bar.

## Task specifications

### 12.1.1 metadata-contract

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create `docs/design/skill-loadouts/skill-loadout-metadata.md`; may create `.scratch/loadout-design/`; do not edit runtime code.
- **Depends on:** baseline only.
- **Spec:** Define the frontmatter metadata extension for groups/loadouts, direct dependencies, optionality, version/provenance references, naming, normalization, and invalid states. Use existing metadata patterns from `skills/*/SKILL.md` and `scripts/skill-metadata.js`. Include representative valid and invalid examples that fit the existing parser.
- **Do not touch:** `src/cli.js`, `scripts/install.js`, `scripts/mine-history.js`, `scripts/validate-skills.js`, `catalog/skills.lock.json`, or unrelated skills.
- **Grep anchors:** `metadata:` in `skills/*/SKILL.md`; `normalizeMetadata` and `validateMetadata` in `scripts/skill-metadata.js`; metadata fields in `docs/decisions/0003-canonical-and-upstream-metadata.md`.
- **Acceptance:** Design document defines every required field, validation invariant, and parser-compatible example; no unresolved schema ambiguity remains.
- **Targeted test command:** `npm run validate:skills`.

### 12.2.1 resolution-semantics

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create `docs/design/skill-loadouts/skill-loadout-resolution.md`; may create `.scratch/loadout-design/`; do not edit runtime code.
- **Depends on:** `12.1.1 metadata-contract`.
- **Spec:** Define deterministic transitive resolution, ordering, deduplication, cycle detection, missing-skill behavior, optional dependencies, user override precedence, and version/provenance handling. Include algorithm pseudocode and an exhaustive edge-case matrix.
- **Do not touch:** `src/cli.js`, `scripts/install.js`, `scripts/mine-history.js`, `scripts/validate-skills.js`, `catalog/skills.lock.json`, or the metadata contract document.
- **Grep anchors:** skill selection parsing in `scripts/install.js`; canonical/upstream normalization in `scripts/skill-metadata.js`; direct-install behavior in `README.md`.
- **Acceptance:** Every decision listed in the goal is resolved with deterministic success/failure behavior and examples.
- **Targeted test command:** `npm run test:validate`.

### 12.3.1 surface-and-catalog

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create `docs/design/skill-loadouts/skill-loadout-surfaces.md`; may create `.scratch/loadout-design/`; do not edit runtime code.
- **Depends on:** `12.2.1 resolution-semantics`.
- **Spec:** Define reusable API functions, CLI commands/options, catalog representation, generated-field boundaries, install/sync interaction, help text, and compatibility behavior. Match `src/cli.js`, `scripts/mine-history.js`, and `README.md` conventions.
- **Do not touch:** `src/cli.js`, `scripts/install.js`, `scripts/mine-history.js`, `catalog/skills.lock.json`, or the metadata/resolution design documents.
- **Grep anchors:** `runCli` in `src/cli.js`; `buildLockfile` and `scanCuratedSkills` in `scripts/mine-history.js`; install options in `README.md`.
- **Acceptance:** API/CLI/catalog contracts are explicit, dependency-free, and preserve the maintainer sync boundary.
- **Targeted test command:** `npm run help`.

### 12.4.1 validation-and-measurement

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create `docs/design/skill-loadouts/skill-loadout-acceptance.md`; may create `.scratch/loadout-design/`; do not edit runtime code.
- **Depends on:** `12.1.1 metadata-contract`, `12.2.1 resolution-semantics`, `12.3.1 surface-and-catalog`.
- **Spec:** Define focused test cases for metadata, resolution, overrides, cycles, missing skills, CLI/API, catalog regeneration, and documentation. Define the context-reduction baseline, target-selection method, evidence format, and full-smoke gate. Account for the known green baseline and possible sibling-checkout limitation.
- **Do not touch:** runtime code, catalog output, existing tests, or prior design documents.
- **Grep anchors:** test command scripts in `package.json`; assertions in `scripts/validate-skills-test.js`; smoke orchestration in `scripts/smoke.js`.
- **Acceptance:** Matrix maps each requirement to a named test/evidence artifact and distinguishes required, deferred, and environment-dependent checks.
- **Targeted test command:** `npm run test:validate`.

### 12.5.1 design-integration

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create `docs/design/skill-loadouts/skill-loadouts.md`; may create `.scratch/loadout-design/`; may read all prior design documents; do not edit runtime code.
- **Depends on:** `12.3.1 surface-and-catalog`, `12.4.1 validation-and-measurement`.
- **Spec:** Integrate the preceding documents into one implementation-ready design. Include goal/scope, architecture, data model, resolution algorithm, override contract, CLI/API/catalog contracts, migration/compatibility notes, acceptance matrix, context measurement plan, ADR compliance, and explicit unresolved items. Review for traceability from requirements to evidence.
- **Do not touch:** runtime code, generated catalog, existing ADRs, or prior design documents.
- **Grep anchors:** all four preceding documents; ADR index in `docs/decisions/README.md`.
- **Acceptance:** A reviewer can implement the system without inventing semantics; all prior decisions are honored; no requirement lacks an acceptance path.
- **Targeted test command:** `npm run validate:skills; npm run test:validate; npm test` (run serially; `npm test` may require sibling checkouts).
