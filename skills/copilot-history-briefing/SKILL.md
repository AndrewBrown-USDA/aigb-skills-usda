---
name: copilot-history-briefing
description: Reads Copilot conversation history and extracts executive-ready success stories. Use when the user asks to study prior Copilot sessions, summarize what was done before, mine evidence, or quantify time, cost, risk, and priority alignment from GitHub Copilot history in any workspace or repository.
version: 1.3
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
---

# Copilot history briefing

Use this skill to turn Copilot conversation history into evidence-backed briefing material.

## Dependencies and setup

- Query the Copilot session store tables directly with SQL: `sessions`, `turns`, `checkpoints`, `session_files`, and `session_refs`.
- Use `search_index` only when it exists and you need faster keyword discovery.
- The local store is the SQLite database at `~/.copilot/session-store.db` on the current machine; per-session state files live under `~/.copilot/session-state/<session-id>/session.db`.
- Use local for this machine's SQLite history at `~/.copilot/session-store.db`; use cloud only for populated shared history through the agent runtime's cloud-backed path.

## Process

1. Start with a small test search.
   - Search the most recent and most relevant sessions first.
   - Use narrow filters by date, summary, repo, branch, session id, or request keywords.
   - Widen the search only if the first pass misses likely sessions.

2. Build the session set.
   - Identify the sessions that actually support the request.
   - For each candidate, capture the session id, summary, date, and the turns or checkpoints that matter.
   - If the user asked for prior history, include both direct matches and closely related sessions that reveal reusable themes.
   - If a candidate overlaps an existing story topic, expand the existing story instead of creating a duplicate.

3. Read the evidence.
   - Pull the turns, checkpoints, artifacts, and refactor notes that show what changed.
   - Capture concrete details: before/after state, blockers, corrections, benchmarks, tests, and user decisions.
   - Cite only what is needed to support each claim.
   - Before summarizing, build a detail-rich working record for each candidate story:
     - starting condition or pain point
     - Copilot-assisted intervention
     - concrete output or artifact created
     - authoritative source, system, dataset, or workflow involved
     - users or staff affected, if supported by the history
     - constraints, reversals, corrections, or user decisions that shaped the final result
     - follow-up work, reusable helper, package, report, or process that came out of the session
   - Keep distinct efforts separate in the working record. Do not merge related projects just because they share a domain, repository, package, or data source.

   Query strategy:
   - Start with `sessions` to find candidate stories. Narrow by `created_at`, `repository`, `cwd`, `branch`, or `summary` before you touch turn text.
   - If metadata is too thin, search `search_index` for repo names, skill names, issue numbers, or other distinctive phrases, then reuse the matching `session_id`s in the next table.
   - Read `checkpoints` for compact session summaries, `turns` for the actual conversation, and `session_files` / `session_refs` for files, commits, PRs, or issues tied to a session.
   - Use two steps: first identify the relevant `session_id`s, then query only those sessions for the evidence table you need.
   - Keep queries narrow: use a date window, select only needed columns, and add `LIMIT` early.
   - Treat the SQL below as a template and replace the placeholders with the repository, workspace, time window, and session ids you need.

   Example pattern:
   ```sql
 -- step 1: find candidate sessions
   SELECT id, created_at, repository, cwd, summary
   FROM sessions
   WHERE created_at > now() - INTERVAL 'REPLACE_ME_DAYS days'
    AND (
      repository ILIKE '%REPLACE_ME_REPOSITORY%'
      OR cwd ILIKE '%REPLACE_ME_WORKSPACE_FRAGMENT%'
    )
   ORDER BY created_at DESC
   LIMIT REPLACE_ME_LIMIT;

 -- step 2: inspect the conversation for the sessions you picked
   SELECT session_id, turn_index, user_message, assistant_response, timestamp
   FROM turns
   WHERE session_id IN (REPLACE_ME_SESSION_ID_LIST)
   ORDER BY session_id, turn_index
   LIMIT REPLACE_ME_LIMIT;

 -- optional: pull the compact evidence trail for those same sessions
   SELECT session_id, created_at, title, overview
   FROM checkpoints
   WHERE session_id IN (REPLACE_ME_SESSION_ID_LIST)
   ORDER BY session_id, created_at
   LIMIT REPLACE_ME_LIMIT;
   ```
   - `REPLACE_ME_REPOSITORY`: use a repository name or fragment that matches your local or cloud session metadata.
   - `REPLACE_ME_WORKSPACE_FRAGMENT`: use a unique substring from the workspace path or cwd for your environment.
   - `REPLACE_ME_DAYS`: use the date window you want to inspect, such as `7`, `30`, or `90`.
   - `REPLACE_ME_SESSION_ID_LIST`: use a comma-separated list of session IDs, or replace this block with the exact filter your SQL dialect expects.
   - `REPLACE_ME_LIMIT`: use the maximum row count appropriate for the query stage.

4. Extract success-story material.
   - First create a detail-rich working brief. It may be longer and more technical than the final answer, because its purpose is to preserve enough raw material for later distillation.
   - In the working brief, keep project-level specifics such as package names, report types, data sources, commands, files, issue numbers, and user decisions when they help explain what actually changed.
   - Only generalize in the final audience-facing text. Preserve enough specificity that the claim can still be traced back to one concrete effort rather than a generic theme.
   - When adapting for a broad audience, generalize jargon into the workflow category first, then keep one or two concrete details that prove the story. For example, "soil report routing based on authoritative ownership records" is better than only "improved reports."
   - Translate technical outcomes into executive language.
   - Lead with the business or operational outcome, not the implementation log.
   - Make the analyst or team the subject of the sentence; Copilot is the tool that helped.
   - Spell out acronyms on first use for executive-facing briefs. If the acronym is unclear, ask the user before using it.
   - Keep test counts, benchmark minutiae, failure details, troubleshooting notes, and "hot path" language out of the summary unless they are the point.
   - Look for time saved, work avoided, reliability improved, repeatability gained, manual steps removed, and risk reduced.
   - Include numbers whenever the history provides them. If it does not, say so plainly and do not invent them.
   - Prefer the strongest supported number or scale, then explain its business significance in plain language.
   - Prefer clean outcome metrics over work-log details or measurement mechanics.
   - Call out organization-, program-, or administration-level priorities only when the history supports the connection.

5. Synthesize by audience.
   - For non-technical executives, lead with business value, operational impact, and measurable change.
   - For technical readers, add implementation detail after the executive summary.
   - Prefer a short list of strong stories over a long list of weak ones.

## Output shape

When the user wants a briefing, use this structure:

```markdown
# Executive summary
[1-3 paragraphs on the overall themes, what Copilot accelerated, and why it matters]

## Best story candidates
| Story | Why it matters | Evidence | Metrics |
| --- | --- | --- | --- |
| ... | ... | session ids / turns | quantitative details if available |

## Priority alignment
- Organization priorities:
- Program priorities:

## Gaps
- Missing metrics
- Missing evidence
- Follow-up sessions to inspect
```

When the user wants a short GitHub issue-style evidence post, use this structure instead:

```markdown
# GitHub Copilot Evidence

## What I used it for
[First-person summary of the work, framed around the user's role and recurring workflow needs]

## Time savings
[Supported qualitative or quantitative savings. If exact numbers are not defensible, say that plainly and describe the form of avoided rework.]

## Examples

**[Workflow or project name].** [Specific before/after with one effort per paragraph. Include the output, source system, or staff-facing result when supported.]
```

For intermediate drafts or when the user asks to preserve more detail, include a working evidence section before or after the final summary:

```markdown
## Working story details

### [Candidate story]
- Starting point:
- Copilot-assisted change:
- Output or artifact:
- Source system, dataset, or workflow:
- Users or staff affected:
- Constraints, corrections, or user decisions:
- Evidence:
- Metrics:
- Public-facing framing:
```

The working section is allowed to be more granular than the final post. It exists so the final story can be distilled from real details rather than generic claims.

## Gotchas

- Start large-history searches with a time filter.
- Narrow the session set before searching broad turn text.
- Prefer exact identifiers and session metadata before free-text search.
- Report only savings, cost avoidance, or priority alignment that the history supports.
- Keep technical notes, test counts, benchmark minutiae, and failure details out of the executive summary unless they are the point.
- Keep "hot path" and similar internal debugging language out of the executive summary.
- Use plain declarative sentences unless a contrast is genuinely necessary.
- Spell out each acronym on first use, then use the acronym only if the audience is likely to recognize it.
- Use reader-meaningful names in public-facing summaries; include internal folder names, script paths, helper names, and issue numbers only when they matter to the reader or the user explicitly wants technical detail.
- Use plain domain language when it is accurate and keep labels simple.
- Pair any outcome phrase with the specific workflow change or artifact that supports it.
- Keep the analyst or team as the subject of the story; Copilot is the accelerator, not the primary actor.
- If an acronym is not clearly defined in the repository docs or the history, ask the user before using it.
- If the user wants artifacts or a reusable writeup, create a folder per story and keep the executive summary self-contained.
- If the history is thin, return the strongest evidence you found instead of stretching weak matches.

## Completion criterion

The briefing is done when:

- every recommended story is backed by identifiable session evidence,
- every recommended story has a clear before/after or measured outcome, and
- every quantitative or priority claim is either supported or explicitly marked as missing.
