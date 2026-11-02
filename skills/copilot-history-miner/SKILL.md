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

`scripts/adapters.js` exposes `loadSource(options)`, which synchronously returns
`{ raw, backend, incomplete_sources, errors }`. `raw` contains only observed
tables; `backend` is a reported label (`local`, `cloud`, or `unknown`), not a
driver selection; and `incomplete_sources` names tables observed as
`local:<table>:missing|partial` or `cloud:<table>:missing|partial`.

The implementation in `scripts/history_miner.js` exposes:

```js
discoverSessions(source, options)
loadSessionEvidence(source, sessionIds)
normalizeHistory(raw, options)
calculateMetrics(artifact, options)
mine(raw, options)
toNdjson(artifact)
```

`toNdjson` emits one manifest line followed by one typed line per record, so
callers can stream the artifact without adding a serialization dependency.

The miner accepts already-loaded source-shaped records so callers supply the
local SQLite or cloud adapter themselves. The skill ships no database driver and
no built-in network client: `loadSource` only reads a caller-provided filesystem
`root` or invokes a caller-provided `transport` function. Output is returned in
memory; callers explicitly choose whether to serialize JSON or NDJSON.
