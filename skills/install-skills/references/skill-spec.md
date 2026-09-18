# SKILL.md Specification

A skill is defined by a `SKILL.md` file at the root of its directory. This file is the contract between your skill and the coding agent that consumes it.

## Required Structure

### YAML Frontmatter

Every `SKILL.md` must begin with a YAML frontmatter block:

```yaml
---
name: skill-name-kebab-case
description: One-line description of what this skill does. Use when [trigger condition].
---
```

#### `name` field
- **Format:** kebab-case (lowercase, hyphens instead of spaces)
- **Example:** `python-code-style`, `llm-tool-debug`, `install-skills`
- **Requirement:** Must be unique within the repo
- **Usage:** The agent uses this name for the `/skill-name` slash command

#### `description` field
- **Format:** Single sentence, 1-3 clauses
- **Pattern:** "What it does. Use when [trigger condition]."
- **Examples:**
  - "Installs skills into a coding agent's skill directory. Use when setting up aigb-skills for Claude Code, Cursor, Copilot, or Pi."
  - "Debugs LLM tool calling issues by analyzing request/response cycles. Use when tool calls fail or behave unexpectedly."
  - "Enforces Python coding style conventions with linting and formatting. Use when standardizing code style in a Python project."
- **Requirement:** Describes when an agent should invoke this skill (helps with automatic skill selection)

## Document Body

After the frontmatter, the skill document typically contains:

- **H1 heading** -- Human-readable title (usually matches the skill name, formatted nicely)
- **Overview section** -- Detailed explanation of what the skill does
- **Quick Start section** -- Copy-paste examples to get started immediately
- **Detailed sections** -- Step-by-step guides, reference tables, troubleshooting, etc.
- **References section** -- Links to supporting files in `references/` and `scripts/` subdirectories

## Supporting Files

A skill directory may contain:

```
skill-name/
+-- SKILL.md                 # Required; the skill definition
+-- references/              # Optional; reference materials
|   +-- example-config.yaml
|   +-- troubleshooting.md
|   +-- ...
+-- scripts/                 # Optional; executable helper scripts
    +-- run-example.sh
    +-- setup.py
    +-- ...
```

### `references/` Subdirectory
Contains static reference materials:
- Configuration examples (YAML, JSON, TOML)
- SQL templates or query examples
- Architecture diagrams or checklists
- Troubleshooting guides
- Format specifications

### `scripts/` Subdirectory
Contains executable utility scripts that the skill's workflow may call:
- Bash scripts (`.sh`)
- Python scripts (`.py`)
- TypeScript scripts (`.ts`)

Scripts should:
- Accept command-line arguments
- Output JSON or formatted results
- Exit with non-zero code on error
- Include usage documentation (comment header or `--help` flag)

## Naming Conventions

| Element | Pattern | Example |
|---|---|---|
| Skill folder name | kebab-case | `install-skills`, `python-code-style` |
| `name` field | kebab-case | `install-skills` |
| `description` field | Sentence case, starts with verb | "Installs skills..." |
| Slash command invoked | `/<name>` | `/install-skills` |
| Reference files | kebab-case or descriptive | `agent-paths.md`, `example-query.sql` |
| Script files | kebab-case or CamelCase | `install.sh`, `queryBuilder.ts` |

## Validation Checklist

Before publishing a skill:

- [ ] `SKILL.md` exists at skill root
- [ ] YAML frontmatter has both `name` and `description`
- [ ] `name` is unique across the repo
- [ ] `description` follows "What. Use when..." pattern
- [ ] H1 heading is present and human-readable
- [ ] Contains at least one section with actionable content (Quick Start, examples, etc.)
- [ ] Code blocks are properly fenced (triple backticks with language tag)
- [ ] All relative links to `references/` and `scripts/` are valid
- [ ] Spell-checked and grammatically correct

## Examples

See any of these skills for full working examples:
- `skills/python-code-style/SKILL.md` -- Style guide reference
- `skills/agent-onboarding/SKILL.md` -- Procedural workflow
- `skills/install-skills/SKILL.md` -- Skill with `references/` and `scripts/`
