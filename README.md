# Andrew Brown's USDA Skills (`aigb-skills-usda`)

`aigb-skills-usda` is Andrew Brown's public repository of agent skills curated for USDA workflows, geospatial computing, and software engineering. It packages planning, code review, investigative research, and developer tooling into a reproducible npm package and lockfile-driven catalog.

## What is here

- A ready-to-use npm package with the `skills` CLI (`npx skills`).
- Curated skill catalog defined in `catalog/skills.lock.json`
- Materialized and linkable skills in `skills/`.
- Permissive MIT License at the repository root, with explicit third-party attribution external skills.
- Agent and repo conventions in `AGENTS.md`.

## Quick Start (Installing Skills)

To install packaged skills into your agent directory (works out-of-the-box on any machine):

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

### CI Validation vs. Maintainer Sync

CI validates the packaged `skills/` directory with:

```bash
npm run validate:skills -- --report .scratch/skills-report.json
```

This check uses only files shipped in this repository. It does not clone or sync
upstream repositories, access private repositories, or require sibling checkouts.

The existing `npm test` smoke suite also exercises maintainer synchronization
paths and may require local upstream source checkouts. Run it locally when
working on `skills sync`; it is not the packaged-only CI contract.

### Common Agent Install Targets

- Copilot CLI / Universal Agents: `npx skills install --target ~/.agents/skills`
- Claude Code: `npx skills install --target ~/.claude/skills`
- Pi coding agent: `npx skills install --target ~/.pi/agent/skills`

### Project-Directory & Skill-Specific Installs

You can install skills directly into a local repository/project directory:

```bash
# Install all skills into a local project's agent or GitHub Copilot folder
npx skills install --target ./.agents/skills
# or: npx skills install --target ./.github/skills
```

To install a specific skill or a subset of skills, use `--skill` or `--skills` with single or comma-separated names:

```bash
# Install a single skill to Pi coding agent
npx skills install --target ~/.pi/agent/skills --skill plan-first

# Install multiple selected skills
npx skills install --target ~/.pi/agent/skills --skills plan-first,dr-lexus,code-review-2axis

# Install selected skills into a project directory
npx skills install --target ./.agents/skills --skills plan-first,web-source-bundler
```

You can also use the bash helper in `skills/install-skills/scripts/install.sh`:

```bash
# Install a single skill via bash script
bash skills/install-skills/scripts/install.sh --target pi --skill plan-first
```

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

The catalog includes 27 curated skills:

- **External Skills:** `grilling`, `code-review-2axis`, `research`, and `tdd` are authored by Matt Pocock (https://github.com/mattpocock/skills). `caveman` is authored by Julius Brussee (https://github.com/JuliusBrussee/caveman). `ponytail` is authored by Dietrich Gebert (https://github.com/DietrichGebert/ponytail). All have pinned release references and upstream provenance in the catalog and `SKILL.md` frontmatter and are included under the terms of the MIT license.
- **Diagnostics & Debugging:** `dr-lexus` (plain language directive) and `rubber-ducking` (interactive user-driven explanation and debugging).
- **Web Research & Documentation:** `web-source-bundler` (captures web sources, search results, and file lists into deterministic Markdown reference bundles with SHA-256 provenance) and `research` (structured primary source investigations).
- **Core Engineering & Standards:** `agent-onboarding`, `apply-fed-oss-license`, `copilot-history-briefing`, `deep-investigative-research`, `doc-consistency`, `github-actions-ci`, `install-skills`, `json-processing-with-jq`, `makefile-development-workflow`, `performance-benchmarking`, `plan-first`, `plan-wave`, `reviewer-architecture`, `reviewer-correctness`, `skill-research`, `tdd`, `verbosity-cleaner`, `wave-orchestration`, and `worker-validation`.

## Licensing Model

- **Repository License:** MIT License with 17 U.S.C. § 105 federal public domain notice (see `LICENSE.md` and `INTENT.md`).
- **Attribution:** All imported third-party skills maintain MIT compatibility with full author attribution in both `catalog/skills.lock.json` and `SKILL.md` YAML frontmatter.

## Troubleshooting

- **`skills: command not found`**: Run `npm install` first.
- **Symlink mode on Windows**: If symlinks fail due to permissions, use `--mode copy` (default).
