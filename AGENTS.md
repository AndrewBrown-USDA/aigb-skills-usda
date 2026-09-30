# AGENTS.md - aigb-skills-usda

## Quick Start
- `git status --short --branch`
- `node -e "require('./package.json')"`
- `npm install` (or `make install`)
- `npm test` (or `make test`)
- `npx skills --help`
- `npx skills install --target ~/.agents/skills` (or `make install-skills`)

## Installing Skills (Users & Agents)
- **Primary off-ramp**: Pre-materialized skills live in `skills/`.
- To install skills into your agent directory on any machine, run:
  - `npx skills install --target ~/.agents/skills` (or `~/.claude/skills`, `~/.pi/agent/skills`)
  - Or run `make install-skills`
- **Do not run `skills sync` or `make sync` to install skills.** `sync` is a maintainer-only command that rebuilds `skills/` from upstream source checkouts.

## Maintainer Workflows
- `npx skills sync --mode copy` (or `make sync`): Re-materializes `skills/` from external source repositories listed in `catalog/skills.lock.json`. Requires local source repo checkouts.
- `npm run catalog:mine` (or `make catalog`): Regenerates catalog lockfile.

## Repo shape
- `bin/` -- executable shims that expose CLI entry points.
- `src/` -- CLI implementation layer (`install` and `sync` commands).
- `skills/` -- curated and materialized skill folders (packaged source of truth for installations).
- `catalog/` -- authoritative lockfile for upstream source repos.
- `scripts/` -- installer (`install.js`), maintainer sync (`sync-skills.js`), history mining, and smoke check utilities.
- `planning/` -- execution plans, wave states, task tracking, and prompt templates (untracked locally).
- `Makefile` -- standard developer workflow targets (`make help`, `make install`, `make install-skills`, `make test`, `make sync`).
- `README.md` -- public-facing overview and install guidance.
- `LICENSE` -- MIT License at the repo root.

## Working conventions
- Keep the public package minimal, reliable, and functional.
- `package.json` must parse cleanly and expose the `skills` bin.
- The `skills install` command installs pre-bundled skills directly from `./skills` without external network or sibling repo requirements.
- The `skills sync` command is strictly for maintainers with local checkouts of upstream source repositories.
- Multi-wave development and planning artifacts live under `planning/` following the `wave-orchestration` skill guidelines.
- Prefer small, verifiable changes that are easy to review and maintain.

## Validation
- Favor the targeted smoke path: `npm install` followed by `npx skills --help` and `npm test`.
- If a change affects package metadata, re-run `node -e "require('./package.json')"` before the smoke test.

## References
- `catalog/skills.lock.json` -- authoritative lockfile for curated skills
- `planning/` -- orchestration state, task DAGs, and execution plans
- Reference repo: `D:\workspace\aigb-skills`
