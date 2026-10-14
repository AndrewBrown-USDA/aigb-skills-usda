---
id: "0001"
title: "Record Architecture Decisions"
status: "Accepted"
date: 2026-10-12
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "Repository Inception"
---

# 1. Record Architecture Decisions

## Context and Problem Statement
In fast-moving development workflows involving multiple agents, small-model task workers, and wave orchestration, important technical decisions are frequently made during planning sessions or emergent bugfixes. While planning files (`planning/`) capture these decisions incrementally, they may be untracked or cleared across sessions to compact context. Relying on commit diffs or backwards-tracing through logs makes it difficult for subsequent agents and developers to understand the current architectural constraints and rationale.

## Decision Drivers
* Need for a persistent, version-controlled source of architectural truth.
* Clear distinction between transient task execution details and enduring architectural rules.
* Transparent living state showing active decisions vs superseded decisions.
* Native integration into planning (`plan-wave`) and execution (`wave-orchestration`).

## Considered Options
1. Retain all decisions only in `planning/EXECUTION_PLAN_N.md` and `planning/STATE_N.md`.
2. Commit unstructured decision summaries in PR descriptions.
3. Adopt Architecture Decision Records (ADRs) tracked in `docs/decisions/` with active/superseded status.

## Decision Outcome
Chosen option: "Adopt Architecture Decision Records (ADRs) tracked in `docs/decisions/`", because it provides a standardized, immutable historical log while exposing an indexed living baseline of active system constraints.

### Consequences
* **Positive**: Architectural constraints are easily ingested during pre-wave reconnaissance.
* **Positive**: Decisions outlive temporary planning files and compaction cycles.
* **Negative**: Requires maintainers and orchestrators to curate ADRs rather than solely relying on transient plan notes.

## Validation & Compliance
Validated via `docs/decisions/README.md` index and integration with `skills/adr-distillation`.
