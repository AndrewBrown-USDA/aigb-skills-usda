# Copilot history miner contract

The miner emits a versioned artifact with deterministic JSON-compatible records.
Raw source records are never required in the artifact; normalized records retain
source references so consumers can trace each fact back to a session-store row.

## Artifact

```json
{
  "schema_version": "1.0",
  "miner_version": "0.1.0",
  "generated_at": "2026-01-01T00:00:00.000Z",
  "backend": "local|cloud|unknown",
  "query": {},
  "timezone": "UTC",
  "source_schema": {},
  "record_counts": {},
  "redaction_rules_version": "1",
  "incomplete_sources": [],
  "sessions": [],
  "turns": [],
  "checkpoints": [],
  "files": [],
  "refs": [],
  "usage": [],
  "tools": [],
  "metrics": [],
  "errors": []
}
```

Records use stable source identifiers where available and a content hash
fallback otherwise. The miner sorts records by source identifier, then by
timestamp and serialized content.

## Evidence values

Every derived fact or metric has:

- `kind`: `observed`, `derived`, `estimated`, or `inferred`.
- `evidence_tier`: `0` through `4`, from metadata to user-confirmed outcome.
- `confidence`: `high`, `medium`, `low`, or `unknown`.
- `source_refs`: normalized record identifiers supporting the value.
- `method_version`: stable definition identifier for derived values.
- `limitations`: explicit reasons the value may be incomplete or non-causal.

The miner never labels elapsed activity as time saved and never treats temporal
proximity between a session and a commit as proof of Copilot authorship.

## Normalized records

`session` records preserve identity, repository, workspace, branch, summary,
created/updated timestamps, and status (`complete`, `open`, `partial`, or
`unknown`). `turn`, `checkpoint`, `file`, `ref`, `usage`, and `tool` records
retain their session id plus source-specific identifiers and nullable fields.
Missing optional fields remain `null`; they are not silently replaced.

## Backend and joins

`loadSource({ backend, root, transport, query, session })` is synchronous and
returns `{ raw, backend, incomplete_sources, errors }`. `backend` defaults to
`auto`, whose detection precedence is: a readable filesystem `root` selects
`local`; otherwise a supplied `transport` function selects `cloud`; otherwise
the result is `unknown` with an explicit limitation. A supplied but unreadable
root falls back to `cloud` when a transport is also supplied, and the local
error is retained in `errors`. Async transports are rejected.

`backend` is a reported label (`local`, `cloud`, or `unknown`) describing which
path produced the records; it is not a driver selection. `incomplete_sources`
entries are `local:<table>:missing|partial` or `cloud:<table>:missing|partial`.

Adapters must feature-detect tables and columns before querying them. A backend
reports unavailable or partially read sources in `incomplete_sources` and
continues with the records it can validate. Git, GitHub, and CI integrations
are adapter contracts only: they accept validated session references and return
evidence records with source references, status, and limitations. They must not
be assumed available for local history mining.

## Privacy and redaction

Default output is local-only and contains no telemetry. Credentials, secrets,
query-string URLs, and complete local paths are redacted by built-in rules,
including nested sensitive-key values. Callers may add patterns for
organization-specific prompt or personal-data handling, but automatic
personal-name and arbitrary prompt-text detection is not promised. Built-in
rules cannot be disabled through caller patterns. The manifest records the
redaction rules version and any redaction errors.
