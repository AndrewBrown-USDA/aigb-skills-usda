---
name: magic-wand
description: Finds and ranks candidate goals with the 24-hour Magic Wand dependency heuristic, records their dependency graph in planning/GOALS.md, and hands the highest-leverage goal to plan-wave or wave-orchestration.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/magic-wand/SKILL.md
  source_url: https://github.com/AndrewBrown-USDA/aigb-skills.git
---

# Magic Wand

Turn loose ideas, workspace audits, or discovered candidates into a dependency-ordered goal graph.

Find the bottleneck goal: the goal that would unblock, speed up, or remove the most downstream goals if completed within 24 hours.

## Companion skills

- **goal-alignment** (`../../goal-alignment/SKILL.md`) clarifies intent, trade-offs, and evaluation weights in Phase 1.
- **plan-wave** (`../../plan-wave/SKILL.md`) and **wave-orchestration** (`../../wave-orchestration/SKILL.md`) act on the selected goal. Magic Wand selects and bounds the next work. Plan-wave writes the execution plan. Wave-orchestration runs it.

Stop once the target state, scope boundary, and first action are clear.

## Phase 0: Scope gate

Do not scan the whole workspace without confirming scope.

1. Check whether the user supplied candidate goals, target paths, or references to `planning/GOALS.md` or `planning/STATE_N.md`.
2. If scope is missing, ask the user for candidate goals or target paths, the planning reports to inspect, or confirmation of a full workspace audit.

## Phase 1: Candidate extraction

Extract about 10 candidates by default. Use 5 to 25 when the scope requires it.

Rewrite each candidate as a declarative, verifiable, present-tense end state. For example, replace “fix slow raster reclassification” with “raster reclassification runs without intermediate heap allocations and passes benchmark X in 50 ms or less.”

Present the normalized candidates to the user. Confirm that they match the intended outcomes and ask for any custom criteria to weigh with the default heuristic.

## Phase 2: Viability and control

Filter candidates before ranking:

- Keep goals that are controllable and feasible within current constraints.
- Refactor goals that depend on external parties into controllable internal work, or mark them **Blocked / External Watch**.
- Mark non-viable or out-of-scope goals **Pruned** with a one-line reason.

## Phase 3: Dependency pass

For each surviving goal, ask:

> If this goal were complete within 24 hours, which other goals would become trivial, unblocked, or unnecessary?

Record directed dependencies such as `G1 -> [G3, G5]`. Rank candidates by:

1. Unblocking leverage and downstream criticality.
2. System-wide value relative to local cleanup.
3. Cost of delay and reversibility.
4. Ability to take a concrete first step now.
5. Custom criteria agreed with the user.

## Phase 4: Update `planning/GOALS.md`

Partition evaluated goals into these sections:

1. **Circled Goal (Active Focus)**: one highest-leverage root goal, or strictly orthogonal goals when the user requests parallel work.
2. **Sequenced Goals (Dependency DAG)**: viable goals ordered topologically, each noting `Depends on: Gx`.
3. **Independent Backlog**: viable goals with low unblocking leverage.
4. **Deferred**: valid goals with an explicit trigger for reconsideration.
5. **Blocked / Pruned**: external dependencies and rejected goals with reasons.

## Phase 5: Handoff

For the Circled Goal, provide:

1. Target state.
2. Exit criteria and verification.
3. Files and components in scope.
4. Critical-path checklist.
5. First immediate action.

Ask whether to write or update `planning/GOALS.md` and hand the Circled Goal to plan-wave, or start the next execution plan.

## `planning/GOALS.md` format

```markdown
# Project Goals (`planning/GOALS.md`)
Last Updated: YYYY-MM-DD
Source State: STATE_N.md (if applicable)

## Circled Goal (Active)
- **[G1]** <present-tense goal>
  - Why now: <unblocking leverage>
  - Exit criteria: <observable evidence>
  - First action: <single concrete action>

## Sequenced Goals (Dependency DAG)
- **[G2]** <goal>
  - Depends on: G1

## Independent Backlog
- **[G3]** <goal>

## Deferred
- **[G4]** <goal>
  - Trigger: <condition for reconsideration>

## Blocked / Pruned
- **[G5]** <goal>
  - Status: Blocked / Pruned
  - Reason: <one-line rationale>
```
