# Andrew Brown's USDA Skills (`aigb-skills-usda`)

`aigb-skills-usda` is Andrew Brown's public repository of agent skills curated for USDA workflows, geospatial computing, and software engineering. It packages planning, code review, investigative research, and developer tooling into a reproducible npm package and lockfile-driven catalog.

## What is here

- A ready-to-use npm package with the `skills` CLI (`npx --no-install skills` after `npm link` from a checkout).
- Curated skill catalog defined in `catalog/skills.lock.json`
- Materialized and linkable skills in `skills/`.
- Permissive MIT License at the repository root, with explicit third-party attribution external skills.
- Agent and repo conventions in `AGENTS.md`.

## Quick Start (Installing Skills)

From a checkout containing the packaged `skills/` directory, install the local package link first, then use `npx` to invoke its CLI; Node.js 18 or newer is required:

```bash
npm link
npx --no-install skills install --target ~/.agents/skills
```

This copies packaged skills and never fetches skill sources. `npm link` makes this checkout's package available to `npx`; `--no-install` prevents `npx` from downloading an unrelated registry package. The install command requires source and target to be separate, non-overlapping directories. Existing same-named skills in the destination are left untouched: by default, installation refuses the conflicting install; pass `--force` to replace the matching destination skills.

Or using `make`:

```bash
make help
make install
make install-skills
make test
```

`make install` installs npm dependencies. `make install-skills` invokes the checked-in CLI directly and copies skills into `~/.agents/skills`; if any same-named skills already exist, it refuses. To explicitly replace matching skills through Make, use `make install-skills -- --force`. `make test` is the broader maintainer smoke suite and can require sibling source checkouts; it is not needed to install packaged skills.

To install selected skills, pass a comma-separated list or use the singular shorthand:

```bash
make install-skills SKILLS=plan-first,dr-lexus
make install-skill SKILL=plan-first
make install-skill SKILL=plan-first -- --force
make install-skills-force SKILLS=plan-first,dr-lexus
```

The first two forms refuse conflicting skills by default. `install-skills-force` always replaces matching skills and accepts the optional `SKILLS` filter.

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

After running `npm link` in this checkout:

- Copilot CLI / Universal Agents: `npx --no-install skills install --target ~/.agents/skills`
- Claude Code: `npx --no-install skills install --target ~/.claude/skills`
- Pi coding agent: `npx --no-install skills install --target ~/.pi/agent/skills`

These commands copy the packaged skills from this checkout. Existing matching names cause installation to refuse; add `--force` only when you intend to replace those destination skills.

### Project-Directory & Skill-Specific Installs

You can install skills directly into a local repository/project directory:

```bash
# Install all skills into a local project's agent or GitHub Copilot folder
npx --no-install skills install --target ./.agents/skills
# or: npx --no-install skills install --target ./.github/skills
```

To install a specific skill or a subset of skills, use `--skill` or `--skills` with single or comma-separated names:

```bash
# Install a single skill to Pi coding agent
npx --no-install skills install --target ~/.pi/agent/skills --skill plan-first

# Install multiple selected skills
npx --no-install skills install --target ~/.pi/agent/skills --skills plan-first,dr-lexus,code-review-2axis

# Install selected skills into a project directory
npx --no-install skills install --target ./.agents/skills --skills plan-first,web-source-bundler
```

Selection roots may also name a catalog loadout with the `loadout:` prefix.
Use `--include` and `--exclude` for optional selections and explicit
overrides; repeated options and comma-separated values are accepted:

```bash
npx --no-install skills install --target ~/.agents/skills --skill loadout:research
npx --no-install skills install --target ~/.agents/skills --include tdd --exclude plan-first
```

Omitting `--skill`/`--skills` preserves the compatibility behavior of
installing every packaged skill. Invalid selections produce deterministic
diagnostics and install nothing. `--source`, `--mode`, and `--force` apply to
the install command only; `sync` remains the maintainer-only command for
upstream repositories and lockfiles.

For a safe local helper example, specify a temporary target rather than a real agent directory:

```bash
bash skills/install-skills/scripts/install.sh --target-path ./.scratch/pi-skills --skill plan-first
```

The helper writes to the custom path selected by `--target-path`; use a scratch directory for testing. Existing same-named skills at a destination are replaced by the helper.

## Install vs. Maintainer Sync

### 1. `skills install` (For Users & Agents)
Installs pre-packaged skills directly from the local `./skills` directory into your agent directory without requiring external source repositories or network calls. The source and target must be separate, non-overlapping directories. Existing same-named skills are preserved because installation refuses to proceed; `--force` opts into replacing those matching destination skills.

```bash
# Copy mode (default); refuses conflicts unless --force is added
npx --no-install skills install --mode copy --target ~/.agents/skills

# Symlink / junction mode; also refuses conflicts unless --force is added
npx --no-install skills install --mode symlink --target ~/.agents/skills
```

### 2. `skills sync` (Maintainers Only)
Synchronizes the `./skills` directory from upstream source repositories listed in `catalog/skills.lock.json`. Requires local checkouts of source repositories.

```bash
# Maintainer sync (local checkouts only by default)
npx --no-install skills sync --mode copy
# or: make sync

# Explicitly permit clone/fetch recovery when a local checkout or ref is missing
npx --no-install skills sync --mode copy --allow-network
```

`skills sync` does not clone or fetch by default. `--no-clone` remains a
compatibility alias for this local-only behavior. Use `--allow-network` only
when intentionally permitting maintainer network recovery.

## Curated Skills & Attribution

The catalog includes 34 curated skills:

- **Skill metadata contract:** Each `skills/*/SKILL.md` frontmatter must provide
  the standard top-level `name` and `description` fields. Supported standard
  optional fields remain top-level when used. Repository-specific synchronization
  fields belong under a `metadata` mapping: `source_repo`, `source_path`, and
  `source_url` identify the canonical bundled source; `upstream_repo`,
  `upstream_ref`, optional `upstream_name`, and `version` preserve upstream
  provenance. Legacy `source_ref` and `upstream` are read-only fallbacks for
  `upstream_ref` and `upstream_repo`. Known canonical repositories derive a
  GitHub URL; unknown repositories leave `source_url` unset rather than
  fabricating one.
- **Authority and catalog:** `skills/*/SKILL.md` frontmatter is authoritative.
  `catalog/skills.lock.json` is generated compatibility and index data derived
  from that frontmatter; edit the skill metadata rather than hand-editing the
  catalog.
- **External Skills:** `grilling`, `code-review-2axis`, `research`, and `tdd` are authored by Matt Pocock (https://github.com/mattpocock/skills). `caveman` is authored by Julius Brussee (https://github.com/JuliusBrussee/caveman). `ponytail` is authored by Dietrich Gebert (https://github.com/DietrichGebert/ponytail). Each skill's `SKILL.md` frontmatter carries its source, exact pinned ref, attribution, and upstream URL; the catalog is generated from that metadata.

### Curated aliases

The top-level frontmatter `name` is the public packaged identity used for
installation, synchronization, validation, and CLI selection. When a curated
skill intentionally uses a different name than its upstream source, record the
upstream name relative to `metadata.source_repo` as `metadata.upstream_name`.
For example, `code-review-2axis` uses `upstream_name: code-review`.
- **Diagnostics & Debugging:** `dr-lexus` (plain language directive) and `rubber-ducking` (interactive user-driven explanation and debugging).
- **Web Research & Documentation:** `web-source-bundler` (captures web sources, search results, and file lists into deterministic Markdown reference bundles with SHA-256 provenance) and `research` (structured primary source investigations).
- **Core Engineering & Standards:** `agent-onboarding`, `apply-fed-oss-license`, `arcpy-migration`, `conventional-commits`, `copilot-history-briefing`, `deep-investigative-research`, `doc-consistency`, `github-actions-ci`, `goal-alignment`, `install-skills`, `json-processing-with-jq`, `makefile-development-workflow`, `performance-benchmarking`, `plan-first`, `plan-wave`, `reviewer-architecture`, `reviewer-correctness`, `skill-research`, `tdd`, `verbosity-cleaner`, `wave-orchestration`, and `worker-validation`.

## Licensing Model

- **Repository License:** MIT License with 17 U.S.C. § 105 federal public domain notice (see `LICENSE` and `INTENT.md`).
- **Attribution:** All imported third-party skills maintain MIT compatibility with author attribution in `SKILL.md` YAML frontmatter.

## Troubleshooting

- **`skills: command not found`**: Run `npm link` from this checkout, then use `npx --no-install skills`; `npm install` alone does not expose this package's bin to `npx`.
- **Symlink mode on Windows**: If symlinks fail due to permissions, use `--mode copy` (default).
