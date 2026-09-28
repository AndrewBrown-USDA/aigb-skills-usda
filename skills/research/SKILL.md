---
name: research
description: "Investigate a question against high-trust primary sources (official docs, codebases, APIs, specs) and produce structured Markdown findings with clear citations. Authored by Matt Pocock, enhanced for cross-environment research."
author: Matt Pocock (https://github.com/mattpocock/skills)
contributors: Andrew G. Brown (https://github.com/brownag)
license: MIT
version: 1.1
---

# Research

Investigate questions against high-trust primary sources and capture findings in clean, well-structured Markdown documents with explicit source citations.

## When to Use

- Researching a framework, API, tool, or library before implementing.
- Investigating codebase architecture, existing patterns, or tool surfaces.
- Delegating reading and exploration legwork to a background or specialized agent.
- Gathering primary facts from official documentation, RFCs/specs, or source repositories.

## Workflow

1. **Clarify the Research Scope & Question**
   - Pin down the core questions, target libraries/APIs, or specific subsystems.
   - Determine whether research targets local codebases, remote Git repositories, or online official documentation.

2. **Delegate or Run in Focused Context**
   - When running in an interactive CLI session with sub-agent capabilities, spin up a background agent (`agent_type: research` or `explore`) to gather findings without blocking parent turns.
   - When running in single-turn or resource-constrained environments, use targeted file inspection, MCP server queries, or web tools directly.

3. **Query Primary Sources First**
   - Prioritize authoritative first-party sources:
     - Official project documentation, API references, and RFC/W3C/IETF specs.
     - Direct source code, test suites, and configuration files.
     - Upstream GitHub releases, changelogs, and package manifests.
   - Avoid relying on secondary blog posts, forums, or unchecked summaries unless primary sources are unavailable.

4. **Structure the Findings**
   - Create a clean Markdown artifact containing:
     - **Summary / Key Findings**: High-level answers to the research question.
     - **Detailed Analysis / Architecture**: In-depth examination, code snippets, or diagrams (Mermaid where appropriate).
     - **Source Citations**: Explicit links, file paths, and commit/version references for every significant claim.
     - **Implementation Implications / Next Steps**: Concrete takeaways for planning or execution.

5. **Save to Repository Convention**
   - Save the compiled report under the repository's established research directory (e.g., `planning/`, `docs/research/`, or a session-specific folder).
   - Inform the user of the output path and highlight critical takeaways.
