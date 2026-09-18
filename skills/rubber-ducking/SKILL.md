---
name: rubber-ducking
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
version: 1.0
description: Interactive guided walkthrough of code, line by line, where the agent reflects back your explanations without analysis. Use when debugging, reviewing, or understanding code by forced articulation.
---

# Rubber Ducking

Explain your code out loud. Your brain fills in gaps when reading silently. Speaking makes you confront every line. That's where bugs surface.

Saying it aloud -- to anyone, even a rubber duck -- works because:
- You slow down and notice what you skip.
- You explain *why* each line exists, not just what it does.
- Hearing yourself exposes the gap between what you think and what's actually there.

Research shows 50-90% of bugs surface during this walkthrough, often before the listener says anything. The listener barely matters. The act of explaining is everything.

## When to Use

Use rubber-ducking to find bugs by explaining code aloud.

Also works for:
- Reviewing unfamiliar code
- Learning a new codebase
- Documenting assumptions before tests

Skip it if:
- Code is working fine
- Your bug is an API misunderstanding (use `/research` instead)
- You need automated code review (use `/code-review`)

---

## Quick Start

Invoke the skill and provide your code:

```
/rubber-ducking

Paste the code you want to walk through. Optionally, specify the language (e.g., Python, JavaScript, R) or the specific issue you're investigating.
```

**Example**:
```
/rubber-ducking

Language: Python
Issue: This loop isn't returning what I expect.

def find_highest_score(scores):
    highest = scores[0]
    for i in range(1, len(scores)):
        if scores[i] > highest:
            highest = scores[i]
    return highest
```

The agent will:
1. Parse your code and identify logical chunks (statements, control structures, function definitions)
2. Display the first chunk with line numbers
3. Ask you to explain what that chunk does
4. Log your explanation
5. Move to the next chunk, or offer you options (rewind, step deeper, stop)
6. When done, offer to create a recap, plan a bugfix, or skip

---

## Default Mode: Pure Facilitation

By default, the agent acts as a **silent, passive listener**. It does NOT:
- Offer corrections or suggestions
- Complete your sentences
- Point out bugs (unless you ask explicitly)
- Skip ahead or summarize on its own

The agent DOES:
- Display code chunks with line numbers
- Prompt you to explain without hints
- Log your exact explanation
- Reflect back: "You said line X-Y does [your explanation]"
- Offer navigation (next chunk, rewind, step deeper, stop)
- Create a neutral recap on request
- Auto-detect your code's language

### Navigation Commands

After explaining a chunk, choose:

- `next` (`n`) -- next chunk
- `rewind` (`r`) -- previous chunk
- `step` -- expand into sub-chunks
- `explain` -- agent explains once, then you re-explain
- `stop` -- end walkthrough

---

## Socratic Mode (Optional)

Socratic mode adds guided discovery:
- **Contradiction surfacing**: Agent asks when explanations conflict ("You said the loop includes all elements. Does range(1, len) skip index 0?")
- **Clarifying questions**: Optional probing ("What if that condition fails?")
- **Pause prompting**: When you hesitate, the agent invites exploration
- **Prediction gap**: Post-walkthrough view of what you predicted vs. reality

### Enable Socratic Mode

During walkthrough:
```
enable socratic mode
```

Or start with it:
```
/rubber-ducking socratic
[code]
```

### Example

```
User: "This loop finds the highest score"
Agent (Socratic): "Noted. So you expect it to find the max? Let's see. 

Chunk 2 (line 3): for i in range(1, len(scores)):

Does range(1, len) include the first element at index 0?"

User: "No, it starts at 1."

Agent: "Right. And your function goal was to find the highest -- does that include scores[0]?"

User: "Oh... we already initialized highest with scores[0], so we're checking the rest... but wait, does it include the last element?"

Agent: "What do you think?"

User: "No! range goes up to but not including len(). So we miss the last element!"
```

**Difference from default mode**: Agent asks questions to expose the gap. In pure mode, the agent would just reflect and move on; you'd discover the gap on your own (or not).

---

## Language & Chunking

Auto-detects 12+ languages (Python, JavaScript, TypeScript, R, Java, C/C++, Go, Rust, SQL, Bash, YAML). Falls back to generic chunking if unsupported.

See `scripts/language_detect.md` and `scripts/ast_chunking.md` for technical details.

---

## After the Walkthrough: Recap & Planning

Once you've walked through all chunks (or stopped early), the agent offers three options:

### 1. Recap (Neutral Log)
The agent outputs a structured summary of your explanations:

```
## Rubber Duck Recap

### Chunk 1 (Lines 1-2)
[code]

**Your Explanation**:
> [your exact words]

### Chunk 2 (Lines 3-5)
[code]

**Your Explanation**:
> [your exact words]

### Key Observations
[If you flagged something as "interesting" or "unclear", it appears here]
```

Use this to:
- Externalize your mental model
- Share your understanding with teammates
- Spot inconsistencies you missed
- Archive your findings for later

### 2. Plan a Bugfix or Feature

If you identified an issue during the walkthrough, ask the agent to "Plan a bugfix based on the recap." The agent will:
- Synthesize your observations from the recap
- Suggest root causes
- Outline steps to fix or refactor
- Propose tests or validation

Similarly, you can ask to "Plan a new feature" or "Plan a refactor" based on what you learned.

### 3. Skip

End the session without recap or planning.

---

## Tips

1. **Explain every line** -- don't skip details.
2. **Speak naturally** -- use your own words, perfect grammar not needed.
3. **Flag confusion** -- say when something doesn't make sense.
4. **Rewind if unsure** -- re-explain to solidify understanding.
5. **Use recap as mirror** -- externalize and verify your mental model.
6. **Try Socratic mode if stuck** -- switch to guided questioning if pure facilitation isn't revealing bugs.

---

## Scope & Escalation

### Use rubber-ducking for:
- Logic errors and off-by-one bugs
- Understanding control flow in new code
- Documenting assumptions before refactoring
- Learning a codebase gradually

### Best results:
- Focus on one function or class at a time (not entire codebases >1000 lines)
- For performance issues, use profiling tools or `/code-review`
- For API misunderstandings, use `/research` first

### When to switch tools:
- Bug found, need a fix plan -> `/plan-first`
- Need architecture advice -> `/codebase-design`
- Want automated code review -> `/code-review` (after rubber ducking)
- Stuck on library behavior -> `/research`

---

## Implementation

For agent implementers:
- `references/facilitator-rules.md` -- Agent behavior rules (default and Socratic modes)
- `references/interaction-flow.md` -- Walkthrough state machine and navigation
- `scripts/language_detect.py` -- Language detection utility
- `scripts/ast_chunking.py` -- Code chunking utility
- `scripts/language_detect.md`, `scripts/ast_chunking.md` -- Technical specifications
