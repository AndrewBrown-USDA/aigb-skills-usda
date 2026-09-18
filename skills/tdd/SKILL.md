---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green-refactor, or wants integration tests.
author: Matt Pocock (https://github.com/mattpocock/skills)
license: MIT
version: 1.0
---

# Test-Driven Development

TDD is the red -> green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle. Consult it before and during the loop, not after.

When exploring the codebase, read `CONTEXT.md` if it exists so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests should not. A good test reads like a specification: "user can checkout with valid cart" tells you exactly what capability exists, and it survives refactors because it does not care about internal structure.

See `tests.md` for examples and `mocking.md` for mocking guidelines.

## Seams: where tests go

A seam is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

Test only at pre-agreed seams. Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You cannot test everything, so agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.

Ask: "What is the public interface, and which seams should we test?"

When the shape of that interface is itself in question, call the `codebase-design` skill for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage, and locality terms, and it is a reference to consult, not a session to run.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel. The tell is that the test breaks when you refactor but behavior has not changed.
- **Tautological**: the assertion recomputes the expected value the way the code does, so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, or the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify imagined behavior: you test the shape of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in vertical slices instead: one test, one implementation, repeat.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Do not anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage, see the `code-review-2axis` skill, not the red to green implementation cycle.
