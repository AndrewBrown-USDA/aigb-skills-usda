---
id: "0006"
title: "Resolve Skill Loadouts Deterministically from Packaged Metadata"
status: "Accepted"
date: 2026-10-24
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_13 / docs/design/skill-loadouts"
---

# 6. Resolve Skill Loadouts Deterministically from Packaged Metadata

## Context and Problem Statement

Selecting related skills requires transitive dependency expansion while
remaining reproducible, safe to install, and compatible with direct packaged
installation. Ambiguous ordering, cycles, exclusions, or provenance handling
could produce incomplete or non-repeatable installs.

## Decision Drivers

- Stable results for CLI, API, catalog, and tests.
- No partial installation after a resolution error.
- Explicit user control over optional dependencies and exclusions.
- No network access or provenance-driven source substitution.
- A resolver that can be reused independently of CLI dispatch.

## Considered Options

1. Use deterministic depth-first post-order resolution over the generated
   catalog.
2. Resolve only direct names and leave transitive expansion to callers.
3. Resolve through upstream repositories or provenance URLs.

## Decision Outcome

Chosen option: **a pure, catalog-backed resolver with deterministic
depth-first post-order traversal**.

Direct roots preserve request order; loadout members are name-sorted;
dependencies follow declaration order; shared nodes are emitted once.
Required dependencies are always selected. Optional dependencies require
explicit inclusion or force selection. Include/exclude overrides require at
least one explicit root. Excluding a direct root is an error unless `force`
retains it; excluding a required edge remains an error.

Missing direct or required skills and cycles fail with stable diagnostics.
An unknown or mistyped `loadout:<name>` also fails rather than resolving to an
empty selection. Selected missing optional skills warn and are omitted. Any
error returns `ok: false`, an empty `skills` array, additive structured
diagnostics, and no target mutation. Identity is the skill name. API version
constraints accept exact strings only; ranges, missing versions, mismatches,
and unknown constrained skills fail. Provenance remains metadata, and
installation always uses packaged `source_path`.

### Consequences

- **Positive:** Reproducible plans, actionable diagnostics, safe failure
  behavior, and one reusable semantic core for CLI and API consumers.
- **Negative:** Optional behavior is intentionally explicit, and future
  version constraints require a separately documented grammar.

## Validation & Compliance

Validation completed in `scripts/skill-loadouts-test.js` and
`scripts/install-loadouts-test.js` with focused ordering, deduplication,
unknown-loadout, rootless-override, direct-exclusion, missing-value, cycle,
exact-version, additive-result, provenance, packaged-source, and
atomic-failure fixtures. `npm run test:validate`, `npm run help`, `npm run
validate:skills`, and the serial `npm test` wave boundary gate passed.
Resolution never invokes maintainer synchronization, preserving ADRs 0002 and
0004; canonical and upstream metadata remain distinct under ADR 0003.
