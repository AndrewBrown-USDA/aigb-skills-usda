# AGENTS.md - aigb-skills-usda

## Quick Start
- `git status --short --branch`
- `node -e "require('./package.json')"`
- `npm install` (or `make install`)
- `npm run validate:skills`
- `npm run test:validate`
- `npm test` (or `make test`) for the maintainer smoke path
- `npx skills --help`
- `npx skills install --target ~/.agents/skills` (or `make install-skills`)

## Find Things
- `bin/` -- executable shim for the `skills` CLI.
- `src/cli.js` -- public CLI command dispatch.
- `scripts/install.js` -- installs the packaged `skills/` tree.
- `scripts/sync-skills.js` -- maintainer-only materialization from upstream checkouts.
- `scripts/validate-skills.js` -- packaged-skill structural and selected behavioral validator.
- `scripts/validate-skills-test.js` -- validator regression tests.
- `scripts/smoke.js` -- broader maintainer smoke suite.
- `skills/` -- curated, materialized skill folders; source of truth for users and CI.
- `catalog/skills.lock.json` -- generated/indexed catalog data for curated ordering and maintainer synchronization.
- `.github/workflows/ci.yml` -- Node matrix CI for packaged validation.
- `planning/` -- execution plans, wave states, task tracking, and prompt templates.

## Workflows
### Installing Skills (Users & Agents)
- **Primary off-ramp**: Pre-materialized skills live in `skills/`.
- Install packaged skills with `npx skills install --target ~/.agents/skills` (or `~/.claude/skills`, `~/.pi/agent/skills`).
- Or run `make install-skills`.
- **Do not run `skills sync` or `make sync` to install skills.** Sync is maintainer-only and rebuilds `skills/` from upstream source checkouts.

### Maintainer Sync and Catalog
- `npx skills sync --mode copy` (or `make sync`) re-materializes `skills/` from repositories indexed in `catalog/skills.lock.json`; local source checkouts are required.
- `npm run catalog:mine` (or `make catalog`) regenerates the catalog lockfile.

### Validation
- CI runs `npm ci`, CLI help, and `npm run validate:skills -- --report .scratch/skills-report.json`.
- Packaged validation never clones, syncs, or accesses upstream/private repositories.
- `npm test` and `make test` retain upstream-dependent maintainer smoke coverage and may require sibling source checkouts.
- `npm run test:validate` tests validator success, structural failure, behavioral failure, and JSON reporting.

## Infrastructure
- Node.js `>=18` is required.
- `package.json` exposes the `skills` bin through `bin/skills.js`.
- `.scratch/` holds disposable validation reports and smoke artifacts; run `make clean` to remove it.
- If package metadata changes, run `node -e "require('./package.json')"` before validation.
- `Makefile` provides install, smoke, sync, catalog, and cleanup targets.

## Working Conventions
- Keep the public package minimal, reliable, and functional.
- The `skills install` command installs pre-bundled skills directly from `./skills` without external network or sibling-repository requirements.
- The `skills sync` command is strictly for maintainers with local upstream checkouts.
- Multi-wave development and planning artifacts live under `planning/` following the `wave-orchestration` skill guidelines.
- Prefer small, verifiable changes that are easy to review and maintain.

## References
- `README.md` -- public install, CI, and maintainer-sync guidance.
- `skills/*/SKILL.md` frontmatter -- authoritative source for skill identity, source/provenance, version/ref, and related metadata.
- `catalog/skills.lock.json` -- generated/indexed data for curated ordering and maintainer synchronization.
- `planning/` -- orchestration state, task DAGs, execution plans, and prompt templates.
- Reference repo: `https://github.com/AndrewBrown-USDA/aigb-skills.git` (private maintainer repository).
