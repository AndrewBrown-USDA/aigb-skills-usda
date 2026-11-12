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

# 3. Keep Package Identity Separate from Source Attribution and Sync

## Context and Problem Statement

This repository ships its own packaged copy of each skill. A skill can retain
its original author, source URL, and release version even when the repository
no longer synchronizes it from that source. Package identity, source
attribution, and active synchronization are separate facts:

1. **Package identity:** where this repository stores and installs the skill.
2. **Source attribution:** who authored the skill and where it originated.
3. **Active synchronization:** which source repository and ref the maintainer
   workflow uses to update the packaged copy.

Using attribution as a synchronization input would make a retained source link
accidentally control updates.

## Decision Drivers

- Installation must have a stable local identity.
- Attribution and release versions must remain available for manually maintained
  vendor copies.
- Sync must be driven only by explicit synchronization metadata.
- Old metadata names must continue to work during migration.
- Unknown repositories must not produce invented URLs.

## Considered Options

1. Use one mixed set of source fields.
2. Remove all source attribution when synchronization ends.
3. Store package identity, source attribution, and sync configuration separately.

## Decision Outcome

We use distinct metadata for each fact:

| Fact | Fields |
|---|---|
| Package identity | `source_repo`, `source_path`, `source_url` |
| Source attribution | `author`, `original_source_url`, `version` |
| Active synchronization | `upstream_repo`, `upstream_ref`, `upstream_path`, `upstream_name` |

The package identity determines what the repository installs. Source
attribution and version describe authorship and history; they do not activate
synchronization or replace package identity. A skill without active upstream
metadata is maintained from the canonical package source. Legacy `source_ref`
and `upstream` names remain read-only compatibility aliases for sync metadata.
Unknown repositories do not receive fabricated canonical URLs.

### Consequences

- Metadata carries separate identity, attribution, and optional sync concepts.
- Manually maintained vendor copies can retain origin and version without
  remaining sync targets.
- Install, catalog, and sync code can make their source choice explicit.

## Validation & Compliance

`scripts/skill-metadata.js`, the validator, catalog generation, and smoke
checks enforce these distinctions, require a version for packaged skills, and
normalize legacy aliases. `original_source_url` is validated and preserved as
attribution only; it is not used to resolve synchronization sources.
