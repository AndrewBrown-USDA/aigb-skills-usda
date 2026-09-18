---
name: plan-wave
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Develops an implementation plan ready for wave-orchestration to execute. Takes the user's goal or rough plan as input, mines the codebase for facts, grills the user one question at a time for the decisions, drafts the planning/ artifacts (task DAG, wave table, worker prompt template, state file), then reviews its own plan on two axes before seeking approval. Use when the user wants to turn a feature idea, master plan, or backlog into a wave-orchestration execution plan.
version: 1.0
---

# Plan-Wave: author the plan that wave-orchestration executes

Produces the `planning/` artifact set that the **wave-orchestration** skill
consumes: `EXECUTION_PLAN.md` (task DAG + wave table + per-task specs),
`PROMPT_TEMPLATE.md` (worker prompt), and `STATE.md` (scaffold). The output
contract -- task-spec fields, right-sizing rules, wave rules -- is defined by
wave-orchestration; read that skill first and treat it as the spec this plan
must conform to.

Division of labor with the user, borrowed from **grilling**: *facts* come from
the codebase -- look them up, never ask. *Decisions* belong to the user -- put
each one to them and wait. Nothing is executed here; this skill ends at an
approved plan.

## Phase 1 -- Intake (embed the user's input)

The user's input -- a goal sentence, a master-plan document, a TODO backlog,
scattered notes, links -- is the seed. Read every referenced document in full.
Then restate it as a structured **Goal & Scope** block that will head
EXECUTION_PLAN.md:

- Goal (one paragraph, in the user's own terms)
- In scope: workstreams named in the input
- Out of scope: things the input mentions but defers (make deferrals explicit -- 
  silent scope growth is the thing waves punish worst)
- Verbatim constraints the user stated (quote them; do not paraphrase away
  requirements)

Everything the user gave you must land somewhere: in the Goal block, in a task
spec, or in an explicit out-of-scope line. If a sentence of their input maps to
none of those, that's a gap to raise in Phase 3.

## Phase 2 -- Codebase reconnaissance (facts, not questions)

Before asking the user anything, establish from the repo(s):

- Entry-point files and their sizes (`wc -l`) -- oversized files dictate the
  grep-anchor rule and often the parallelization boundaries
- Test infrastructure: commands, suites, how e2e servers bind (shared ports and
  resources decide whether suites can ever run concurrently)
- Conventions files (AGENTS.md, CONTRIBUTING, existing plan docs) and any prior
  TODO/state files recording what already shipped
- The current green baseline per suite (run them if cheap; otherwise note as a
  pre-wave-1 step)
- Existing code that new work should pattern-match (candidate "reference
  implementations" for task specs)
- For multi-repo plans: each repo's location, build/test commands, and which
  tasks cross the boundary

Record findings as a short recon log -- they become anchors, acceptance
commands, and hazard warnings in the task specs.

## Phase 3 -- Grill the user (decisions, one at a time)

Interview per the **grilling** skill's method: one question per message, a
recommended answer with each, walk the design tree resolving dependent
decisions in order. Do not batch questions; do not proceed to drafting until
the tree is walked. Typical decision branches for a wave plan:

1. Priority and ordering between workstreams when the DAG allows either
2. Scope calls the input left open (which panels/endpoints/platforms count?)
3. Technology choices with no codebase precedent (storage format, new deps)
4. Parallelism appetite: max concurrent workers, worktree tolerance, whether
   cross-repo work may interleave
5. Worker/escalation models and budget (which small model, escalate to what)
6. Acceptance bar: which suites must be green per wave, what's deferred to
   manual/device testing
7. Anything from Phase 1 that mapped to no task and no deferral

Record each answer as a dated decision line -- these go in EXECUTION_PLAN.md so
workers and future orchestrators inherit the *why*, not just the *what*.

## Phase 4 -- Draft the artifacts

Write, in the target repo's `planning/` directory, conforming to
wave-orchestration's contract:

1. **EXECUTION_PLAN.md** -- Goal & Scope block (Phase 1), decision log
   (Phase 3), wave/dependency table, hazard notes from recon, and one spec per
   task with the required fields: id, repo, files-in-scope, depends-on, spec
   prose, constraints ("do not touch"), grep anchors, acceptance + targeted
   test command. Apply the right-sizing rules (<=12-step micro-plan, explicit
   scope, anchors not whole-file reads, named reference implementations,
   pairwise-disjoint files within a wave).
2. **PROMPT_TEMPLATE.md** -- instantiate wave-orchestration's worker skeleton
   with this repo's conventions files, test commands, and gate messages. Include
   pointer to [[git-workflow-standards]](../../git-workflow-standards/SKILL.md)
   for commit discipline (conventional format, one sentence, no phase/wave numbers).
3. **STATE.md** -- baseline checklist (from recon), wave board with every task
   `pending`, empty task-reports section.

## Phase 5 -- Review the plan (code-review-2axis, applied to a plan)

Before showing the user, review the draft along two axes, in the spirit of the
**code-review-2axis** skill -- as two independent passes (parallel sub-agents when
available, so neither pass anchors on the other):

- **Spec axis** -- does the plan faithfully cover the input? Every requirement
  from Phase 1 traces to a task or an explicit deferral; every Phase 3 decision
  is honored; no task invents work the user never asked for.
- **Standards axis** -- does every task conform to wave-orchestration's rules?
  Right-sized; files-in-scope honest (grep for hidden coupling -- two tasks
  "in different files" that both edit a shared registry are one task or two
  waves); acceptance mechanically checkable; wave table's disjointness claims
  true; escalation and serial-suite rules present.

Fix findings, then re-check anything structural (a task split in review can
change the wave table).

## Phase 6 -- User approval loop

Present: the wave table, a one-line-per-task summary, the decision log, and
anything the review flagged as judgment calls. Then ask for approval -- plainly,
e.g. "Does this plan look right? Reply yes to finalize, or tell me what to
change." Revise and re-present until approved. Do not start execution: the
handoff on approval is a single closing pointer -- 

> Plan approved and written to `planning/`. To execute, invoke
> **wave-orchestration** (say "run wave 1") in this or any fresh session.
