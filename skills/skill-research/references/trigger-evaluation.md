# Trigger Evaluation

Use this reference when testing whether a skill description routes correctly.

1. Draft positive prompts that should trigger the skill and near-miss prompts that should not.
2. Split prompts into training and held-out validation sets.
3. Repeat prompts when routing is nondeterministic and record trigger rates.
4. Revise general intent and capability language, not prompt-specific keyword hacks.
5. Re-run the held-out set and preserve regressions.

Record prompt, expected result, observed result, run count, trigger rate, and revision. Keep neighboring skills in the negative set when their boundaries overlap.
