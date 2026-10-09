---
name: skill-research
description: Guides the discovery, design, validation, and delivery of Agent Skills. Use when identifying skill gaps, creating or revising a SKILL.md, improving skill descriptions, or checking a skill against the Agent Skills specification.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.1
  source_repo: aigb-skills
  source_path: skills/skill-research/SKILL.md
---
# Skill Research

## Instructions

### Phase 1: Discovery
1. Read `skills/install-skills/references/agent-paths.md` and resolve the current agent skills directory before scanning anything.
2. Scan the resolved skills directory and read only the YAML frontmatter `description` field of each existing skill.
3. Categorize existing skills (code quality, testing, CI/CD, infrastructure, language-specific, utilities) to map the agent's current footprint.
4. Identify gaps by checking `AGENTS.md`, recent commit histories, and active repos for repetitive workflows or underserved ecosystems that produce inconsistent outputs.
5. Validate gaps against real work -- a genuine gap affects actual project tasks, not hypothetical ones.

### Phase 2: Design
1. **Scope narrowly:** One skill = one focused capability. If the description needs "and," split it.
2. **Standardized name:** Use 1-64 lowercase letters, numbers, and single hyphens; match the parent directory name and do not start or end with a hyphen.
3. **Standardized description:** Put a concise description in YAML frontmatter, explain what the skill does and when to use it, and include specific task keywords that help agents identify relevant requests. Keep it within 1,024 characters.
4. **Progressive disclosure:** Keep the main `SKILL.md` focused on core instructions and under 500 lines or 5,000 tokens when practical. Move detailed material to focused files in `references/`, `scripts/`, or `assets/` and tell the agent when to load it.
5. **Useful structure:** Use headings, step-by-step procedures, examples, edge cases, checklists, or validation loops as appropriate. Do not require a fixed body layout or imperative wording for every sentence.
6. **Choose defaults:** When several tools or approaches are valid, recommend one default and mention alternatives only when they materially help.

### Phase 3: Validation
1. **Specification test:** Check that `SKILL.md` begins with valid YAML frontmatter containing `name` and `description`, that the name matches the parent directory, and that optional metadata uses supported fields or a `metadata` mapping.
2. **Actionability test:** Confirm that the workflow gives clear, reusable procedures, examples, or checks for the target task. Use imperative steps where sequence and consistency matter, but allow explanatory context when it improves decisions.
3. **Boundary test:** Compare against the 2-3 closest existing skills. Add a cross-reference note if boundaries overlap.
4. **Token efficiency test:** Delete any sentence, adjective, or background explanation that can be removed without losing the core instruction.
5. **Progressive-disclosure test:** Keep core guidance in `SKILL.md`; move detailed references, templates, and executable helpers to focused supporting files with relative links or explicit load conditions.
6. **Description test:** Check that the description is specific about capabilities and activation contexts, stays within 1,024 characters, and avoids broad or vague triggers.

### Phase 4: Delivery
1. Create the resolved skills directory and write to `<resolved-skills-dir>/<name>/SKILL.md` using the canonical agent-path rules.
2. Include only the frontmatter fields needed by the skill. Use `license`, `compatibility`, `allowed-tools`, and `metadata` according to the Agent Skills specification; do not duplicate frontmatter values as required body headers.
3. Organize the body with headings and the content formats that best support the workflow, such as examples, edge cases, checklists, or validation loops.
4. Use relative paths from the skill root for references, scripts, and assets. Keep references focused and avoid deep chains of linked files.
5. Report: skill name, description, line count, and related existing skills.

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Deep-reading all skills | Wastes token context | Read only YAML frontmatter descriptions during discovery |
| Multi-topic skills | Causes routing confusion | Split into single-purpose skills |
| Unstructured procedures | Steps or decisions get skipped | Use headings, numbered steps, checklists, examples, or validation loops as appropriate |
| Over-explaining | Wastes tokens on known info | Assume competence; focus on workflow |
