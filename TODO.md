# TODO

## Goal
Review every commit on `v041` since it diverged from `v040` and identify edited packaged skills whose `metadata.version` was not bumped, with recommended patch-level version values.

## Tasks

### 1. Establish the reviewed commit range
- [x] Determine the exact `v040..v041` commit range and enumerate files changed in each commit.
- [x] Filter the changes to packaged skill files under `skills/*/SKILL.md`.

### 2. Compare skill edits with version metadata
- [x] Inspect each changed skill's version before and after the relevant commits.
- [x] Identify skills whose content changed without a corresponding version change.
- [x] Determine the existing version format for each affected skill.

### 3. Produce the findings
- [x] Report each affected skill, the relevant commits, the observed version transition, and a recommended patch-level version.
- [x] Confirm that documentation-only and generated-file changes are excluded from the skill findings.

### 4. Propagate approved version bumps
- [x] Apply the recommended version bumps to matching skill files in `..\aigb-skills`.
- [x] Verify the upstream skill files match the reviewed `v041` versions and report the resulting diff.

## Notes
- Review scope: all commits in `v040..v041`.
- Output scope: recommend version bumps, then propagate those changes to `..\aigb-skills`.
- Preserve the pre-existing unrelated modification in `bin\skills.js`.

## Discovered Tasks

### 5. Sync and commit propagated changes
- [x] Run the repository's defined sync or validation workflow for the propagated skill metadata.
- [x] Review the resulting diffs in both repositories and confirm only intended files are included.
- [x] Commit the approved changes in the appropriate repository or repositories without altering unrelated user changes.
