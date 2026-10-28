# ADR 0003-0005 Scope Audit

Status: evidence record for task 16.3.1. This audit describes branch history;
it does not amend or replace the Accepted decisions.

## Evidence reviewed

| Commit | Historical change |
| --- | --- |
| `25f60a6` (`docs: record v0.3 architecture decisions`) | Introduced Accepted ADR 0003, separating canonical package identity from upstream provenance, and Accepted ADR 0004, separating bundled installation from maintainer synchronization. |
| `3fce8b8` (`docs(adr): clarify package and sync boundaries`) | Replaced the original 0003 and 0004 filenames and prose with clearer package-identity and install/sync-boundary wording. IDs, dates, Accepted status, source context, and substantive decisions were retained. |
| `83e48a4` (`docs(adr): record skill loadout architecture`) | Added Accepted ADR 0005, making `SKILL.md` frontmatter the canonical metadata source, together with loadout ADRs 0006 and 0007. |

The patch history shows editorial replacement for ADRs 0003 and 0004, not
decision reversal. The newer files narrow ambiguous terminology: package
identity controls installation; upstream data records history; user install is
offline and packaged; maintainer sync is the only workflow that may consult
upstream sources under its explicit policy.

## Scope finding

The earlier finding that ADRs 0003-0005 are active constraints outside the
runtime hardening scope is valid. ADR 0003 governs identity versus provenance.
ADR 0004 governs install versus sync. ADR 0005 governs frontmatter versus
generated catalog ownership. Task 16.3.1 changes documentation for resolver,
installer, API, and measurement behavior, but does not change any of those
three ownership boundaries.

Loadout hardening depends on these decisions: resolution selects packaged
records without following provenance; installation remains separate from
maintainer sync; and catalog loadout fields remain derived from frontmatter.
Nothing implemented in orchestration 16 provides evidence that those Accepted
choices are obsolete or harmful.

## Retention rationale

The active ADRs are retained rather than reverted because:

1. Their recorded decisions still match implementation and focused tests.
2. Commit `3fce8b8` clarified the same decisions instead of superseding them.
3. ADR 0005 adds a compatible metadata-ownership rule and does not conflict
   with ADRs 0003 or 0004.
4. Reverting an Accepted ADR would rewrite architectural history without a new
   conflicting decision, migration, or superseding ADR.
5. The correct place for current loadout details is ADRs 0006 and 0007 and the
   design contracts, leaving Accepted historical scope intact.

Accordingly, ADRs 0003-0005 remain Accepted and unmodified. ADR 0007 remains
Proposed because repaired protocol verification is not real curated-loadout
evidence; that evidence is blocked on orchestration 14.
