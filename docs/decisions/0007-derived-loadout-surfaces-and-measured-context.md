---
id: "0007"
title: "Expose Loadouts Through Derived Catalog, CLI, and Reusable API"
status: "Proposed"
date: 2026-10-24
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_12 / docs/design/skill-loadouts"
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
separates catalog reading, resolution, installation, and regeneration.
`skills install` accepts named skills, `loadout:<name>`, optional inclusion,
exclusion, force, source, target, and materialization mode. `skills sync`
remains maintainer-only and local by default; neither resolution nor install
follows provenance URLs.

Context reduction is not a design claim until a pinned corpus, environment,
selection manifest, repeated byte measurements, and optional tokenizer
measurements are stored as JSON and summarized in Markdown.

### Consequences

- **Positive:** Existing users retain no-selection and direct-name behavior;
  consumers share one contract; generated ownership stays reviewable; evidence
  can be reproduced without requiring a particular tokenizer.
- **Negative:** Compatibility and acceptance testing spans metadata, catalog,
  API, CLI, sync boundaries, and measurement artifacts.

## Validation & Compliance

Required evidence includes catalog regeneration determinism, CLI/API
diagnostics, packaged-only installation, documentation alignment, existing
validation, and the serial maintainer smoke suite. Environment-dependent
network recovery and tokenizer checks must be recorded as limitations rather
than converted into passing evidence. ADRs 0002 and 0004 remain in force.
