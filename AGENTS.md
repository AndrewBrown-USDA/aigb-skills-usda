# AGENTS.md - aigb-skills-usda

## Quick Start
- `git status --short --branch`
- `node -e "require('./package.json')"`
- `npm install` (or `make install`)
- `npm test` (or `make test`)
- `npx skills --help`
- `npx skills sync --mode copy` (or `make sync`)

## Repo shape
- `bin/` -- executable shims that expose CLI entry points.
- `src/` -- CLI implementation layer (delegates commands cleanly).
- `skills/` -- curated and materialized skill folders.
- `catalog/` -- authoritative lockfile.
- `scripts/` -- sync, installer, history mining, and smoke check utilities.
- `planning/` -- execution plans, wave states, task tracking, and prompt templates (untracked locally).
- `Makefile` -- standard developer workflow targets (`make help`, `make test`, `make sync`).
- `README.md` -- public-facing overview and install guidance.
- `LICENSE` -- MIT License at the repo root.

## Working conventions
- Keep the public package minimal, reliable, and functional.
- `package.json` must parse cleanly and expose the `skills` bin.
- The `skills` CLI supports `sync` and `install` operations backed by `catalog/skills.lock.json`.
- Skills in `skills/` are materialized from source repos according to the catalog lockfile.
- Multi-wave development and planning artifacts live under `planning/` following the `wave-orchestration` skill guidelines.
- Prefer small, verifiable changes that are easy to review and maintain.

## Validation
- Favor the targeted smoke path from the task spec: `npm install` followed by `npx skills --help` and `npm test`.
- If a change affects package metadata, re-run `node -e "require('./package.json')"` before the smoke test.

## References
- `catalog/skills.lock.json` -- authoritative lockfile for curated skills
- `planning/` -- orchestration state, task DAGs, and execution plans
- Reference repo: `D:\workspace\aigb-skills`
