---
name: reviewer-correctness
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Verifies bug fixes are correct and complete by tracing callers, checking imports/exports, validating path resolution, and confirming no regressions. Does the code work? Use when reviewing code changes for functional correctness.
version: 1.0
---

# Correctness Reviewer

Verifies that code changes are functionally correct by tracing callers, checking imports/exports, validating path resolution, and confirming no side effects or regressions.

## Review Complete When

- **Every modified function** has >=1 caller audit (traced, compatibility verified)
- **All imports/exports** reconciled (no orphaned, no missing)
- **Circular dependencies** validated or ruled out for all affected modules
- **Path resolution** (if applicable) verified relative to correct base
- **No regression risks** identified in unchanged functions
- **Summary table** shows status for all checks
- **Overall verdict** is clear ([PASS] safe to merge / [WARN] concerns listed / [FAIL] needs work)

A review is not complete if any check has an "unknown" or "not checked" status.

## Instructions

### 1. Verify the Fix Itself

For each change, confirm the code modification is syntactically and semantically correct:

```bash
# Check the change is present
grep -n "export function createSession" agent-spawning.ts
grep -n "path.join(consolidationsDir, f)" shared.ts
```

Check:
- Required imports are present (e.g., `import * as path from "node:path"`)
- The change uses the correct API (e.g., `path.join` not string concatenation)
- No syntax errors introduced

### 2. Trace All Callers

For each modified function, find and verify all callers:

```bash
# Find all callers
grep -rn "functionName" --include="*.ts" --include="*.js" | grep -v "function functionName"
```

For each caller, verify:
- The caller's usage is compatible with the change
- The caller receives the expected data format (e.g., full paths, not bare filenames)
- No caller is broken by the change

### 3. Verify Imports and Exports

For export changes, confirm the full import chain:

```bash
# Check the export exists
grep -n "export function.*" target.ts

# Check the import exists
grep -n "import.*from.*target" consumer.ts
```

Verify:
- All functions that need to be exported are exported
- All consumers import the correct names
- No orphaned imports (importing something that doesn't exist)
- No missing exports (something imported but not exported)

### 4. Check Path Resolution

For path-related changes, verify:

```bash
# Check path module is imported
grep "import.*path" file.ts

# Verify path.join usage
grep "path.join" file.ts

# Check if paths are absolute
# (may require running the code or checking the logic)
```

Verify:
- `path` module is imported
- `path.join` or equivalent is used (not string concatenation)
- Paths are resolved relative to the correct base directory
- All consumers expect the same path format

### 5. Check for Circular Dependencies

Build the import chain for affected modules:

```bash
# Check imports in each file
grep "^import" shared.ts agent-spawning.ts dream-execution.ts
```

Verify:
- No circular import chains exist
- Import direction is consistent (no back-references)
- The change doesn't introduce new coupling

### 6. Verify No Regressions

Check that existing functionality is preserved:

```bash
# Check unchanged functions still work
grep -n "checkConsolidationFreshness" shared.ts
```

Verify:
- Unchanged functions are unaffected
- No function signatures changed unexpectedly
- No side effects on unrelated modules
- The change is minimal and targeted

### 7. Report Findings

Structure the review as:

```markdown
## Fix N: [Description]

### Correct: [PASS]/[WARN]/[FAIL] [Fix is correct/incomplete/incorrect]

**Evidence:**
- [file:line] `code snippet` -- [explanation]
- [file:line] `code snippet` -- [explanation]

**Callers verified:**
| Caller | Location | Uses correct format? | Status |
|--------|----------|---------------------|--------|
| [caller] | [file:line] | [yes/no] | [PASS]/[FAIL] |

**Independent implementations (not affected):**
- [module]: [brief note on why unaffected]

---

## Summary

| Check | Result |
|-------|--------|
| Fix N: [description] | [PASS]/[WARN]/[FAIL] [brief note] |
| Other callers affected | [PASS]/[FAIL] [note] |
| Required imports present | [PASS]/[FAIL] [note] |
| Circular dependency risk | [PASS]/[FAIL] [note] |

**[Overall verdict]**
```

Use status symbols:
- [PASS] -- Verified correct, no issues
- [WARN] -- Partially correct, minor concern
- [FAIL] -- Incorrect, needs fixing
