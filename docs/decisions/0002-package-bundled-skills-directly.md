---
id: "0002"
title: "Package Bundled Skills Directly Without Network Sync"
status: "Accepted"
date: 2026-10-12
authors:
  - "Andrew G. Brown"
supersedes: null
superseded_by: null
source_context: "Packaging Strategy & CLI Design"
---

# 2. Package Bundled Skills Directly Without Network Sync

## Context and Problem Statement
Users installing skills in agent environments often operate in restricted sandbox networks or offline environments where `git clone` or access to upstream/sibling repositories fails. Previously, skills synchronization relied on maintainer checkouts or external git operations.

## Decision Drivers
* Zero external network dependencies for user installations (`npx skills install`).
* Predictable, reproducible CI validation that never requires upstream credentials.
* Clear boundary between public package users and private maintainer synchronization.

## Considered Options
1. On-demand git clone or submodule checkout during `skills install`.
2. Bundling curated, pre-materialized skills directly in `./skills/`.
3. Fetching skill archives from a remote CDN/registry at runtime.

## Decision Outcome
Chosen option: "Bundling curated, pre-materialized skills directly in `./skills/`", because it guarantees immediate, offline availability and eliminates runtime git/network failures for agents and end-users. Maintainer synchronization from upstream checkouts is isolated into a separate `skills sync` command.

### Consequences
* **Positive**: Reliable offline installation into target agent directories (`~/.agents/skills`, `~/.claude/skills`, etc.).
* **Positive**: CI validation (`npm run validate:skills`) runs standalone with no external clones.
* **Negative**: Repository contains materialized skill folders directly in version control.

## Validation & Compliance
Validated via `npm run validate:skills`, `scripts/validate-skills-test.js`, and `npx skills install`.
