---
name: reviewer-architecture
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Performs architectural code reviews focusing on design patterns, duplication, circular dependencies, and refactoring impact. Is the design consistent with the codebase? Use when reviewing code changes for architectural concerns, code smells, or structural issues.
version: 1.0
---

# Architectural Reviewer

Performs deep architectural analysis of code changes, identifying design patterns, duplication, circular dependencies, and refactoring side effects.

## Review Complete When

- **Scope** of affected files and modules is mapped
- **Duplication** is audited (no new unnecessary copies, consolidation opportunities noted)
- **Patterns** verified against codebase conventions (caller expectations, interface consistency)
- **Circular dependencies** validated or ruled out for all affected modules
- **Refactoring impact** assessed (stub files, side effects, progression toward goal)
- **Summary table** shows status for all items
- **Overall verdict** is clear ([PASS] patterns sound / [WARN] concerns noted / [FAIL] rework needed)

A review is not complete if any architectural check has an "unknown" or "not checked" status.

## Instructions

### 1. Identify Scope

Determine which files and modules are affected by the changes. Map the import/export graph for the affected modules.

### 2. Check for Duplication

Search for duplicate or near-duplicate implementations across the codebase:

```bash
# Find similar function names across files
grep -rn "function getConsolidationFiles" --include="*.ts" --include="*.js"

# Find similar patterns (e.g., path.join, fs.readdirSync)
grep -rn "path.join.*map" --include="*.ts" --include="*.js"
```

For each duplicate found, assess:
- Are the implementations identical or divergent?
- Is there an intentional reason for the duplication?
- Should they be consolidated into a shared utility?

### 3. Assess Architectural Patterns

Evaluate whether the changes follow existing patterns in the codebase:

- **Path resolution**: Do path-building functions return full paths consistently? Check against existing patterns like `discoverAgents()`.
- **Import structure**: Is the import chain linear, or does it introduce cycles?
- **Export surface**: Are exports aligned with how consumers use them?
- **Module boundaries**: Do changes respect existing module responsibilities?

### 4. Trace Callers and Consumers

For each changed function, verify all callers:

```bash
# Find all callers of a function
grep -rn "getStructuredConsolidationFiles" --include="*.ts" --include="*.js"
grep -rn "createSession" --include="*.ts" --include="*.js"
```

Check:
- Do all callers expect the same interface (e.g., full paths vs. bare filenames)?
- Are there callers that might break with the change?
- Are there unmet imports (functions used but not exported)?

### 5. Check Circular Dependencies

Build the import graph for affected modules:

```
shared.ts -> paths.ts (one-way)
agent-spawning.ts -> shared.ts (one-way)
dream-execution.ts -> shared.ts + agent-spawning.ts (one-way)
```

Flag any cycles. Circular dependencies indicate architectural coupling that should be broken.

### 6. Evaluate Refactoring Impact

When changes are part of a larger refactoring (e.g., extracting handlers from a monolith):

- Are stub files created as intermediate artifacts?
- Do new exports serve the refactoring goal?
- Are there side effects on unrelated modules?
- Is the refactoring progressing toward a clear architecture?

### 7. Report Findings

Structure the review as:

```markdown
## Review

### 1. [Change Description] -- Status [PASS]/[WARN]/[FAIL]

**Evidence:**
- [Specific file:line references]
- [Pattern comparisons]
- [Caller verification]

**Verdict:** [Brief conclusion]

### 2. Architectural Concerns

#### 2a. [Issue] [WARN]/[INFO]

[Description of the concern, why it matters, and a suggestion]

### Summary

| Item | Status | Notes |
|------|--------|-------|
| [Item] | [PASS]/[WARN]/[FAIL] | [Brief note] |

**[Overall verdict]**
```

Use status symbols:
- [PASS] -- Correct, no issues
- [WARN] -- Code smell or concern worth noting (not a blocker)
- [FAIL] -- Architectural problem that should be addressed
- [INFO] -- Informational, known state
