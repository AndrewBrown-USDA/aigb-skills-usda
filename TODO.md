# TODO

## Goal
Improve `skills/skill-research` using the findings in `planning\skill-research-improvements-research-report.md`, while keeping the main skill concise and adding focused, progressive-disclosure references.

## Tasks

### 1. Define the revised skill workflow
- [x] Rewrite `skills/skill-research/SKILL.md` to add explicit research modes, scope and stopping criteria, discovery failure handling, evidence/provenance requirements, candidate-gap validation, boundary checks, maintenance checks, evaluation guidance, and the standard delivery report shape.
- [x] Add a reference-loading section to `skills/skill-research/SKILL.md` with direct one-level links and phase-specific loading conditions.
- [x] Keep the main skill within the repository's practical progressive-disclosure target and preserve clear boundaries with `research`, `web-source-bundler`, and `install-skills`.

### 2. Add focused reference material
- [x] Create `skills/skill-research/references/agentskills-spec.md` covering normative frontmatter, naming, metadata, progressive-disclosure, and relative-path rules.
- [x] Create `skills/skill-research/references/authoring-best-practices.md` covering task-driven design, gotchas, defaults, validation loops, and deterministic helpers.
- [x] Create `skills/skill-research/references/research-evidence.md` defining source hierarchy, claim classifications, evidence-table fields, immutable references, and confidence handling.
- [x] Create `skills/skill-research/references/trigger-evaluation.md` defining positive/negative prompts, train/validation separation, repeated runs, and held-out retesting.
- [x] Create `skills/skill-research/references/skill-evaluation.md` defining baseline comparisons, realistic cases, objective assertions, qualitative review, and quality/token/duration tracking.
- [x] Create `skills/skill-research/references/validation-tools.md` documenting `skills-ref` commands and their boundary relative to repository validation.

### 3. Validate the packaged skill
- [x] Run `npm run validate:skills`.
- [x] Run `npm run test:validate`.
- [x] Review the final diff to confirm only `skill-research` and its new focused references changed.

### 4. Version and synchronize the skill
- [x] Bump `skills/skill-research/SKILL.md` `metadata.version` from `1.1` to the next patch version after the content changes.
- [x] Synchronize the completed `skill-research` package to `..\aigb-skills` using the repository's maintainer workflow, preserving the same version and reference files.
- [x] Verify both repositories contain matching `skill-research` content and that generated/catalog changes are limited to the required synchronization results.

## Notes
- The requested report path was absent; the confirmed source is `planning\skill-research-improvements-research-report.md`.
- Scope excludes `evals/evals.json`, validator changes, and new automated evaluation infrastructure.
- Bump the skill version and synchronize the final skill to `..\aigb-skills`; do not hand-edit generated catalog entries.
