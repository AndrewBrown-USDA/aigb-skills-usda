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
- **Format:** 1-64 lowercase letters, numbers, and hyphens; no leading or trailing hyphen or consecutive hyphens
- **Directory match:** Must match the parent directory name
- **Example:** `python-code-style`, `llm-tool-debug`, `install-skills`
- **Requirement:** Must be unique within the skills collection
- **Usage:** The agent uses this name for the `/skill-name` slash command

#### `description` field
- **Format:** 1-1,024 characters
- **Content:** Describe what the skill does and when to use it
- **Discovery:** Include specific keywords that help agents identify relevant tasks
- **Examples:**
  - "Installs skills into a coding agent's skill directory. Use when setting up aigb-skills for Claude Code, Cursor, Copilot, or Pi."
  - "Debugs LLM tool calling issues by analyzing request/response cycles. Use when tool calls fail or behave unexpectedly."
  - "Enforces Python coding style conventions with linting and formatting. Use when standardizing code style in a Python project."
- **Requirement:** Must be non-empty and remain within the 1,024-character limit

## Document Body

After the frontmatter, the Markdown body contains the skill instructions. The specification does not require a fixed heading structure or an H1 heading. Use the formats that best support the workflow, such as:

- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases
- Checklists and validation loops

Keep the main `SKILL.md` focused and under 500 lines or 5,000 tokens when practical. Move detailed material to focused supporting files and load those resources only when needed.

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
| `description` field | Describes capability and activation context; max 1,024 characters | "Installs skills... Use when setting up..." |
| Slash command invoked | `/<name>` | `/install-skills` |
| Reference files | kebab-case or descriptive | `agent-paths.md`, `example-query.sql` |
| Script files | kebab-case or CamelCase | `install.sh`, `queryBuilder.ts` |

## Validation Checklist

Before publishing a skill:

- [ ] `SKILL.md` exists at skill root
- [ ] YAML frontmatter has both `name` and `description`
- [ ] `name` matches the parent directory, follows the allowed character rules, and is unique across the skills collection
- [ ] `description` explains what the skill does and when to use it, includes useful discovery keywords, and is no longer than 1,024 characters
- [ ] Body content provides actionable guidance in a structure appropriate to the skill
- [ ] Code blocks are properly fenced (triple backticks with language tag)
- [ ] All relative links to `references/` and `scripts/` are valid
- [ ] Spell-checked and grammatically correct

## Examples

See these skills for working examples:
- `skills/agent-onboarding/SKILL.md` -- Procedural workflow
- `skills/install-skills/SKILL.md` -- Skill with `references/` and `scripts/`
- `skills/skill-research/SKILL.md` -- Skill authoring and validation workflow
