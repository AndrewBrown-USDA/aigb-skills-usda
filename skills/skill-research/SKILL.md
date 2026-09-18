---
name: skill-research
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Guides the research, design, and validation of new SKILL.md files for the Pi coding agent ecosystem. Use when tasked with identifying skill gaps or designing new agent capabilities.
version: 1.0
---

# Skill Research

## Instructions

### Phase 1: Discovery
1. Read `skills/install-skills/references/agent-paths.md` and resolve the current agent skills directory before scanning anything.
2. Scan the resolved skills directory and read only the `# Description` line of each existing skill.
3. Categorize existing skills (code quality, testing, CI/CD, infrastructure, language-specific, utilities) to map the agent's current footprint.
4. Identify gaps by checking `AGENTS.md`, recent commit histories, and active repos for repetitive workflows or underserved ecosystems that produce inconsistent outputs.
5. Validate gaps against real work -- a genuine gap affects actual project tasks, not hypothetical ones.

### Phase 2: Design
1. **Scope narrowly:** One skill = one focused capability. If the description needs "and," split it.
2. **Standardized name:** lowercase-hyphen format (e.g., `python-code-style`, not `python-utils`).
3. **Standardized description:** Match exactly: `# Description: [action] [target]. Use when [context].`
4. **Atomic steps:** Numbered list of imperative actions. No paragraphs or conversational prose.
5. **Keep it succinct:** Target <100 lines.
6. **Define triggers:** Include 3-5 semantic trigger words or intents in the description that signal when this skill should be invoked.

### Phase 3: Validation
1. **Actionability test:** Every instruction step must begin with an imperative verb (Run, Check, Write, Remove, Scan).
2. **Boundary test:** Compare against the 2-3 closest existing skills. Add a cross-reference note if boundaries overlap.
3. **Token efficiency test:** Delete any sentence, adjective, or background explanation that can be removed without losing the core instruction.
4. **Line count check:** If the draft exceeds 100 lines, split into two skills.

### Phase 4: Delivery
1. Create the resolved skills directory and write to `<resolved-skills-dir>/<name>/SKILL.md` using the canonical agent-path rules.
2. Final file layout:
   - Header: `# Name:` and `# Description:`
   - `## Instructions` with numbered list
   - Optional `## Example` with **Before:** and **After:** blocks
   - Optional `## Anti-Patterns to Avoid` table
3. Report: skill name, description, line count, and related existing skills.

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Deep-reading all skills | Wastes token context | Read only description headers during discovery |
| Multi-topic skills | Causes routing confusion | Split into single-purpose skills |
| Paragraph instructions | Steps get skipped | Use numbered, imperative steps |
| Over-explaining | Wastes tokens on known info | Assume competence; focus on workflow |
