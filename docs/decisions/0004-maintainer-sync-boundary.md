---
id: "0004"
title: "Keep Maintainer Synchronization Separate from Canonical Packaging"
status: "Accepted"
date: 2026-10-14
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_7"
---

# 4. Keep Maintainer Synchronization Separate from Canonical Packaging

## Context and Problem Statement
Bundled skills are the package's canonical source, while maintainer workflows
may need to inspect pinned upstream repositories for attribution or extraction.
Using upstream provenance as an implicit replacement for canonical sources could
make synchronization network-dependent or fail on provenance links that are not
cloneable repositories.

## Decision Drivers
* Preserve reliable bundled and offline installation.
* Keep canonical package materialization reproducible.
* Honor valid pinned upstream references when a repository is available.
* Avoid failing synchronization for non-cloneable provenance URLs.

## Considered Options
1. Always replace canonical extraction with the upstream repository.
2. Ignore upstream references entirely.
3. Use canonical sources by default and consult pinned upstream repositories
   only when they are valid and available for maintainer synchronization.

## Decision Outcome
Chosen option: "Use canonical sources by default and consult pinned upstream
repositories only when they are valid and available for maintainer
synchronization."

The public installation path remains bundled and offline. The maintainer
`sync` path may use a valid `upstream_repo` and `upstream_ref`, but
non-cloneable provenance links fall back to canonical extraction rather than
being treated as repositories.

### Consequences
* **Positive**: End-user installation never depends on upstream repositories.
* **Positive**: Maintainers can reproduce pinned upstream-derived content when
  the source is a real repository.
* **Positive**: Informational provenance URLs do not break synchronization.
* **Negative**: Maintainers must distinguish source availability from metadata
  presence.

## Validation & Compliance
Implemented in `scripts/sync-skills.js` and covered by validator, smoke,
metadata, and catalog regression tests. The policy remains consistent with
ADR 0002.
