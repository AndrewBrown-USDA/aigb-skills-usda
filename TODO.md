# TODO

## Goal
Resolve all nine unresolved review comments on pull request #17, including generated catalog metadata, loadout/dependency resolution, measurement artifacts, schema validation, multi-loadout support, and regression-test coverage.

## Tasks

### 1. Propagate metadata into generated catalogs
- [x] Update the metadata scanner and catalog builder to preserve normalized `group`, multi-value `loadouts`, `dependencies`, and `optional_dependencies` fields.
- [x] Regenerate `catalog/skills.lock.json` from authoritative skill frontmatter and verify the generated entries contain the new fields.

### 2. Complete loadout and dependency resolution
- [x] Extend frontmatter parsing and validation to accept the documented multi-loadout representation, including comma-separated values where specified.
- [x] Update catalog loading to reject unsupported `schema_version` values while retaining compatibility for fixtures without a schema version.
- [x] Update `installResolved` to accept documented `targetDir` and retain the CLI-compatible `target` alias.
- [x] Ensure force resolution expands `loadout:<name>` roots so excluded direct members follow the documented force behavior.
- [x] Add or update focused resolver and installer tests for multi-loadout expansion, dependencies, optional dependencies, schema rejection, target aliases, and forced exclusions.

### 3. Correct loadout measurement outputs
- [x] Add `baseline_bytes`, `target_bytes`, `absolute_reduction_bytes`, and `reduction_ratio` to generated measurement aggregates.
- [x] Generate the required Markdown measurement summary linking the manifest, raw samples, calculation procedure, command, environment, and source commit.
- [x] Add or update measurement tests to verify the complete artifact contract.

### 4. Repair generated-ownership regression coverage
- [x] Rebuild the test fixture after simulating a hand-edited catalog value and assert regeneration restores the frontmatter-derived output.

### 5. Verify the complete change
- [x] Run the focused validation and regression test suites for metadata, installation, loadouts, and measurements.
- [x] Run the repository validation command and inspect the final diff for all nine review comments.

## Notes
- Scope includes all nine unresolved review comments from AndrewBrown-USDA/aigb-skills-usda#17.
- Multi-loadout support is intentional per user decision; update the implementation and related design documentation consistently.
- Preserve existing CLI compatibility and do not rewrite or amend existing commits.
