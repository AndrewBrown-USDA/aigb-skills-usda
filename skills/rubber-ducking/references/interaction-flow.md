# Interaction Flow & State Machine

Detailed specification for the rubber ducking agent's state machine and all navigation paths.

---

## Mode Selection

The skill supports two modes:

**Default Mode**: Pure listening (silent, passive)
```
/rubber-ducking
[code]
```

**Socratic Mode**: Guided questioning (opt-in)
```
/rubber-ducking socratic
[code]
```

Or, enable during walkthrough:
```
enable socratic mode
```

In both modes, the state machine is similar; the key difference is in contradiction detection and clarifying questions (Socratic only).

---

## Overall State Machine

```
START
  |
  +- [User invokes /rubber-ducking (optional: socratic flag)]
  |   +- Prompt: "Paste code (and optional language hint)"
  |   +- Initialize: socratic_mode = false (or true if flag set)
  |   +- Wait for input
  |
  +- [User provides code + optional language]
  |   +- Auto-detect language
  |   +- Parse code into logical chunks
  |   +- Initialize chunk pointer (chunk = 0)
  |   +- Transition to: WALKTHROUGH_LOOP
  |
  WALKTHROUGH_LOOP:
  |
  +- [Display chunk at pointer]
  |   +- Show code snippet (lines X-Y)
  |   +- Prompt: "Explain what this part does, or ask me to explain"
  |   +- Wait for user input
  |
  +- [User responds]
  |   |
  |   +- IF user provides explanation:
  |   |   +- Log explanation verbatim
  |   |   +- Reflect: "You said lines X-Y do [their words]. Options?"
  |   |   +- Present navigation menu (see below)
  |   |   +- Wait for navigation command
  |   |
  |   +- IF user types "explain" or "ask you to explain":
  |   |   +- Provide explanation (one time only)
  |   |   +- Mark as "agent-explained" in log
  |   |   +- Prompt: "Now, can you explain this in your own words?"
  |   |   +- Wait for user explanation
  |   |   +- [Then jump to: Present navigation menu]
  |   |
  |   +- [Continue WALKTHROUGH_LOOP until user chooses to stop]
  |
  NAVIGATION MENU:
  |
  +- **Next** (or blank line, or "n")
  |   +- Advance pointer: chunk = chunk + 1
  |   +- IF chunk < total chunks: Loop back to WALKTHROUGH_LOOP
  |   +- IF chunk >= total chunks: Transition to POST_WALKTHROUGH
  |   +- [Continue walkthrough]
  |
  +- **Rewind** (or "r", or "back")
  |   +- Decrement pointer: chunk = chunk - 1
  |   +- IF chunk < 0: Set chunk = 0 (don't go before first chunk)
  |   +- Loop back to WALKTHROUGH_LOOP (redisplay previous chunk)
  |   +- [Continue walkthrough]
  |
  +- **Step In** (or "step", or "deeper")
  |   +- Expand current chunk into sub-chunks
  |   +- Insert sub-chunks into chunk list at current position
  |   +- Adjust pointer to first sub-chunk
  |   +- Loop back to WALKTHROUGH_LOOP
  |   +- [Continue walkthrough with finer granularity]
  |
  +- **Stop** (or "done", or "end")
  |   +- Exit WALKTHROUGH_LOOP
  |   +- Transition to POST_WALKTHROUGH
  |
  +- [Invalid command: Repeat navigation menu]
  
  POST_WALKTHROUGH:
  |
  +- Create neutral recap from user explanations
  +- Present options:
  |   +- **Recap** (or "r") -> Output recap log
  |   +- **Plan** (or "p") -> Suggest bugfix/feature/refactor based on recap
  |   +- **Skip** (or "s", or blank) -> End cleanly
  |
  +- IF user chooses Recap:
  |   +- Output recap (see Recap Format below)
  |   +- Then re-present options (Recap again? Plan? Skip?)
  |   +- [User can ask for recap multiple times]
  |
  +- IF user chooses Plan:
  |   +- Synthesize observations from recap
  |   +- Output plan (bugfix, refactor, feature, etc.)
  |   +- Offer: "Create a full spec? / Refine plan? / Done?"
  |   +- [May iterate with user on plan details]
  |
  +- IF user chooses Skip:
  |   +- [Clean end]
  |
  +- END
```

---

## Input & Initialization

### `/rubber-ducking` Invocation (Default or Socratic)

**Agent prompt** (default mode):
```
Paste the code you want to debug or review. Optionally, specify the programming language (e.g., Python, JavaScript, R). If you don't specify, I'll auto-detect.

Optionally, also tell me what you're trying to debug or understand (e.g., "This loop isn't returning the expected result").
```

**To enable Socratic mode upfront**:
```
/rubber-ducking socratic

[code]
```

**Or enable mid-walkthrough**:
User types: `enable socratic mode`

### User Input Format (Flexible)

Users can provide:

```
Language: Python
Issue: Why isn't the highest score correct?

def find_highest_score(scores):
    highest = scores[0]
    for i in range(1, len(scores)):
        if scores[i] > highest:
            highest = scores[i]
    return highest
```

Or just:
```python
def find_highest_score(scores):
    ...
```

Or:
```
# My buggy loop
def find_highest_score(scores):
    ...
```

**Agent action**: Extract code, auto-detect language, initialize chunks.

---

## Chunk Initialization

### Parsing Phase

1. **Language Detection**:
   - Scan code for keywords, syntax
   - If ambiguous, ask: "Is this Python or JavaScript?"

2. **Code Parsing**:
   - Use native AST parsing (Python `ast`, JavaScript native parse, etc.)
   - OR use Claude's parsing if language is unsupported
   - Identify semantic boundaries (functions, loops, conditionals, statements)

3. **Chunking**:
   - Break code into logical units (see `ast-chunking-strategy.md`)
   - Assign each chunk:
     - Chunk ID (0, 1, 2, ...)
     - Line range (start, end)
     - Code snippet
     - Hierarchy (parent chunk for nested structures)

4. **State Initialization**:
   - Current chunk index: 0
   - Total chunks: N
   - Chunk log: empty (will store explanations)
   - Navigation history: empty (for rewind)
   - **Socratic mode flag**: true if enabled, false if default

5. **Socratic Mode State** (if enabled):
   - Track prior explanations for contradiction detection
   - Track stated user goals/intents
   - Prepare to surface conflicts during walkthrough
   - Enable pause prompting on user hesitation
   - Prepare prediction gap view for post-walkthrough

### Chunk Metadata

Each chunk tracks:
```json
{
  "id": 0,
  "lines": [1, 2],
  "code": "def find_highest_score(scores):\n    highest = scores[0]",
  "type": "function_header",
  "explanation": null,
  "agent_explained": false
}
```

---

## Walkthrough Loop: Detailed States

### State: Display Chunk

**Agent output**:
```
## Chunk 1 of 5 (Lines 1-2)

def find_highest_score(scores):
    highest = scores[0]

---

Explain what this part does, or type "explain" if you want me to explain first.
```

### State: Await User Input

Agent waits for:
- Free-form explanation
- Command (explain, next, rewind, step in, stop)

**Agent should handle**:
- Multi-line input (user may explain across multiple lines)
- Commands case-insensitive
- Aliases (n=next, r=rewind, s=stop, etc.)

### State: Log Explanation

**If user provides explanation**:

1. **Store verbatim**: Save exact user input in chunk log
2. **Reflect back**: Confirm what was said
3. **Offer navigation**: Present menu

**Example (Default Mode)**:

```
You said: "Define the function and initialize highest to the first score."

Logged. What's next?
  - next (or n)
  - rewind (or r)
  - step in (or step)
  - stop

>
```

### State: Contradiction Detection (Socratic Mode Only)

**If Socratic mode is enabled**, after logging the explanation, check for contradictions:

1. **Check against prior explanations**: Does this conflict with something user said about earlier chunks?
2. **Check against code**: Does this match what the code actually does?
3. **Check against stated intent**: Does this align with the user's stated goal?

**If contradiction found**:
- Surface as genuine question (not trap)
- Phrase as curiosity: "You mentioned [X earlier], but here you're saying [Y]. Can you help me understand?"
- Wait for user resolution
- Don't provide the answer

**If no contradiction**:
- Log and move to navigation

**Example (Socratic Mode)**:

```
You said: "Loop from index 1 to the length."

Earlier you said: "The function should find the highest of all scores."

Does range(1, len) include the element at index 0? And does it reach the last element at index len-1?

>
```

**Then continue to navigation options after user responds to the contradiction question.**

### State: Handle Agent Explanation Request

**If user asks "explain"**:

1. **Agent explains chunk once** (clear, one paragraph)
2. **Mark chunk as agent-explained**: `"agent_explained": true`
3. **Reprompt user**: "Now, can you explain this in your own words?"
4. Wait for user explanation (start of logging cycle again)

**Important**: If user asks to explain again, return the same explanation (don't elaborate or rephrase).

---

## Navigation Commands

### Next
**Alias**: `n`, `next`, blank line, `->`, `continue`

**Action**:
- Increment chunk pointer
- IF pointer < total chunks: Loop to Display Chunk
- IF pointer >= total chunks: Transition to Post-Walkthrough
- IF pointer out of bounds: "You're at the last chunk. Type 'recap' or 'stop'."

**Example**:
```
> next

## Chunk 2 of 5 (Lines 3-5)

for i in range(1, len(scores)):
    ...
```

### Rewind
**Alias**: `r`, `back`, `rewind`, `<-`, `previous`

**Action**:
- Decrement chunk pointer
- IF pointer < 0: Set to 0, message: "You're at the first chunk"
- Loop to Display Chunk

**Example**:
```
> rewind

## Chunk 1 of 5 (Lines 1-2)

def find_highest_score(scores):
    highest = scores[0]

---

[Reprompt for explanation]
```

### Step In
**Alias**: `step`, `in`, `deeper`, `expand`, `detail`

**Action**:
- Expand current chunk into finer-grained sub-chunks
- Insert sub-chunks into chunk list
- Set pointer to first sub-chunk
- Loop to Display Chunk with new granularity

**Example**:
Before:
```
Chunk 2 (Lines 3-5):
if scores[i] > highest:
    highest = scores[i]
```

After "step in":
```
Chunk 2a (Line 4):
if scores[i] > highest:

Chunk 2b (Line 5):
    highest = scores[i]
```

### Stop
**Alias**: `s`, `done`, `end`, `exit`

**Action**:
- Exit walkthrough loop
- Transition to Post-Walkthrough

**Example**:
```
> stop

Walkthrough complete. Recap, plan a fix, or skip?
```

### Enable/Disable Socratic Mode
**Command**: `enable socratic mode`, `disable socratic mode`, `toggle socratic`

**Action**:
- If Socratic mode is off, turn it on (enable contradiction surfacing, clarifying questions, pause prompting)
- If Socratic mode is on, turn it off (revert to pure passive listening)
- Continue walkthrough with new mode

**Example**:
```
> enable socratic mode

Socratic mode enabled. Questions and contradiction surfacing now active.

Chunk 2 (Line 3)

for i in range(1, len(scores)):

[Reprompt for explanation]
```

### Invalid Command
**If user input is unclear**:

**Agent response**:
```
I'm not sure what you meant. You can:
  - Explain the chunk
  - Type 'explain' to ask me to explain
  - Type 'next' (or n) to move to the next chunk
  - Type 'rewind' (or r) to go back
  - Type 'step in' for more detail
  - Type 'stop' to end the walkthrough

What would you like?
```

---

## Post-Walkthrough: Recap & Planning

### After All Chunks (or User Stops)

**Agent output** (default mode):
```
Walkthrough complete!

What would you like to do?
  - recap     (Show summary of your explanations)
  - plan      (Suggest a bugfix or feature based on our walkthrough)
  - skip      (End here)

>
```

**Agent output** (Socratic mode):
```
Walkthrough complete!

What would you like to do?
  - recap     (Show summary of your explanations)
  - prediction    (Show what you predicted vs. what the code does)
  - plan      (Suggest a bugfix or feature based on our walkthrough)
  - skip      (End here)

>
```

### Recap Request

**Command**: `recap`, `r`, `summary`

**Agent action**:
1. Compile chunk log into structured format
2. Output recap (see Recap Format below)
3. After recap, re-offer options (recap again? plan? skip?)

### Gap Request (Socratic Mode Only)

**Command**: `gap`, `prediction`, `show gap`

**Agent action** (Socratic mode only):
1. Reconstruct prediction: "You predicted [what user thought code does]"
2. Show reality: "The code actually [what it does]"
3. Identify gap: "The difference is [what doesn't match]"
4. Output gap view
5. Offer: "Ready to plan a fix?" or re-offer options

**Example Output**:
```
## Prediction Gap

**You predicted**: "The function finds the highest score in the entire list"

**Code does**: "Initializes highest to scores[0], loops from index 1 to len-1, returns highest"

**Gap**: You thought all scores would be considered. But scores[0] is used for init, not looped. The loop stops before len-1, potentially missing the last element.

The logic is sound, but boundaries are narrower than intended.
```

### Plan Request

**Command**: `plan`, `p`, `bugfix`, `fix`, `feature`

**Agent action**:
1. Analyze recap (and prediction-actual code if available in Socratic mode) for observations/issues user mentioned
2. Synthesize suggestions (bugfix, refactor, feature, etc.)
3. Output plan
4. Offer: "Refine this plan? Create a full spec? Done?"

### Skip Request

**Command**: `skip`, `s`, blank line, `done`

**Agent action**:
- Clean exit
- No recap or planning
- Dismiss cleanly

---

## Recap Format

**Output structure**:

```
## Rubber Duck Recap: [Code Identifier]

**Language**: [Detected or user-specified]  
**Total Chunks**: [N]  
**Chunks Explained**: [M] (without agent help), [N-M] (with agent help)

---

### Chunk 1 (Lines 1-2)

[Code snippet in triple backticks]

**Your Explanation**:
> [Exact user explanation from log]

[If applicable]
**Note**: Agent explained this chunk; you then explained in your own words.

### Chunk 2 (Lines 3-5)

[Repeat...]

---

## Key Observations

[List any issues, concerns, or interesting points user raised during walkthrough]
[Do NOT inject agent's own analysis here]

---

## Next Steps

[Leave blank unless user already requested planning]
```

---

## Plan Format

**Output structure**:

```
## Suggested Bugfix / Feature / Refactor

**Issue Identified**:
[Based on user's recap observations]

**Root Cause**:
[Synprediction of what user noticed]

**Recommendation**:
[Specific fix or feature addition]

**Steps**:
1. [Concrete step 1]
2. [Concrete step 2]
3. [etc.]

**Example Fix**:
[Code snippet showing the change]

---

Would you like to refine this plan, create a full specification, or are we done?
```

---

## State Machine Transitions: Quick Reference

| Current State | User Input | Next State | Action |
|---------------|-----------|-----------|--------|
| Display Chunk | Explanation | Display Chunk | Log, reflect, show nav menu |
| Display Chunk | "explain" | Display Chunk | Agent explains, ask for user explanation |
| Display Chunk | "next" | Display Chunk | Advance; if done, go to Post-Walkthrough |
| Display Chunk | "rewind" | Display Chunk | Go back |
| Display Chunk | "step in" | Display Chunk | Expand and show first sub-chunk |
| Display Chunk | "stop" | Post-Walkthrough | Exit loop |
| Post-Walkthrough | "recap" | Post-Walkthrough | Output recap, offer menu again |
| Post-Walkthrough | "plan" | Post-Walkthrough | Output plan, offer refinement |
| Post-Walkthrough | "skip" | END | Clean exit |

---

## Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| User provides code >1000 lines | Suggest focusing on one function/class at a time |
| Language auto-detection fails | Ask: "Is this Python or JavaScript? (or other language)" |
| User explanation is very vague | Ask for clarification once; if still vague, log it and move on |
| User asks for analysis mid-walkthrough | Defer: "Let's finish the walkthrough, then we can plan based on what you observed" |
| User wants to re-examine a chunk they passed | Offer "rewind" to go back; or ask if they want to jump to a specific chunk |
| User asks for bugfix mid-walkthrough | Defer to post-walkthrough planning |
| Code has syntax errors | Note the error and ask for corrected version |

---

## Key Design Principles

1. **User is in control**: Every navigation option is explicit and reversible (rewind, step in)
2. **Agent is passive**: Explains only if asked; never injects analysis mid-walkthrough
3. **Recap bridges to planning**: Neutral recap becomes foundation for actionable fixes
4. **Flexibility**: User can stop, rewind, step in, or skip planning -- all valid paths
