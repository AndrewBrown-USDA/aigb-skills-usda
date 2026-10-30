# Skill Loadout API, CLI, and Catalog Surfaces

Status: implemented design contract. This document defines the dependency-free
integration surfaces exercised by the focused resolver and installer suites.

## 1. Contract boundaries

`skills/<name>/SKILL.md` frontmatter is the canonical input. The resolver
consumes normalized records derived from that frontmatter. The catalog is a
generated index and compatibility artifact, never an override. Installation
uses materialized `./skills` content; provenance fields describe origin only.
`skills install` remains the user-facing packaged installer, while `skills
sync` remains maintainer-only and may use upstream repositories only under its
existing explicit network policy.

The surfaces use Node.js built-ins only: `node:fs`, `node:path`, and existing
repository parsing/normalization helpers. No runtime dependency or network
client is required.

## 2. Reusable API

The implementation exposes dependency-free resolver functions in
`scripts/skill-loadouts.js` and installer/catalog functions in
`scripts/install.js`:

### `readCatalog(options?)`

**Input:** `{ catalogPath?: string, sourceDir?: string }`. Defaults are
`catalog/skills.lock.json` and `./skills`. It reads JSON and returns a
normalized catalog object. It must reject unreadable files, malformed JSON,
unsupported schema versions, duplicate names, and records missing canonical
identity or install path.

### `resolveLoadout(request, catalog, options?)`

**Input:**

```js
{
  names?: string[],       // names and loadout:<name> tokens, ordered
  include?: string[],
  exclude?: string[],
  force?: string[],
  constraints?: object   // optional name -> version constraint
}
```

**Output:**

```js
{
  ok: true,
  skills: [{ name, source_path, source_repo, source_url, version, ... }],
  diagnostics: [{
    code, severity, message, subject, path, detail, legacyPath
  }]
}
```

Failure returns `{ ok: false, skills: [], diagnostics }`. Names and override
lists use the resolution contract's trim/deduplicate rules and reject malformed
empty list items before any catalog resolution. Roots preserve
request order; loadout members are name-sorted; dependencies are emitted
post-order. `source_path` is always the packaged install path. Required and
selected optional missing nodes, cycles, exclusions, and invalid constraints
are errors; a loadout with no packaged members and include/exclude overrides
without roots are also errors. Selected optional missing nodes are warnings as
specified by the resolution contract. Version constraints accept exact strings
only. Diagnostics are deterministic and never contain a partial install plan.
`message`, array `path`, and string `legacyPath` are additive compatibility
fields.

### `installResolved(result, options?)`

**Input:** a successful resolution result and the existing install options:
`{ sourceDir?, targetDir, mode?: 'copy'|'symlink', force?: boolean }`.
It delegates materialization to the same copy/symlink and non-overlap rules as
`skills install`. It returns the existing `{ skills, target, mode }` fields
plus additive `{ installed: string[], skipped: string[] }` fields, or throws a
stable operational error. It rejects unsuccessful resolution results before
creating or changing the target. It must not download, interpret upstream
URLs, or mutate the catalog.

### `buildCatalog(options?)`

**Input:** `{ skillsDir?: string }`. It performs the equivalent of
`scanCuratedSkills` and returns the generated lockfile object. Frontmatter is
parsed and normalized first; generated fields are never read back as authority.
The operation is deterministic for the same tree and does not access the
network.

### Error and diagnostic contract

Errors should expose a stable `code`, human-readable `message`, and optional
`subject`/`path`; CLI formatting may add context but must not change the code.
Implemented diagnostic codes include `invalid-catalog`, `missing-root`,
`missing-loadout`, `missing-skill`, `missing-optional`, `unknown-override`,
`roots-required`, `excluded-root`, `excluded-required`, `cycle`,
`version-constraint`, and `unknown-constraint`. API callers can branch on
codes without parsing text.

## 3. CLI surface

The existing commands retain their meanings and defaults. Add a user-facing
selection option to `install`:

```text
skills install [options]
  --target <path>          Target directory
  --source <path>          Packaged skills directory (default: ./skills)
  --skill, --skills <list> Names or loadout:<name> tokens, comma-separated
  --include <list>         Include optional dependencies; requires a root
  --exclude <list>         Exclude optional dependencies; requires a root
  --force                  Retain an excluded direct root and replace conflicts
  --mode <copy|symlink>    Materialization mode (default: copy)
```

For compatibility, `--skill` and `--skills` remain aliases, comma-separated
names remain valid, and an omitted selection still means all packaged skills.
`loadout:<name>` is the only loadout selection syntax; a bare name remains a
skill name, and a skill may belong to multiple loadouts.
Unknown options, missing option values, malformed lists, rootless overrides,
unknown/mistyped loadouts, resolution errors, and install conflicts print one
concise diagnostic to stderr and exit 1. Resolution completes before target
creation or replacement, so every such failure is atomic. Success exits 0.
`--help` continues to exit 0 and includes the selection options. Diagnostics
retain discovery order, identify the actionable path, and do not expose
absolute paths or provenance URLs.

No new public `sync` selection semantics are required. If a maintainer needs
to materialize a selected loadout after synchronization, they run `sync`
first, then `install` against the resulting packaged tree. `sync` retains
`--target`, `--lockfile`, `--mode`, `--allow-network`, and `--no-clone`; it
must never resolve a provenance URL as an install source.

Representative commands:

```bash
skills install --target ~/.agents/skills --skills loadout:wave-delivery
skills install --target ./.agents/skills --skill plan-first,dr-lexus \
  --include web-source-bundler
skills install --target ./.agents/skills --skill loadout:software-delivery
skills install --target ./.agents/skills --skill loadout:typo # fails
skills install --help
skills sync --mode copy --no-clone
```

## 4. Catalog representation and ownership

The generated lockfile remains JSON with `schema_version`,
`generated_by`, `generated_from`, and `skills`. Each skill record may add
normalized loadout data:

```json
{
  "name": "field-reporting",
  "loadout": "field-ops",
  "group": "geospatial",
  "dependencies": ["dr-lexus", "worker-validation"],
  "optional_dependencies": ["web-source-bundler"],
  "source_repo": "aigb-skills",
  "source_path": "skills/field-reporting/SKILL.md",
  "source_url": "https://github.com/AndrewBrown-USDA/aigb-skills-usda",
  "version": { "status": "resolved", "value": "2.1.0" }
}
```

`name`, loadout fields, dependency fields, version, and provenance are copied
from normalized frontmatter. `source_url` is derived only by the existing
canonical repository map. `version.status` remains `resolved` or `missing`.
`generated_by`, schema information, and ordering are generator-owned.
`catalog/skills.lock.json` is never hand-edited; `scripts/mine-history.js`
regenerates it deterministically from `skills/*/SKILL.md`. A schema bump is
required for incompatible shape or semantic changes. Additive fields preserve
schema compatibility when consumers ignore unknown fields.

Catalog consumers must tolerate absent loadout fields as empty values and
absent dependency arrays as empty lists. The generator may internally
normalize comma-separated metadata into arrays; frontmatter remains scalar and
parser-compatible.

## 5. Install, sync, and provenance

Resolution produces packaged skill identities and relative `source_path`s.
Installation copies or links only from the selected source directory, checks
source/target non-overlap, and applies existing conflict behavior. `--force`
has two coordinated meanings: it wins resolution exclusions and permits
replacement of destination conflicts. A failed resolution never starts
installation.

Synchronization is a maintainer operation that updates `./skills` from
lockfile-directed local source repositories. It remains local-only by default;
`--allow-network` is the explicit exception. Loadout metadata is synchronized
as part of each `SKILL.md`, and the catalog is regenerated afterward. Neither
install nor resolution clones, fetches, or follows `upstream_repo`,
`upstream_ref`, or `source_url`.

## 6. Compatibility and migration

Skills without `loadout`, `group`, `dependencies`, or
`optional_dependencies` retain current behavior. Existing invocations with no
selection install all packaged skills. Existing single names and comma lists
remain valid. Legacy `upstream`/`source_ref` aliases are normalized according
to the metadata contract and are not rewritten by the resolver.

Catalog readers should accept schema version 1 records with no loadout fields.
A future incompatible catalog requires an explicit supported-version error,
not silent guessing. New clients may request loadouts only when the catalog
contains the relevant field. Migration is frontmatter-first: add scalar
metadata, validate, regenerate the catalog, then use the new CLI/API.

## 7. Diagnostics and examples

Successful resolution:

```json
{
  "ok": true,
  "skills": [
    { "name": "dr-lexus" },
    { "name": "worker-validation" },
    { "name": "field-reporting" }
  ],
  "diagnostics": []
}
```

Selected optional dependency missing:

```json
{
  "ok": true,
  "skills": ["dr-lexus", "field-reporting"],
  "diagnostics": [{
    "code": "missing-optional",
    "severity": "warning",
    "message": "Selected optional dependency is not packaged.",
    "subject": "web-source-bundler",
    "path": ["field-reporting", "web-source-bundler"],
    "detail": "Selected optional dependency is not packaged.",
    "legacyPath": "field-reporting -> web-source-bundler"
  }]
}
```

Cycle or required exclusion:

```text
install: cycle: field-reporting -> dr-lexus -> field-reporting
install: excluded-required: field-reporting requires dr-lexus
```

Diagnostics must identify the actionable skill and edge path, preserve stable
ordering, and avoid absolute paths or provenance secrets. `--help` describes selection syntax and the install/sync boundary; it does not
claim network access or context-reduction results. The tracked measurement
artifact records real curated scenarios and byte metrics without claiming
token reduction.

## 8. Cross-check and unresolved questions

The contract matches `runCli`'s command-dispatch/help style, extends
`scanCuratedSkills`/`buildLockfile` without changing frontmatter authority,
and follows README language distinguishing packaged install from maintainer
sync. Focused tests now lock API outputs, CLI selection, catalog ownership,
compatibility, diagnostics, missing values, and atomic failure. The reusable
API exposes exact-only version constraints; the CLI does not expose a version
constraint option.
