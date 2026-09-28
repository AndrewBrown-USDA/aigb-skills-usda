# Andrew Brown's USDA Skills (`aigb-skills-usda`)

`aigb-skills-usda` is Andrew Brown's public repository of agent skills curated for USDA workflows, geospatial computing, and software engineering. It packages planning, code review, investigative research, and developer tooling into a reproducible npm package and lockfile-driven catalog.

## What is here

- A ready-to-use npm package with the `skills` CLI (`npx skills`).
- Curated skill catalog defined in `catalog/skills.lock.json`
- Materialized and linkable skills in `skills/`.
- Permissive MIT License at the repository root, with explicit third-party attribution external skills.
- Agent and repo conventions in `AGENTS.md`.

## Quick Start (Installing Skills)

To install packaged skills into your agent directory (works out of the box on any machine):

```bash
npm install
npx skills install --target ~/.agents/skills
```

Or using `make`:

```bash
make help
make install
make install-skills
make test
```

### Common Agent Install Targets

- Copilot CLI / Universal Agents: `npx skills install --target ~/.agents/skills`
- Claude Code: `npx skills install --target ~/.claude/skills`
- Cursor: `npx skills install --target ~/.cursor/skills`

## Install vs. Maintainer Sync

### 1. `skills install` (For Users & Agents)
Installs pre-packaged skills directly from the local `./skills` directory into your agent directory without requiring external source repositories or network calls.

```bash
# Copy mode (default)
npx skills install --mode copy --target ~/.agents/skills

# Symlink / junction mode
npx skills install --mode symlink --target ~/.agents/skills
```

### 2. `skills sync` (Maintainers Only)
Synchronizes the `./skills` directory from upstream source repositories listed in `catalog/skills.lock.json`. Requires local checkouts of source repositories.

```bash
# Maintainer sync
npx skills sync --mode copy
# or: make sync
```

## Curated Skills & Attribution

The catalog includes 25 curated skills:

- **Matt Pocock Skills:** `grilling`, `code-review-2axis`, and `research` are authored or co-authored by Matt Pocock (https://github.com/mattpocock/skills) under the MIT License. Their `SKILL.md` frontmatter explicitly preserves `author: Matt Pocock (https://github.com/mattpocock/skills)` and `license: MIT`.
- **Diagnostics & Debugging:** `dr-lexus` (plain language directive) and `rubber-ducking` (interactive user-driven explanation and debugging).
- **Web Research & Documentation:** `web-source-bundler` (captures web sources, search results, and file lists into deterministic Markdown reference bundles with SHA-256 provenance) and `research` (structured primary source investigations).
- **Core Engineering & Standards:** `agent-onboarding`, `apply-fed-oss-license`, `copilot-history-briefing`, `deep-investigative-research`, `doc-consistency`, `github-actions-ci`, `install-skills`, `json-processing-with-jq`, `makefile-development-workflow`, `performance-benchmarking`, `plan-first`, `plan-wave`, `reviewer-architecture`, `reviewer-correctness`, `skill-research`, `tdd`, `verbosity-cleaner`, `wave-orchestration`, and `worker-validation`.

## Licensing Model

- **Repository License:** MIT License with 17 U.S.C. § 105 federal public domain notice (see `LICENSE.md` and `INTENT.md`).
- **Attribution:** All imported third-party skills maintain MIT compatibility with full author attribution in both `catalog/skills.lock.json` and `SKILL.md` YAML frontmatter.

## Troubleshooting

- **`skills: command not found`**: Run `npm install` first.
- **Symlink mode on Windows**: If symlinks fail due to permissions, use `--mode copy` (default).
