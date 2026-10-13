---
name: adr-distillation
description: Distills enduring architectural decisions and design rationale from wave orchestration plans or historical git changes into structured, tracked Architecture Decision Records (ADRs). Use pre-wave to resolve active architectural constraints or post-wave to record enduring decisions in docs/decisions/.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0.0
  source_repo: aigb-skills
  source_path: skills/adr-distillation/SKILL.md
---
# ADR Distillation: Formalize Living Architecture Decisions

Captures and formalizes enduring system architecture decisions into tracked,
standardized Architecture Decision Records (ADRs). Bridges the gap between
incremental, often disposable planning artifacts (`planning/`) and the
long-term repository truth recorded under `docs/decisions/`.

Inspired by Michael Nygard's ADR format, Markdown Architectural Decision
Records (MADR), and Martin Fowler's ADR guidance.

## When to Use

- **Pre-Implementation (Reconnaissance & Pre-Step)**: During `plan-wave` or
  task inception, to inspect active architectural decisions and resolve
  conflicts or explicit superseding intent before code is written.
- **Post-Implementation (Wave Completion & Post-Step)**: After a wave completes
  or milestone is reached, to extract enduring architectural choices from
  grilling logs (`EXECUTION_PLAN_N.md`), runtime deviations (`STATE_N.md`), or
  git history before context compaction or plan cleanup.
- **Repository History Mining (Scaffold-Free Mode)**: In projects without
  `planning/` scaffolds, by clustering commit histories, diffs, and PR
  discussions across milestones to construct a retroactive architectural timeline.

---

## The Heuristic Filter: Architecture vs. Transient Churn

ADRs must represent living, long-term system design rather than task checklists.
Before minting an ADR, ensure the decision satisfies **at least two** criteria:

1. **High Reversibility Cost**: Changing or undoing this choice requires
   substantial multi-module refactoring or data migration (e.g., database
   selection, framework change, CLI dispatch paradigm).
2. **Pattern-Setting**: The decision establishes a precedent or convention that
   future waves and agents must adhere to (e.g., standardizing on YAML frontmatter,
   Node >=18 engine constraints, zero-network user installation).
3. **Cross-Cutting Boundary**: Affects multiple components, public APIs,
   shared data contracts, or repository boundaries.
4. **Evaluated Trade-Offs**: Consciously accepted specific downsides to gain
   strategic benefits (e.g., increased disk usage for offline availability).

### What NOT to Record in an ADR:
- Checkbox completions from task micro-plans (`tasks/N.W.id.todo.md`).
- Targeted test run logs, failure counts, or execution times.
- Local refactoring of private helper functions or variable naming.
- Temporary worker model escalations (e.g., Haiku to Sonnet).

---

## Operational Modes

### Mode A: Planning Scaffold Mode (`planning/` Artifacts)
Used when working within `plan-wave` and `wave-orchestration`:

1. **Inputs**:
   - `planning/EXECUTION_PLAN_N.md`: Phase 1 Goal & Scope, Phase 3 Grilling Decision Log.
   - `planning/STATE_N.md`: Deviations from approved plan, gotchas, unexpected edge cases.
   - `planning/tasks/N.W.id.todo.md`: Micro-plan structural discoveries.
2. **Extraction**:
   - Extract the problem context from Phase 1.
   - Extract options considered and chosen rationale from Phase 3 dated decision lines.
   - Incorporate unexpected runtime discoveries from `STATE_N.md` wave reports.

### Mode B: Git History Mode (Scaffold-Free Mining)
Used in repositories that do not use incremental planning documents, or for
retroactive documentation:

1. **Inputs**:
   - Commit history: `git log --reverse --patch [rev-range]`
   - Dependency manifests (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`).
   - PR discussion summaries and commit message bodies.
2. **Extraction**:
   - Cluster commits by architectural pivot points (new dependencies, structural reorganizations, interface changes).
   - Mine commit message bodies for the problem context and rationale.
   - Formulate ADR drafts based on the structural diffs.

---

## Bidirectional Lifecycle: Pre-Step and Post-Step

### 1. Pre-Step: Reconnaissance & Resolution (`plan-wave`)
Before writing code or locking task DAGs:

1. **Ingest Active Decisions**: Read `docs/decisions/README.md` and inspect all
   records where `status: Accepted`.
2. **Inject Constraints**: Feed active ADR requirements directly into task specs
   as non-negotiable constraints.
3. **Resolve Divergences Upfront**: If the user's request conflicts with an
   active ADR, do not silently proceed. Grill the user:
   > *"ADR-[ID] specifies [Current Choice]. The proposed goal requires [New Choice]. Does this plan supersede ADR-[ID], or should we adapt the plan to comply with ADR-[ID]?"*
4. **Record Superseding Intent**: If the user intends to supersede, document it
   in `EXECUTION_PLAN_N.md` so the post-step knows to update the link.

### 2. Post-Step: Distillation & Living Index Update (`wave-orchestration`)
After wave execution passes verification and before compaction:

1. **Filter & Draft**: Pass wave state and diffs through the Heuristic Filter.
2. **Mint Sequential ADR**: Create `docs/decisions/NNNN-<kebab-case-title>.md`.
3. **Update Superseded Records**:
   - In the newly created ADR: set `supersedes: "[OLD-ID]"`.
   - In the prior ADR: set `status: Superseded`, `superseded_by: "[NEW-ID]"`.
4. **Update Index**: Re-render the living catalog table in `docs/decisions/README.md`.
5. **Commit**: Ensure `docs/decisions/` changes are committed to version control.

---

## ADR Document Format

Records are stored in `docs/decisions/NNNN-<slug>.md` using standard YAML frontmatter
and MADR-compatible sections:

```markdown
---
id: "0002"
title: "Package Bundled Skills Directly Without Network Sync"
status: "Accepted" # Proposed | Accepted | Deprecated | Superseded
date: 2026-10-10
authors:
  - "Andrew G. Brown"
supersedes: "0001"
superseded_by: null
source_context: "EXECUTION_PLAN_2" # Wave plan ref, PR #, or commit SHA
---

# 2. Package Bundled Skills Directly Without Network Sync

## Context and Problem Statement
Users installing skills in agent environments frequently encounter network or permission issues when attempting git-clone based syncs from upstream repositories...

## Decision Drivers
* Zero external network requirement for standard end-users.
* Fast, offline agent startup and installation.
* Clear boundary between maintainer tooling and user distribution.

## Considered Options
1. On-demand git clone during `skills install`.
2. Bundling pre-materialized skills directly in `./skills` directory.
3. Fetching npm tarballs from a remote registry.

## Decision Outcome
Chosen option: "Bundling pre-materialized skills directly in `./skills` directory", because it guarantees immediate, offline availability and eliminates runtime git dependencies.

### Consequences
* **Positive**: Reliable offline installation; simplified CI validation.
* **Negative**: Repository size increases slightly due to bundled skill assets.

## Validation & Compliance
Validated via `scripts/validate-skills.js` and `npm run test:validate`.
```

---

## Living Catalog Index (`docs/decisions/README.md`)

Maintain an at-a-glance status table representing the **current state** of system architecture:

```markdown
# Architecture Decision Records

| ID | Title | Status | Date | Supersedes | Superseded By | Context |
|---|---|---|---|---|---|---|
| [0001](0001-git-sync-skills.md) | Sync skills via git clone | Superseded | 2026-09-18 | - | [0003](0003-package-bundled-skills.md) | Scaffold |
| [0002](0002-node-minimum-version.md) | Standardize on Node >=18 runtime | Accepted | 2026-09-20 | - | - | Baseline |
| [0003](0003-package-bundled-skills.md) | Package Bundled Skills Directly | Accepted | 2026-10-10 | [0001](0001-git-sync-skills.md) | - | Wave Plan 2 |
```
