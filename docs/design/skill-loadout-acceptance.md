# Skill Loadout Acceptance and Measurement Plan

Status: design contract for task 12.4.1. This document defines evidence
required for a later implementation of the metadata, resolver, catalog, CLI,
API, and documentation contracts. It records no implementation result and
does not change the current package.

## 1. Acceptance classification

| Class | Meaning |
| --- | --- |
| Required | Must pass before implementation is accepted. |
| Deferred | Not required for the initial implementation; must be explicitly documented and must not be implied by the shipped contract. |
| Environment-dependent | Required when the environment supports it; otherwise record the command, limitation, and observable evidence without weakening the requirement. |

The current green baseline is `npm run help`, `npm run validate:skills`
(34 skills, 39 checks), `npm run test:validate`, and the recorded smoke result
of `npm test` / `node scripts/smoke.js` for 34 skills. The task-specific
targeted check is `npm run test:validate`. It must be run after this document
is created. This task does not run the full/global suites.

## 2. Focused acceptance matrix

Each row names the implementation fixture or evidence artifact that a later
worker must produce. Fixtures are isolated under a test-owned temporary
directory (never the packaged `skills/` tree or generated catalog).

| Requirement | Focused test/evidence | Expected assertion | Class |
| --- | --- | --- | --- |
| Scalar metadata fields are parser-compatible | `metadata-valid-fields` fixture | Group, loadout, dependency, optional, version, and provenance scalars normalize successfully | Required |
| Normalization is deterministic | `metadata-normalization` fixture | Trimming, token order, and exact-name deduplication produce the documented normalized record | Required |
| Invalid identifiers fail | `metadata-invalid-identifiers` fixture | Underscores, empty tokens, malformed names, and invalid loadout/group values produce stable validation errors | Required |
| Duplicate/conflicting declarations fail | `metadata-duplicates-conflicts` fixture | Duplicate dependencies and overlap between required and optional declarations are rejected | Required |
| Self-reference fails | `metadata-self-reference` fixture | Direct and optional self-edges are rejected before catalog generation | Required |
| Provenance rules hold | `metadata-provenance` fixture | Canonical/legacy aliases agree when both exist; canonical identity remains distinct from upstream provenance | Required |
| Legacy records remain readable | `metadata-legacy-record` fixture | A record without loadout fields, and a record using legacy provenance aliases, remains compatible | Required |
| Direct ordering is preserved | `resolution-order` fixture | Requested roots retain order; dependencies emit post-order in declaration order | Required |
| Deduplication is idempotent | `resolution-deduplication` fixture | Repeated roots, loadout members, and shared dependencies emit once at first completion | Required |
| Required dependencies resolve transitively | `resolution-required-transitive` fixture | All required descendants are included or resolution fails without a partial plan | Required |
| Optional dependencies are opt-in | `resolution-optional` fixture | Unselected optional edges are omitted; included edges traverse normally | Required |
| Overrides have fixed precedence | `resolution-overrides` fixture | `force` beats `exclude`, `exclude` beats `include`, and metadata defaults are weakest | Required |
| Missing skills are classified | `resolution-missing` fixture | Missing direct/required names fail; selected missing optional names warn and are omitted | Required |
| Cycles are deterministic | `resolution-cycles` fixture | Required or selected-optional cycles fail with a closed, stable path; unselected optional cycles are not visited | Required |
| Version behavior is explicit | `resolution-versions` fixture | Identity is name-based; constraints are checked deterministically; conflicts and missing constrained versions fail | Required |
| Provenance does not change install source | `resolution-provenance` fixture | Output retains provenance but installation uses packaged `source_path` only | Required |
| CLI selection syntax works | CLI fixture invoking `--skill`, `--skills`, comma lists, and `loadout:<name>` | Aliases and compatibility syntax produce the same normalized request | Required |
| CLI diagnostics are actionable | CLI failure fixtures | Unknown names/options, cycles, exclusions, and conflicts exit 1 with stable codes and no partial install | Required |
| Help documents the surface | `npm run help` plus help snapshot/assertions | Selection, override, mode, and install/sync boundary are described without claiming network access | Required |
| API contracts are stable | API fixture tests for read, resolve, install, and catalog functions | Inputs, successful output, diagnostics, and failure shape match the surface design | Required |
| Install behavior remains packaged-only | Install fixture with provenance URLs and local packaged source | No network or upstream fetch occurs; source/target overlap and conflict rules remain enforced | Required |
| Sync boundary is unchanged | Existing sync regression assertions | Sync retains local-only default and explicit network recovery; install does not invoke sync | Required |
| Frontmatter owns catalog values | Catalog regeneration fixture | Editing frontmatter changes derived fields; editing the old JSON does not survive regeneration | Required |
| Generated-field ownership is enforced | Catalog ownership assertions | Generator metadata, schema fields, ordering, and derived URLs have one owner and stable values | Required |
| Catalog output is deterministic | Regenerate twice from identical fixture tree | Byte-equivalent JSON (including ordering) is produced | Required |
| Catalog schema is compatible | Legacy catalog fixture and new-field fixture | Schema-1 records without loadout fields remain readable; incompatible schema fails explicitly | Required |
| Documentation is complete | Documentation contract checks | Metadata, resolution, surfaces, and acceptance documents agree on names, precedence, diagnostics, and boundaries | Required |
| README/help alignment is maintained | Text assertions or review checklist | User-facing examples do not contradict the design or imply unsupported behavior | Required |
| Context reduction is measured | Measurement artifact described in section 5 | Baseline and selected-loadout measurements are reproducible and report inputs and metrics | Required |

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

The implementation gate is serial:

1. Focused loadout tests: all rows marked Required in sections 2 and 3.
2. `npm run test:validate` (task-targeted check; required and must pass).
3. `npm run help` and `npm run validate:skills` (required regression checks
   when CLI or metadata/catalog code changes).
4. `npm test` (`node scripts/smoke.js`) as the full maintainer smoke gate.

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

This is a measurement protocol, not a result. No percentage, token count, or
performance claim may be published until the protocol has produced an artifact.

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
Run each scenario at least five times in a clean serial process; report every
sample plus median, minimum, maximum, and spread. If a tokenizer or model
service is unavailable, byte counts remain valid evidence and token metrics
are marked environment-dependent rather than estimated.

### Comparison metrics and artifact

For each scenario record:

`baseline_bytes`, `target_bytes`, `absolute_reduction_bytes`,
`reduction_ratio`, optional `baseline_tokens`, `target_tokens`,
`absolute_reduction_tokens`, `reduction_ratio_tokens`, resolved names,
diagnostics, environment, and source commit.

Write a machine-readable JSON artifact under `.scratch/` (or the CI artifact
store) and a short Markdown summary that links the corpus manifest, commands,
raw samples, and calculation script. Do not overwrite prior evidence. A result
is repeatable only when the pinned corpus, procedure, and environment fields
match; otherwise report it as a new run.

## 6. Deferred and environment-dependent items

| Item | Classification | Required handling |
| --- | --- | --- |
| Version-constraint grammar beyond the initial contract | Deferred | Choose and document one deterministic syntax before exposing constraints; do not claim support before tests exist |
| Future implicit optional-selection policy | Deferred | Keep optional dependencies explicit until a policy and fixture exist |
| Token counts requiring a tokenizer/model service | Environment-dependent | Record unavailable tooling and use byte evidence only |
| Full maintainer smoke requiring sibling checkouts | Environment-dependent | Run when available; otherwise preserve the not-evidenced record |
| Network recovery paths in sync | Environment-dependent | Test only with explicit opt-in and controlled local remote fixtures; never require network for packaged install |
| Performance targets or percentage reduction | Deferred until measured | Publish no target result without the corpus and repeatability artifact |

## 7. Traceability and sign-off

The matrix covers every decision and hazard in `EXECUTION_PLAN_12.md`:
frontmatter authority, generated catalog ownership, transitive resolution,
overrides, cycles, missing and optional skills, version/provenance separation,
dependency-free surfaces, packaged install versus maintainer sync, parser
limits, deterministic ordering, and context-reduction evidence. A reviewer
signs off only when each Required row has a named test or artifact, each
Deferred row has an owner/trigger in the implementation plan, and each
Environment-dependent row has either successful evidence or a precise
limitation record.
