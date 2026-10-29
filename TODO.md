# TODO

## Goal
Clarify the integration between `git-workflow-standards` and `conventional-commits` so agents may make focused local commits while never pushing or performing remote Git actions without explicit instruction.

## Tasks

### 1. Update Git workflow guidance
- [x] Revise `skills/git-workflow-standards/SKILL.md` to explicitly authorize local commits after logical, reviewable chunks when task instructions permit.
- [x] State clearly that push, pull, fetch, remote changes, pull requests, and other remote actions require explicit user instruction.
- [x] Add a direct cross-reference to `conventional-commits` for message drafting and validation, while keeping local commit safety and staging guidance in `git-workflow-standards`.

### 2. Update Conventional Commits integration
- [x] Add guidance in `skills/conventional-commits/SKILL.md` describing its complementary role with `git-workflow-standards`.
- [x] Preserve the existing Conventional Commits syntax, taxonomy, and repository-boundary guidance.

### 3. Propagate source and packaged copies
- [x] Apply the corresponding skill changes to the sibling source repository at `..\aigb-skills`.
- [x] Run the sibling repository's supported materialization workflow and verify both source and packaged copies contain the changes.

### 4. Validate and review
- [x] Run the smallest applicable packaged-skill validation in this repository.
- [x] Run the smallest applicable validation in the sibling repository.
- [x] Review diffs to confirm only the requested integration and remote-action policy changes are included.

### 5. Commit locally
- [ ] Stage only the requested files in each repository and create focused local Conventional Commits.
- [ ] Verify post-commit status and commit summaries without pushing, fetching, changing remotes, or opening pull requests.

## Notes
- Preserve unrelated user changes in both repositories.
- Do not amend, rebase, reset, stash, discard, or rewrite existing commits.
- `skills/*/SKILL.md` frontmatter remains authoritative; regenerate derived catalog data only if the workflow requires it.
- The sibling repository propagation is in scope, but no remote action is authorized.

## Discovered Tasks

### 6. Restore unintended local materialization changes
- [x] Restore the broad packaged-skill changes caused by running the sibling materialization command from this checkout, preserving the requested two skill edits and `TODO.md`.
- [x] Re-run materialization from `..\aigb-skills` with the correct working directory and verify only the requested sibling/package changes remain.
