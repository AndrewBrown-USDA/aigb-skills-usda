# Skill Loadout Metadata Contract

Status: design contract for task 12.1.1. This document defines metadata
that a later implementation may consume; it does not change the current
parser, validator, catalog, or packaged skills.

## Authority and parser boundary

`skills/<name>/SKILL.md` frontmatter is authoritative. The generated catalog
may copy normalized values, but it is never an input or an override. The
contract uses only the current frontmatter subset: top-level scalar fields and
the existing `metadata:` mapping whose values are scalars. Lists, inline YAML
arrays, nested mappings, tags, anchors, and multiline values are not valid.

The existing required top-level fields remain:

| Field | Shape | Invariant |
| --- | --- | --- |
| `name` | scalar string | Required; canonical skill identifier; lowercase kebab-case, matching its directory. |
| `description` | scalar string | Required; non-empty. |
| `license` | scalar string | Optional existing field; unchanged by this contract. |

## Metadata fields

All new fields are nested under `metadata`. A comma-separated field is a
single scalar string; commas separate tokens and surrounding whitespace is
ignored. Empty tokens are invalid.

| Field | Required | Shape and normalization |
| --- | --- | --- |
| `group` | No | One lowercase kebab-case group identifier. Normalize surrounding whitespace; absent means no group. |
| `loadout` | No | One lowercase kebab-case loadout identifier. Normalize surrounding whitespace; absent means the skill is not a loadout entry. |
| `dependencies` | No | Comma-separated skill names. Normalize each token by trimming whitespace; preserve declaration order; deduplicate exact names. |
| `optional_dependencies` | No | Comma-separated skill names with the same rules as `dependencies`; these are opt-in dependencies and are not required for the default loadout. |
| `version` | No | Non-empty scalar version string. Existing values are preserved; semantic-version syntax is recommended but not required for legacy compatibility. |
| `source_repo` | Yes for packaged skills | Canonical repository key. |
| `source_path` | Yes for packaged skills | Canonical path within `source_repo`. |
| `source_url` | Derived/optional | Absolute URL; for known `source_repo` values it is derived and must agree with the derived URL. |
| `upstream_repo` | No | Provenance repository identifier or URL. |
| `upstream_ref` | No | Immutable or named provenance reference (tag, branch, or commit). |
| `upstream_path` | No | Provenance path within the upstream repository. |
| `upstream_name` | No | Human-readable upstream skill name. |
| `inspired_by` | No | Non-empty scalar string naming the source of an idea (a person, project, or conversation). Normalize surrounding whitespace; empty values are invalid. Records inspiration, not authorship, and never replaces `author`. |

`source_ref` and `upstream` are legacy read-only aliases for `upstream_ref`
and `upstream_repo`, respectively. New metadata must use the canonical names.
They must not disagree with their canonical counterparts.

## Invariants

1. A skill name, group, loadout, and every dependency token use the same
   identifier grammar: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
2. A skill cannot depend on itself, directly or through an optional
   dependency declaration.
3. A name may occur in at most one of `dependencies` and
   `optional_dependencies`; required status wins only when a legacy record
   contains both, and new records are invalid.
4. `dependencies` and `optional_dependencies` cannot contain duplicate tokens.
5. A loadout is identified by `loadout`; `group` is organizational metadata
   and does not imply dependency resolution. A skill may have one of each.
6. `group` and loadout membership are independent; equal values are allowed but
   have no special meaning. A skill may use singular `loadout` for compatibility
   or `loadouts` as a comma-separated scalar/list of memberships.
7. Dependency references are validated as metadata, but resolution severity
   depends on edge kind: missing required nodes are errors; selected missing
   optional nodes are warnings and are omitted; unselected optional nodes are
   not resolution diagnostics.
8. Canonical identity and upstream provenance remain separate. Provenance
   never replaces `source_repo` or changes install source.
9. If both canonical and legacy provenance fields are present, their
   normalized values must match. If only a legacy alias is present, it is
   accepted and normalized to the canonical field without rewriting the source
   file.
10. Unknown repositories do not receive fabricated `source_url` values.
11. `inspired_by` is optional attribution metadata. It records where an idea
    came from, does not confer authorship, never replaces `author`, and must be
    a non-empty scalar string after trimming; empty values and lists are
    invalid.

## Valid examples

These examples use the supported scalar/list values:

```yaml
---
name: field-reporting
description: Produces field reporting workflows.
metadata:
  group: geospatial
  loadouts: field-ops, field-reporting
  dependencies: dr-lexus, worker-validation
  optional_dependencies: web-source-bundler
  inspired_by: Ryon Morrison (idea shared with GitHub Copilot CoP)
  version: 2.1.0
  source_repo: aigb-skills
  source_path: skills/field-reporting/SKILL.md
  upstream_repo: https://github.com/example/field-reporting.git
  upstream_ref: v2.1.0
  upstream_path: skills/field-reporting/SKILL.md
---
```

An ordinary existing skill remains valid without loadout fields:

```yaml
---
name: dr-lexus
description: Plain language directive.
metadata:
  author: Andrew G. Brown
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/dr-lexus/SKILL.md
---
```

Legacy provenance remains parseable during migration:

```yaml
metadata:
  source_repo: aigb-skills
  source_path: skills/example/SKILL.md
  upstream: https://github.com/example/old.git
  source_ref: v1
```

It normalizes as `upstream_repo` and `upstream_ref`.

## Invalid examples

```yaml
# Invalid: arrays are outside the supported parser contract.
metadata:
  dependencies: [dr-lexus, worker-validation]

# Invalid: duplicate and conflicting declarations.
metadata:
  dependencies: dr-lexus, dr-lexus
  optional_dependencies: dr-lexus

# Invalid: self-reference and malformed identifier.
metadata:
  dependencies: field_reporting
  optional_dependencies: field-reporting

# Invalid: canonical/legacy provenance conflict.
metadata:
  upstream_repo: https://github.com/new/source.git
  upstream: https://github.com/old/source.git

# Invalid: attribution must be a non-empty scalar string.
metadata:
  inspired_by: ""
```

An empty value, trailing comma, whitespace-only token, unknown dependency, or
non-absolute `source_url` is invalid. A missing `source_repo` or `source_path`
is invalid for a packaged skill under the existing validator.

## Compatibility and migration

Existing skills with no new fields retain their current behavior and resolve
to no group, loadout, or dependencies. Adding `group`, `loadout`, or
dependency fields is additive. A migration should:

1. Copy legacy `upstream` to `upstream_repo` and `source_ref` to
   `upstream_ref`.
2. Preserve the legacy keys only until all consumers accept canonical keys;
   if both forms remain, require equality.
3. Convert any proposed YAML list to a comma-separated scalar.
4. Normalize tokens and reject conflicts, self-references, duplicates, and
   malformed names before catalog generation.
5. Regenerate the catalog from frontmatter; never hand-edit generated output.

No runtime or catalog behavior is implied by this design document. Later
implementation must define whether unresolved optional dependencies warn or
fail, and must preserve the maintainer-only sync boundary and the canonical /
upstream separation established by ADR 0003.
