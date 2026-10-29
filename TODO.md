# TODO

## Goal
Add the issue #16 `magic-wand` skill to this package, commit it, propagate it to `D:\workspace\aigb-skills`, review and revise it with `dr-lexus`, then propagate and commit the reviewed version.

## Tasks

### 1. Add the packaged skill
- [x] Create `skills\magic-wand\SKILL.md` from issue #16 with repository-compatible frontmatter and content.
- [x] Regenerate `catalog\skills.lock.json` from the skill frontmatter if required by the repository workflow.
- [x] Run the focused packaged-skill validation and inspect the resulting diff.
- [x] Commit the new skill and any required derived catalog change in `aigb-skills-usda`.

### 2. Propagate the initial skill upstream
- [x] Apply the new `magic-wand` skill to `D:\workspace\aigb-skills` using that repository's supported workflow.
- [x] Validate the upstream source and packaged copies.
- [x] Commit the initial `magic-wand` addition in `D:\workspace\aigb-skills`.

### 3. Review and revise with dr-lexus
- [x] Run the `dr-lexus` skill against `skills\magic-wand\SKILL.md`.
- [x] Apply only necessary review-driven revisions to the packaged skill and any directly dependent derived metadata.
- [x] Re-run focused validation and inspect the review diff.

### 4. Propagate the reviewed skill upstream
- [x] Apply the reviewed `magic-wand` skill to `D:\workspace\aigb-skills` using the supported workflow.
- [x] Validate that the upstream source and packaged copies match the reviewed version.
- [x] Commit the reviewed update in `D:\workspace\aigb-skills`.

### 5. Final verification
- [x] Verify clean or explicitly understood post-commit status in both repositories.
- [x] Confirm no remote actions were performed and summarize the resulting commits.

## Notes
- Issue source: `AndrewBrown-USDA/aigb-skills-usda#16`.
- The upstream checkout path is `D:\workspace\aigb-skills`.
- “Run dr-lexus” means review and revise `magic-wand` before the second upstream sync.
- Preserve unrelated user changes; do not amend, rebase, reset, stash, discard, or rewrite existing commits.
- No push, fetch, pull, remote modification, or pull request is authorized.
