# TODO

## Goal
Resolve the three open code-review findings on PR #13 without changing PR metadata or committing changes.

## Tasks

### 1. Preserve safe Makefile installation defaults
- [x] Remove the unconditional `--force` flag from the `install-skills` Makefile target.
- [x] Keep the README description consistent with the target's conflict-refusal behavior.

### 2. Harden installer path canonicalization
- [x] Resolve the nearest existing ancestor for non-existent target paths, including symlinked intermediate ancestors, before overlap checks.
- [x] Add a regression test covering an intermediate ancestor symlink that could redirect installation into the source tree.
- [x] Preserve correct handling of dangling target symlinks and existing source/target overlap checks.

### 3. Correct checkout quick-start documentation
- [x] Keep the quick-start workflow based on `npx`, and document the required package-install or package-link step so `npx` resolves this repository's CLI rather than an unrelated registry package.
- [x] Update any duplicate quick-start wording or commands that make the same incorrect assumption.

### 4. Validate the review fixes
- [x] Run the targeted installer regression tests and packaged skill validation.
- [x] Run the repository smoke suite and inspect the final diff for scope correctness.

## Notes
- Scope is limited to unresolved review comments from PR #13.
- Do not commit changes or modify GitHub PR metadata.
- Follow the repository convention that `skills/` frontmatter is authoritative and generated catalog data is not hand-edited.

## Discovered Tasks
- [x] Update the `install-skills` Make target to forward command-line arguments, so `make install-skills -- --force` explicitly enables replacement while `make install-skills` remains conflict-safe.
- [x] Update the related README wording and add or adjust smoke coverage for the Make target argument behavior.
- [x] Add a Make shorthand for installing selected skills and document its syntax.
- [x] Add `make install-skills-force` as a direct overwrite shorthand and document how it relates to `make install-skills -- --force`.
