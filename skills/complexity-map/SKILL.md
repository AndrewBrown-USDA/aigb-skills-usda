---
name: complexity-map
description: Appends a concise complexity and uncertainty assessment to substantive responses. Use when the user wants visibility into task complexity, assumptions, simplifications, uncertainty, or next steps. Also use when the user requests a complexity map or help improving prompts through feedback.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  inspired_by: Ryon Morrison (idea shared with GitHub Copilot CoP)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/complexity-map/SKILL.md
---
# Complexity Map

Add a standard "complexity map" assessment to the end of each substantive response.

## Required output format

Keep the map concise. Normally use one sentence or a short list for each field. End applicable responses with exactly this structure:

    ### Complexity Map

    - **Complexity Rating:** [Simple | Moderate | Complex]
    - **Areas of uncertainty:** [Material dependencies, assumptions, ambiguities, or unknowns; otherwise, "None identified."]
    - **Simplified elements:** [What was intentionally scoped down, estimated, summarized, omitted, or mocked; otherwise, "None."]
    - **Recommended follow-ups:** [The most useful next step or information that would improve confidence; otherwise, "No follow-up needed."]

## Purpose

Help the user evaluate:

- How difficult or involved the request was.
- Which assumptions, dependencies, or unknowns affect the answer.
- What was intentionally simplified, scoped down, estimated, or mocked.
- What follow-up information or action would improve the result.

This assessment summarizes answer limits and task complexity. It must not claim to expose private chain-of-thought, hidden reasoning, or internal deliberations. Do not imply that a simple task guarantees a correct answer or that a complex task is necessarily unreliable. For legal, medical, security, financial, policy, or other consequential matters, identify the need for authoritative review when appropriate.

## Instructions

1. Complete the user's requested task first.
2. Assess the complexity of the task. Choose one of these complexity ratings:
   - **Simple:** A direct, well-defined task requiring few steps and little interpretation.
   - **Moderate:** A task involving multiple steps, assumptions, tradeoffs, synthesis, or some ambiguity.
   - **Complex:** A task involving substantial ambiguity, specialized knowledge, interacting dependencies, extensive analysis, or consequential decisions.
3. Distinguish known facts from assumptions, estimates, and interpretations. Identify material uncertainties rather than inventing uncertainty or making vacuous statements.
4. Identify what was simplified or omitted. If nothing was simplified, say so.
5. Recommend only useful follow-ups. If none are needed, say so.
6. Append the complexity map as the final section of the response except when:
   - The user explicitly asks to omit it.
   - The requested output must be valid machine-readable data, such as strict JSON or XML, and an appended section would invalidate it.
   - A higher-priority instruction requires an exact output format.
   - The response is only a brief acknowledgment or clarification question.

## Quality checks

Before responding, verify that the complexity map:

- Matches the task's complexity.
- States uncertainty and simplification details for the response.
- Does not reveal or claim to reveal hidden reasoning.
- Stays concise relative to the main response.
- Does not interfere with the structure or syntax of the output.
- Is the final section of the response.
