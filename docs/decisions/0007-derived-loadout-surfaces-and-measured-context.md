---
id: "0007"
title: "Expose Loadouts Through Derived Catalog, CLI, and Reusable API"
status: "Accepted"
date: 2026-10-24
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_13 / docs/design/skill-loadouts"
---

# 7. Expose Loadouts Through Derived Catalog, CLI, and Reusable API

## Context and Problem Statement

Loadout behavior must be available to users and future tooling without
creating a second metadata authority or conflating packaged installation with
maintainer synchronization. Claims about reducing agent context also need
reproducible evidence rather than estimated percentages.

## Decision Drivers

- Keep generated catalog ownership and frontmatter authority explicit.
- Provide a dependency-free reusable API and compatible CLI surface.
- Preserve the install/sync boundary and offline default.
- Make context-reduction claims reproducible and auditable.

## Considered Options

1. Derive catalog fields from frontmatter and expose shared resolver/API and
   `install` selection options.
2. Make the generated catalog authoritative for loadouts.
3. Add a separate network-backed loadout service.

## Decision Outcome

Chosen option: **derive loadout metadata into the existing catalog, expose
resolution through a reusable local API and `skills install`, and measure
context reduction from pinned artifacts**.

Catalog generation remains deterministic and frontmatter-driven. The API
separates catalog reading, resolution, installation, and regeneration while
adding structured diagnostic and install-result fields without removing the
legacy-compatible fields. `skills install` accepts named skills,
`loadout:<name>`, optional inclusion, exclusion, force, source, target, and
materialization mode. Invalid selections and missing values fail before target
mutation. `skills sync` remains maintainer-only and local by default; neither
resolution nor install follows provenance URLs.

Context reduction is not a token or model claim. The tracked evidence records a
pinned corpus, environment, selection manifests, five independent serial
child-process byte measurements per scenario, raw samples and hashes,
serialization/cache metadata, and non-overwriting run directories. The current
artifact is
`docs/evidence/skill-loadout-measurement.{json,md}`, with retained raw runs
under `.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/`.

### Consequences

- **Positive:** Existing users retain no-selection and direct-name behavior;
  consumers share one contract; generated ownership stays reviewable; evidence
  can be reproduced without requiring a particular tokenizer.
- **Negative:** Compatibility and acceptance testing spans metadata, catalog,
  API, CLI, sync boundaries, and measurement artifacts.

## Validation & Compliance

Focused resolver and installer suites verify fail-closed CLI/API diagnostics,
additive result shapes, malformed-list rejection, missing option values,
packaged-only installation, and atomic failure. The tracked measurement
artifact records six real curated scenarios, five distinct child executions per
scenario, retained raw samples, corpus hashes, manifests, environment and
cache declarations, aggregate byte metrics, null tokenizer/model metrics, and
overwrite refusal. This proves measured byte evidence, not token reduction.
ADRs 0002 and 0004 remain in force. The wave-6 full acceptance gate passed,
and the tracked evidence and process audit satisfy the separate acceptance
review; this ADR is Accepted.
