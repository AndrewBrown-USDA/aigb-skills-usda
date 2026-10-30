# TODO

## Goal

Resolve all currently unresolved PR #18 review findings while preserving the six new skills, loadout behavior, metadata contracts, and history-miner artifact guarantees.

## Tasks

### 1. Fix loadout membership consumers

- [x] Update loadout resolution and measurement paths to match plural `loadouts` memberships while preserving legacy singular `loadout` support.
- [x] Add regression coverage proving generated catalogs resolve `loadout:software-delivery` and measurement scenarios successfully.

### 2. Harden history-miner privacy and determinism

- [x] Replace complete supported Unix and Windows local paths with `[REDACTED_PATH]` in all redaction contexts.
- [x] Recursively sanitize nested objects and arrays before emitting normalized records.
- [x] Canonically serialize nested values for fallback source hashing without dropping properties.
- [x] Sort normalized records by source identifier, timestamp, and serialized content as documented.
- [x] Add focused regression coverage for nested redaction, path variants, nested hash differences, and deterministic ordering.

### 3. Preserve complete NDJSON artifacts

- [x] Add a manifest record containing non-array artifact metadata before typed record lines in `toNdjson`.
- [x] Add regression coverage proving schema, backend, counts, redaction, completeness, errors, and metrics metadata survive NDJSON serialization.

### 4. Synchronize expanded skill metadata

- [x] Emit group, loadouts, dependency, optional-dependency, and supported legacy metadata during skill synchronization using parser-compatible scalar values.
- [x] Add or update synchronization validation coverage to ensure generated frontmatter matches catalog metadata.

### 5. Correct skill references and documentation

- [x] Fix `magic-wand` companion links to resolve sibling skills under `skills/`.
- [x] Replace the briefing skill’s direct-SQL example with the miner artifact/request workflow.
- [x] Document all supported metadata fields and all 40 curated skills in `README.md`.

### 6. Validate and commit

- [ ] Run the package metadata check, catalog generation, skill validation, validator tests, smoke tests, and focused new regressions.
- [ ] Review the final diff and create focused conventional commits without pushing.

## Notes

- PR #18 currently has 13 unresolved review findings; one count comment is already resolved but the README correction remains part of the final consistency pass.
- The packaged catalog contains 40 skills, including `usda-open-data-catalog`.
- Use `[REDACTED_PATH]` for complete local paths and prepend a manifest line in NDJSON output.
- Do not run maintainer sync or push the branch.
