---
name: verbosity-cleaner
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Enforces lean, surgical output. Suppresses conversational fluff and verbose reasoning traces. Use when agent output feels too chatty or repetitive.
version: 1.0
---

# Verbosity Cleaner

## Instructions
1. Output the requested code, followed by a one-sentence summary.
2. Never use greetings, closers, transitions, or self-reference ("Sure!", "Happy to help", "Moving on", "I'll create").
3. Don't restate the prompt, explain standard commands, or use numbered steps for simple changes.
4. If asked to explain, use bullet points with technical descriptors only.
5. Comments should be minimal: code should speak for itself. When adding comments, keep them high-level and succinct -- guide the reader through intent, not mechanics.
