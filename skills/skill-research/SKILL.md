---
name: skill-research
description: Guides evidence-driven discovery, design, validation, and delivery of Agent Skills. Use when identifying skill gaps, creating or revising a SKILL.md, improving routing descriptions, comparing skill behavior, or checking a skill against the Agent Skills specification.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.1.1
  source_repo: aigb-skills
  source_path: skills/skill-research/SKILL.md
---
# Skill Research

## Operating contract

Before starting, record:

- the research question and working hypotheses;
- the target ecosystem, organizations, and repositories;
- in-scope and out-of-scope evidence;
- the requested deliverable;
- stopping criteria;
- the mode: `research-only`, `design`, `implementation`, or `validation-only`.

Do not silently turn a research request into implementation. If the requested mode is unclear, preserve the evidence and recommendation without changing files.

## Reference loading

Read only the reference needed for the current phase:

- Read `references/agentskills-spec.md` for frontmatter, naming, compatibility, or progressive-disclosure rules.
- Read `references/authoring-best-practices.md` when designing or restructuring a skill.
- Read `references/research-evidence.md` when gathering evidence or recording claims.
- Read `references/trigger-evaluation.md` when testing description routing.
- Read `references/skill-evaluation.md` when comparing outputs or revisions.
- Read `references/validation-tools.md` when using `skills-ref`.

Use direct relative links from the skill root. Keep references one level deep; do not recursively load unrelated references.

## Phase 1: Discovery

1. Read `skills/install-skills/references/agent-paths.md` and resolve the current agent skills directory before scanning.
2. Scan that directory and read only each skill's YAML frontmatter `description`.
3. Categorize the footprint: code quality, testing, CI/CD, infrastructure, language-specific, research, and utilities.
4. Search the current repository, `AGENTS.md`, recent history, active related repositories, upstream implementations, and official specifications in that order.
5. Record search queries, repositories considered, negative results, inaccessible sources, and API/search failures. A failed or empty search is not proof of absence.
6. Validate each candidate gap against real work, such as repeated tasks, corrections, traces, or inconsistent outputs.

For code or repository claims, capture the full repository, path, line range, and immutable commit or ref whenever available. Separate observed facts, inferences, and proposals.

## Phase 2: Design

1. Scope narrowly: one skill provides one focused capability. Split a capability when its description requires unrelated "and" clauses.
2. Use a lowercase directory-matching name of 1-64 letters, numbers, and single hyphens.
3. Write a specific description with capabilities and activation contexts; keep it within 1,024 characters.
4. Keep trigger-critical guidance inline, and move detailed procedures, examples, and tools into focused references.
5. Choose one default approach; mention alternatives only when they materially affect the decision.
6. Compare the candidate with two or three neighboring skills and record overlap, handoff conditions, and explicit non-goals.

For every candidate gap, inspect implementation, tests, examples, configuration, history, and issue or pull-request context where available. Seek a second independent signal and record uncertainty and rejected alternatives.

## Phase 3: Validation

1. Run the specification, actionability, boundary, token-efficiency, progressive-disclosure, and description checks.
2. Verify every internal Markdown link resolves from the skill root, stays within the skill directory, and uses no deeper-than-one-level reference chain.
3. Ensure every reference has a loading condition, every durable rule has one canonical source, and examples and version-sensitive URLs are current.
4. Snapshot the current skill and compare realistic evaluation cases against the prior version or a no-skill baseline when behavior changed.
5. Record trigger rate, output quality, token use, duration, qualitative findings, and regressions. Preserve failure patterns for future revisions.

## Phase 4: Delivery

1. In `implementation` mode, write `<resolved-skills-dir>/<name>/SKILL.md` using the canonical agent-path rules; otherwise report recommendations without modifying the resolved directory.
2. Use only needed frontmatter fields and keep repository-specific synchronization metadata under `metadata`.
3. Use relative paths for references, scripts, and assets. Keep supporting material focused.
4. Report an executive summary, scope and search strategy, repositories and sources consulted, evidence table, gaps and confidence, boundary comparison, recommendation, unresolved uncertainty, failed or inaccessible searches, and immutable citations.
5. Include the skill name, final description, line count, and related skills.

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Is Bad | Fix |
|---|---|---|
| Deep-reading all skills | Wastes context before a gap is known | Read frontmatter first; load details on demand |
| Multi-topic skills | Causes routing confusion | Split into focused capabilities |
| Unsupported gap claims | Turns assumptions into requirements | Require independent evidence and confidence |
| Silent search failures | Makes absence claims unreliable | Record scope, failures, and inaccessible sources |
| Duplicated guidance | Causes drift between copies | Keep one canonical procedure and route to it |
| Unstructured procedures | Steps or decisions get skipped | Use headings, numbered steps, checklists, and validation loops |
