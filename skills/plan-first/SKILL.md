---
name: plan-first
description: Structured planning workflow for any coding task. Use at the start of every new feature, bug fix, refactor, or implementation request. Analyzes the project, asks up to 5 clarifying questions, creates a TODO.md, gets user approval, then executes task by task. Never writes code before a plan is approved.
license: MIT
metadata:
  group: architecture-planning
  loadouts: software-delivery,wave-delivery
  optional_dependencies: goal-alignment
  author: SoAp9035 (Reddit)
  version: 1.2
  source_repo: aigb-skills
  source_path: skills/plan-first/SKILL.md
  upstream: https://www.reddit.com/r/LocalLLaMA/s/w0G0mMp1js
---
# Plan-First Workflow

## Rules

- Read-only project and Git inspection is allowed during analysis. Do not edit implementation files, create implementation artifacts, or run state-changing commands until the `TODO.md` is approved. Creating or updating the planning `TODO.md` before approval is required and allowed.
- NEVER assume missing information. Ask instead.
- NEVER skip steps. Follow phases in order.
- NEVER go off-plan. If new work is discovered, add it to TODO.md and ask for approval before doing it.
- If the workspace is a Git repository, follow `git-workflow-standards` for repository state, branch selection, commits, and remote-action boundaries.
- User approval of the plan authorizes focused local commits for logical, verified work units; it does not authorize pushes, pull requests, comments, or other remote actions.

---

## Phase 1 -- Analyze the Project

Read the project silently before asking anything. Check:

1. Directory structure (top 2 levels)
2. `package.json`, `pubspec.yaml`, `go.mod`, `requirements.txt`, `Cargo.toml`, `pom.xml`, or equivalent
3. Existing dependencies and their versions
4. Build system and scripts (`Makefile`, `scripts/`, CI config)
5. `README.md` or `README.*`
6. Repository instructions such as `AGENTS.md` and `CONTRIBUTING.md`
7. Any existing `TODO.md`, `TASKS.md`, `.todo`, open issue files, and prior TODO archives
8. Whether the workspace is a Git repository; if so, the current branch, working-tree changes, and relevant worktrees

Do not output analysis results unless directly relevant to your questions.
Use branch information from the user request, task context, and repository state. If the branch to use or create is still unclear, ask the user during Phase 2; do not guess or switch branches in a way that risks existing work.

---

## Phase 2 -- Ask Clarifying Questions (One Round Only)

After analysis, identify gaps that would block correct implementation.

- Ask **at most 5 questions** in a single message.
- Only ask what is **critical and cannot be inferred** from the codebase.
- Number the questions.
- Do not ask about things already answerable from the project files.
- Do not split into multiple rounds -- this is your only chance to ask.
- Ask whether this run's planning artifacts should be tracked or ignored, even when `.gitignore` suggests a choice. If there is no Git repository, ask whether the user wants one initialized; follow the answer and record both decisions in `TODO.md`.

Example format:

```
Before I create the plan, I need a few things clarified:

1. Should the new endpoint require authentication?
2. Is there a preferred database (the project has both SQLite and Postgres configs)?
3. Should existing tests be updated, or only new ones added?
```

Wait for the user's response before proceeding.

---

## Phase 3 -- Create TODO.md

Using the analysis and the user's answers, write a `TODO.md` file in the project root.

### TODO.md Structure

```markdown
# TODO

## Goal
One sentence describing what will be built or fixed.

## Tasks

### 1. <Phase Name>
- [ ] <Concrete, measurable action>
- [ ] <Concrete, measurable action>

### 2. <Phase Name>
- [ ] <Concrete, measurable action>
- [ ] <Concrete, measurable action>

## Notes
Any constraints, decisions, or known risks recorded here.
```

### Requirements

- Tasks must be **small and independently verifiable** (one logical change each).
- Order tasks by **dependency** (prerequisites first).
- Each task must be checkable as done/not done.
- No vague items like "fix things" or "improve code".
- State relevant branch and worktree decisions and include verification/commit steps for logical deliverables.
- Plan approval authorizes local commits for verified logical units. It never authorizes remote actions; obtain explicit user instruction before any push, pull, fetch, pull request, comment, remote change, or other outward-facing action.
- If planning artifacts are tracked, commit the approved `TODO.md` and later planning-only progress using separate `docs(planning):` commits. If the user chooses to ignore them, do not commit them and include any required ignore-rule update in the plan.

After writing the file, show the full contents to the user and ask:

```
I've created TODO.md. Does this plan look correct?
Reply YES to start, or tell me what to change.
```

---

## Phase 4 -- Revision Loop (if needed)

If the user requests changes:

1. Ask targeted follow-up questions to resolve the disagreement.
2. Rewrite `TODO.md`.
3. Show the updated plan and ask for approval again.

Repeat until the user approves.

---

## Phase 5 -- Execute the Plan

Once approved:

1. Work through tasks **in order**, one at a time.
2. Before implementation, establish the task branch from the approved plan and current Git context, following `git-workflow-standards`. Ask the user if the intended branch remains unclear.
3. If the user chose to track planning artifacts, commit the approved plan in a separate `docs(planning):` commit before implementation. Keep planning commits separate from code commits.
4. After each verified logical, reviewable implementation unit, make a focused local commit rather than waiting until the full plan is complete.
5. After completing each task, mark it done in `TODO.md` before its final task commit:
   - Change `- [ ]` to `- [x]`
   - If the user chose to track planning artifacts, commit updated status separately using `docs(planning):` and keep it out of implementation commits. If the user chose to ignore planning artifacts, do not stage or commit them.
6. State which task you are starting before you begin it.
7. Do not start the next task until the current one is complete.
8. Do not perform any work not listed in `TODO.md`.

If you discover that an unlisted task is required:
- Stop.
- Add it to `TODO.md` under a `## Discovered Tasks` section.
- Tell the user what was found and why it is needed.
- Ask for approval before continuing.

When all tasks are marked `[x]` and validation is complete, write:

```
All tasks in TODO.md are complete.
```

Then archive `TODO.md` automatically unless the user explicitly says not to. Follow a user-specified archive directory or identifier and applicable repository instructions such as `AGENTS.md` or `CONTRIBUTING.md`. Otherwise move it to `planning/TODO_YYYYMMDD-N.md`, using the current date and the next available sequence number for that date. If planning artifacts are tracked, commit the archive move separately using `docs(planning):`; if ignored, leave it untracked and ignored. Report the archive path.
