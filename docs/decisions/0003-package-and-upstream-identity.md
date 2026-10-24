---
id: "0003"
title: "Keep Package Identity Separate from Upstream History"
status: "Accepted"
date: 2026-10-14
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_7"
---

# 3. Keep Package Identity Separate from Upstream History

## Context and Problem Statement

This repository ships its own packaged copy of each skill. Some skills also
came from another repository. Those are two different facts:

1. **Package identity:** where this repository stores and installs the skill.
2. **Upstream provenance:** where the skill originally came from.

If one field serves both purposes, a provenance link can accidentally be
treated as the package's install source.

## Decision Drivers

- Installation must have a stable local identity.
- Upstream attribution and pinned references should be retained.
- Old metadata names must continue to work during migration.
- Unknown repositories must not produce invented URLs.

## Considered Options

1. Use one mixed set of source fields.
2. Remove upstream information from packaged metadata.
3. Store package identity and upstream provenance in separate fields.

## Decision Outcome

We use separate fields:

| Fact | Fields |
|---|---|
| Package identity | `source_repo`, `source_path`, `source_url` |
| Upstream provenance | `upstream_repo`, `upstream_ref`, `upstream_name` |

The package identity determines what the repository installs. Provenance
describes history and attribution; it does not replace package identity.
Legacy `source_ref` and `upstream` names remain read-only compatibility
aliases. Unknown repositories do not receive fabricated canonical URLs.

### Consequences

- Consumers must carry two concepts instead of one.
- Install, catalog, and sync code can make their source choice explicit.
- Provenance remains available without making normal installation depend on it.

## Validation & Compliance

`scripts/skill-metadata.js`, the validator, catalog generation, and smoke
checks enforce these distinctions and normalize legacy aliases.
