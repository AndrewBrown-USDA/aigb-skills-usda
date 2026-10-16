---
name: goal-alignment
description: Evaluate whether goals, outcomes, requirements, tasks, acceptance evidence, and diffs are aligned, measurable, and within scope. Use before execution or when checking a proposed change against its intended result.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0.0
  source_repo: aigb-skills
  source_path: skills/goal-alignment/SKILL.md
  source_url: https://github.com/AndrewBrown-USDA/aigb-skills.git
---

# Goal Alignment

Use this skill to check whether work serves its stated goal. It covers outcome traceability, measurable success criteria, scope limits, evidence gaps, and the final alignment verdict. Do not invent baselines, targets, decisions, or evidence.

## Traceability model

Build this chain with stable identifiers:

`Goal -> Outcome -> Key Result -> Requirement -> Task -> Acceptance evidence -> Diff`

- **Goal**: the intended change or problem, written in observable terms.
- **Outcome** (`O1`): who benefits and what changes.
- **Key Result** (`KR1`): measurable target, baseline, deadline, and evidence source.
- **Requirement** (`REQ1`): necessary behavior, constraint, or non-negotiable.
- **Task** (`TASK1`): concrete work that satisfies a requirement.
- **Acceptance evidence** (`AE1`): a test, measurement, review artifact, or user confirmation.
- **Diff** (`D1`): delivered or proposed change mapped to the task.

Mark missing values as `unknown`. Never turn assumptions into facts.

## Workflow

1. **Normalize the goal.** Keep the user's intent. State the observable outcome without adding scope.
2. **Extract outcomes and key results.** Record beneficiaries, baseline, target, deadline, owner, and evidence source. Flag missing measures.
3. **Define scope.** List in-scope work, explicit non-goals, constraints, assumptions, dependencies, and non-negotiables.
4. **Inspect evidence.** Read the relevant issue, plan, ADR, code, tests, diff, and repository rules. Separate repository facts from user decisions.
5. **Build traceability.** Map each outcome to requirements, tasks, acceptance evidence, and diffs. Map each diff back to a requirement.
6. **Detect gaps.** Report unmapped work, unsupported claims, missing evidence, conflicting requirements, unmeasurable results, and scope creep.
7. **Resolve decisions.** Ask only questions whose answers change scope, priority, requirement, target, or acceptance. State the decision and its impact.
8. **Issue the verdict.** Apply the exact rules below. If the verdict is not `ALIGNED`, give concrete remediation. Do not silently approve execution.

## Verdict behavior

Return exactly one of these labels:

- **ALIGNED** - Each in-scope requirement maps to an outcome, task, acceptance evidence, and diff, or to an explicitly proposed task. No conflicts or unexplained scope additions exist. Key results are measurable or marked not applicable. Evidence is enough for the requested decision.
- **PARTIALLY ALIGNED** - The core goal is served, but a non-blocking gap remains. Examples include incomplete traceability, missing optional evidence, an unmeasured secondary result, or a bounded scope question. Name the gap and approve only the mapped portion.
- **MISALIGNED** - Work breaks a requirement or constraint, serves a different outcome, has an unresolved conflict that affects execution, adds material out-of-scope work, or lacks evidence needed to support the claimed result. Do not approve. Require a correction or decision.

Missing evidence is never silently treated as success. Use `PARTIALLY ALIGNED` when the claim is supported but non-blocking evidence is absent. Use `MISALIGNED` when missing evidence prevents validation of a required result.

## Unresolved-decision rules

- Facts discoverable in the repository are not questions. Inspect them.
- Ask when user intent, trade-offs, ownership, target, deadline, or scope is undecided.
- Keep the item unresolved until answered. Record affected IDs and both plausible paths.
- Never choose a default that changes scope or acceptance criteria.
- If execution can safely proceed on a bounded subset, mark that subset `PARTIALLY ALIGNED`. Otherwise mark `MISALIGNED`.
- A conflict needs an explicit owner decision. Do not merge incompatible requirements by interpretation.

## Output template

```markdown
# Goal Alignment

## Goal
<normalized goal>

## Outcomes and key results
| ID | Outcome / key result | Baseline | Target / deadline | Evidence | Status |
|---|---|---|---|---|---|

## Scope
### In scope
### Out of scope
### Constraints and assumptions

## Traceability
| Requirement | Outcome/KR | Task | Acceptance evidence | Diff | Status |
|---|---|---|---|---|---|

## Gaps, risks, and unresolved decisions
- <item, affected IDs, required decision or remediation>

## Verdict
<ALIGNED / PARTIALLY ALIGNED / MISALIGNED>
<evidence, rationale, and next action>
```

## Examples

### Aligned

Goal: reduce API p95 latency from 400ms to 250ms by June 30. The task adds indexed query paths, a benchmark proves 230ms p95, and the diff contains only query and benchmark changes. **Verdict: `ALIGNED`.**

### Misaligned

Goal: add CSV export for admins. The diff adds a customer-facing dashboard redesign but no export endpoint or acceptance test. This breaks scope and leaves the required outcome unmapped. **Verdict: `MISALIGNED`; remove the redesign and implement and test export.**

### Ambiguous

Goal: "make onboarding better," with no user group, baseline, target, or evidence source. Ask which outcome and measure are intended. **Verdict: `MISALIGNED`** when execution is requested. Use `PARTIALLY ALIGNED` only for a clearly bounded discovery task.

### Conflicting

One requirement says "retain audit history indefinitely." Another says "delete all records after 30 days." Identify the conflict, affected requirements, owner, and decision. **Verdict: `MISALIGNED`** until reconciled.

### Scope creep

Goal: fix password-reset expiry. A proposed diff also upgrades unrelated dependencies and changes account deletion. Those changes have no traceability mapping. **Verdict: `MISALIGNED`** unless they are added to scope and re-aligned.

### Evidence missing

Goal: reduce build time by 20%. The change appears correct, but no before/after measurements exist. **Verdict: `PARTIALLY ALIGNED`** if measurement is a follow-up acceptance task. **`MISALIGNED`** if the 20% claim is required for release and cannot be verified.

## Boundaries and routing

- **plan-first** owns small, linear implementation planning, clarification, approval, and `TODO.md` execution. This skill supplies alignment inputs. It does not replace that workflow.
- **plan-wave** owns multi-workstream reconnaissance, dependency DAGs, waves, worker prompts, and orchestration state. This skill does not author wave artifacts.
- **reviewer-correctness** owns runtime behavior, callers, imports/exports, path resolution, and regressions. This skill checks whether those results serve the goal, not whether the code works in detail.
- **reviewer-architecture** owns module boundaries, coupling, duplication, patterns, and refactoring impact. This skill does not decide architecture quality.
- **code-review-2axis** owns fixed-point review orchestration and Standards/Spec aggregation. This skill provides alignment evidence. It does not aggregate a code review.
- **adr-distillation** owns durable architectural decisions, supersession, indexing, and ADR lifecycle. This skill records unresolved decisions but does not author or maintain ADRs.
