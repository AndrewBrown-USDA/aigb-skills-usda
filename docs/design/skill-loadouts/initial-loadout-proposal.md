# Initial Skill Loadout Proposal

Status: review proposal for orchestration 14 task 14.1.1. This document does
not change packaged metadata, catalog output, resolver behavior, or installation
behavior.

## Decision boundary

This proposal separates three concepts:

- A **group** is one organizational home for browsing. It never expands during
  resolution.
- A **loadout membership** makes a skill selectable through
  `loadout:<identifier>`. Loadouts can be broad or granular, and one skill may
  belong to several loadouts.
- A **dependency** is an execution edge between skill names. Required edges are
  always resolved; optional edges remain opt-in. Similarity, sequencing, or
  appearing in the same loadout is not enough evidence for a dependency.

All identifiers below are final lowercase kebab-case names for the
implementation worker. Later frontmatter will encode the ordered loadout list
as one comma-separated scalar.

## Broad groups

| Group | Scope |
|---|---|
| `architecture-planning` | Planning, alignment, orchestration, and durable architecture decisions. |
| `quality-assurance` | Review, testing, validation, debugging, and engineering-quality controls. |
| `research-evidence` | Source research, history mining, evidence capture, and evidence synthesis. |
| `communication-documentation` | Documentation structure, clarity, brevity, onboarding, and skill authoring. |
| `developer-tooling` | Installation, CI, Makefiles, structured-data utilities, and commit workflow. |
| `domain-workflows` | Specialized federal, geospatial, and R-package workflows. |

## Loadout registry

Broad loadouts are useful starting collections. Granular loadouts select a
specific workflow. Broad and granular memberships use the same identifier
namespace.

| Loadout | Kind | Scope |
|---|---|---|
| `software-delivery` | broad | Plan, implement, review, test, and maintain software changes. |
| `evidence-research` | broad | Gather, preserve, analyze, and communicate evidence. |
| `documentation` | broad | Create, normalize, compress, and maintain written guidance. |
| `specialist-workflows` | broad | Domain-specific workflows needing specialized procedural guidance. |
| `wave-delivery` | granular | Plan and execute approval-gated, dependency-ordered implementation waves. |
| `plan-review` | granular | Assess plans, goals, architecture, specifications, and implementation alignment. |
| `code-quality` | granular | Design, review, simplify, debug, and test code quality. |
| `test-validation` | granular | Build tests, execute checks, benchmark, and verify runtime behavior. |
| `context-economy` | granular | Reduce unnecessary code or prose while preserving correctness. |
| `architecture-history` | granular | Mine historical evidence and turn enduring decisions into architecture records. |
| `skill-authoring` | granular | Design, document, validate, install, and maintain agent skills. |
| `source-research` | granular | Research high-trust sources and retain reproducible source evidence. |
| `documentation-quality` | granular | Improve documentation consistency, clarity, and concision. |
| `ci-maintenance` | granular | Build reproducible local and GitHub Actions development workflows. |
| `r-package-quality` | granular | Test, check, and automate R packages. |
| `geospatial-migration` | granular | Replace ArcPy workflows with explicit open-source geospatial implementations. |
| `federal-open-source` | granular | Apply the federal Code.mil open-source licensing model. |
| `git-practices` | granular | Study Git history and produce repository-aware commit messages. |
| `agent-setup` | granular | Onboard agents and install packaged skills. |
| `decision-stress-testing` | granular | Expose weak assumptions through questioning, misuse, and guided articulation. |
| `performance-analysis` | granular | Design and run reproducible performance measurements. |
| `data-utilities` | granular | Process and preserve structured command-line or web-source data. |
| `copilot-insights` | granular | Turn Copilot activity history into evidence-backed briefings. |

## Membership and dependency rationale

The manifest below is the normative proposal. `evidence` summarizes the
packaged description or an explicit body instruction. `rationale` explains why
that evidence maps to the chosen group, loadouts, and edges.

<!-- BEGIN PROPOSAL MANIFEST -->
```json
{
  "schema_version": 1,
  "groups": [
    {"name": "architecture-planning", "rationale": "Planning, alignment, orchestration, and durable architecture decisions."},
    {"name": "quality-assurance", "rationale": "Review, testing, validation, debugging, and quality controls."},
    {"name": "research-evidence", "rationale": "Source research, history mining, evidence capture, and synthesis."},
    {"name": "communication-documentation", "rationale": "Documentation structure, clarity, brevity, onboarding, and skill authoring."},
    {"name": "developer-tooling", "rationale": "Installation, CI, Makefiles, structured-data utilities, and commit workflow."},
    {"name": "domain-workflows", "rationale": "Specialized federal, geospatial, and R-package workflows."}
  ],
  "loadouts": [
    {"name": "software-delivery", "kind": "broad", "rationale": "End-to-end software change delivery."},
    {"name": "evidence-research", "kind": "broad", "rationale": "Evidence gathering, preservation, analysis, and communication."},
    {"name": "documentation", "kind": "broad", "rationale": "Written guidance creation and maintenance."},
    {"name": "specialist-workflows", "kind": "broad", "rationale": "Specialized domain procedures."},
    {"name": "wave-delivery", "kind": "granular", "rationale": "Approval-gated implementation planning and orchestration."},
    {"name": "plan-review", "kind": "granular", "rationale": "Plan, goal, architecture, and specification review."},
    {"name": "code-quality", "kind": "granular", "rationale": "Code design, review, simplification, and debugging."},
    {"name": "test-validation", "kind": "granular", "rationale": "Testing, benchmarking, and runtime verification."},
    {"name": "context-economy", "kind": "granular", "rationale": "Lean code and communication."},
    {"name": "architecture-history", "kind": "granular", "rationale": "Historical analysis and durable architecture records."},
    {"name": "skill-authoring", "kind": "granular", "rationale": "Agent skill design, validation, installation, and maintenance."},
    {"name": "source-research", "kind": "granular", "rationale": "High-trust research and reproducible source capture."},
    {"name": "documentation-quality", "kind": "granular", "rationale": "Documentation consistency, clarity, and concision."},
    {"name": "ci-maintenance", "kind": "granular", "rationale": "Reproducible local and hosted automation."},
    {"name": "r-package-quality", "kind": "granular", "rationale": "R package tests, checks, and automation."},
    {"name": "geospatial-migration", "kind": "granular", "rationale": "ArcPy replacement with open-source geospatial workflows."},
    {"name": "federal-open-source", "kind": "granular", "rationale": "Federal open-source licensing compliance."},
    {"name": "git-practices", "kind": "granular", "rationale": "Git history analysis and commit-message practice."},
    {"name": "agent-setup", "kind": "granular", "rationale": "Agent onboarding and skill installation."},
    {"name": "decision-stress-testing", "kind": "granular", "rationale": "Questioning and misuse-oriented stress testing."},
    {"name": "performance-analysis", "kind": "granular", "rationale": "Reproducible performance measurement."},
    {"name": "data-utilities", "kind": "granular", "rationale": "Structured-data processing and preservation."},
    {"name": "copilot-insights", "kind": "granular", "rationale": "Evidence-backed Copilot activity briefings."}
  ],
  "skills": [
    {
      "name": "adr-distillation",
      "group": "architecture-planning",
      "loadouts": ["software-delivery", "evidence-research", "wave-delivery", "architecture-history", "plan-review"],
      "required_dependencies": [],
      "optional_dependencies": ["git-history-interval-study"],
      "evidence": "Distills decisions from wave plans or historical Git changes into tracked ADRs.",
      "rationale": "It bridges delivery planning and historical evidence; interval study is an optional evidence producer, not a prerequisite."
    },
    {
      "name": "agent-onboarding",
      "group": "communication-documentation",
      "loadouts": ["documentation", "software-delivery", "agent-setup", "skill-authoring"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Creates and maintains AGENTS.md project-grounding files.",
      "rationale": "It is documentation used during agent setup and supports maintainable skill-enabled projects without requiring another skill."
    },
    {
      "name": "apply-fed-oss-license",
      "group": "domain-workflows",
      "loadouts": ["specialist-workflows", "software-delivery", "federal-open-source"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Applies the Code.mil federal open-source licensing model, including R package metadata.",
      "rationale": "Its specialized compliance procedure is independently executable."
    },
    {
      "name": "arcpy-migration",
      "group": "domain-workflows",
      "loadouts": ["specialist-workflows", "software-delivery", "geospatial-migration", "test-validation"],
      "required_dependencies": [],
      "optional_dependencies": ["worker-validation"],
      "evidence": "Migrates ArcPy workflows to explicit, testable open-source Python geospatial workflows.",
      "rationale": "Migration is the domain focus; worker-validation is a useful opt-in runtime verification pass."
    },
    {
      "name": "bull-in-a-china-shop",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "documentation", "decision-stress-testing", "code-quality"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Stress-tests APIs, CLIs, libraries, documentation, and workflows as a confused user.",
      "rationale": "It crosses software and documentation quality by testing misuse and interpretation without requiring another reviewer."
    },
    {
      "name": "caveman",
      "group": "communication-documentation",
      "loadouts": ["documentation", "context-economy"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Provides an ultra-compressed communication mode.",
      "rationale": "Its sole capability is context-efficient communication and it is intentionally standalone."
    },
    {
      "name": "code-review-2axis",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "code-quality", "plan-review"],
      "required_dependencies": [],
      "optional_dependencies": ["reviewer-architecture", "reviewer-correctness"],
      "evidence": "Reviews changes independently against repository standards and the originating specification.",
      "rationale": "It is a code and specification review workflow; specialized architecture and correctness reviewers can deepen the two passes but are not required."
    },
    {
      "name": "conventional-commits",
      "group": "developer-tooling",
      "loadouts": ["software-delivery", "git-practices", "wave-delivery"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Drafts and reviews repository-aware Conventional Commit messages.",
      "rationale": "Commit discipline supports delivery and wave task completion, but the skill is self-contained."
    },
    {
      "name": "copilot-history-briefing",
      "group": "research-evidence",
      "loadouts": ["evidence-research", "copilot-insights", "architecture-history"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Mines Copilot conversation history for executive-ready evidence and success stories.",
      "rationale": "It is a focused history-analysis and reporting workflow with no required companion."
    },
    {
      "name": "deep-investigative-research",
      "group": "research-evidence",
      "loadouts": ["evidence-research", "source-research"],
      "required_dependencies": [],
      "optional_dependencies": ["web-source-bundler"],
      "evidence": "Performs multi-domain investigations with claim separation, source tiers, and contradiction resolution.",
      "rationale": "It performs research independently; deterministic source bundling is an optional preservation aid."
    },
    {
      "name": "doc-consistency",
      "group": "communication-documentation",
      "loadouts": ["documentation", "software-delivery", "documentation-quality", "skill-authoring"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Normalizes documentation and examples for style, format, and code accuracy.",
      "rationale": "It applies to general documentation and skill documents while remaining a standalone normalization pass."
    },
    {
      "name": "dr-lexus",
      "group": "communication-documentation",
      "loadouts": ["documentation", "context-economy", "documentation-quality"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Cuts verbosity, jargon, and unnecessary complexity from writing.",
      "rationale": "It directly improves concise documentation without execution dependencies."
    },
    {
      "name": "git-history-interval-study",
      "group": "research-evidence",
      "loadouts": ["evidence-research", "software-delivery", "architecture-history", "git-practices"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Studies Git history intervals and produces structured architecture-convergence evidence.",
      "rationale": "It creates evidence that other skills may consume, but downstream consumption is not its dependency."
    },
    {
      "name": "github-actions-ci",
      "group": "developer-tooling",
      "loadouts": ["software-delivery", "ci-maintenance", "r-package-quality"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Creates and debugs GitHub Actions for Python, R, and multi-platform testing.",
      "rationale": "It serves general CI and R-package automation with a self-contained workflow."
    },
    {
      "name": "goal-alignment",
      "group": "architecture-planning",
      "loadouts": ["software-delivery", "plan-review", "wave-delivery"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Checks traceability among goals, outcomes, tasks, evidence, and diffs.",
      "rationale": "It reviews both plans and executed work but explicitly does not replace their owning workflows."
    },
    {
      "name": "grilling",
      "group": "architecture-planning",
      "loadouts": ["software-delivery", "decision-stress-testing", "wave-delivery"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Stress-tests a plan, decision, or idea through focused questioning.",
      "rationale": "It supports planning and decision review as a standalone interaction method."
    },
    {
      "name": "install-skills",
      "group": "developer-tooling",
      "loadouts": ["software-delivery", "agent-setup", "skill-authoring"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Installs skills into supported coding-agent skill directories.",
      "rationale": "It is the independent setup utility and also supplies path references used by skill authoring."
    },
    {
      "name": "json-processing-with-jq",
      "group": "developer-tooling",
      "loadouts": ["software-delivery", "evidence-research", "data-utilities"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Parses, filters, validates, and transforms JSON with jq.",
      "rationale": "It is a general structured-data utility useful to delivery and research without coupling to either."
    },
    {
      "name": "makefile-development-workflow",
      "group": "developer-tooling",
      "loadouts": ["software-delivery", "ci-maintenance"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Standardizes reproducible Makefile install, build, test, and clean targets.",
      "rationale": "It supports local automation and CI handoff but has no required companion."
    },
    {
      "name": "performance-benchmarking",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "performance-analysis", "test-validation"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Designs and runs reproducible performance and scaling benchmarks.",
      "rationale": "Benchmarking is both analysis and validation and remains independently executable."
    },
    {
      "name": "plan-first",
      "group": "architecture-planning",
      "loadouts": ["software-delivery", "wave-delivery"],
      "required_dependencies": [],
      "optional_dependencies": ["goal-alignment"],
      "evidence": "Provides approval-gated planning and task-by-task execution for a coding change.",
      "rationale": "It is the small-task planning workflow; goal alignment is a useful opt-in review rather than required machinery."
    },
    {
      "name": "plan-wave",
      "group": "architecture-planning",
      "loadouts": ["software-delivery", "wave-delivery", "plan-review"],
      "required_dependencies": ["wave-orchestration", "grilling"],
      "optional_dependencies": ["code-review-2axis", "goal-alignment", "adr-distillation"],
      "evidence": "Its body requires reading wave-orchestration first and interviewing according to the grilling method.",
      "rationale": "Those two skills define its output contract and decision interview; review, alignment, and ADR checks are valuable optional enhancements."
    },
    {
      "name": "ponytail",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "documentation", "code-quality", "context-economy"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Forces the simplest working solution and resists over-engineering.",
      "rationale": "It applies across coding, design, review, and concise technical communication without needing another skill."
    },
    {
      "name": "r-package-testing-workflow",
      "group": "domain-workflows",
      "loadouts": ["specialist-workflows", "software-delivery", "r-package-quality", "test-validation"],
      "required_dependencies": [],
      "optional_dependencies": ["github-actions-ci"],
      "evidence": "Runs R package tests and CRAN-style checks and routes CI matrices to github-actions-ci.",
      "rationale": "Local package validation is independent; hosted CI automation is an explicit optional extension."
    },
    {
      "name": "research",
      "group": "research-evidence",
      "loadouts": ["evidence-research", "source-research"],
      "required_dependencies": [],
      "optional_dependencies": ["web-source-bundler"],
      "evidence": "Researches a question against high-trust primary sources and writes a repository artifact.",
      "rationale": "The core research artifact is standalone; source bundling is an optional reproducibility enhancement."
    },
    {
      "name": "reviewer-architecture",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "code-quality", "plan-review"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Reviews patterns, duplication, dependencies, module boundaries, and refactoring impact.",
      "rationale": "It serves both code and plan/design review and is intentionally independent."
    },
    {
      "name": "reviewer-correctness",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "code-quality", "test-validation"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Traces callers and behavior to verify fixes and prevent regressions.",
      "rationale": "It combines review with validation but does not require a test-authoring skill."
    },
    {
      "name": "rubber-ducking",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "decision-stress-testing", "code-quality"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Guides line-by-line articulation to understand or debug code.",
      "rationale": "It is a self-contained debugging and reasoning technique."
    },
    {
      "name": "skill-research",
      "group": "communication-documentation",
      "loadouts": ["documentation", "software-delivery", "skill-authoring"],
      "required_dependencies": ["install-skills"],
      "optional_dependencies": ["doc-consistency"],
      "evidence": "Its discovery phase explicitly reads install-skills/references/agent-paths.md before scanning skills.",
      "rationale": "The packaged install-skills reference is a required input; documentation normalization is an optional final pass."
    },
    {
      "name": "tdd",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "code-quality", "test-validation"],
      "required_dependencies": [],
      "optional_dependencies": ["reviewer-correctness"],
      "evidence": "Defines the red-green test-first loop and test-quality rules.",
      "rationale": "TDD is independently actionable; correctness review is an optional post-implementation verification."
    },
    {
      "name": "verbosity-cleaner",
      "group": "communication-documentation",
      "loadouts": ["documentation", "context-economy", "documentation-quality"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Suppresses conversational fluff and repetitive reasoning.",
      "rationale": "It is a standalone output-cleaning directive."
    },
    {
      "name": "wave-orchestration",
      "group": "architecture-planning",
      "loadouts": ["software-delivery", "wave-delivery"],
      "required_dependencies": [],
      "optional_dependencies": ["adr-distillation", "conventional-commits"],
      "evidence": "Executes dependency-ordered waves with worker plan gates, state artifacts, verification, and commits.",
      "rationale": "It is the central wave-delivery skill; ADR distillation and commit guidance are explicit milestone or repository-policy enhancements."
    },
    {
      "name": "web-source-bundler",
      "group": "research-evidence",
      "loadouts": ["evidence-research", "source-research", "data-utilities"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Captures web sources into deterministic Markdown bundles with metadata and checksums.",
      "rationale": "It supports both source research and reproducible data preservation without requiring a research workflow."
    },
    {
      "name": "worker-validation",
      "group": "quality-assurance",
      "loadouts": ["software-delivery", "wave-delivery", "test-validation"],
      "required_dependencies": [],
      "optional_dependencies": [],
      "evidence": "Runs code, compilation, and runtime checks to verify a reported fix.",
      "rationale": "It is the execution-verification component of delivery and remains independently usable."
    }
  ],
  "cross_membership_examples": [
    {
      "skill": "wave-orchestration",
      "loadouts": ["software-delivery", "wave-delivery"],
      "rationale": "The broad membership supports general delivery selection; the granular membership selects the wave workflow."
    },
    {
      "skill": "adr-distillation",
      "loadouts": ["software-delivery", "evidence-research", "wave-delivery", "architecture-history", "plan-review"],
      "rationale": "The same skill consumes plans or historical evidence without creating dependency edges to every adjacent workflow."
    },
    {
      "skill": "ponytail",
      "loadouts": ["software-delivery", "documentation", "code-quality", "context-economy"],
      "rationale": "A cross-cutting simplicity directive belongs in coding and writing selections while remaining dependency-free."
    }
  ],
  "intentionally_independent_skills": [
    "adr-distillation",
    "agent-onboarding",
    "apply-fed-oss-license",
    "arcpy-migration",
    "bull-in-a-china-shop",
    "caveman",
    "code-review-2axis",
    "conventional-commits",
    "copilot-history-briefing",
    "deep-investigative-research",
    "doc-consistency",
    "dr-lexus",
    "git-history-interval-study",
    "github-actions-ci",
    "goal-alignment",
    "grilling",
    "install-skills",
    "json-processing-with-jq",
    "makefile-development-workflow",
    "performance-benchmarking",
    "plan-first",
    "ponytail",
    "r-package-testing-workflow",
    "research",
    "reviewer-architecture",
    "reviewer-correctness",
    "rubber-ducking",
    "tdd",
    "verbosity-cleaner",
    "wave-orchestration",
    "web-source-bundler",
    "worker-validation"
  ]
}
```
<!-- END PROPOSAL MANIFEST -->

## Required and optional edge decisions

Only three required edges are proposed:

1. `plan-wave -> wave-orchestration`, because `plan-wave` explicitly says to
   read that skill first and conform to its artifact contract.
2. `plan-wave -> grilling`, because `plan-wave` explicitly adopts the
   questioning method as its decision phase.
3. `skill-research -> install-skills`, because `skill-research` explicitly
   reads a packaged reference file owned by `install-skills`.

Every other skill is intentionally independent at base resolution. The
`intentionally_independent_skills` list therefore means "no required
dependency"; some listed skills still expose an evidence-backed optional edge.
Optional edges add a useful pass or artifact but are not necessary for the
parent skill to fulfill its own description.

## Representative wave-orchestration loadout

Selecting `loadout:wave-delivery` proposes these members, sorted by skill name
by the resolver:

`adr-distillation`, `conventional-commits`, `goal-alignment`, `grilling`,
`plan-first`, `plan-wave`, `wave-orchestration`, `worker-validation`.

Default required expansion adds no new names because `plan-wave`'s required
dependencies, `grilling` and `wave-orchestration`, are already members. Optional
selection may add `code-review-2axis`; selecting that optional edge does not
implicitly select its own optional reviewers.

## Cross-membership rules

1. Membership is capability-based, not exclusive ownership; a skill may appear
   in one broad and several granular loadouts.
2. One skill has exactly one organizational group even when it has several
   loadouts.
3. Cross-membership never creates a dependency edge.
4. Broad and granular identifiers share one namespace and must be globally
   unique.
5. Frontmatter membership order follows the manifest order: broad loadouts
   first, then granular loadouts from general to specific.
6. Resolver output remains name-sorted for loadout members under ADR 0006, so
   metadata order does not define installation order.

## Unresolved choices

There are no blocking naming or membership ambiguities for implementation.
These bounded policy questions remain deliberately outside this curation:

1. Whether future releases should split any broad loadout after real context
   measurement; the initial identifiers and memberships above remain fixed.
2. Whether any optional dependency should later become an implicit loadout
   default; the initial contract keeps every optional edge opt-in.
3. Whether a future taxonomy needs aliases or deprecation metadata; the initial
   implementation has no aliases and uses only the identifiers above.

The implementation worker must apply this manifest exactly unless the
orchestrator records a reviewed proposal revision.
