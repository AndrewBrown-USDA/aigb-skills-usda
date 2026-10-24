---
id: "0006"
title: "Resolve Skill Loadouts Deterministically from Packaged Metadata"
status: "Proposed"
date: 2026-10-24
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_12 / docs/design/skill-loadouts"
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
explicit inclusion or force selection. `force` outranks `exclude`, which
outranks `include`; excluding a direct root or required edge is an error.

Missing direct or required skills and cycles fail with stable diagnostics.
Selected missing optional skills warn and are omitted. Any error returns no
installable partial result. Identity is the skill name, while versions and
provenance remain metadata constraints; installation always uses packaged
`source_path`.

### Consequences

- **Positive:** Reproducible plans, actionable diagnostics, safe failure
  behavior, and one reusable semantic core for CLI and API consumers.
- **Negative:** Optional behavior is intentionally explicit, and future
  version constraints require a separately documented grammar.

## Validation & Compliance

Acceptance requires focused ordering, deduplication, override, missing-skill,
cycle, version, and provenance fixtures. Resolution never invokes
maintainer synchronization, preserving ADRs 0002 and 0004; canonical and
upstream metadata remain distinct under ADR 0003.
