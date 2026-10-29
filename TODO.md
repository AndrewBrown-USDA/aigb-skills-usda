# TODO

## Goal
Add issue #14 `complexity-map` as a packaged skill, record Ryon Morrison as the idea source without claiming authorship, sync it to `aigb-skills` in two commits, and revise it with `dr-lexus` between syncs.

## Tasks

### 1. Add the packaged skill
- [x] Create `skills\complexity-map\SKILL.md` from issue #14 with repository-compatible frontmatter and content.
- [x] Add `inspired_by: Ryon Morrison (idea shared with GitHub Copilot CoP)` to the supported metadata contract, validator, catalog generation, and documentation if needed.
- [x] Regenerate `catalog\skills.lock.json`.
- [x] Run focused packaged-skill validation and inspect the diff.
- [x] Commit the initial skill and required metadata/catalog changes in `aigb-skills-usda`.

### 2. Propagate the initial skill upstream
- [ ] Apply `skills\complexity-map\SKILL.md` to `D:\workspace\aigb-skills\skills\complexity-map\SKILL.md`.
- [ ] Validate the upstream source and commit the initial skill addition in `D:\workspace\aigb-skills`.

### 3. Review and revise with dr-lexus
- [x] Review `skills\complexity-map\SKILL.md` with `dr-lexus`.
- [x] Apply only necessary review-driven revisions and regenerate directly dependent catalog data.
- [x] Re-run focused validation and inspect the review diff.

### 4. Propagate the reviewed skill upstream
- [x] Apply the reviewed skill to `D:\workspace\aigb-skills\skills\complexity-map\SKILL.md`.
- [x] Validate that the upstream and packaged copies match.
- [x] Commit the reviewed update in `D:\workspace\aigb-skills`.

### 5. Final verification
- [x] Verify post-commit status in both repositories.
- [x] Confirm no remote actions were performed and report the resulting commits.

## Notes
- Issue source: `AndrewBrown-USDA/aigb-skills-usda#14`.
- The upstream skill path is `D:\workspace\aigb-skills\skills\complexity-map\SKILL.md`.
- `inspired_by` records idea provenance; `author` remains the skill author.
- Preserve unrelated user changes. Do not amend, rebase, reset, stash, discard, or rewrite existing commits.
- No push, fetch, pull, remote modification, or pull request is authorized.
