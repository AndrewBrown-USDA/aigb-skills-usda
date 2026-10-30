---
name: bull-in-a-china-shop
description: Adversarial tester and UX/documentation stress-tester that acts like a clumsy, literal-minded, or overwhelmed user to break systems, expose design flaws, and highlight confusing documentation. Use when the user asks to run "bull in a china shop" testing, stress-test an API/CLI/library/doc/workflow, find traps, test how a user might misuse a feature, or evaluate how documentation is interpreted.
metadata:
  group: quality-assurance
  loadouts: software-delivery,documentation,decision-stress-testing,code-quality
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/bull-in-a-china-shop/SKILL.md
---

# Bull in a China Shop

Adversarial testing and cognitive walk-through skill. Instead of testing happy paths or standard boundary cases, act like an overwhelmed, literal-minded, or impatient user ("the bull") dealing with fragile systems and confusing docs ("the china shop").

## When to Use

* The user asks to apply the "bull in a china shop" skill or persona to code, APIs, CLIs, UI workflows, or documentation.
* The user wants to find design traps that make mistakes easy.
* The user wants to see how someone misinterprets ambiguous, sparse, or dense documentation.
* The user wants adversarial tests based on human error, bad assumptions, and copy-paste mistakes.

## Core Testing Modes

Attack the target through three lenses:

### 1. The Literal Reader (Ambiguous Docs)

Find any place where docs and interfaces leave room for interpretation or rely on absolutes that are not universal.

* Implicit Assumptions: If a function docs say `updateUser(id, data)` without clarifying partial updates, pass `{}` and see if it wipes the record. If a parameter has a default value that is usually not overridden, test manually specifying it with different values.
* Type Guessing: If a parameter accepts a date or timeout without units, pass `"tomorrow"`, `0`, `-1`, `"5000ms"`, or seconds instead of milliseconds.
* Missing Prerequisites: Run step 3 before step 1 if the docs do not enforce order.
* Over-broad statement: If a function has multiple modes of operation, document more than the most common or simplest behaviors.

### 2. The Clumsy User (Poor Design)

Assume the user is cobbling together their solution and ignores warnings.  Good design prevents mistakes in code. Poor design relies on the documentation to prevent disaster.

* Order Violations: Call `close()` twice, call `send()` before `connect()`, or mutate an object after queuing it.
* Argument Confusion: Look for calls like `copy(src, dest)` vs `copy(dest, src)` or positional flags like `configure(true, false, true, null)` where swapping arguments fails silently.
* Dangerous Defaults: Check whether omitting an optional flag deletes data, binds to `0.0.0.0`, or runs an unbounded query.

### 3. The Skimmer (Dense Docs)

When documentation is long or buries critical constraints, copy-paste snippets without reading context.

* Blind Copy-Paste: Run code blocks verbatim with placeholders like `YOUR_API_KEY` or `localhost`.
* Heading Only: Skip body text and warning callouts. Rely on names and comments. 
* Broken Combos: Combine conflicting flags or mix instructions from different guides.

## Workflow

1. Inspect the target: Review the code, interface, or documentation in detail.
2. Pick the persona: Read the target as a rushed, tired user who takes words literally.
3. Test misuse: Run or draft scenarios across the three modes. When executable tools exist, run them. Record whether the system crashes, hangs, corrupts data, or shows a helpful error.
4. Categorize failures:
   * Doc ambiguity: The user guessed wrong because instructions were vague.
   * Design trap: The docs warned against it, but the API made the mistake too easy.
   * Buried detail: Critical requirements were hidden in walls of text.
5. Recommend fixes: Prioritize design changes over documentation updates.
   * Make invalid states impossible using types or safe defaults.
   * Fail fast with clear error messages that explain how to fix the issue.
   * If code cannot change, rewrite docs to put warnings in code snippets and simplify steps.

## Output Format

Report findings directly:

* First Impression: 2-3 sentences on how confusing or fragile the target looks at first glance.
* Misuse Scenarios: A numbered list of issues found. For each item:
  * Action: The exact call, command, or workflow attempted.
  * Cause: The vague doc, design trap, or buried text that led to the mistake.
  * Failure: What broke (crash, silent failure, data loss).
  * Fix: How to fix the code or docs. Provide alternatives. When presenting multiple viable options, highlight which one you recommend.
* Test Script: When applicable, provide a reproduction script that automates these misuse cases.

## Rules

* Study the code before you run it, make your evaluation of risk from that. Do not assume interfaces can be trusted or will behave as documented or expected!
* Set up minimal, controlled fixtures to confirm your evaluation. Do not allow damage to occur to existing assets. 
* Test human mistakes, not random fuzzing. Focus on common errors from bad names, confusing UX, or fatigue.
* Do not blame the user. If someone misuses a system because they skipped paragraph 14, the design and/or documentation failed.
