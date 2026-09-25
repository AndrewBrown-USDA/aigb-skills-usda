---
name: install-skills
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Installs skills from aigb-skills into a coding agent's skill directory. Use when setting up aigb-skills for Claude Code, Cursor, Copilot, or Pi.
version: 1.0
---

# Install Skills

## Overview

The `install-skills` skill automates the process of installing skills from this repository into your coding agent's skill directory. When you install a skill, your agent gains access to it as an invocable slash command or reference document.

**What "installing" means:** Skills are copied or symlinked from `skills/<name>/` into the agent's skill directory. The installer resolves the target path automatically for Windows and Unix-like systems. Symlinking keeps the installed skill pointing to the repo (changes propagate automatically); copying creates a standalone copy (useful for shipping skills without the full repo).

## Supported Agent Targets

| Agent | Target Name | Skill Directory | Notes |
|---|---|---|---|
| **Claude Code** | `claude` | `.claude/skills/` | Default; synced across Claude Code sessions |
| **Cursor** | `cursor` | `.cursor/skills/` | Editor IDE; distinct from Claude Code |
| **GitHub Copilot** | `copilot` | `.github/skills/` | Enterprise/premium feature |
| **Pi** | `pi` | `.pi/agent/skills/` | Pi agent framework |
| **Antigravity** | `antigravity` | `.antigravity/agent/skills/` | Google Antigravity IDE |
| **OpenAI Codex** | `codex` | `.codex/skills/` | OpenAI Codex CLI / agent |
| **Custom Path** | `--target-path <dir>` | Custom directory | Any arbitrary directory |

## Quick Start

### Install all skills to Claude Code

```bash
cd /path/to/aigb-skills
bash skills/install-skills/scripts/install.sh --target claude --all --symlink
```

This creates symlinks in `~/.claude/skills/` for all skills in `skills/`.

### Install a single skill

```bash
bash skills/install-skills/scripts/install.sh --target claude --skill python-code-style
```

### Copy instead of symlink

```bash
bash skills/install-skills/scripts/install.sh --target claude --all
```

Omitting `--symlink` performs a copy instead, creating standalone skill directories.

### Install to a custom directory

```bash
bash skills/install-skills/scripts/install.sh --target-path ~/my-custom-skills --skill deslop
```

## Options Reference

### Target Selection

- **`--target <agent>`** -- Install to a standard agent directory (claude, cursor, copilot, pi, antigravity, codex)
- **`--target-path <path>`** -- Install to a custom directory instead

### Skill Selection

- **`--all`** -- Install all skills in this repo (default if no `--skill` specified)
- **`--skill <name>`** -- Install a single skill by name (e.g., `python-code-style`, `deslop`)

### Installation Mode

- **`--symlink`** -- Create symlinks (changes in repo are reflected immediately)
- **(omitted)** -- Copy skill directory (standalone copy)

### Information

- **`--help`** -- Show usage information
- **`--list`** -- List all available skills in this repo

## Step-by-Step: Setting Up Claude Code with aigb-skills

1. **Identify the repo path**
   ```bash
   cd /path/to/aigb-skills
   ```

2. **View available skills**
   ```bash
   bash skills/install-skills/scripts/install.sh --list
   ```

3. **Install all skills (symlinked)**
   ```bash
   bash skills/install-skills/scripts/install.sh --target claude --all --symlink
   ```
   This creates entries in `~/.claude/skills/` that point back to the repo.

4. **Verify installation**
   Check that skill directories appeared in `~/.claude/skills/`:
   ```bash
   ls ~/.claude/skills/
   # Output: agent-onboarding, deslop, doc-consistency, ...
   ```

5. **Reload Claude Code**
   If Claude Code is open, restart it to refresh the skill list (or just run a new session).

6. **Invoke a skill**
   Now you can use the skills in any Claude Code session. For example:
   ```
   /python-code-style
   ```

## Understanding the Installation Script

The install script (`scripts/install.sh`) handles:

- **Path resolution** -- automatically finds the repo root using `git rev-parse`
- **Target resolution** -- chooses the canonical agent directory from `APPDATA` on Windows or `HOME` on Unix-like systems
- **Skill validation** -- checks that each skill has a valid `SKILL.md`
- **Copy or symlink** -- creates a copy or symlink depending on the `--symlink` flag
- **Shared inventory** -- list and install reuse the same normalized skill walk
- **Progress feedback** -- prints status for each skill
- **Error handling** -- exits with non-zero on failure and prints error messages

The script is cross-platform (Windows, Linux, macOS) and requires only bash and standard Unix utilities.

## Troubleshooting

### "No such file or directory: .claude/skills"

The `.claude/` directory doesn't exist yet. Claude Code creates it on first run. Either:
- Run Claude Code once (opens immediately)
- Manually create the directory: `mkdir -p ~/.claude/skills/`

### "Cannot create symlink: Permission denied"

On Windows or certain systems, symlinking requires elevated privileges. Use copy mode instead:
```bash
bash skills/install-skills/scripts/install.sh --target claude --all
```

### "Skill validation failed for X"

The skill folder is missing a required `SKILL.md` file. Check:
```bash
ls skills/X/SKILL.md
```

If missing, the folder is not a valid skill and cannot be installed.

### Claude Code doesn't see the installed skills

Restart Claude Code entirely (close all sessions and reopen). The skill list is loaded at startup.

### Symlinking breaks after moving the repo

If you moved the repo to a different path and symlinks are now broken, reinstall:
```bash
bash skills/install-skills/scripts/install.sh --target claude --all --symlink
```

The script will overwrite broken symlinks.

## References

- [Agent Paths Reference](references/agent-paths.md) -- Detailed paths for each agent
- [SKILL.md Specification](references/skill-spec.md) -- How to structure a skill document
