---
name: agent-onboarding
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Create and maintain AGENTS.md files for project onboarding and grounding. Use when initialized in a new project, when project structure changes significantly, or when creating subfolder-level AGENTS.md files for complex monorepos.
version: 1.0
---

# Agent Onboarding

Generate `AGENTS.md` files that ground agents in project structure -- not in volatile state.

## Commands

**Create a new AGENTS.md:**
```bash
/agent-onboarding create
```

**Update an existing AGENTS.md after structural changes:**
```bash
/agent-onboarding update
```

**Create or update AGENTS.md for a subfolder (monorepo):**
```bash
/agent-onboarding subfolder <path>
```

## Philosophy: Catalog to Compass

`AGENTS.md` is a navigation map, not a snapshot of current state. It answers "where is X?" and "how do I do Y?" -- not "what are we working on today?"

### Directory map, not content inventory
Show where things live. Directory structure is stable; contents change. Agents can `ls` to see what's inside.

- Don't: "Dashboard components (currently 12 files, 3 pending refactor)"
- Do: "`src/dashboard/components/` -- run `ls` to see them"

### Process, not state
Document how artifacts flow through their lifecycle, not their current status.

- Don't: "API auth refactor (50% done), dashboard redesign (in review)"
- Do: "Add work to TODO.md -> check off when done -> archive -> repeat"

### Stable infrastructure, not ephemeral status
Record commands, file paths, port numbers. Don't record "current priorities" or "today's focus."

- Don't: "We're fixing a latency regression discovered yesterday"
- Do: "`npm test --performance` -> results in `dist/benchmarks/`"

### Reference skills, not re-encode them
Point to skill files (`/plan.md`, `SKILL.md`). They are the source of truth. Don't duplicate.

- Don't: Re-explain testing strategy in AGENTS.md
- Do: "See [[testing-strategy]](testing-strategy/SKILL.md) for the full protocol"

### Commands, not explanations
Show what to type. Agents can read the source if they need to understand internals.

- Don't: "Webpack bundles TypeScript modules via a custom loader that extracts metadata..."
- Do: "`npm run build` -> output in `dist/`"

## AGENTS.md Structure

Organize in this order (commands and discovery first):

1. **Quick Start** -- Essential commands to build, test, run, deploy
2. **Find Things** -- Where code, config, and docs live (directory map)
3. **Workflows** -- Lifecycle of tasks, artifacts, releases
4. **Infrastructure** -- Stable file paths, ports, commands, configuration
5. **References** -- Links to detailed skills or documentation

Use [AGENTS_template.md](assets/AGENTS_template.md) as a starting point.

## When to Create or Update

- **Create**: New project with no AGENTS.md
- **Update**: Project structure has changed (new directories, removed modules, moved entry points)
- **Don't update for**: Changes to task status, current priorities, or file contents -- these are transient

## Root vs. Subfolder

- **Root AGENTS.md**: High-level map, workspace-wide commands, primary entry points
- **Subfolder AGENTS.md** (monorepo): Independent context for a module or package (e.g., `src/services/billing/AGENTS.md`)

## Detect the Ecosystem

Use [patterns.md](references/patterns.md) to identify language and architecture:

| Ecosystem | Signatures | Reference |
|-----------|-----------|-----------|
| Python | `pyproject.toml`, `setup.py`, `requirements.txt` | patterns.md#python |
| JavaScript/Node | `package.json`, `tsconfig.json` | patterns.md#javascript |
| Rust | `Cargo.toml`, `Cargo.lock` | patterns.md#rust |
| R | `DESCRIPTION`, `NAMESPACE`, `renv.lock` | patterns.md#r |
| C/C++ | `CMakeLists.txt`, `*.h`, `*.cpp` | patterns.md#cpp |
| Julia | `Project.toml`, `Manifest.toml` | patterns.md#julia |

Extract commands from build files (package.json, Makefile, pyproject.toml, Cargo.toml). They are the invariants of the project.
