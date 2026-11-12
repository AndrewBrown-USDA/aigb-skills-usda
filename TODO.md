# TODO

## Goal
Address all three PR #23 review comments and make plan-first Git, planning-artifact tracking, and completed-plan archival behavior explicit.

## Tasks

### 1. Correct PR #23 review findings
- [x] Update the smoke-test assertion for the bumped `plan-first` version and keep the catalog version in sync.
- [x] Reorder plan-first completion bookkeeping so the final task checkbox is marked complete before its final planning commit.
- [x] Permit workers to create the required scoped micro-TODO before approval, while keeping implementation changes and other state-changing commands gated.

### 2. Define planning-artifact and repository setup policy
- [ ] In `git-workflow-standards`, ask before initializing Git when a workspace is not a repository; initialize only after explicit user approval.
- [ ] Ask whether this task's planning artifacts should be tracked or ignored. For tracked artifacts, use separate Conventional Commits with the `docs(planning):` prefix; never mix planning artifacts with code changes.
- [ ] If the user chooses not to track planning artifacts, do not stage or commit them and ensure the applicable `TODO.md` and `planning/` paths are ignored.
- [ ] Specify automatic TODO archival at completion by default: move it to `planning/TODO_YYYYMMDD-N.md`, incrementing `N` to avoid collisions. Honor an explicitly requested archive location or task/plan identifier, applicable repository instructions, and an explicit request not to archive.

### 3. Align workflow instructions and versions
- [ ] Update `plan-first`, `wave-orchestration`, and `git-workflow-standards` to apply the clarified approval, tracking, archive, and commit-separation policies.
- [ ] Bump versions to `plan-first` 1.2, `wave-orchestration` 1.3, and `git-workflow-standards` 1.3; regenerate `catalog/skills.lock.json`.

### 4. Validate and commit
- [ ] Run `npm run catalog:mine`, `npm run validate:skills`, `npm run test:validate`, and `npm test`.
- [ ] Review the final diff and confirm only the planned workflow skills, smoke assertion, generated catalog, and planning artifact changed.
- [ ] Keep planning-only and implementation/documentation changes in separate commits with the required commit prefixes.

## Notes
- PR #23 has three open review comments covering the smoke-test version assertion, stale final TODO progress at commit time, and the worker micro-TODO being written before approval.
- The working branch is `fix/git-hygiene1`; it is a Git repository.
- For this run, planning artifacts are to be tracked separately using `docs(planning):` commits. Future tasks must ask the user whether to track or ignore their planning artifacts.
- Default archival is automatic unless the user or repository instructions specify otherwise.
- Do not push or take any other remote action without explicit instruction.
