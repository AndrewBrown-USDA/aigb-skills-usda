---
id: "0005"
title: "Use YAML Frontmatter as the Canonical Skill Metadata Source"
status: "Accepted"
date: 2026-10-24
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "EXECUTION_PLAN_12 / docs/design/skill-loadouts"
---

# 5. Use YAML Frontmatter as the Canonical Skill Metadata Source

## Context and Problem Statement

The repository needs one dependable place to define what each skill is and
how it relates to other skills. That metadata includes identity and
description, canonical and upstream information, organizational grouping,
loadouts, and dependencies.

The current parser intentionally supports top-level scalar fields and scalar
values under `metadata`, while the catalog is generated from
`skills/*/SKILL.md`. Introducing another metadata file would create competing
sources of truth.

## Decision Drivers

- Preserve frontmatter as the authoritative source for all skill metadata.
- Keep metadata compatible with the existing dependency-free parser.
- Allow metadata to describe groups, loadouts, required dependencies, and
  explicit optional dependencies.
- Preserve the separation between canonical package identity and upstream
  history required by ADR 0003.
- Keep generated catalog data derived and reproducible.
- Make migration additive for existing skills and catalogs.

## Considered Options

1. Keep all skill metadata in existing `SKILL.md` frontmatter.
2. Maintain separate metadata manifests for different feature areas.
3. Treat generated catalog JSON as the authoritative metadata store.

## Decision Outcome

Chosen option: **use existing `SKILL.md` YAML frontmatter as the canonical
metadata source, and derive all catalog metadata from it**.

Frontmatter owns skill identity, descriptions, grouping, loadout membership,
dependencies, versions, canonical package identity, and upstream history.
Loadouts use a lowercase kebab-case `loadout` label. Organizational `group`
labels do not imply expansion. Required and optional dependencies are
comma-separated scalar fields, normalized into arrays only in derived catalog
records.

Arrays, nested mappings, multiline values, tags, and anchors are outside the
parser contract. Existing skills without loadout fields remain valid. Optional
`inspired_by` credits the source of an idea without conferring authorship and
never replaces `author`.

### Consequences

- **Positive:** One source of truth; deterministic catalog regeneration;
  additive migration; no competing sidecar ownership; no new runtime
  dependency.
- **Negative:** Dependency declarations are less expressive than general YAML
  structures, and richer constraints require explicit future schema work.
- **Clarification:** `inspired_by` is attribution only. It is optional, is a
  non-empty scalar string, and carries no authority over identity, ownership,
  or provenance fields.

## Validation & Compliance

The metadata contract and focused fixtures must validate frontmatter parsing,
identifiers, duplicate and overlap rules, self-reference, provenance alias
agreement, and parser compatibility before catalog generation. This ADR
establishes the source-of-truth rule; ADR 0003 defines the narrower separation
between package identity and upstream history.
