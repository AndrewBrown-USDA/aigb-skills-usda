---
id: "0003"
title: "Separate Canonical Skill Identity from Upstream Provenance"
status: "Accepted"
date: 2026-10-14
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_7"
---

# 3. Separate Canonical Skill Identity from Upstream Provenance

## Context and Problem Statement
The package materializes skills locally while preserving information about
their original repositories. Treating canonical package identity and upstream
provenance as the same metadata caused ambiguous synchronization behavior,
duplicated normalization logic, and the risk of generating incorrect source
URLs.

## Decision Drivers
* Stable metadata for the bundled package and generated catalog.
* Explicit provenance without changing the package's canonical source.
* Backward compatibility with existing `source_ref` and `upstream` metadata.
* Deterministic validation and safe handling of unknown repositories.

## Considered Options
1. Continue using one mixed set of source and upstream fields.
2. Remove upstream provenance from packaged metadata.
3. Maintain separate canonical and provenance fields behind one shared helper.

## Decision Outcome
Chosen option: "Maintain separate canonical and provenance fields behind one
shared helper."

Canonical identity uses `source_repo`, `source_path`, and `source_url`.
Upstream provenance uses `upstream_repo`, `upstream_ref`, and optional
`upstream_name`. Legacy `source_ref` and `upstream` remain read-only fallbacks
for compatibility. Unknown repositories do not receive fabricated canonical
URLs.

### Consequences
* **Positive**: Catalogs and packaged skills have one stable canonical identity.
* **Positive**: Upstream attribution and pinned references remain available
  without redirecting canonical extraction.
* **Positive**: Miner, validator, and synchronizer share deterministic rules.
* **Negative**: Metadata contains more explicit fields and requires migration
  support for older records.

## Validation & Compliance
Implemented by `scripts/skill-metadata.js` and enforced by the metadata,
validator, smoke, and catalog regression suites.
