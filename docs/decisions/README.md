# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for `aigb-skills-usda`.
Decisions recorded here represent the current architectural truth and conventions of the repository.

Records are maintained in accordance with the [adr-distillation](../../skills/adr-distillation/SKILL.md) skill, following [Martin Fowler's ADR structure](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) and [Michael Nygard's format](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions).

## Current Decisions Index

| ID | Title | Status | Date | Supersedes | Superseded By | Context |
|---|---|---|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2026-10-12 | - | - | Repository Baseline |
| [0002](0002-package-bundled-skills-directly.md) | Package Bundled Skills Directly Without Network Sync | Accepted | 2026-10-12 | - | - | Offline Agent Distribution |
| [0003](0003-package-and-upstream-identity.md) | Keep Package Identity Separate from Upstream History | Accepted | 2026-10-14 | - | - | v0.3 Metadata Contract |
| [0004](0004-install-sync-boundary.md) | Keep Upstream Synchronization Out of User Installation | Accepted | 2026-10-14 | - | - | v0.3 Synchronization |
| [0005](0005-frontmatter-canonical-metadata.md) | Use YAML Frontmatter as the Canonical Skill Metadata Source | Accepted | 2026-10-24 | - | - | EXECUTION_PLAN_12 |
| [0006](0006-deterministic-packaged-loadout-resolution.md) | Resolve Skill Loadouts Deterministically from Packaged Metadata | Accepted | 2026-10-24 | - | - | EXECUTION_PLAN_13 |
| [0007](0007-derived-loadout-surfaces-and-measured-context.md) | Expose Loadouts Through Derived Catalog, CLI, and Reusable API | Proposed | 2026-10-24 | - | - | EXECUTION_PLAN_13 |
