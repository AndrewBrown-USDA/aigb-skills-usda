---
name: git-workflow-standards
description: Create safe, focused local Git commits during coding tasks. Use when an agent is authorized to inspect repository state, work on a task branch, stage changes, write Conventional Commit messages, or prepare push instructions without modifying remotes.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.2
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
- Before Git operations, determine whether the workspace is inside a Git repository. If it is not, ask the user whether they want one initialized. Initialize only after explicit user approval and after the operation is in the approved task scope; if they decline, continue without Git or explain any task limitation.
- Work on the task's branch, not the default or base branch. Use a branch established by the user or task context; if the branch to use or create is unclear, ask the user which branch they want.
- A coding request or approved task plan authorizes focused local commits for logical, verified, reviewable, revertible chunks. Do not wait until the entire plan or orchestration is complete, and do not ask for separate approval for each such commit.
- Make one commit per reviewable, revertible change.
- Never push, pull, fetch, open a pull request, post comments, change a remote, or perform any other outward-facing or remote action unless the user explicitly instructs you to do so. Local commit authorization does not authorize these actions.
- Never discard, stash, reset, or overwrite user changes without approval.
- Do not amend, rebase, or rewrite commits unless requested.
- Follow repository instructions and commit conventions.

## Planning artifacts

- At the start of a planning workflow, ask whether that run's planning artifacts should be tracked or ignored. Do not infer the choice from the current `.gitignore`.
- If the user chooses tracking, commit planning-only changes separately using a Conventional Commit with the `docs(planning):` prefix. Do not mix planning artifacts with implementation, tests, or other code changes.
- If the user chooses not to track planning artifacts, never stage or commit them. Ensure the applicable root `TODO.md`, `planning/`, and other generated planning paths are ignored by `.gitignore` or an appropriate local exclude; add missing ignore rules when needed.

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

- the branch to use or create is unclear from the user request, task plan, and current repository context;
- the current branch is the default or base branch and no task branch has been identified;
- unrelated changes are staged;
- existing changes overlap the files or hunks you need;
- the task requires files outside its stated scope;
- you cannot protect the user's work.

Do not stash or discard changes to clean the tree.

## Branches

Use one task branch per feature. Let the user choose its name unless repository guidance sets one.

Do not switch branches if doing so could overwrite or conflict with existing work. Ask how to proceed.

## Worktrees

- Commit each worktree's in-scope implementation deliverables before integrating or releasing the worktree. Preserve the task commits during integration; do not rely on untracked worktree files to carry results.
- If planning artifacts are tracked, commit them separately with `docs(planning):` and record planning and implementation commit identifiers in the state file. If ignored, do not stage or commit them.
- Retain agent-created worktrees until their changes are merged to the main branch or the user or orchestrator explicitly releases them.
- Sequential orchestrations must detect and account for prior worktrees so unexplained accumulation is avoided.
- Record each worktree's repository path, worktree path, branch, orchestration/task identifier, creation time, and lifecycle status.
- Treat stale-worktree detection as candidate identification and reporting only; age or worker completion alone does not authorize deletion.
- Report cleanup candidates first and obtain explicit approval from the user or orchestrator before deleting any worktree.
- Protect active, dirty, detached, user-owned, overlapping, and unverified worktrees from cleanup.

## Build commits

- Keep implementation, related tests, and docs together.
- Keep planning artifacts out of implementation commits; use the planning-artifact policy above.
- Do not split implementation commits by phase, file type, or arbitrary step.
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
- For tracked planning-only changes, use the Conventional Commit prefix `docs(planning):` and keep them separate from implementation commits.

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
