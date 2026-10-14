# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for `aigb-skills-usda`.
Decisions recorded here represent the current architectural truth and conventions of the repository.

Records are maintained in accordance with the [adr-distillation](../../skills/adr-distillation/SKILL.md) skill, following [Martin Fowler's ADR structure](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) and [Michael Nygard's format](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions).

## Current Decisions Index

| ID | Title | Status | Date | Supersedes | Superseded By | Context |
|---|---|---|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2026-10-12 | - | - | Repository Baseline |
| [0002](0002-package-bundled-skills-directly.md) | Package Bundled Skills Directly Without Network Sync | Accepted | 2026-10-12 | - | - | Offline Agent Distribution |
| [0003](0003-canonical-and-upstream-metadata.md) | Separate Canonical Skill Identity from Upstream Provenance | Accepted | 2026-10-14 | - | - | v0.3 Metadata Contract |
| [0004](0004-maintainer-sync-boundary.md) | Keep Maintainer Synchronization Separate from Canonical Packaging | Accepted | 2026-10-14 | - | - | v0.3 Synchronization |
