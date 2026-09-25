# Andrew Brown's USDA Skills (`aigb-skills-usda`)

`aigb-skills-usda` is Andrew Brown's public repository of agent skills curated for USDA workflows, geospatial computing, and software engineering. It packages planning, code review, investigative research, and developer tooling into a reproducible npm package and lockfile-driven catalog.

## What is here

- A ready-to-use npm package with the `skills` CLI (`npx skills`).
- Curated skill catalog defined in `catalog/skills.lock.json` containing 24 curated skills (including `dr-lexus`, `rubber-ducking`, `web-source-bundler`, and `apply-fed-oss-license`).
- Materialized and linkable skills in `skills/`.
- Permissive MIT License at the repository root, with explicit third-party attribution for Matt Pocock skills (`grilling`, `code-review-2axis`).
- Agent and repo conventions in `AGENTS.md`.

## Quick Start

```bash
npm install
npx skills --help
```

Or using `make`:

```bash
make help
make install
make test
make sync
```

You can sync or install skills using the CLI:

```bash
# Sync into local ./skills directory
npx skills sync --mode copy

# Or install/link into your agent skills directory
npx skills install --mode symlink --target ~/.agents/skills
```

Run repository smoke checks:

```bash
npm test
```

## Install and sync workflow

The curated catalog is driven from `catalog/skills.lock.json`, which is the authoritative list of 24 skills to materialize. Each entry records the source repo, source path, publishability, and version status.

- `version.status: unresolved` means the skill has not yet been pinned to a concrete version value.
- `version.value: null` keeps that unresolved state explicit instead of guessing at a version.

The sync and install commands materialize the approved list into a target directory (defaulting to `./skills`).

### Sync Modes

| Mode | Meaning |
|---|---|
| `copy` | Create a standalone copy of each approved skill directory. |
| `symlink` | Point the target back at the source skill directory (useful for live local development). |

Examples:

```bash
# Direct CLI invocation
npx skills sync --mode copy --target .scratch/skills-sync
npx skills install --mode symlink --target .scratch/skills-install

# Or using npm script shortcuts
npm run skills:sync -- --mode copy --target .scratch/skills-sync
npm run skills:install -- --mode symlink --target .scratch/skills-install
```

Treat the lockfile as the single source of truth for selection and version status. The generated `skills/` tree should be treated as a materialized output rather than hand-edited source.

## Curated Skills & Attribution

The catalog includes 24 curated skills:

- **Matt Pocock Skills:** `grilling` and `code-review-2axis` (derived from `code-review`) are authored by Matt Pocock (https://github.com/mattpocock/skills) under the MIT License. Their `SKILL.md` frontmatter explicitly preserves `author: Matt Pocock (https://github.com/mattpocock/skills)` and `license: MIT`.
- **Diagnostics & Debugging:** `dr-lexus` (diagnostic vocabulary and plain language) and `rubber-ducking` (interactive debugging with Python AST chunking and language detection utilities).
- **Web Research & Documentation:** `web-source-bundler` (captures web sources, search results, and file lists into deterministic Markdown reference bundles with SHA-256 provenance).
- **Core Engineering & Standards:** `agent-onboarding`, `apply-fed-oss-license`, `copilot-history-briefing`, `deep-investigative-research`, `doc-consistency`, `github-actions-ci`, `install-skills`, `json-processing-with-jq`, `makefile-development-workflow`, `performance-benchmarking`, `plan-first`, `plan-wave`, `reviewer-architecture`, `reviewer-correctness`, `skill-research`, `tdd`, `verbosity-cleaner`, `wave-orchestration`, and `worker-validation`.

## Licensing Model

- **Repository License:** MIT License with 17 U.S.C. § 105 federal public domain notice (see `LICENSE.md` and `INTENT.md`).
- **Attribution:** All imported third-party skills maintain MIT compatibility with full author attribution in both `catalog/skills.lock.json` and `SKILL.md` YAML frontmatter.

## Troubleshooting

- **`skills: command not found`**: Run `npm install` first.
- **Symlink mode on Windows**: If symlinks fail due to permissions, use `--mode copy`.


