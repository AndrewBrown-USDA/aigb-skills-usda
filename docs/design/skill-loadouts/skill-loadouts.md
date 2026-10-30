# Skill Loadouts

Status: implementation-ready design specification for task 12.5.1. This
document integrates the metadata, resolution, surface, and acceptance
contracts. It specifies future implementation only; it changes no runtime
code, packaged skill, catalog, prior design document, or ADR.

## 1. Goal, scope, and constraints

Skill loadouts group related packaged skills and resolve their transitive
dependencies deterministically, while allowing explicit user overrides.
Frontmatter in `skills/*/SKILL.md` remains authoritative; the catalog is
derived. The implementation must use dependency-free Node.js built-ins,
preserve direct packaged installation, and keep maintainer-only synchronization
separate from installation.

In scope: scalar metadata extensions, catalog derivation, resolution,
overrides, diagnostics, reusable API, CLI selection, migration, validation,
and context measurement. Out of scope: implementation in this design task,
network-backed installation, sidecar metadata, new dependencies, implicit
optional-selection policy, unmeasured context-reduction claims, and a
version-range grammar beyond the initial contract.

## 2. Architecture and ownership

The flow is:

```text
SKILL.md frontmatter -> parser/normalizer -> generated catalog
                                      -> resolver -> install planner
                                      -> packaged ./skills installer
```

`skills/*/SKILL.md` owns identity and declared metadata. The parser boundary
is top-level scalar fields plus scalar values under `metadata:`; comma-separated
lists are scalar strings. Arrays, nested mappings, multiline values, anchors,
and tags are invalid. `scripts/mine-history.js` owns generated schema fields,
ordering, and derived URLs. `catalog/skills.lock.json` is never hand-edited.
The resolver and installer read packaged `source_path` values only. `source_url`
and all upstream fields are provenance, never download instructions.

The future implementation should add a small dependency-free module (for
example `scripts/skill-loadouts.js`) and call existing parsing, normalization,
copy/symlink, conflict, and path-safety helpers rather than duplicate them.
Shared metadata/catalog writes are serialized; the resolver itself is pure
after catalog loading.

## 3. Data model and metadata boundary

Existing `name` and `description` remain required; `license` remains optional.
New values are nested under `metadata`:

| Field | Shape and meaning |
|---|---|
| `group` | Optional lowercase kebab-case organizational label; never expands. |
| `loadout` | Optional lowercase kebab-case selection label. |
| `dependencies` | Optional comma-separated required skill names, declaration order. |
| `optional_dependencies` | Optional comma-separated opt-in skill names. |
| `version` | Optional non-empty scalar; semantic versioning is recommended. |
| `source_repo`, `source_path` | Required canonical install identity for packaged skills. |
| `source_url` | Optional absolute derived URL; must agree when known. |
| `upstream_repo`, `upstream_ref`, `upstream_path`, `upstream_name` | Optional provenance only. |

`source_ref` and `upstream` are read-only legacy aliases for `upstream_ref`
and `upstream_repo`; both forms must agree. Normalize whitespace and list
tokens, reject empty tokens, duplicates, malformed identifiers, self-reference,
required/optional overlap in new records, unknown dependencies, invalid URLs,
and canonical/legacy conflicts. Existing records without loadout fields remain
valid. Migration is frontmatter-first: add scalar fields, validate, regenerate.

The generated record may represent comma-separated fields as arrays and may
carry `schema_version`, `generated_by`, and `generated_from`; consumers treat
missing new fields as empty values. A schema bump is required for incompatible
shape or semantics.

## 4. Resolution contract

Input is ordered names and/or `loadout:<name>` roots plus ordered `include`,
`exclude`, and `force` lists. Bare names are skills, not groups. Loadout
members are name-sorted. Empty input succeeds empty; omitted install selection
retains current all-packaged behavior.

Normalize and deduplicate each list at first appearance. Reject unknown
override names and missing roots. Traverse depth-first in declared required
order, then selected optional order; emit post-order. A shared node is emitted
once at first completion. Required dependencies are always selected.
Optional dependencies are selected only by `include` or `force`; an excluded
optional edge is skipped unless forced. `force` outranks `exclude`, which
outranks `include`, with metadata defaults weakest. Excluding a direct root or
required edge is an error; forcing it succeeds. Any error returns no
installable partial result.

Use `unseen`, `active`, and `complete` node states. Re-entering an active node
fails with a closed deterministic path such as `a -> b -> c -> a`. Missing
direct/required skills fail. A selected missing optional skill warns and is
omitted; an unselected missing optional edge is not a resolution diagnostic
(catalog validation still reports invalid references). Diagnostics are stable
tuples with code, severity, subject, path, and detail, ordered by discovery,
then code and subject.

Identity is `name`, not version. If constraints are later exposed, every
constraint for one name must pass; missing constrained versions and conflicting
or malformed constraints fail. The initial implementation must choose and
document one deterministic constraint grammar before exposing `constraints`.
Canonical source fields remain distinct from upstream provenance throughout.

## 5. API, CLI, catalog, and install contracts

The reusable API should provide:

* `readCatalog({ catalogPath?, sourceDir? })`: normalized catalog; reject
  unreadable, malformed, unsupported, duplicate, or non-installable records.
* `resolveLoadout({ names?, include?, exclude?, force?, constraints? }, catalog)`:
  `{ok, skills, diagnostics}`, with `skills: []` on failure.
* `installResolved(result, {sourceDir?, targetDir, mode?, force?})`: delegate
  to existing materialization and conflict rules; never fetch or mutate catalog.
* `buildCatalog({skillsDir?})`: equivalent to frontmatter-driven
  `scanCuratedSkills`/`buildLockfile`, deterministic and offline.

Extend `skills install` with `--skill`/`--skills <comma-list>`,
`--include <list>`, `--exclude <list>`, `--force`, `--mode <copy|symlink>`,
`--source`, and existing `--target`. `loadout:<name>` is the sole loadout
syntax. Unknown options, malformed lists, resolution errors, and conflicts
print one concise diagnostic to stderr and exit 1; help exits 0 and documents
the packaged-install versus sync boundary. `--force` both overrides resolution
exclusions and permits destination replacement.

`sync` retains its existing maintainer-only options and local-only default;
`--allow-network` remains explicit recovery. Sync may update materialized
frontmatter and regenerate the catalog, but install and resolution never invoke
sync or follow provenance URLs.

## 6. Compatibility and migration

No-selection installs, single names, comma lists, legacy provenance aliases,
and schema-1 catalogs without loadout fields remain readable. New clients must
not infer unsupported fields; incompatible schemas fail explicitly. A later
implementation must validate before catalog generation and must not alter
existing design docs, ADRs, or generated output outside its regeneration flow.

## 7. Acceptance and traceability matrix

| Plan requirement / hazard | Evidence | Class |
|---|---|---|
| Frontmatter authority and parser limits | Metadata fixtures; catalog regeneration test | Required |
| Groups, loadouts, dependencies, optionality | Scalar/list metadata and normalization fixtures | Required |
| Invalid identifiers, duplicates, self-reference, provenance | Invalid/provenance fixtures | Required |
| Transitive ordering and deduplication | `resolution-order`, `resolution-deduplication` | Required |
| Overrides and optional behavior | `resolution-overrides`, `resolution-optional` | Required |
| Missing skills and cycles | `resolution-missing`, `resolution-cycles` | Required |
| Version/provenance semantics | `resolution-versions`, `resolution-provenance` | Required |
| API and CLI compatibility/diagnostics | API fixtures, CLI fixtures, `npm run help` | Required |
| Catalog ownership, schema, determinism | Regeneration, ownership, legacy-schema fixtures | Required |
| Packaged install and sync boundary | Install and sync regression fixtures | Required |
| Documentation consistency | Cross-document contract checks and README review | Required |
| Existing regression behavior | `npm run validate:skills`, `npm run test:validate` | Required |
| Full maintainer smoke | Serial `npm test` / `node scripts/smoke.js` | Environment-dependent |
| Context reduction | `.scratch/` JSON plus Markdown measurement artifact | Required |
| Version constraint grammar | Decision and tests before `constraints` exposure | Deferred |
| Implicit optional-selection policy | Explicit policy and fixture before use | Deferred |
| Tokenizer/model counts | Recorded only when tooling exists | Environment-dependent |
| Network sync recovery | Controlled opt-in remote fixture | Environment-dependent |

Focused fixtures must be isolated, cleaned up, scalar-parser compatible, and
assert complete ordered outputs and diagnostics. No test may mutate packaged
skills, the generated catalog, prior documents, installed skills, network,
home directory, shared port, or ambient clock.

## 8. Context-reduction measurement

Pin the complete packaged tree, commit, Node version, OS, locale, hashes,
serialization, and context assembly procedure. Compare full corpus with a
representative transitive loadout, that loadout plus one optional dependency,
a minimal direct selection, and the full-corpus upper bound. Run each scenario
at least five times serially and retain every sample plus median, minimum,
maximum, and spread. Record resolved names, omissions, diagnostics, commands,
environment, and source commit.

Report `baseline_bytes`, `target_bytes`, absolute reduction, and ratio; record
token metrics only when a pinned tokenizer/model is available. Store JSON under
`.scratch/` (or CI artifacts) and a Markdown summary linking manifests, raw
samples, and calculation code. Do not publish a percentage or token result
before this artifact exists; unavailable tokenizer or sibling-checkout evidence
is a limitation, not a pass.

## 9. ADR compliance and unresolved decisions

* ADR 0001: this durable design records the architecture and acceptance path.
* ADR 0002: packaged installation is direct and offline; resolution never syncs.
* ADR 0003: canonical identity/install metadata and upstream provenance remain
  separate, with legacy aliases normalized only for compatibility.
* ADR 0004: maintainer synchronization remains a separate, explicit boundary
  with opt-in network recovery.

No ADR is superseded. Remaining implementation decisions are intentionally
bounded: select and document the version-constraint grammar before exposing
constraints; decide whether catalog validation reports unresolved optional
references as errors or warnings while preserving resolution's selected-missing
warning; and define the exact measurement harness/tokenizer available in CI.
None permits inventing semantics, weakening required acceptance, or changing
the canonical/generated ownership model.
