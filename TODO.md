# TODO

## Goal
Resolve the code-review findings and restore the installer regression suite so the loadout changes are ready to merge.

## Tasks

### 1. Repair installer regression coverage
- [x] Fix the installer test fixture setup so the overlap assertion reaches the intended overlap validation.
- [x] Run `node scripts/install-loadouts-test.js` and confirm the regression suite passes.

### 2. Enforce the metadata parser contract
- [x] Reject array-valued metadata and YAML-like inline array syntax in `scripts/skill-metadata.js`.
- [x] Add focused regression cases proving dependency and loadout metadata must use supported scalar forms.
- [x] Run the metadata validator tests and confirm existing valid scalar metadata remains compatible.

### 3. Complete install help documentation
- [x] Update `scripts/install.js` help to document loadout roots, `--include`, `--exclude`, and `--lockfile` where supported.
- [x] Verify the top-level CLI help remains aligned with the install command surface.

### 4. Enforce the measurement protocol
- [x] Validate that measurement runs use exactly five serial child-process samples and reject other sample counts.
- [x] Add focused regression coverage for invalid sample counts and preserve the existing five-sample artifact checks.
- [x] Add explicit output wording that distinguishes protocol measurements from deferred real curated-loadout evidence.

### 5. Run release validation
- [x] Run the focused validator, resolver, installer, and measurement suites.
- [x] Run packaged validation, CLI help checks, and the serial maintainer smoke suite.
- [x] Inspect the final diff and confirm no unrelated files or generated artifacts changed.

## Notes
- Scope includes all four findings from the two-axis review and the installer regression failure observed during validation.
- Measurement behavior will reject any sample count other than exactly five.
- Install documentation will be updated in both the direct installer help and the public CLI help path as needed.
- Preserve existing CLI compatibility, generated-file ownership, and prior commits; do not rewrite history.
