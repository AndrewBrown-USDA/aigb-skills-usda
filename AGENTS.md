# AGENTS.md - aigb-skills-usda

This repository packages a curated set of agent skills and a dependency-free Node.js CLI for installing them. The checked-in `skills/` tree is the user-facing package; maintainer synchronization is a separate workflow.

## Quick Start
- `git status --short --branch`
- `node -e "require('./package.json')"`
- `npm install` (or `make install`)
- `npm run help`
- `npm run validate:skills`
- `npm run test:validate`
- `npm test` (or `make test`) for the maintainer smoke path
- `npm link` then `npx --no-install skills --help`
- `npx --no-install skills install --target ~/.agents/skills` (or `make install-skills`)
- `make install-skills SKILLS=plan-first,dr-lexus`
- `make install-skill SKILL=plan-first`
- `make install-skills-force SKILLS=plan-first,dr-lexus`

## Find Things
- `bin/` -- executable shim for the `skills` CLI.
- `src/cli.js` -- public CLI command dispatch.
- `package.json` -- package metadata, CLI entry point, and npm scripts.
- `Makefile` -- install, test, sync, catalog, and cleanup targets.
- `scripts/install.js` -- installs the packaged `skills/` tree.
- `scripts/sync-skills.js` -- maintainer-only materialization from upstream checkouts.
- `scripts/mine-history.js` -- regenerates the catalog from skill frontmatter.
- `scripts/validate-skills.js` -- packaged-skill structural and selected behavioral validator.
- `scripts/validate-skills-test.js` -- validator regression tests.
- `scripts/smoke.js` -- broader maintainer smoke suite.
- `skills/` -- curated, materialized skill folders; source of truth for users and CI.
- `catalog/skills.lock.json` -- generated compatibility/index data for curated ordering and maintainer synchronization, derived from skill frontmatter.
- `.github/workflows/ci.yml` -- Node matrix CI for packaged validation.
- `planning/` -- execution plans, wave states, task tracking, and prompt templates.

## Workflows
### Installing Skills (Users & Agents)
- **Primary off-ramp**: Pre-materialized skills live in `skills/`.
- From a checkout, run `npm link`, then use `npx --no-install skills install --target ~/.agents/skills`.
- Or run `make install-skills`; use `SKILLS=name1,name2` for selected skills, `make install-skill SKILL=name` for one skill, and `make install-skills-force` only when replacement is intentional.
- **Do not run `skills sync` or `make sync` to install skills.** Sync is maintainer-only and rebuilds `skills/` from upstream source checkouts.

### Maintainer Sync and Catalog
- `skills/*/SKILL.md` frontmatter is authoritative. It requires top-level `name` and `description`; supported standard optional fields remain top-level. Repository-specific metadata is nested under `metadata`: `source_repo`, `source_path`, and `source_url` identify the canonical bundled source; `upstream_repo`, `upstream_ref`, and optional `upstream_name` preserve provenance; optional `inspired_by` is a non-empty scalar that credits the source of an idea, does not confer authorship, and never replaces `author`. Legacy `source_ref` and `upstream` are read-only fallbacks for `upstream_ref` and `upstream_repo`.
- `npx --no-install skills sync --mode copy` (or `make sync`) re-materializes `skills/` from repositories indexed in `catalog/skills.lock.json`; it is local-only by default and requires local source checkouts. Use `--allow-network` for explicit clone/fetch recovery; `--no-clone` remains a compatibility alias.
- `npm run catalog:mine` (or `make catalog`) regenerates the catalog lockfile.

### Validation
- CI runs `npm ci`, CLI help, and `npm run validate:skills -- --report .scratch/skills-report.json`.
- Packaged validation never clones, syncs, or accesses upstream/private repositories.
- `npm test` and `make test` retain upstream-dependent maintainer smoke coverage and may require sibling source checkouts.
- `npm run test:validate` tests validator success, structural failure, behavioral failure, and JSON reporting.
- There is no separate build or lint script; use the package validation and smoke commands above.

## Infrastructure
- Node.js `>=18` is required.
- `package.json` exposes the `skills` bin through `bin/skills.js`.
- `.scratch/` holds disposable validation reports and smoke artifacts; run `make clean` to remove it.
- If package metadata changes, run `node -e "require('./package.json')"` before validation.
- `Makefile` provides install, selected-skill install, force-install, smoke, sync, catalog, and cleanup targets.

## Working Conventions
- Keep the public package minimal, reliable, and functional.
- The `skills install` command installs pre-bundled skills directly from `./skills` without external network or sibling-repository requirements.
- The `skills sync` command is strictly for maintainers with local upstream checkouts.
- Edit `skills/*/SKILL.md` frontmatter first, then run `npm run catalog:mine`; do not hand-edit generated catalog entries.
- Multi-wave development and planning artifacts live under `planning/` following the `wave-orchestration` skill guidelines.
- Prefer small, verifiable changes that are easy to review and maintain.

## References
- `README.md` -- public install, CI, and maintainer-sync guidance.
- `skills/*/SKILL.md` frontmatter -- authoritative source for skill identity, standard fields, and nested source/provenance/version metadata.
- `catalog/skills.lock.json` -- generated compatibility/index data derived from frontmatter for curated ordering and maintainer synchronization.
- `planning/` -- orchestration state, task DAGs, execution plans, and prompt templates.
- Reference repo: `https://github.com/AndrewBrown-USDA/aigb-skills.git` (private maintainer repository).
