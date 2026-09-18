# Agent Skill Directory Paths

This reference lists where each supported coding agent looks for skills.

## Agent Directory Locations

| Agent | OS | Path | Environment Variable |
|---|---|---|---|
| **Claude Code** | Linux/macOS | `~/.claude/skills/` | `$HOME/.claude/skills` |
| | Windows | `%APPDATA%/.claude/skills/` | `%APPDATA%/.claude/skills` |
| **Cursor** | Linux/macOS | `~/.cursor/skills/` | `$HOME/.cursor/skills` |
| | Windows | `%APPDATA%/.cursor/skills/` | `%APPDATA%/.cursor/skills` |
| **GitHub Copilot** | Linux/macOS | `~/.github/skills/` | `$HOME/.github/skills` |
| | Windows | `%APPDATA%/.github/skills/` | `%APPDATA%/.github/skills` |
| **Pi** | Linux/macOS | `~/.pi/agent/skills/` | `$HOME/.pi/agent/skills` |
| | Windows | `%APPDATA%/.pi/agent/skills/` | `%APPDATA%/.pi/agent/skills` |

## Creating Directories

If a directory doesn't exist, create it with the matching path for your OS:

```bash
# Claude Code
mkdir -p ~/.claude/skills/

# Cursor
mkdir -p ~/.cursor/skills/

# GitHub Copilot
mkdir -p ~/.github/skills/

# Pi
mkdir -p ~/.pi/agent/skills/
```

On Windows, use `%APPDATA%` or the full Roaming path if you are creating the directory manually. The installer handles that resolution automatically.

## Verifying Installation

Check what skills are currently installed:

```bash
ls ~/.claude/skills/
# Lists all skill folders

ls -l ~/.claude/skills/
# Shows whether entries are symlinks (->) or copies
```

## Cross-Platform Expansion

On Unix-like systems, `~` expands to `$HOME` or the user's home directory. On Windows, use `%APPDATA%` or the full Roaming path (for example, `C:\Users\YourName\AppData\Roaming\.claude\skills\`).

The `install.sh` script handles this resolution automatically for the target platform.
