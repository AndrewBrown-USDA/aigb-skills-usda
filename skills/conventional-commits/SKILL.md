---
name: conventional-commits
description: Create, classify, validate, and explain commit messages using Conventional Commits v1.0.0, with repository-aware type, scope, footer, and breaking-change guidance. Use when drafting or reviewing a commit message.
license: MIT
metadata:
  group: developer-tooling
  loadouts: software-delivery,git-practices,wave-delivery
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/conventional-commits/SKILL.md
  source_url: https://github.com/AndrewBrown-USDA/aigb-skills.git
---

# Conventional Commits

Use this skill to draft or review one commit message. Apply Conventional Commits v1.0.0 first, then report repository-specific style concerns separately.

## When to Use

Use this skill when you need to:

- draft a commit message from a change description;
- classify a change by its primary purpose;
- review a proposed commit message;
- explain a type, scope, footer, or breaking-change marker;
- suggest a corrected message without inventing technical details.

Do not use this skill for commit-history intervals, churn metrics, architectural convergence, release automation, or changelog generation. Use `git-history-interval-study` for history analysis and `adr-distillation` for enduring architectural decisions.

## Message Format

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

The header requires a type, the `: ` separator, and a non-empty description. A scope is optional and normally names the affected area. A body and footers are optional and follow a blank line.

Examples:

```text
feat(export): add GeoJSON output

fix(auth)!: reject expired sessions

docs: clarify installation steps

fix(parser): handle empty input

Refs: #123
Reviewed-by: Example User
Change-Id: Iabc123
BREAKING CHANGE: callers must pass an explicit format
```

Do not require a scope, body, or footer when the message is otherwise valid.

## Default Type Taxonomy

Use the change's primary purpose. Recommend separate commits when independent changes can be separated.

| Type | Use for |
|---|---|
| `feat` | A new user- or system-facing capability |
| `fix` | Incorrect, unintended, or failing behavior |
| `perf` | A performance or resource-use improvement |
| `refactor` | Behavior-preserving restructuring |
| `docs` | Documentation-only changes |
| `test` | Test-only changes |
| `build` | Build tools, dependencies, or packaging |
| `ci` | Continuous-integration or delivery configuration |
| `style` | Non-functional formatting or style |
| `chore` | Maintenance not covered by a more specific type |
| `revert` | Reversal of an earlier commit |

Conventional Commits gives normative meaning to `feat` and `fix`. The remaining types are an allowed project taxonomy and may be overridden by repository guidance.

When categories overlap, choose the primary purpose:

- use `perf` when performance is the main objective, otherwise `refactor`;
- use `fix` when correcting runtime behavior is the main objective, otherwise `build` for dependency or packaging work;
- use `ci` for delivery automation and `test` for tests or test behavior;
- use `docs` for documentation content and `build` or `ci` when documentation automation is the main change.

## Breaking Changes

A breaking change may be marked in the header:

```text
refactor(api)!: replace the response contract
```

or in a footer:

```text
refactor(api): replace the response contract

BREAKING CHANGE: clients must use the new response fields
```

Both forms may be used together. Recognize `BREAKING CHANGE:` and `BREAKING-CHANGE:`. A breaking change may accompany any type.

Treat the breaking-change token as the uppercase special footer form. General type casing may be accepted by a standards-oriented review, but lowercase types remain the repository style recommendation.

## Bodies and Footers

Use a body when context, motivation, or consequences need explanation. Use footers for issue references, acknowledgments, metadata, or breaking-change details.

Valid footer shapes include:

```text
Token: value
Token #value
```

Ordinary footer tokens must not contain whitespace. Use a hyphen for multiword tokens, such as `Reviewed-by`. `BREAKING CHANGE` is the special exception.

Do not claim that `Fixes`, `Refs`, `Closes`, or other issue-reference tokens are required by Conventional Commits. Preserve repository-specific footer conventions when they exist.

## Drafting Workflow

1. Identify the change's primary purpose.
2. Select the most specific applicable type.
3. Add a useful scope when the affected area is known.
4. Mark a breaking change with `!`, a breaking footer, or both.
5. Write a concise description after `: `.
6. Add a body or footer only when it adds necessary context.
7. Ask for clarification instead of inventing technical details.

Prefer a single-sentence subject. Do not put orchestration, wave, or phase numbers in the subject; record those in planning artifacts instead.

## Review Workflow

1. Parse the type, optional scope, optional `!`, and description.
2. Verify the `type: description` structure and exact colon-plus-space separator.
3. Check blank-line separation before bodies and footers.
4. Check footer token syntax.
5. Identify breaking changes from either supported indicator.
6. Apply the primary-purpose taxonomy.
7. Check repository-specific types, scopes, casing, and footer conventions.
8. Report concrete findings and a corrected message when useful.

Return this shape:

```text
Status: Valid | Invalid | Valid with project-specific concerns

Findings:
- ...

Suggested message:

<suggested type>[optional scope][!]: <suggested description>
```

Use `Invalid` for malformed or incomplete Conventional Commit syntax. Use `Valid with project-specific concerns` when the standard is satisfied but local style or policy should be improved.

## Repository Boundaries

- `git-history-interval-study` owns commit-range analysis, churn, type distributions, and architectural convergence.
- `adr-distillation` may use commit messages as evidence, but a message alone does not prove an enduring architectural decision.
- `plan-wave` and `wave-orchestration` own planning state, task reports, dependencies, and execution metadata.
- Repository-specific types and scopes take precedence as policy, but optional standard elements must not be made mandatory without explicit local guidance.

Reference: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).
