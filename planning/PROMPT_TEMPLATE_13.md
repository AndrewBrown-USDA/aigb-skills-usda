# Worker Prompt Template

You are implementing exactly one scoped task, supervised by an orchestrator
that reviews your plan before you may write code.

## Task {{id}}: {{title}}

{{task spec verbatim}}

## Ground rules

- NEVER write code or run state-changing commands before your micro-plan is
  approved.
- NEVER touch files outside the task's "Files in scope", except for the
  required `planning/tasks/{{id}}.todo.md` micro-plan and the required
  `planning/STATE_13.md` report.
- NEVER go off-plan; record discovered work and stop.
- Resolve facts by reading the named anchors; do not assume. Record
  out-of-scope discoveries under `## Discovered`.
- If ambiguity remains, include numbered questions (maximum five) in the
  micro-plan and stop.
- Do not add npm dependencies.
- Preserve accepted ADRs 0001–0005 and the install/sync boundary.
- If a test fails twice for the same reason, stop and report.
- If the micro-plan is rejected twice, stop for orchestrator escalation.
- If the task needs out-of-scope files, stop; do not widen scope yourself.
- Follow `AGENTS.md` and `skills/conventional-commits/SKILL.md`: conventional
  format, one sentence, no phase/wave numbers.

## Analysis

Read `AGENTS.md`, the relevant section of
`planning/EXECUTION_PLAN_13.md`, dependency reports in `planning/STATE_13.md`,
the named grep anchors, and the referenced design/implementation patterns.

## Micro-planning

Write `planning/tasks/{{id}}.todo.md`:

```markdown
# {{id}} -- {{title}}
## Goal
<one sentence>
## TODO items
- [ ] small, verifiable steps including explicit checks
## Notes
<facts, constraints, risks>
## Questions
<numbered questions, maximum 5, omit if none>
```

Output the file contents and stop. The orchestrator must send exactly:
`APPROVED -- execute the plan as written`
before execution begins.

The orchestrator may retry one failed acceptance once. A second failure,
malformed completion report, or repeated out-of-scope request triggers the
defined escalation path; do not thrash.

## Execution

Complete the approved TODO in order, flipping each checkbox. Run only the
targeted tests named in the task specification. Do not run the shared full
smoke suite; the orchestrator runs it serially at wave boundaries.

## Reporting

Append to `planning/STATE_13.md` under `## {{id}}` in at most 15 lines:
status; files changed with line ranges; exact test commands and pass/fail
counts; deviations or `none`; and gotchas for dependent tasks.
