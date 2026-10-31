---
name: git-workflow-standards
description: Create safe, focused local Git commits during coding tasks. Use when an agent is authorized to inspect repository state, work on a task branch, stage changes, write Conventional Commit messages, or prepare push instructions without modifying remotes.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.1
  source_repo: aigb-skills
  source_path: skills/git-workflow-standards/SKILL.md
  source_url: https://github.com/AndrewBrown-USDA/aigb-skills.git
  group: developer-tooling
  loadouts: software-delivery,git-practices,ci-maintenance
---

# Git Workflow

Make focused local commits. Keep control of branches, history, and remotes with the user. Use `conventional-commits` when drafting or reviewing the commit message; this skill owns repository-state safety, staging, commit timing, and remote boundaries.

## Rules

- Treat all pre-existing changes as user-owned.
- Work on a task branch, not the default or base branch.
- When the user or standing task instructions authorize commits, make them after logical, reviewable, revertible chunks rather than waiting for the entire task.
- Make one commit per reviewable, revertible change.
- Never push, pull, fetch, open a pull request, change a remote, or perform any other remote action unless the user explicitly instructs you to do so.
- Never discard, stash, reset, or overwrite user changes without approval.
- Do not amend, rebase, or rewrite commits unless requested.
- Follow repository instructions and commit conventions.

## Inspect repository state

Before editing and before each commit, run:

```bash
git status --short --branch
git diff
git diff --staged
```

Check the branch, detached `HEAD`, tracked and untracked files, staged changes, and changes outside the task.

A clean tree is not required. Leave unrelated changes alone.

Ask before proceeding when:

- the branch is the default or base branch;
- unrelated changes are staged;
- existing changes overlap the files or hunks you need;
- the task requires files outside its stated scope;
- you cannot protect the user's work.

Do not stash or discard changes to clean the tree.

## Branches

Use one task branch per feature. Let the user choose its name unless repository guidance sets one.

Do not switch branches if doing so could overwrite or conflict with existing work. Ask how to proceed.

## Worktrees

- Retain agent-created worktrees until their changes are merged to the main branch or the user or orchestrator explicitly releases them.
- Sequential orchestrations must detect and account for prior worktrees so unexplained accumulation is avoided.
- Record each worktree's repository path, worktree path, branch, orchestration/task identifier, creation time, and lifecycle status.
- Treat stale-worktree detection as candidate identification and reporting only; age or worker completion alone does not authorize deletion.
- Report cleanup candidates first and obtain explicit approval from the user or orchestrator before deleting any worktree.
- Protect active, dirty, detached, user-owned, overlapping, and unverified worktrees from cleanup.

## Build commits

- Keep implementation, related tests, and docs together.
- Do not split commits by phase, file type, or arbitrary step.
- Do not combine unrelated fixes.
- If a file has unrelated edits, stage only the needed hunks.

## Validate changes

Before committing:

1. Run relevant tests, linters, formatters, or builds.
2. Run `git diff --check`.
3. Stage only the intended files or hunks.
4. Review the exact staged content with `git diff --staged`.
5. Confirm that no user-owned or out-of-scope changes are staged.

Prefer explicit paths or interactive staging. Avoid `git add .` when unrelated changes exist.

Do not use `--no-verify`. If validation or a hook fails, fix an in-scope problem or stop and report it.

## Commit messages

Follow the repository's format. Use the `conventional-commits` skill to draft or review the message, then apply it here after the staged diff is validated. If the repository has no format, use Conventional Commits:

```text
type(scope): description
```

- Use a suitable type, such as `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`, `perf`, or `revert`.
- Omit a scope when it adds no value. Prefer a component, package, or subsystem when one is clear.
- Use an imperative description with no period.
- Keep the header short, preferably under 72 characters.
- Add a body when it explains rationale, constraints, or non-obvious behavior.
- Mark breaking changes using the repository's convention.

Do not put phases, waves, or task steps in commit messages.

### Examples

```text
feat(api): add rate-limiting middleware
fix(parser): handle escaped quotes in JSON strings
refactor(cli): extract option validation
docs: clarify installation steps
```

Avoid:

```text
wave-2: refactor authentication
task-3: update parser
feat(auth): add OIDC support to wave-2 refactor
add OIDC, improve logging, and fix parser edge case
```

## After committing

Run:

```bash
git status --short --branch
git show --stat --oneline --decorate HEAD
```

Report the commit hash and message, validation results, remaining changes, and any issue needing user action.

If useful, give the user a push command. Do not run it.
