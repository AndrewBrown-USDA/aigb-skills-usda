# TODO

## Goal
Group the skill-loadout design documents under `docs/design/skill-loadouts/` and update repository references without rewriting existing commits.

## Tasks

### 1. Move design documents
- [x] Create `docs/design/skill-loadouts/`.
- [x] Move the five skill-loadout design documents into the folder.

### 2. Update references
- [x] Update `planning/EXECUTION_PLAN_12.md` file-scope paths.
- [x] Update `planning/STATE_12.md` task reports and design-document references.
- [x] Update any remaining repository references to the old paths.

### 3. Verify and commit
- [x] Confirm no old-path references remain.
- [x] Run `git diff --check`.
- [x] Commit the changes as a new corrective commit, preserving prior commits.

## Notes
- Do not rewrite or amend existing commits.
- This is documentation and planning metadata only; no runtime code changes are expected.
