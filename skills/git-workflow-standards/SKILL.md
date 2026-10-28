---
name: git-workflow-standards
description: Create safe, focused local Git commits during coding tasks. Use when an agent is authorized to inspect repository state, work on a task branch, stage changes, write Conventional Commit messages, or prepare push instructions without modifying remotes.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/git-workflow-standards/SKILL.md
  source_url: https://github.com/AndrewBrown-USDA/aigb-skills.git
---

# Git Workflow

Create focused local commits while preserving user control over branches, history, and remotes.

## Core rules

- Treat all pre-existing changes as user-owned.
- Work on a dedicated task branch, not the repository's default or base branch.
- Commit only when the user or standing task instructions authorize it.
- Make one commit per independently reviewable and revertible change.
- Never push, create a pull request, or otherwise modify a remote.
- Never discard, stash, reset, or overwrite user changes without explicit approval.
- Do not amend, rebase, or rewrite existing commits unless explicitly requested.
- Follow repository-specific instructions and commit conventions when they exist.

## Inspect repository state

Before editing and before each commit, run:

```bash
git status --short --branch
git diff
git diff --staged
```

Check for:

- the current branch, including a detached `HEAD`;
- tracked and untracked changes;
- pre-existing staged changes;
- changes outside the task's scope.

A clean working tree is not required. Leave unrelated changes untouched.

Pause and ask the user before proceeding when:

- the current branch is the default or base branch;
- unrelated changes are already staged;
- existing changes overlap files or hunks needed for the task;
- the task requires files outside its stated scope;
- preserving user work is uncertain.

Do not automatically stash or discard changes to obtain a clean tree.

## Branches

Use one dedicated branch per task or feature. Let the user choose the branch name unless repository guidance defines a convention.

Do not switch branches when doing so could overwrite or conflict with existing work. Ask the user how to proceed instead.

## Build logical commits

A logical commit should be understandable, reviewable, and revertible on its own.

- Group implementation with its directly related tests and documentation.
- Do not split commits by workflow phase, file type, or arbitrary step.
- Do not combine unrelated fixes or refactors.
- If one file contains unrelated edits, stage only the relevant hunks.

## Validate changes

Before committing:

1. Run relevant tests, linters, formatters, or build checks.
2. Run `git diff --check`.
3. Stage only the intended files or hunks.
4. Review the exact staged content with `git diff --staged`.
5. Confirm that no user-owned or out-of-scope changes are staged.

Prefer explicit paths or interactive staging. Avoid blanket staging commands such as `git add .` when unrelated changes are present.

Do not bypass repository hooks with `--no-verify`. If validation or a hook fails, fix the issue when it is in scope; otherwise stop and report it.

## Commit messages

Follow the repository's established format. If none exists, use Conventional Commits:

```text
type(scope): description
```

Rules:

- Use an appropriate type, commonly `feat`, `fix`, `refactor`, `docs`,
  `test`, `chore`, `build`, `ci`, `perf`, or `revert`.
- Omit the scope when it adds no useful information.
- Prefer a component, package, or subsystem as the scope.
- Write the description in imperative mood and without a trailing period.
- Keep the complete header concise, preferably no more than 72 characters.
- Add a body when it helps explain rationale, constraints, or non-obvious
  behavior.
- Mark breaking changes according to the repository's convention.

Do not include temporary workflow labels such as phases, waves, or task steps.

### Good examples

```text
feat(api): add rate-limiting middleware
fix(parser): handle escaped quotes in JSON strings
refactor(cli): extract option validation
docs: clarify installation steps
```

### Avoid

```text
wave-2: refactor authentication
task-3: update parser
feat(auth): add OIDC support to wave-2 refactor
add OIDC, improve logging, and fix parser edge case
```

The first three depend on temporary planning context. The last combines
unrelated changes.

## After committing

Run:

```bash
git status --short --branch
git show --stat --oneline --decorate HEAD
```

Report:

- the commit hash and message;
- the validation performed and its result;
- any remaining or pre-existing changes;
- any issue that requires user action.

If useful, provide a push command for the user to review and execute. Do not execute it.
