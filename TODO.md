# TODO

## Goal
Resolve all 10 new and previously missed review comments on pull request #17, including custom catalog/source selection, generated metadata validation, loadout materialization, documentation links, and planning-state accuracy.

## Tasks

### 1. Correct custom catalog and source selection
- [x] Pass the parsed `--lockfile` path through CLI installation into catalog loading.
- [x] Resolve selected skills and loadout membership from the selected `--source` tree rather than the packaged default tree.
- [x] Add regression tests proving custom lockfiles and custom source directories affect installation and do not fall back to repository defaults.

### 2. Validate generated metadata ownership
- [x] Validate normalized metadata before emitting each generated catalog record and fail catalog generation with actionable errors.
- [x] Compare every generated metadata field against frontmatter-derived expectations, including group, singular/plural loadouts, required dependencies, optional dependencies, and provenance/version fields.
- [x] Add regression tests for invalid generated metadata and field-level frontmatter/catalog mismatches.

### 3. Complete loadout metadata materialization
- [x] Add the documented loadout memberships and dependency metadata to the appropriate packaged skill frontmatter.
- [x] Regenerate `catalog/skills.lock.json` from authoritative frontmatter.
- [x] Ensure measurement member selection includes plural `loadouts` entries and add focused coverage.

### 4. Remove duplicate validation and clarify resolution semantics
- [x] Refactor loadout validation so each metadata field is validated once without duplicate diagnostics.
- [x] Document that missing required dependency nodes are errors while selected missing optional nodes remain warnings/omissions.

### 5. Repair documentation and planning references
- [x] Update ADR links after renamed or removed decision files.
- [x] Mark completed `STATE_13` tasks as checked.
- [x] Update affected documentation and tests to reflect the materialized loadout contract.

### 6. Verify all review-comment fixes
- [x] Run focused installer, catalog, resolver, measurement, and validator tests.
- [x] Run packaged validation and inspect the final diff against all 10 review comments.
- [x] Confirm the worktree and generated catalog are consistent with the approved frontmatter.

## Notes
- Scope includes all 10 comments listed in the latest review: 6 open issues and 4 previously missed issues.
- The documented loadout gap will be resolved by materializing metadata in packaged skill frontmatter and regenerating the catalog.
- Preserve existing CLI compatibility, generated-file ownership, and prior commits; do not rewrite history.
