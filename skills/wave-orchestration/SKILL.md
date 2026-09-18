---
name: wave-orchestration
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Decomposes a large implementation plan into small-model-sized tasks executed by supervised worker agents (e.g. Haiku) in dependency-ordered parallel waves, with a plan-first approval gate inside every task, file-based state for context compaction, and a hard escalation ladder. Use when a master plan or multi-workstream feature is too large for one session and should be executed cheaply by many small agents under frontier-model supervision.
version: 1.0
---

# Wave Orchestration (plan-gated, small-model workers)

An architecture for executing a large, multi-workstream plan as a pipeline of
small, cheap worker agents supervised by one frontier-model orchestrator. Three
ideas do all the work:

1. **Waves over a task DAG** -- tasks grouped into coherent work clusters; tasks
   within a wave touch disjoint files and can run in parallel; waves are sequential
   and depend on prior waves. Every orchestration (planning-file set) can contain
   multiple waves.
2. **Plan-first inside every task** -- a worker may not write code until its
   micro-plan is approved. The approval gate is the *orchestrator*, not the
   human, so the loop stays autonomous.
3. **State on disk, not in context** -- a `STATE.md` file is the single resume
   point. Worker context never enters the orchestrator; the orchestrator's own
   context is disposable after every wave (compact or clear freely).

## Key terms

- **Orchestration**: one planning-file set (EXECUTION_PLAN_N, PROMPT_TEMPLATE_N, STATE_N). Each orchestration has a unique number; wave numbers reset to 1 for each new orchestration.
- **Wave**: a logical work cluster of tasks sequenced together. All tasks in a wave touch disjoint files and run in parallel.
- **Task**: a single coherent change unit, <=12 micro-plan steps, executed by one worker. File format: `tasks/N.W.id.todo.md` (e.g., `tasks/5.2.3.todo.md` = Orchestration 5, Wave 2, Task 3).

## Roles

| Role | Model | Responsibilities | Never does |
| --- | --- | --- | --- |
| Orchestrator | frontier (one session) | decompose plan into waves, spawn workers, gate plans, verify diffs/tests, commit, maintain STATE_N.md | write feature code |
| Worker | small/cheap (one per task) | read scoped context, produce micro-TODO, stop, execute after approval, run targeted tests, report | pick its own scope, run shared/global test suites, work off-plan |

## Artifacts (all under `planning/` in the target repo)

Each orchestration (planning-file set) is numbered. Use the next available number:

- **`EXECUTION_PLAN_N.md`** -- the task DAG: wave table + one spec per task (N = orchestration number).
- **`PROMPT_TEMPLATE_N.md`** -- the fill-in-the-slots worker prompt (below).
- **`STATE_N.md`** -- baseline record, wave board, and appended worker reports.
- **`tasks/N.W.id.todo.md`** -- each worker's approved micro-TODO; N = orchestration number, W = wave number within that orchestration, id = task ID (e.g., `tasks/5.2.3.todo.md` for Orchestration 5, Wave 2, Task 3).

Example: Orchestration 5 has EXECUTION_PLAN_5.md, PROMPT_TEMPLATE_5.md, STATE_5.md with tasks named `5.1.1.todo.md`, `5.1.2.todo.md`, `5.2.1.todo.md`, etc. When Orchestration 6 starts, it has EXECUTION_PLAN_6.md, STATE_6.md, and tasks `6.1.1.todo.md`, `6.1.2.todo.md`, etc.

A fresh orchestrator session resumes from the highest-numbered `EXECUTION_PLAN_N.md` in `planning/`. That is the contract that makes compaction safe. To start a new orchestration, create the next numeric set; do not reuse or overwrite prior orchestrations.

## [Orchestrator] Decomposition

Break the master plan into tasks sized for a small model. A task is right-sized
when all of these hold:

- One coherent change cluster; a micro-plan for it fits in <=12 checkbox steps.
- **Files in scope** is an explicit list: *must edit* (existing files the task
  changes), *can create* (output files, build dirs). Temp/scratch goes in an
  untracked folder per repo conventions (e.g., `.development/`); everything else
  is off-limits.
- Acceptance criteria are mechanically checkable (named test file + command).
- Large files are entered via **grep anchors** (symbol names, approximate line
  numbers), never "read the whole file" -- multi-thousand-line files are where
  small models drown.
- Reference implementations are named explicitly ("port the pattern in X").

Each task spec records: id, repo, files in scope (with temp folder location), 
depends-on, spec prose, anchors, acceptance + targeted test command.

### Building the wave table

Cluster tasks by **logical work phase**, not just parallelism. Tasks in a wave
are sequenced together and run in parallel (file scopes are disjoint):

- Group by feature tier: "API layer", "migrations", "frontend UI" as separate
  waves, even if they could run in parallel.
- Keep tightly coupled work (schema, backfill, validation) in one wave; testing
  is clearer when phases advance together.
- Same-file tasks: sequence them, never parallelize (UI shells collide in same
  files; backend and frontend rarely do).
- **Monolithic waves risk**: >8 tasks -> split into 2-3 waves by theme. A 10-task
  wave hides dependencies and complicates review.

Record the green baseline (all suites, all repos) in STATE_N.md **before wave 1**;
"no regressions" is meaningless without it.

## [Orchestrator] Templating

Every worker gets the same skeleton with slots filled from its task spec:

```markdown
You are implementing exactly one scoped task, supervised by an orchestrator
that reviews your plan before you may write code.

## Task {{id}}: {{title}}
{{task spec verbatim}}

## Ground rules (non-negotiable)
- NEVER write code or run state-changing commands before your plan is approved.
- NEVER touch files outside "Files in scope"; if required, STOP and report.
- NEVER go off-plan; discovered work goes in "## Discovered" and waits.
- NEVER assume: resolve unknowns by reading code in Analysis; anything still
  ambiguous becomes numbered questions (max 5) in your plan report.
- If a test fails twice for the same reason, stop and report -- do not thrash.

## [Worker] Analysis
Read: project conventions file; the named plan section(s); STATE_N.md reports of
your dependency tasks; the grep anchors; the named reference implementation.

## [Worker] Micro-planning
Write planning/tasks/{{id}}.todo.md:
  # {{id}} -- {{title}}
  ## Goal        <one sentence>
  ## TODO items  - [ ] small, verifiable steps incl. explicit test steps
  ## Notes       <facts discovered in Analysis, constraints honored, risks>
  ## Questions   <numbered, max 5, omit if none>
Output the file contents as your report and END YOUR TURN.

## [Worker] Execution
Work the TODO strictly in order, flipping - [ ] to - [x]. Match surrounding
code style. Run only the targeted tests named in the spec.

## [Worker] Reporting
Append to planning/STATE_N.md under ## {{id}} (<=15 lines): status; files
changed with line ranges; exact test commands + pass/fail counts; deviations
from the approved plan (or "none"); gotchas for dependent tasks.
```

Spawn with the cheapest capable model; use worktree isolation when a wave has
more than one task in the same repo.

## [Orchestrator] Wave execution

Read the current orchestration's STATE_N.md. Repeat until the wave board is all `done`:

1. Read `STATE_N.md`; pick the next wave whose dependencies are all done.
2. Spawn one worker per task in the wave (parallel).
3. **Plan review** -- inspect the micro-TODO for: in-scope files only, acceptance
   criteria mapped, <=12 steps, no re-work vs. dependencies (check STATE_N.md),
   spot-check code claims. Approve or request revisions.
4. **Unblock worker** -- use SendMessage or equivalent to send `APPROVED -- execute the plan as written. [Answers to any questions from their plan.]` to the agent. This message is mandatory and unblocks Phase 3 execution; the worker reads it as the execution trigger.
5. **Inform user** -- tell the user you've sent the approval and what the agent will do next (reference the task id and goal).
6. **Verify** -- inspect diff, re-run targeted tests. At wave end, run full suites
   serially (shared resources flake under concurrency).
7. **Commit** -- pass: merge worktree, one commit per task (conventional format,
   no orchestration/wave in message), distill report into STATE_N.md (<=15 lines),
   mark done. Fail: escalation ladder.
8. **Wave done** -- update wave board in STATE_N.md, then `/compact` or `/clear` orchestrator.

## Escalation ladder (hard limits -- small models must not loop)

1. Micro-plan off-spec twice => orchestrator writes the micro-TODO itself and
   hands it to the worker as fixed input.
2. Acceptance fails after one retry (retry = failure output fed back with
   `FAILED VERIFICATION: ...`) => stop the worker; re-run the task on a
   mid-tier model. Never a third small-model attempt.
3. Worker doesn't produce completion report or produces malformed report => 
   send feedback describing what is missing or incorrect (e.g., "report did not
   include file changes" or "test output truncated"); allow one retry. If the
   worker still fails to produce a valid completion report, stop and re-run the
   task on a mid-tier model.
4. Worker needs out-of-scope edits => that is a decomposition bug: re-scope the
   task spec in EXECUTION_PLAN.md; don't widen the worker's permissions ad hoc.

## Why each piece exists

- **Orchestration numbering**: preserves history, prevents overwrites, signals orchestration boundaries.
- **Worker approval loop**: worker stops after Micro-planning so orchestrator
  catches plan errors before code exists. Approval message sent via SendMessage or
  equivalent is the only Execution trigger; narration to the user is separate from this action.
- **Plan gate**: catches wrong-file, wrong-schema, over-scoped work before code.
- **Wave clustering by phase**: forces logical grouping; monolithic waves hide
  dependencies.
- **Targeted tests only**: full suites are slow and flaky under concurrency;
  orchestrator owns pass/fail.
- **<=15-line reports**: forces distillation; keeps resume file readable.
- **One commit per task**: bisectable history; failed tasks revert cleanly.
- **Escalation caps**: converts silent thrash into visible, priced decisions.
