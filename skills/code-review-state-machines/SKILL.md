---
name: code-review-state-machines
description: Reviews explicit and implicit state machines in application code. Traces lifecycle behavior, finds reachable transition defects and unclear state, and proposes focused fixes. Use for workflow, async, lifecycle, or state-management reviews. Reports findings; does not change code.
license: MIT
metadata:
  author: Andrew Brown
  version: 1.0.0
  source_repo: aigb-skills
  source_path: skills/code-review-state-machines/SKILL.md
  group: quality-assurance
  loadouts: software-delivery,code-quality,plan-review
---
# State-Machine Code Review

Review application behavior through its explicit and implicit state machines.
Explain how each lifecycle works, find where it fails or becomes unclear, and
propose the smallest useful fixes. Do not implement them.

Consider user experience (UX), developer experience (DX), and agent experience
(AX) together.

## What counts as a state machine

A state machine is behavior where the current state and an event determine
what can happen next.

An explicit state machine declares states and transitions. An implicit one
encodes them through flags, nullable fields, timestamps, branches, callbacks,
routes, or database records.

Examples include onboarding, authentication, form submission, publishing,
payments, background jobs, retries, synchronization, and agent execution.

## Scope and priority

Use the requested files, diff, feature, or repository as the review scope.

Start with state fields and conditions that drive user-facing decisions:
available actions, progress, success or failure feedback, navigation, and
saved outcomes. For a diff, focus on the decisions it changes.

Trace who writes those fields and which events trigger them. Follow readers
and callers only as far as needed to establish ownership, an invariant, or a
specific failure path. Check adjacent machines when an issue crosses their
boundary. Do not inventory unrelated state.

Group related behavior by lifecycle and ownership. Separate control states
from their data and derived views. Keep independent state dimensions separate
instead of listing every possible combination.

## Review steps

### 1. Reconstruct the lifecycle

Look for lifecycle fields, flag combinations, branches, reducers, effects,
async callbacks, retries, timers, queues, and persistence boundaries.

For each meaningful machine, establish:

- **States:** initial, intermediate, terminal, and recovery conditions.
- **Transitions:** triggering events, guards, destinations, and side effects.
- **Ownership:** authoritative state, writers, and derived representations.
- **Invariants:** facts that must stay true throughout the lifecycle.
- **Interactions:** dependencies on other machines and external operations.

When transitions depend on library events or callbacks, check the installed
version's behavior in source, tests, or matching documentation. Verify event
ordering, delivery conditions, error handling, and cancellation behavior.
Do not infer these from event names. If you cannot verify them, name the
assumption.

Ground the reconstruction in source and tests. Mark inferred or unknown
behavior, and distinguish intended behavior from what the code does.

### 2. Find reachable problems

Check for:

- Invalid or contradictory state combinations.
- Missing guards, unsupported transitions, and dead ends.
- Hidden, duplicated, or apparently unreachable states.
- Competing writers and state representations that drift apart.
- Stale responses, reordered events, duplicate execution, and lost updates.
- Incomplete cancellation, timeout, retry, and recovery behavior.
- Partial failure between state changes and external effects.
- UI feedback or available actions that conflict with actual state.
- Transitions that developers or agents cannot find or interpret reliably.

For each suspected defect, trace a feasible path from an application entry
point: a UI action, route, API, supported exported interface, worker, or
external event. Account for upstream guards, validation, authorization, and
library guarantees.

A direct call to an internal helper with impossible input is not an
application defect. If reachability is unclear, report what condition needs
investigation instead of calling it a confirmed bug. Separate internal
hardening from reachable failures.

Each finding must show a concrete failure path or a specific maintenance
burden. For a race, show the event order that breaks an invariant. Do not call
an implicit representation or the lack of a state-machine library a defect
on its own.

### 3. Propose a focused fix

Prefer the smallest change that restores an invariant, clears up state, or
makes transitions easier to understand and verify.

Consider guards, derived state, single ownership, explicit events, tagged
states, transition functions, and clearer feedback before adding
infrastructure.

Evaluate each fix across:

- **UX:** clarity, predictable behavior, feedback, and recovery.
- **DX:** explicit behavior, maintenance, observability, and testing.
- **AX:** states, legal next actions, and clear outcomes.

Prefer improvements across all three. Neutral impact is fine. State tradeoffs
instead of hiding a regression in a combined score. Preserve existing
contracts unless you explicitly propose a behavior change.

## Severity

Rate impact separately from confidence:

- **Critical:** a reachable failure with severe effects, such as permanent
  data loss, an authorization bypass, or widespread failure of a core flow.
- **High:** a reachable failure that blocks a core flow, gives a materially
  wrong result, or needs costly recovery.
- **Medium:** bounded incorrect behavior, misleading state, or a recoverable
  workflow failure.
- **Low:** a minor inconsistency, concrete maintenance burden, or optional
  hardening without a demonstrated user-facing failure.

Consider affected users, triggering conditions, and recovery when rating
severity. For unconfirmed issues, mark severity as potential and state what
needs to be established.

## Output

Start with a short assessment of the scope, overall findings, and meaningful
coverage gaps.

Then list review areas by impact, highest first. Each item must stand alone as
a prompt for a separate implementation session.

### 1. [Severity] [Lifecycle or workflow]: [issue or recommended outcome]

- **Behavior:** Summarize current states, transitions, ownership, and the key
  invariant. Use a short transition chain when helpful.
- **Problem:** Show the reachable entry point, event sequence, incorrect
  outcome, impact, and source locations. For maintenance findings, describe
  the concrete burden. State uncertainty and any library behavior the finding
  depends on.
- **Fix:** Propose the smallest coherent change and its implementation boundary.
  State expected UX, DX, and AX effects. Include tradeoffs, compatibility
  risks, or migration and rollback needs only when relevant.
- **Verify:** Give observable acceptance criteria and regression cases for the
  existing test setup. If there is no suitable test, give a reproducible manual
  scenario with setup, actions or event order, and expected results. If manual
  checks are impractical, name the smallest focused harness or instrumentation
  needed and mark validation as pending. Do not require a general-purpose test
  framework. Separate proposed checks from checks already run.

Keep each item concise but include enough evidence to act on it.

Group issues that should be fixed together. Separate issues that need
independent implementation sessions. Mention dependencies only when they
change the order of work.

Briefly note healthy workflows at the end. Do not create findings just to fill
the format.

Number items only within the current review. Do not add persistent machine
IDs, finding IDs, or a separate handoff catalog.
