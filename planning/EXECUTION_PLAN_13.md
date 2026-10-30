# Execution Plan 13: Implement Skill Loadouts

## Goal & Scope

### Goal

Implement the reviewed skill-loadout design: keep `SKILL.md` frontmatter
authoritative, derive loadout metadata into the catalog, resolve transitive
dependencies deterministically with explicit overrides, expose the behavior
through the reusable API and `skills install`, and verify compatibility,
documentation, and context-measurement evidence.

### In scope

- Extend metadata normalization and validation for groups, loadouts,
  dependencies, optional dependencies, versions, and provenance compatibility.
- Regenerate catalog metadata from frontmatter.
- Implement deterministic loadout resolution and stable diagnostics.
- Integrate resolution with packaged installation and a reusable API.
- Extend CLI options, help, README guidance, and compatibility behavior.
- Add isolated focused acceptance tests and context-measurement tooling.
- Validate proposed ADRs 0006 and 0007 after implementation.

### Out of scope

- New npm dependencies or a new runtime framework.
- Network-backed installation or changing the maintainer-only sync boundary.
- A version-range grammar beyond recording unsupported constraints explicitly.
- Implicit optional-dependency selection.
- Publishing context-reduction percentages or token results without measured
  artifacts.
- Superseding accepted ADRs 0001–0005 unless an intractable implementation
  conflict is discovered and explicitly documented.

### Verbatim constraints and decisions

- "Frontmatter as the source of truth, with derived catalog metadata."
- "Automatic transitive dependency resolution."
- "User overrides for dependency inclusion."
- "CLI and reusable metadata/API surfaces."
- "Existing `SKILL.md` metadata remains authoritative."
- "`catalog/skills.lock.json` remains generated."
- "Dependency cycles, overrides, missing skills, and version/provenance
  behavior must be specified explicitly."
- "No new packages; defer version ranges and implicit optional selection."
- "Maximum two concurrent workers."
- "Comply with all accepted ADRs; supersede none."
- "The implementation should be a validation of 6 and 7 moving them towards
  acceptance."

## Reconnaissance log

- Repository: `AndrewBrown-USDA/aigb-skills-usda`; single Node.js CommonJS
  package; Node `>=18`; no build or lint script.
- Entry points: `src/cli.js` 72 lines, `scripts/install.js` 298,
  `scripts/skill-metadata.js` 51, `scripts/mine-history.js` 180,
  `scripts/validate-skills.js` 385, `scripts/validate-skills-test.js` 416,
  `scripts/smoke.js` 677, `README.md` 170.
- References: `scripts/skill-metadata.js` for parsing/normalization,
  `scripts/mine-history.js` for generated catalog ownership,
  `scripts/install.js` for materialization/conflict/path safety,
  `src/cli.js` for dispatch/help, and `scripts/validate-skills-test.js` for
  isolated temporary fixtures.
- Baseline passed serially: `npm run help`; `npm run validate:skills`
  (34 skills, 39 checks); `npm run test:validate`; `npm test` (smoke passed
  for 34 skills).
- Accepted ADRs 0001–0005 are constraints. Proposed ADRs 0006–0007 describe
  the implementation target and should be reviewed after verification.
- Smoke uses shared `.scratch/` and remains serial. No shared network port was
  found. Maintainer smoke may depend on sibling source checkouts.

## Decision log

| Date | Decision | Impact |
|---|---|---|
| 2026-10-24 | Use the dependency order metadata/catalog, resolver, install/API, CLI/docs, then acceptance/measurement. | Wave dependencies follow the implementation architecture. |
| 2026-10-24 | Use dependency-free Node.js and existing helpers; defer version-range grammar and implicit optional selection. | No new packages; unsupported policies remain explicit. |
| 2026-10-24 | Limit execution to two concurrent workers. | Shared metadata and catalog work is serialized; only disjoint scopes run in parallel. |
| 2026-10-24 | Require targeted checks per wave and serial full smoke before acceptance. | Regression evidence remains comparable to the green baseline. |
| 2026-10-24 | Comply with accepted ADRs 0001–0005; use implementation to validate proposed ADRs 0006–0007. | No ADR is superseded by this plan. |

## Wave and dependency table

| Wave | Tasks | Depends on | Purpose |
|---|---|---|---|
| 1 | 13.1.1 metadata-contract | baseline | Add canonical metadata normalization and validation. |
| 2 | 13.2.1 catalog-generation; 13.2.2 resolver-core | 13.1.1 | Derive catalog fields and implement pure resolution semantics in disjoint files. |
| 3 | 13.3.1 install-api; 13.3.2 cli-surface | 13.2.1, 13.2.2 | Integrate resolution with installation and expose CLI/API behavior. |
| 4 | 13.4.1 resolver-install-acceptance; 13.4.2 cli-catalog-acceptance; 13.4.3 measurement-tooling | 13.3.1, 13.3.2 | Cover required behavior and produce reproducible context evidence. |
| 5 | 13.5.1 docs-and-adr-acceptance | 13.4.1, 13.4.2, 13.4.3 | Align docs and decide whether proposed ADRs can become accepted. |

## Hazard notes

- `catalog/skills.lock.json` is generated; workers must never hand-edit it.
- Frontmatter parser limits require comma-separated scalar metadata, not YAML
  arrays or nested mappings.
- `scripts/install.js`, `src/cli.js`, and the generated catalog are shared
  integration surfaces; same-file work is kept in separate waves.
- Resolution must never use `source_url` or upstream fields as install sources.
- Any resolver error must prevent partial installation.
- Focused fixtures must not mutate packaged skills, the catalog, home
  directories, network, or shared ambient state.
- Full smoke is serial and may be not-evidenced if sibling checkouts are
  unavailable.
- At every wave boundary, the orchestrator runs `npm test` serially and
  blocks the next wave on failure or records the environment limitation.

## Task specifications

### 13.1.1 metadata-contract

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must edit `scripts/skill-metadata.js`,
  `scripts/validate-skills.js`; may edit/add focused metadata assertions in
  `scripts/validate-skills-test.js`; may create `.scratch/loadout-tests/`.
- **Depends on:** baseline only.
- **Spec:** Implement parser-compatible scalar metadata normalization and
  validation for group, loadout, required/optional dependencies, version, and
  canonical/upstream alias rules. Preserve legacy records and existing
  validation behavior.
- **Do not touch:** `src/cli.js`, `scripts/install.js`, `scripts/mine-history.js`,
  `catalog/skills.lock.json`, `README.md`, or packaged skill frontmatter.
- **Grep anchors:** `normalizeMetadata`, `validateMetadata` in
  `scripts/skill-metadata.js`; metadata validation calls in
  `scripts/validate-skills.js`; validator fixture helpers in
  `scripts/validate-skills-test.js`.
- **Reference implementations:** existing provenance normalization and
  validator failure fixtures.
- **Acceptance:** valid scalar metadata normalizes; malformed identifiers,
  duplicates, overlap, self-reference, unknown dependency references,
  invalid URLs, and canonical/legacy conflicts fail; legacy records remain
  valid.
- **Targeted test command:** `npm run validate:skills; npm run test:validate`.

### 13.2.1 catalog-generation

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must edit `scripts/mine-history.js`; may update
  catalog-generation assertions in `scripts/smoke.js`; generated
  `catalog/skills.lock.json` may be regenerated only by the named command.
- **Depends on:** 13.1.1.
- **Spec:** Copy normalized loadout/dependency/version metadata into the
  generated catalog, preserve schema compatibility for absent fields, keep
  generated ownership/deterministic ordering, and reject invalid metadata
  before writing output.
- **Do not touch:** `src/cli.js`, `scripts/install.js`, `scripts/skill-metadata.js`,
  `README.md`, or prior ADR/design documents.
- **Grep anchors:** `scanCuratedSkills`, `buildLockfile`, output serialization
  in `scripts/mine-history.js`; lockfile assertions in `scripts/smoke.js`.
- **Reference implementations:** existing lockfile generation and provenance
  field ownership.
- **Acceptance:** repeated catalog generation is byte-stable; frontmatter
  changes flow into the catalog; hand-edited generated values do not survive;
  legacy records remain readable.
- **Targeted test command:** `npm run catalog:mine; npm run validate:skills`.

### 13.2.2 resolver-core

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create `scripts/skill-loadouts.js` and focused
  resolver tests under `scripts/skill-loadouts-test.js`; may create
  `.scratch/loadout-tests/`.
- **Depends on:** 13.1.1.
- **Spec:** Implement normalized catalog loading and pure deterministic
  resolution for ordered roots, `loadout:<name>`, required and selected
  optional edges, deduplication, post-order output, include/exclude/force
  precedence, missing nodes, cycles, diagnostics, and provenance-safe source
  paths. Do not expose version constraints beyond explicit unsupported/error
  handling.
- **Do not touch:** `scripts/install.js`, `src/cli.js`, `scripts/mine-history.js`,
  `catalog/skills.lock.json`, or README/docs.
- **Grep anchors:** exported parser/normalization helpers in
  `scripts/skill-metadata.js`; catalog shape in
  `catalog/skills.lock.json`; resolution algorithm in
  `docs/design/skill-loadouts/skill-loadout-resolution.md`.
- **Reference implementations:** validator temporary-fixture patterns and
  resolution design pseudocode.
- **Acceptance:** focused tests cover ordering, deduplication, overrides,
  optional behavior, missing skills, cycles, stable diagnostics, packaged
  source-path selection, and explicit rejection of unsupported or malformed
  version constraints until a grammar is approved.
- **Targeted test command:** `node scripts/skill-loadouts-test.js`.

### 13.3.1 install-api

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must edit `scripts/install.js`; must create
  `scripts/install-loadouts-test.js`; may create `.scratch/loadout-tests/`.
- **Depends on:** 13.2.1, 13.2.2.
- **Spec:** Integrate successful resolver results with existing copy/symlink,
  conflict, overlap, force, and target-path safety behavior. Expose
  `readCatalog`, `resolveLoadout`, `installResolved`, and `buildCatalog`
  through the package's reusable CommonJS surface without network behavior.
- **Do not touch:** `src/cli.js`, `scripts/mine-history.js`,
  `scripts/skill-metadata.js`, `catalog/skills.lock.json`, README, or ADRs.
- **Grep anchors:** install option parsing/materialization and exports in
  `scripts/install.js`; public functions in `scripts/skill-loadouts.js`.
- **Reference implementations:** existing `installSkills`/copy-symlink and
  overlap/conflict helpers.
- **Acceptance:** failed resolution performs no install; successful results
  use packaged source paths and preserve existing conflict/force behavior;
  the resolver module and installer exports match the API contract;
  unsupported constraints fail explicitly rather than being guessed.
- **Targeted test command:** `node scripts/install-loadouts-test.js`.

### 13.3.2 cli-surface

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must edit `src/cli.js`, `README.md`; may add CLI
  fixture assertions in `scripts/validate-skills-test.js` only if needed.
- **Depends on:** 13.2.1, 13.2.2.
- **Spec:** Add `--skill`/`--skills`, `--include`, `--exclude`, `--force`,
  `--mode`, and `--source` behavior to `install`, preserve omitted-selection
  compatibility, document `loadout:<name>`, stable diagnostics, and the
  install/sync boundary.
- **Do not touch:** `scripts/install.js`, `scripts/mine-history.js`,
  `scripts/skill-metadata.js`, `catalog/skills.lock.json`, or ADRs.
- **Grep anchors:** `runCli`, help text, and command argument handling in
  `src/cli.js`; installation examples and sync boundary in `README.md`.
- **Reference implementations:** existing install/sync command dispatch and
  help formatting.
- **Acceptance:** help exits 0 and documents the new surface; aliases and
  comma lists behave compatibly; invalid options/requests exit 1 without
  partial installation; README examples match behavior.
- **Targeted test command:** `npm run help; npm run test:validate`.

### 13.4.1 resolver-install-acceptance

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create/update focused tests under
  `scripts/skill-loadouts-test.js`, `scripts/install-loadouts-test.js`, and
  `.scratch/loadout-tests/`.
- **Depends on:** 13.3.1, 13.3.2.
- **Spec:** Implement focused acceptance for metadata normalization,
  resolution ordering/deduplication/overrides/optional behavior, missing
  skills, cycles, version-constraint rejection, API outputs, packaged-only
  installation, conflict/force behavior, and atomic failure.
- **Do not touch:** packaged `skills/`, generated catalog, CLI source,
  metadata/catalog implementation, or prior ADR/design documents.
- **Grep anchors:** existing temporary repository and cleanup helpers in
  `scripts/validate-skills-test.js`; acceptance rows in
  `docs/design/skill-loadouts/skill-loadout-acceptance.md`.
- **Reference implementations:** current validator regression fixtures.
- **Acceptance:** resolver and install focused suites pass alone and
  serially; fixtures clean up on success and failure and assert complete
  ordered results and diagnostics.
- **Targeted test command:** `node scripts/skill-loadouts-test.js; node scripts/install-loadouts-test.js`.

### 13.4.2 cli-catalog-acceptance

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must edit `scripts/validate-skills-test.js`; may create
  `.scratch/loadout-tests/`.
- **Depends on:** 13.3.1, 13.3.2.
- **Spec:** Add focused regression coverage for CLI aliases/options,
  deterministic diagnostics, help text, catalog regeneration/ownership,
  schema-1 compatibility, README/help alignment, and the existing validator
  suite's unaffected behavior.
- **Do not touch:** runtime implementation, packaged skills, generated
  catalog, README, ADRs, or design documents.
- **Grep anchors:** CLI and JSON assertions in
  `scripts/validate-skills-test.js`; catalog fixture patterns in
  `scripts/smoke.js`.
- **Reference implementations:** existing validator structural, behavioral,
  and JSON-report tests.
- **Acceptance:** focused assertions cover every remaining Required CLI,
  catalog, compatibility, and documentation-alignment row; no shared package
  state is mutated.
- **Targeted test command:** `npm run help; npm run test:validate`.

### 13.4.3 measurement-tooling

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must create a measurement script under
  `scripts/measure-skill-loadouts.js` and evidence documentation under
  `.scratch/loadout-measurement/`; may edit `README.md` only for usage notes.
- **Depends on:** 13.3.1, 13.3.2.
- **Spec:** Implement the pinned corpus/context measurement protocol: full
  corpus, representative transitive loadout, optional-inclusive loadout,
  minimal direct selection, repeated serial samples, byte metrics, manifests,
  diagnostics, environment, and source commit. Do not invent token results.
- **Do not touch:** packaged skills, catalog, CLI dispatch, metadata parser,
  ADRs, or existing design documents.
- **Grep anchors:** installer source traversal in `scripts/install.js`; metric
  and evidence requirements in the integrated loadout design section 8.
- **Reference implementations:** existing `.scratch/` report conventions.
- **Acceptance:** command produces reproducible JSON and Markdown evidence,
  records at least five serial samples per scenario, retains every raw sample,
  calculates median/minimum/maximum/spread and byte reduction metrics, links
  the manifest and calculation procedure, and marks unavailable
  tokenizer/model evidence as environment-dependent.
- **Targeted test command:** `node scripts/measure-skill-loadouts.js --help`.

### 13.5.1 docs-and-adr-acceptance

- **Repo:** `AndrewBrown-USDA/aigb-skills-usda`
- **Files in scope:** must edit `README.md` and
  `docs/decisions/0006-deterministic-packaged-loadout-resolution.md`,
  `docs/decisions/0007-derived-loadout-surfaces-and-measured-context.md`,
  `docs/decisions/README.md`; may update related design docs only when
  implementation evidence reveals a contract correction.
- **Depends on:** 13.4.1, 13.4.2, 13.4.3.
- **Spec:** Reconcile user-facing documentation with implemented behavior,
  record any bounded deviations, and promote ADR 0006/0007 to Accepted only
  if all required behavior and evidence are confirmed. Otherwise preserve
  Proposed status and document the precise gap.
- **Do not touch:** runtime code, packaged skills, generated catalog, or
  accepted ADRs 0001–0005.
- **Grep anchors:** loadout commands in README; proposed ADR decision outcomes;
  current index status table.
- **Reference implementations:** accepted ADR format and the reviewed
  loadout design documents.
- **Acceptance:** docs do not promise unsupported policies; ADR statuses and
  index links are synchronized; unresolved gaps are explicit; final
  `npm run help`, `npm run validate:skills`, `npm run test:validate`, and
  serial `npm test` results are recorded.
- **Targeted test command:** `npm run help; npm run validate:skills; npm run test:validate`.
  The orchestrator runs and records the serial `npm test` gate at the final
  wave boundary.
