---
name: worker-validation
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Validates code fixes by running the code, checking compilation, verifying runtime behavior, and confirming fixes resolve the reported issue. Use when verifying that bug fixes actually work at runtime.
version: 1.0
---

# Worker Validator

Validates that code fixes are correct by running the code, checking compilation, verifying runtime behavior, and confirming the reported issue is resolved.

## Instructions

### 1. Identify the Problem

From the bug report or issue description, determine:
- What was broken (e.g., "files not found", "TypeError: not a function")
- What the expected behavior should be
- What the minimal reproduction is

### 2. Apply the Fix

Make the proposed changes to the affected files.

### 3. Verify Runtime Behavior

Run the code and check that the fix works:

```bash
# Run the entry point or test
node path/to/entry.ts
# or
ts-node path/to/entry.ts
# or
npx pi [command]
```

Check:
- Exit code is 0 (no unhandled errors)
- Expected output is produced
- No new errors appear in stderr

### 4. Verify Data Integrity

For data-processing fixes, verify the data is correct:

```bash
# Check files exist and are readable
ls -la .pi/consolidations/

# Verify path resolution
node -e "const p = require('path'); console.log(p.isAbsolute(p.join('/base', 'file')))"

# Parse and inspect data
node -e "const data = JSON.parse(require('fs').readFileSync('file.json', 'utf-8')); console.log(Object.keys(data))"
```

Verify:
- All expected files are found
- Paths are absolute (where expected)
- Data parses successfully
- Key data fields are present and correct

### 5. Check Compilation

If the project uses TypeScript or another compile-time language:

```bash
# Check for compilation errors
npx tsc --noEmit
# or
npx tsc
```

Note: Not all projects have `tsc` installed. Some run via an agent's internal runtime. Check if compilation is applicable.

### 6. Verify Specific Claims

For each claim in the fix description, verify independently:

```bash
# Claim: "export function createSession exists"
grep "export function createSession" file.ts && echo "[PASS]" || echo "[FAIL]"

# Claim: "6 files found in directory"
ls directory/ | wc -l

# Claim: "Latest file parses successfully"
node -e "require('fs').readFileSync('latest-file.json', 'utf-8')" && echo "[PASS]" || echo "[FAIL]"
```

### 7. Check for Remaining Concerns

After the fix is verified, note any remaining issues:

- Stub files or incomplete refactoring
- Functions that still need implementation
- Known limitations or TODOs
- Future work that depends on this fix

### 8. Report Findings

Structure the validation report as:

```markdown
## Fixes Applied

### Fix N: [Description]
**Files changed**: `[path/to/file]`

**Problem**: [Brief description of what was broken]

**Fix**: [What was changed]

**Verification**:
- [PASS] [Verification step 1]
- [PASS] [Verification step 2]
- [PASS] Exit code: 0

## [Compilation/Type Checking]
**Status**: [Pass/Fail/Not applicable] -- [Explanation]

## Remaining Concerns
- [Concern 1]
- [Concern 2]

## Summary
[What the fix enables, what still needs work]
```

Use status symbols:
- [PASS] -- Verified working
- [FAIL] -- Verification failed
- [INFO] -- Not applicable or informational
