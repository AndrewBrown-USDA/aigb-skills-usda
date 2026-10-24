# Skill Loadout Resolution Semantics

Status: design contract for task 12.2.1. This document defines deterministic
resolution for the metadata in `skill-loadout-metadata.md`; it does not change
the current CLI, parser, validator, or catalog.

## Inputs and outputs

The resolver consumes the normalized, frontmatter-derived catalog:

- `name` is the canonical skill identity.
- `loadout` selects a named loadout; `group` is informational and never
  expands dependencies.
- `dependencies` are required edges.
- `optional_dependencies` are opt-in edges.
- `version`, `source_repo`, `source_path`, `source_url`, and upstream fields
  are carried as metadata, not alternate install locations.

The request is an ordered list of skill names and/or `loadout:<name>` tokens,
plus ordered override lists: `include`, `exclude`, and `force`. A bare name
always means a skill, never a group. A loadout expands to catalog entries
whose normalized `loadout` equals that name, sorted by skill name. Empty
requests are valid and resolve to an empty result.

The result is either a successful ordered list of unique skill records and
diagnostics, or a failed result with no installable partial result. Diagnostics
are stable tuples `(code, subject, path, detail)` sorted by discovery order,
then code and subject. The install source is always the packaged
`source_path` under `./skills`; resolution never fetches `source_url` or an
upstream repository.

## Expansion, traversal, ordering, and idempotence

Direct request order is preserved. Duplicate direct names and duplicate
loadout members are visited once, at their first occurrence. Each node is
depth-first traversed in declaration order: required dependencies first, then
selected optional dependencies. A node is emitted after its dependencies
(post-order); direct roots therefore appear after their transitive
dependencies. For multiple parents, the first complete traversal determines
the node's position. Repeating a request or resolving the same metadata twice
produces byte-for-byte equivalent names, metadata, and diagnostics.

Optional dependencies are selected only when their name is in `include` or
`force`, or when an implementation-defined future loadout policy explicitly
marks them selected. This contract defines no implicit optional selection.
An optional edge selected by a parent is traversed exactly like a required
edge, except that its missing target is a warning (see below).

## Overrides and precedence

Overrides use comma-separated names, matching the parser's scalar convention.
Precedence, from strongest to weakest, is:

1. `force` includes a name and all of its transitive dependencies, even when
   it is also excluded.
2. `exclude` suppresses an optional edge and its subtree unless forced.
3. `include` selects an optional edge; it does not override an exclusion.
4. Metadata declarations provide the default required/optional graph.

Direct requests are roots and cannot be silently removed: excluding a directly
requested skill is a deterministic conflict error. `force` resolves that
conflict and wins. Excluding a required dependency is also an error because it
would violate the required graph; forcing it is redundant and succeeds.
Excluding an unrequested optional dependency is harmless and produces no
diagnostic. An override naming an unknown skill is an error, even if it would
otherwise be unused. Override names are deduplicated while preserving their
first appearance.

## Missing skills and failures

- A missing direct skill or loadout member is an error.
- A missing required dependency is an error.
- A selected missing optional dependency is a warning and is omitted; it does
  not fail resolution. The warning includes the parent and edge path.
- An unselected missing optional dependency is not diagnosed by resolution;
  metadata/catalog validation may still report it as an invalid reference.

Any error makes the result unsuccessful and non-installable. Warnings are
returned in a successful result in deterministic order. This policy avoids
silently losing requested or required capability while allowing curated
loadouts to remain usable when an explicitly selected optional skill is not
packaged.

## Cycles

Use three states per node: unseen, active, and complete. Encountering an active
node reports a cycle with the active stack rotated to the repeated node and
closed with that node, for example `a -> b -> c -> a`. Required and selected
optional edges both fail resolution; edge kind is included in the diagnostic.
The result is never partially installable. Unselected optional edges are not
traversed and therefore cannot cause a resolution cycle.

## Versions and provenance

Identity is the normalized skill `name`; version does not create another node.
If a request or future API supplies a version constraint, it must be checked
against the selected record's `version`; absent versions satisfy only an
unconstrained request. Unsupported or malformed constraints are errors.
Conflicting constraints for the same identity are errors; compatible
constraints are all required to pass. This contract does not prescribe a
version-range syntax beyond requiring deterministic parser support.

`source_repo` and `source_path` identify the installable artifact. `source_url`
may be derived from the canonical repository map. `upstream_repo`,
`upstream_ref`, `upstream_path`, and `upstream_name` are provenance only.
Canonical and upstream values are preserved in output and never merged,
substituted, or used to download content. Legacy aliases are interpreted only
through the metadata contract's normalization rules.

## Language-neutral algorithm

```text
resolve(request, catalog, include, exclude, force):
  normalize and deduplicate all names; reject unknown override names
  roots = expand request names and loadout:<name> members (catalog-name order)
  reject missing roots and direct roots excluded without force
  state = unseen; output = []; diagnostics = []
  visit(name, edge_kind, path):
    if name is excluded and not forced:
      if edge_kind is optional: return
      error(required exclusion); return
    if missing:
      error for direct/required; warning and return for selected optional
    if state[name] is active: error(cycle path); return
    if state[name] is complete: return
    state[name] = active
    for dep in dependencies[name]: visit(dep, required, path + name)
    for dep in optional_dependencies[name]:
      if dep in include or dep in force: visit(dep, optional, path + name)
    state[name] = complete
    append name to output
  for root in roots: visit(root, direct, [root])
  if any errors: return failure with no output
  return success(output, diagnostics)
```

## Edge-case matrix

| Case | Result |
| --- | --- |
| Empty request | Success, empty output |
| Duplicate roots/members | One entry at first occurrence |
| Nested required edges | Post-order, declaration order |
| Unselected optional edge | Omitted, no resolution diagnostic |
| Included optional edge | Traversed; missing target warns |
| Direct missing name | Failure |
| Missing required edge | Failure |
| Missing optional edge | Warning only when selected |
| Direct exclusion | Conflict failure unless forced |
| Required exclusion | Failure; force is redundant |
| Optional exclusion | Omitted unless forced |
| Unknown override name | Failure |
| Required or selected-optional cycle | Failure, closed path diagnostic |
| Unselected optional cycle | Not traversed |
| Conflicting version constraints | Failure |
| Missing version under constraint | Failure |
| Duplicate compatible version request | One identity, all constraints checked |
| Canonical/upstream disagreement | Metadata validation failure |
| Provenance-only difference | Same identity/source; provenance retained |
| Group-only match | No expansion |
| Loadout with no members | Success, empty expansion |

These rules preserve direct packaged installation and the maintainer-only
`sync` boundary: resolution selects already materialized skills and never
turns provenance into a source.
