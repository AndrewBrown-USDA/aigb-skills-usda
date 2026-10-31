---
name: copilot-history-miner
description: Extracts bounded, normalized, provenance-rich evidence from local or cloud Copilot history for downstream reports without making causal or productivity claims.
license: MIT
metadata:
  version: 0.1.0
  author: Andrew G. Brown (https://github.com/brownag)
  source_repo: aigb-skills
  source_path: skills/copilot-history-miner/SKILL.md
  group: research-evidence
  loadouts: evidence-research,copilot-insights,architecture-history
---
# Copilot history miner

Use this skill to collect machine-readable Copilot history evidence for other
skills or reporting tools. It is an evidence extractor, not a briefing writer.

## Workflow

1. Select `local`, `cloud`, or `auto` backend and a bounded date, repository,
   workspace, branch, keyword, or explicit-session query.
2. Discover candidate sessions from metadata first. Do not scan turn text until
   candidate session ids are known.
3. Expand only selected session ids into turns, checkpoints, files, references,
   usage, and tool records supported by the backend.
4. Normalize records, redact sensitive content, deduplicate records, calculate
   versioned deterministic metrics, and emit JSON or NDJSON.
5. Preserve unknown, partial, unavailable, and estimated states in the manifest.

## Contract and privacy

Load `references/contract.md` for the normalized artifact contract and adapter
boundaries. The default is local-only, no telemetry, bounded output, and no raw
history persistence. Do not claim time saved, Copilot authorship, return on
investment, or business impact unless a downstream consumer has independent
supporting evidence.

## Artifact

The implementation in `scripts/history_miner.js` exposes:

```js
discoverSessions(source, options)
loadSessionEvidence(source, sessionIds)
normalizeHistory(raw, options)
calculateMetrics(artifact, options)
mine(raw, options)
```

It accepts already-loaded source-shaped records so callers can provide local
SQLite or cloud adapters without coupling this skill to a database driver.
Output is returned in memory; callers explicitly choose whether to serialize
JSON or NDJSON.
