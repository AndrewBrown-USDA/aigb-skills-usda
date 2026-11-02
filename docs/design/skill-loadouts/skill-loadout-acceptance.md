# Skill Loadout Acceptance and Measurement Plan

Status: implemented acceptance contract. This document maps the approved
frontmatter taxonomy and metadata,
resolver, installer, API, CLI, documentation, and measurement requirements to
their focused regression suites. Real curated-loadout measurement evidence is
recorded in the tracked evidence artifacts; tokenizer/model metrics remain
environment-dependent.

## 1. Acceptance classification

| Class | Meaning |
| --- | --- |
| Required | Must pass before implementation is accepted. |
| Deferred | Not required for the initial implementation; must be explicitly documented and must not be implied by the shipped contract. |
| Environment-dependent | Required when the environment supports it; otherwise record the command, limitation, and observable evidence without weakening the requirement. |

The current green baseline is `npm run help`, `npm run validate:skills`
(40 skills, 45 checks), `npm run test:validate`, the focused loadout suites,
the measurement protocol suite, and the recorded serial `npm test` result for
40 skills.

## 2. Focused acceptance matrix

Each row names the focused suite or evidence artifact that verifies it.
Fixtures are isolated under a test-owned scratch directory (never the packaged
`skills/` tree or generated catalog).

| Requirement | Focused test/evidence | Expected assertion | Class |
| --- | --- | --- | --- |
| Scalar metadata fields are parser-compatible | `metadata-valid-fields` fixture | Group, loadout, dependency, optional, version, and provenance scalars normalize successfully | Required |
| Normalization is deterministic | `metadata-normalization` fixture | Trimming, token order, and exact-name deduplication produce the documented normalized record | Required |
| Invalid identifiers fail | `metadata-invalid-identifiers` fixture | Underscores, empty tokens, malformed names, and invalid loadout/group values produce stable validation errors | Required |
| Duplicate/conflicting declarations fail | `metadata-duplicates-conflicts` fixture | Duplicate dependencies and overlap between required and optional declarations are rejected | Required |
| Self-reference fails | `metadata-self-reference` fixture | Direct and optional self-edges are rejected before catalog generation | Required |
| Provenance rules hold | `metadata-provenance` fixture | Canonical/legacy aliases agree when both exist; canonical identity remains distinct from upstream provenance | Required |
| Legacy records remain readable | `metadata-legacy-record` fixture | A record without loadout fields, and a record using legacy provenance aliases, remains compatible | Required |
| Direct ordering is preserved | `scripts/skill-loadouts-test.js` | Requested roots retain order; dependencies emit post-order in declaration order | Required |
| Deduplication is idempotent | `scripts/skill-loadouts-test.js` | Repeated roots, loadout members, and shared dependencies emit once at first completion | Required |
| Required dependencies resolve transitively | `scripts/skill-loadouts-test.js` | All required descendants are included or resolution fails without a partial plan | Required |
| Optional dependencies are opt-in | `scripts/skill-loadouts-test.js` | Unselected optional edges are omitted; included edges traverse normally | Required |
| Overrides have fixed precedence | `scripts/skill-loadouts-test.js`; `scripts/install-loadouts-test.js` | Direct exclusion fails unless forced; optional include/exclude and required edges follow the documented rules | Required |
| Missing skills are classified | `scripts/skill-loadouts-test.js`; `scripts/install-loadouts-test.js` | Missing direct/required names fail; selected missing optional names warn and are omitted | Required |
| Unknown loadouts fail closed | `scripts/skill-loadouts-test.js`; `scripts/install-loadouts-test.js` | A mistyped `loadout:<name>` returns `missing-loadout`, no skills, and no target creation | Required |
| Rootless overrides fail | `scripts/skill-loadouts-test.js`; `scripts/install-loadouts-test.js` | `include`/`exclude` without an explicit root return `roots-required` and do not install | Required |
| Cycles are deterministic | `scripts/skill-loadouts-test.js` | Required or selected-optional cycles fail with a closed, stable path; unselected optional cycles are not visited | Required |
| Version behavior is explicit | `scripts/skill-loadouts-test.js` | Exact strings pass; mismatches, ranges, missing versions, malformed constraints, and unknown constrained skills fail | Required |
| Provenance does not change install source | `scripts/skill-loadouts-test.js`; `scripts/install-loadouts-test.js` | Output retains provenance but installation uses packaged `source_path` only | Required |
| CLI selection syntax works | `scripts/install-loadouts-test.js` | `--skill`, `--skills`, comma lists, and `loadout:<name>` produce the normalized request | Required |
| CLI diagnostics are actionable | `scripts/install-loadouts-test.js` | Unknown names/loadouts, rootless overrides, missing values, exclusions, and conflicts exit 1 without stack traces or partial install | Required |
| Help documents the surface | `npm run help` plus help snapshot/assertions | Selection, override, mode, and install/sync boundary are described without claiming network access | Required |
| API contracts are stable | `scripts/skill-loadouts-test.js`; `scripts/install-loadouts-test.js` | Result fields, additive diagnostic fields, install aliases, and empty failure skills match the surface design | Required |
| Install behavior remains packaged-only | Install fixture with provenance URLs and local packaged source | No network or upstream fetch occurs; source/target overlap and conflict rules remain enforced | Required |
| Sync boundary is unchanged | Existing sync regression assertions | Sync retains local-only default and explicit network recovery; install does not invoke sync | Required |
| Frontmatter owns catalog values | Catalog regeneration fixture | Editing frontmatter changes derived fields; editing the old JSON does not survive regeneration | Required |
| Generated-field ownership is enforced | Catalog ownership assertions | Generator metadata, schema fields, ordering, and derived URLs have one owner and stable values | Required |
| Catalog output is deterministic | Regenerate twice from identical fixture tree | Byte-equivalent JSON (including ordering) is produced | Required |
| Catalog schema is compatible | Legacy catalog fixture and new-field fixture | Schema-1 records without loadout fields remain readable; incompatible schema fails explicitly | Required |
| Documentation is complete | Documentation contract checks | Metadata, resolution, surfaces, and acceptance documents agree on names, precedence, diagnostics, and boundaries | Required |
| README/help alignment is maintained | Text assertions or review checklist | User-facing examples do not contradict the design or imply unsupported behavior | Required |
| Measurement protocol is verified | `scripts/measure-skill-loadouts-test.js` | Five independent serial executions, raw evidence, hashes, metadata, aggregates, and overwrite refusal are verified | Required |
| Real curated context bytes are measured | `docs/evidence/skill-loadout-measurement.{json,md}` | Pinned packaged corpus and curated selections report five serial samples, retained raw runs, hashes, manifests, and byte metrics without overwriting prior runs | Required |

## 3. Focused-test discipline

Focused fixtures must:

1. Create all input trees below a test-owned scratch directory and remove them
   in `finally`/cleanup, including failures.
2. Use unique names and no network, sibling checkout, global home directory,
   shared port, clock, or ambient environment state.
3. Assert complete ordered arrays and diagnostic tuples, not set membership
   alone. Diagnostic ordering is discovery order, then code and subject.
4. Keep frontmatter scalar and parser-compatible; do not hide arrays or nested
   YAML in fixtures.
5. Never mutate `skills/`, `catalog/skills.lock.json`, existing design docs,
   or the user's installed skills.
6. Report failures with fixture name, input request, normalized metadata,
   expected result, actual result, and the relevant diagnostic code/path.

The existing `scripts/validate-skills-test.js` pattern is the model for
temporary Git repositories, lockfiles, install targets, and cleanup. Any
implementation-added focused test must be deterministic when run alone and
when run serially with the validator tests.

## 4. Catalog, documentation, and regression gate

The focused implementation gate is serial:

1. `npm run test:validate` for metadata validation regressions.
2. `node scripts/skill-loadouts-test.js` for resolver and API shapes.
3. `node scripts/install-loadouts-test.js` for CLI, installation, missing
   values, and atomic failure.
4. `node scripts/measure-skill-loadouts-test.js` for the measurement protocol.
5. `npm run help` and `npm run validate:skills` for public/documentation and
   packaged validation.
6. `npm test` (`node scripts/smoke.js`) as the serial maintainer smoke gate.

No parallel execution is permitted for the smoke gate because it mutates
`.scratch/` and exercises shared package paths. The smoke gate must include
the existing lockfile schema, curated-skill, CLI help, install, symlink,
sync, attribution, and interval-ledger checks. A failure is not converted
into a pass by narrowing the suite.

The full smoke check is environment-dependent: the current smoke workflow may
need sibling source repositories and Git/network capabilities. If unavailable,
record the exact command, exit status, missing checkout or capability, and
which checks did run. Mark the gate **not evidenced**, not passed. A supported
environment must run it before release acceptance.

## 5. Context-reduction measurement plan

The tracked artifact is the result of this measurement protocol. It publishes
byte counts and ratios from the pinned packaged corpus only; no tokenizer,
model, or token-reduction claim is made.

### Corpus and selections

The baseline corpus is the complete packaged `skills/` tree at a pinned commit,
with each skill's `SKILL.md`, frontmatter, and any files intentionally included
by the existing installer. Record commit, Node version, OS, locale, and corpus
file hashes. The target corpus uses the same commit and a named loadout
selection. Measure at least:

- a representative curated loadout with transitive required dependencies;
- the same loadout with one optional dependency included;
- a minimal direct selection;
- the full-corpus install as the upper-bound comparison.

Selection names, overrides, resolved order, omitted skills, and diagnostics
must be stored beside every measurement.

### Inputs and procedure

Use one fixed serialization/encoding and one fixed context assembly procedure
for baseline and target. Measure the exact bytes and, where the harness
supports it, tokenizer count of the assembled context. Warm-up behavior,
cache state, model/tokenizer version, and command arguments must be recorded.
Run each scenario five times, each in a distinct serial Node.js child process;
retain every raw sample and report median, minimum, maximum, and spread. If a tokenizer or model service is unavailable, byte counts remain valid
evidence and token metrics are marked environment-dependent rather than
estimated. The current tracked run uses five fresh serial Node.js child
processes per scenario.

### Comparison metrics and artifact

For each scenario record:

`baseline_bytes`, `target_bytes`, `absolute_reduction_bytes`,
`reduction_ratio`, optional `baseline_tokens`, `target_tokens`,
`absolute_reduction_tokens`, `reduction_ratio_tokens`, resolved names,
diagnostics, environment, and source commit.

The retained run is under
`.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/`, with
tracked summaries at `docs/evidence/skill-loadout-measurement.json` and
`docs/evidence/skill-loadout-measurement.md`. Raw per-scenario JSON, SHA-256
corpus and selection manifests, serialization and cache declarations,
command/environment metadata, and aggregate JSON are retained. Existing run
directories are refused rather than deleted or overwritten. Tokenizer/model
metrics are `null` because the tooling is unavailable.

## 6. Deferred and environment-dependent items

| Item | Classification | Required handling |
| --- | --- | --- |
| Version-constraint grammar beyond the initial contract | Deferred | Choose and document one deterministic syntax before exposing constraints; do not claim support before tests exist |
| Future implicit optional-selection policy | Deferred | Keep optional dependencies explicit until a policy and fixture exist |
| Token counts requiring a tokenizer/model service | Environment-dependent | Record unavailable tooling and use byte evidence only |
| Full maintainer smoke requiring sibling checkouts | Environment-dependent | Run when available; otherwise preserve the not-evidenced record |
| Network recovery paths in sync | Environment-dependent | Test only with explicit opt-in and controlled local remote fixtures; never require network for packaged install |
| Real curated-loadout evidence and performance claims | Required | Use the tracked pinned-corpus byte artifact; do not extend it to token/model claims |

## 7. Traceability and sign-off

The matrix covers every decision and hazard in `EXECUTION_PLAN_12.md` and the
hardening work recorded in `planning/STATE_16.md`:
frontmatter authority, generated catalog ownership, transitive resolution,
overrides, cycles, missing and optional skills, version/provenance separation,
dependency-free surfaces, packaged install versus maintainer sync, parser
limits, deterministic ordering, additive API shapes, atomic failure, and the
non-overwriting measurement protocol. A reviewer
signs off only when each Required row has a named test or artifact, each
Deferred row has an owner/trigger in the implementation plan, and each
Environment-dependent row has either successful evidence or a precise
limitation record. Real curated-loadout byte evidence is complete; token
metrics remain unavailable and are not estimated.
