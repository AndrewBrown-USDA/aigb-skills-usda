---
name: code-review-subtractive
description: Performs a read-only review of a code repository to find code that can likely be deleted or simplified without changing supported behavior. Use for subtractive, deletion, dead-code, legacy-path, unused-parameter, or repository minimization reviews.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.1
  source_repo: aigb-skills
  source_path: skills/code-review-subtractive/SKILL.md
  group: quality-assurance
  loadouts: software-delivery,code-quality,context-economy
---

# Subtractive Code Review

Find code that can be removed while preserving supported behavior.

Analyze only. Do not modify files, install tools, or run commands that may write files unless the user asks in a separate follow-up.

## Review standard

A finding must identify:

1. one deletion or net-subtractive change;
2. the invariant that preserves behavior;
3. repository evidence for that invariant; and
4. unresolved assumptions.

Use complexity scores, coverage gaps, warnings, linter output, and dead-code reports to find candidates, not to prove safety.

Do not call code safe to delete because it looks unused.

## Establish scope

Before reviewing:

1. Identify the repository root and user-specified target.
2. Restrict analysis to that target unless dependency tracing requires examining related files.
3. State the effective review scope in the report.
4. Note limits such as unavailable tools, incomplete source, missing generated files, or missing support policy.
5. Exclude vendored dependencies, generated code, build artifacts, fixtures, and snapshots unless the user explicitly includes them.

If scope is unclear, ask the user to clarify it.

## Preserve read-only operation

Use read-only methods:

- repository text search;
- symbol and reference search;
- source and configuration inspection;
- version-control history inspection;
- existing static-analysis results; and
- existing test or coverage reports.

Do not:

- edit, format, generate, or delete files;
- install dependencies or analysis tools;
- run autofix commands;
- run project code, build scripts, tests, hooks, or plugins that might write files;
- create new coverage or analysis artifacts; or
- change the working tree, index, environment, or repository configuration.

If stronger evidence needs a command that may write files, describe it and ask before running it.

## Candidate classes

Look for the following candidates.

### Unreachable branches

Identify conditional branches whose predicates cannot take the relevant value under documented repository invariants.

Acceptable evidence may include:

- exhaustive construction sites;
- validated input boundaries;
- type-level restrictions;
- constant configuration;
- closed enum or variant handling; or
- a dominating check that establishes the predicate.

Do not infer unreachability solely from missing test coverage.

### Unreferenced internal code

Identify private or repository-internal functions, types, modules, constants, files, or utilities with no operational callers.

Search for:

- direct references;
- re-exports and aliases;
- configuration and manifest references;
- dependency-injection registration;
- serialization names;
- command, route, event, and plugin registration;
- reflection or dynamic lookup;
- templates, scripts, documentation examples, and string-based references; and
- test-only use.

If an asset is referenced only by tests written specifically for that asset, report deletion of the asset and its dedicated tests as one cleanup unit.

### Obsolete compatibility paths

Identify branches, adapters, migrations, flags, or fallbacks for unsupported versions or environments.

Require repository evidence for the support boundary, such as:

- an explicit support policy;
- dependency or runtime constraints;
- migration state;
- release documentation;
- configuration schema;
- protocol negotiation rules; or
- a higher-level validator that rejects the legacy case.

Do not assume that an old-looking path is unsupported.

### Redundant parameters or states

Identify parameters, options, flags, enum variants, or object fields that have only one reachable value across all known construction and call sites.

Account for:

- public callers;
- deserialization;
- configuration;
- generated callers;
- mocks and tests;
- callbacks;
- framework injection; and
- dynamic invocation.

### Net-subtractive inlining

Identify an internal wrapper with one operational caller when replacing that call with the wrapper body would:

- remove the wrapper;
- reduce net code or indirection;
- preserve behavior and evaluation order; and
- not erase a useful domain boundary.

Treat this as lower confidence when the wrapper is an intentional extension point, test seam, instrumentation boundary, or separately meaningful abstraction.

## Attempt to falsify every candidate

Before reporting a finding, actively search for evidence that the candidate is needed.

For each candidate:

1. Search the full repository, not only the target directory, for references.
2. Examine aliases, re-exports, registrations, manifests, and configuration.
3. Check for dynamic, reflective, generated, serialized, or string-based access.
4. Distinguish production, test, fixture, example, migration, and documentation use.
5. Check whether version-control history explains a compatibility or architectural constraint.
6. Determine whether the symbol is externally visible.
7. Look for comments or documentation describing an invariant not encoded in the type system.
8. Record unresolved possibilities rather than silently dismissing them.

Absence of a text match is not proof when the language or framework supports indirect access.

## Protect open-world interfaces

Treat the following as having unknown external consumers unless the repository provides evidence that all consumers are known:

- public or exported APIs;
- package entry points;
- command-line flags and subcommands;
- environment variables;
- configuration keys;
- network endpoints and message schemas;
- database or serialized fields;
- plugin or extension interfaces;
- event names;
- reflection-visible names; and
- files consumed by deployment or operational systems.

Do not issue a confirmed deletion recommendation for an open-world interface.

Instead, either:

- omit it as a finding; or
- report it as a conditional candidate and state the external-consumer evidence required.

A repository search alone does not establish that a public interface is unused.

## Classify confidence

Assign each candidate one of these classifications.

### Confirmed

Use only when the repository establishes a closed world for the target and the available evidence supports the invariant after falsification attempts.

### Conditional

Use when deletion appears justified but depends on an external-consumer check, support-policy fact, runtime assumption, or other fact not established by the repository.

### Rejected

Do not include in the main findings. Use this classification internally for candidates disproved during analysis. Summarize rejected candidates only when doing so helps explain coverage or limitations.

Avoid absolute guarantees. "Confirmed" means confirmed within the stated repository scope and evidence, not universally proven safe.

## Define one cleanup unit

Each finding must describe one reviewable cleanup unit.

A cleanup unit may include mechanically coupled removals, such as:

- a dead function and tests dedicated only to that function;
- a parameter and the argument supplied at each known call site;
- a branch and imports made unused by deleting it; or
- a wrapper and the call-site adjustment needed to remove it.

Do not combine unrelated deletions into one finding.

Do not expand a deletion into a broader redesign.

## Rank findings

Order findings by:

1. confidence: Confirmed before Conditional;
2. estimated net code reduction;
3. reduction in branching or state-space complexity; and
4. breadth of affected files, preferring narrower changes when impact is otherwise similar.

Estimate impact conservatively. Do not present estimated line counts as exact unless directly measured.

## Report format

Begin with:

- **Scope reviewed**
- **Methods used**
- **Important limitations**
- **Summary:** count of Confirmed and Conditional findings

For each finding, use this structure:

### [Classification] Short finding title

- **Target:** `path/to/file.ext:line-line` - `symbol`
- **Proposed deletion:** One precise cleanup unit.
- **Safe invariant:** The condition under which supported behavior is unchanged.
- **Repository evidence:**
  - `path/to/evidence.ext:line-line` - relevant fact
  - Search or symbol-query summary, including the scope searched
  - Relevant configuration, manifest, history, or analysis evidence
- **Falsification performed:** Checks made for indirect callers, dynamic access, external consumers, or exceptions.
- **Estimated impact:** Conservative net reduction and structural benefit.
- **Risk and unresolved assumptions:** Remaining uncertainty, or `None identified within the reviewed scope`.
- **Human verification:** Any fact the reviewer should confirm before deletion.

Use current line numbers when available. If line numbers are unavailable or unstable, identify the narrowest enclosing symbol and include a distinctive code fragment or search term.

Do not paste large command outputs. Summarize the result and provide enough detail for the user to reproduce the search.

## No-finding outcome

If no candidate meets the evidence threshold, say so directly.

Report:

- the scope examined;
- the searches or analyses performed;
- promising candidates that were rejected and why, when useful; and
- evidence that would be needed for a stronger conclusion.

Do not lower the evidence standard merely to produce findings.

## Final checks

Before returning the report, verify that:

- every main finding is one cleanup unit;
- every finding states a safe invariant;
- every invariant has repository evidence;
- indirect and dynamic references were considered;
- public interfaces were treated as open-world;
- Conditional findings are not presented as confirmed;
- no files or repository state were changed; and
- the report does not claim certainty beyond the reviewed scope.
