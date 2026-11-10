# Agent Skill Directory Paths

Skill directories are agent-specific, not a universal standard. The examples
below are the Vercel Skills CLI's documented project and user paths, checked
2026-11-09. Confirm the current path with the relevant agent's documentation;
paths, supported agents, and platform behavior may change.

## Selected Agent Paths

| Agent | Project-level path | User-level path |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.agents/skills/` | `~/.cursor/skills/` |
| GitHub Copilot | `.agents/skills/` | `~/.copilot/skills/` |
| Pi | `.agents/skills/` | `~/.agents/skills/` |
| OpenAI Codex | `.agents/skills/` | `~/.agents/skills/` |

These are examples, not claims that every agent shares a path. See the
[Vercel Skills CLI supported-agents reference](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)
for its current full list and paths. The CLI's choices are not a guarantee of
skills.sh repository listing.

## Manual Installation

When copying or symlinking skill folders manually, use the directory documented
by the target agent. For example, a project-level install into `.agents/skills/`
can be made with:

```bash
mkdir -p .agents/skills
cp -R /path/to/aigb-skills-usda/skills/plan-first .agents/skills/
```

Or, to link the skill to the checkout:

```bash
ln -s /path/to/aigb-skills-usda/skills/plan-first .agents/skills/plan-first
```

Replace `.agents/skills/` with the target agent's project or user-level path.
On Windows, use the equivalent copy or directory-symlink command for the
target agent and shell.

The repository's own `skills install` command also accepts an explicit target
directory; its target need not match these examples. It installs the bundled
skills and does not fetch upstream sources. `skills sync` is a separate,
maintainer-only workflow.
