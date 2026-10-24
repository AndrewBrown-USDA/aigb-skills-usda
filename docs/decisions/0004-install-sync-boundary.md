---
id: "0004"
title: "Keep Upstream Synchronization Out of User Installation"
status: "Accepted"
date: 2026-10-14
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_7"
---

# 4. Keep Upstream Synchronization Out of User Installation

## Context and Problem Statement

Users install the bundled skills in this package. Maintainers sometimes need
to synchronize those bundled skills with a pinned upstream repository. These
are different workflows with different reliability requirements.

User installation must work from the checked-in package and must not require
network access. Maintainer synchronization may consult upstream metadata when
the referenced repository is real and available.

## Decision Drivers

- Keep ordinary installation offline and reproducible.
- Allow maintainers to recover or refresh content from valid pinned sources.
- Treat informational or non-cloneable URLs as provenance, not commands.
- Make network use an explicit maintainer choice.

## Considered Options

1. Always replace packaged content with upstream content.
2. Ignore upstream references completely.
3. Keep installation local and use upstream only in the maintainer `sync`
   workflow.

## Decision Outcome

The normal `install` workflow reads the checked-in `./skills` tree. It does
not clone repositories, fetch provenance URLs, or invoke synchronization.

The maintainer-only `sync` workflow may use `upstream_repo` and
`upstream_ref` when they identify a valid available repository. Network
recovery remains opt-in. If provenance is not cloneable or unavailable, sync
falls back to the canonical package source instead of treating the metadata
as a mandatory download instruction.

### Consequences

- Users get reliable offline installation.
- Maintainers retain a controlled path for upstream refreshes.
- Maintainer tooling must distinguish provenance metadata from source
  availability.
- The package and sync workflows remain intentionally separate.

## Validation & Compliance

`scripts/sync-skills.js`, validator checks, catalog checks, and smoke tests
enforce the install/sync boundary. This decision complements ADR 0002 and
depends on the source/provenance distinction in ADR 0003.
