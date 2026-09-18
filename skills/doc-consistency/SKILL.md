---
name: doc-consistency
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Normalizes documentation and examples for consistency in style, format, and accuracy. Ensures code matches existing patterns and documentation. Use when reviewing docs, examples, or writing new code that should follow established patterns.
version: 1.0
---

# Doc Consistency

## Instructions

### When Cleaning Existing Code/Docs
1. Run `git diff main...HEAD` (or ask which files to inspect).
2. Scan for these patterns:
   - Inconsistent docstring format (some have `@param`, some don't; some have `@returns`, some use prose).
   - Code examples that don't match the current API (outdated signatures, removed params, wrong imports).
   - Inconsistent example style (some use real values, some use placeholders like `xxx`; some include types, some don't).
   - README or docs sections that repeat information already obvious from code or other sections.
   - Mixed heading styles, list styles, or code block language tags across related docs.
   - Examples with hardcoded values that should be illustrative.
3. Normalize to the project's existing conventions. When no convention exists, pick one style and apply it consistently.
4. Preserve all substantive documentation. When in doubt, leave it.
5. Provide a 1-3 sentence summary of what was normalized.

### When Writing New Code
1. Scan `docs/examples/` or `blueprints/` for structurally identical modules before writing. Match their structure, error handling patterns, and naming conventions.
2. If a function signature or config changes, update the corresponding docs in the same turn.
3. Never invent patterns not shown in reference files -- ask the user for a structural rule instead.

## Example

**Before:**
````markdown
## Usage

Install the package:
```
npm i my-lib
```

Then use it:
```js
const x = require('my-lib');
const result = x.doThing('abc123xyz', 42, true);
```
````

**After:**
````markdown
## Usage

```bash
npm install my-lib
```

```ts
import { doThing } from 'my-lib';
doThing(input, options);
```
````
