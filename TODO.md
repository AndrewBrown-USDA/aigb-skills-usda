# TODO

## Goal
Add and register the `code-review-subtractive` skill in this repository and propagate its source and packaged form to `..\aigb-skills`.

## Tasks

### 1. Add the skill to the USDA package
- [x] Create `skills/code-review-subtractive/SKILL.md` with the supplied content and repository-standard metadata.
- [x] Verify the skill frontmatter satisfies the packaged skill metadata contract.

### 2. Register generated catalog data
- [x] Regenerate `catalog/skills.lock.json` from the skill frontmatter.
- [x] Verify the new skill appears exactly once with the expected source and version metadata.

### 3. Propagate to the sibling source repository
- [x] Inspect `..\aigb-skills` conventions and add the skill to its source tree using the agreed metadata.
- [x] Run the sibling repository's supported synchronization/materialization workflow to produce its packaged copy.
- [x] Verify the sibling source and packaged copies contain the new skill without unrelated changes.

## Discovered Tasks

### 6. Resolve sibling synchronization prerequisite
- [x] Resolve the sibling sync failure: its catalog references the missing git-pinned ref `v2.7.0` for `skills/caveman`, preventing the supported synchronization workflow from completing.
- [x] Rerun the sibling synchronization workflow and verify the new skill remains present.

### 7. Resolve additional sibling provenance blockers
- [x] Resolve the next sibling sync failure: the pinned `v1.2.0` source for `skills/code-review-2axis` contains no matching `skills/code-review-2axis` path in the upstream repository.
- [x] Rerun synchronization and address any further pre-existing provenance blockers exposed by the supported workflow.

### 4. Validate both repositories
- [x] Run the smallest applicable validation commands in `aigb-skills-usda`.
- [x] Run the smallest applicable validation commands in `..\aigb-skills`.
- [x] Review the final diffs and confirm only the requested skill, registration, and propagation changes are present.

### 5. Commit and revise with `dr-lexus`
- [ ] Commit the validated first draft without amending or rewriting existing commits.
- [ ] Apply the `dr-lexus` skill to the new skill draft and make only the resulting requested revision.
- [ ] Validate the revised draft and commit it as a second commit.

## Notes
- Propagation means adding the skill to the sibling source tree and then synchronizing/materializing its packaged copy.
- Use local metadata convention: `author: Andrew G. Brown (https://github.com/brownag)`, `version: 1.0`, `source_repo: aigb-skills`, and `source_path: skills/code-review-subtractive/SKILL.md`.
- Commit the first draft before applying `dr-lexus`; the revised draft must be a separate follow-up commit.
- Do not amend or rewrite existing commits.
