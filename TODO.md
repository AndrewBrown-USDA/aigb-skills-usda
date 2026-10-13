# TODO

## Goal
Make `skills sync` automatically clone missing upstream source repositories into sibling directories, while allowing maintainers to disable cloning with a flag.

## Tasks

### 1. Add sync CLI option
- [x] Add `--no-clone` to `scripts/sync-skills.js` help text and argument parsing.
- [x] Default sync behavior to auto-clone missing repositories.
- [x] Thread the option through CLI dispatch if `bin/skills.js` forwards sync args directly.

### 2. Implement repository auto-clone
- [x] When a relative `source_repo` is missing, clone into the existing sibling location convention (`../<source_repo>`).
- [x] Clone only when the lockfile entry has an `upstream` URL.
- [x] Preserve the existing clear maintainer error when cloning is disabled or no `upstream` is available.

### 3. Fetch pinned refs
- [x] For entries with `source_ref`, fetch tags/refs in the resolved source repository before extraction.
- [x] Ensure cloned repositories can resolve pinned tags like `v1.2.0` and `v2.7.0`.
- [x] Avoid destructive checkout of existing repositories unless needed for fetching refs.

### 4. Update smoke coverage
- [x] Add a smoke/test case for `--no-clone` preserving the current missing-repo error path.
- [x] Keep existing sync behavior compatible for already-present sibling checkouts.

### 5. Validate
- [x] Run `npm test`.
- [x] Run `npm run validate:skills`.

## Notes
- Auto-clone applies only to `skills sync`, not `skills install`.
- Clone target remains the sibling directory checked today: `path.resolve(REPO_ROOT, '..', source_repo)`.
- If a repository lacks `upstream`, sync must fail rather than guessing a URL.
