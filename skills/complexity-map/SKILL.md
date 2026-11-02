---
name: complexity-map
description: Appends a concise complexity and uncertainty assessment to substantive responses. Use when the user wants visibility into task complexity, assumptions, simplifications, uncertainty, or next steps. Also use when the user requests a complexity map or help improving prompts through feedback.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  inspired_by: Ryon Morrison (idea shared with GitHub Copilot CoP)
  version: 1.1
  source_repo: aigb-skills
  source_path: skills/complexity-map/SKILL.md
  group: quality-assurance
  loadouts: software-delivery,code-quality,context-economy
---
# Complexity Map

Add a "complexity map" to the end of each substantive response.

## Required output format

Keep the map short. Use one sentence or a short list for each field. End applicable responses with this exact structure:

    ### Complexity Map

    - **Complexity Rating:** [Simple | Moderate | Complex]
    - **Areas of uncertainty:** [Material dependencies, assumptions, ambiguities, or unknowns; otherwise, "None identified."]
    - **Simplified elements:** [What was intentionally scoped down, estimated, summarized, omitted, or mocked; otherwise, "None."]
    - **Recommended follow-ups:** [The most useful next step or information that would improve confidence; otherwise, "No follow-up needed."]

## Purpose

Help the user assess:

- How difficult or involved the request was.
- Which assumptions, dependencies, or unknowns affect the answer.
- What was intentionally simplified, scoped down, estimated, or mocked.
- What follow-up information or action would improve the result.

This map states task limits and complexity. It must not claim to expose private chain-of-thought, hidden reasoning, or internal deliberations. Do not imply that a simple task guarantees a correct answer or that a complex task is unreliable. For legal, medical, security, financial, policy, or other consequential matters, call for authoritative review when needed.

## Instructions

1. Complete the user's requested task first.
2. Rate the task:
   - **Simple:** A direct, well-defined task requiring few steps and little interpretation.
   - **Moderate:** A task involving multiple steps, assumptions, tradeoffs, synthesis, or some ambiguity.
   - **Complex:** A task involving substantial ambiguity, specialized knowledge, interacting dependencies, extensive analysis, or consequential decisions.
3. Separate known facts from assumptions, estimates, and interpretations. State material uncertainties. Do not invent uncertainty or use empty phrases.
4. Identify what was simplified or omitted. If nothing was simplified, say so.
5. Recommend useful follow-ups only. If none are needed, say so.
6. Append the complexity map as the final section of the response except when:
   - The user explicitly asks to omit it.
   - The requested output must be valid machine-readable data, such as strict JSON or XML, and an appended section would invalidate it.
   - A higher-priority instruction requires an exact output format.
   - The response is only a brief acknowledgment or clarification question.

## Quality checks

Before responding, verify that the complexity map:

- Matches the task's complexity.
- States the response's uncertainty and simplifications.
- Does not reveal or claim to reveal hidden reasoning.
- Stays short.
- Does not interfere with the structure or syntax of the output.
- Is the final section of the response.
