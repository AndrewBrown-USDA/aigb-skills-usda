# Skill Loadout Measurement Summary

- **Run:** `orchestration-18-evidence-v1`
- **Source commit:** `51b562f6a0425b12cbb00d532bacd48f37c325d8`
- **Command:** `node scripts/measure-skill-loadouts.js`
- **Environment:** Node v26.12.1 on win32 x64; 10.0.26200
- **Calculation:** baseline is the full-corpus median UTF-8 byte count; target is each scenario median; reduction ratio is `(baseline - target) / baseline`.
- **Evidence status:** Real curated-loadout byte evidence from the pinned packaged corpus; tokenizer/model metrics are unavailable.
- **Manifest:** [manifest.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/manifest.json)
- **Measurement:** [measurement.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/measurement.json)

| Scenario | Baseline bytes | Target bytes | Reduction bytes | Reduction ratio | Raw samples |
| --- | ---: | ---: | ---: | ---: | --- |
| full-corpus | 387052 | 387052 | 0 | 0 | [full-corpus.raw.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/full-corpus.raw.json) |
| direct-plan-wave | 387052 | 21100 | 365952 | 0.9454853611401052 | [direct-plan-wave.raw.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/direct-plan-wave.raw.json) |
| wave-delivery | 387052 | 51633 | 335419 | 0.866599319988012 | [wave-delivery.raw.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/wave-delivery.raw.json) |
| wave-delivery-with-code-review-2axis | 387052 | 28441 | 358611 | 0.926518917354774 | [wave-delivery-with-code-review-2axis.raw.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/wave-delivery-with-code-review-2axis.raw.json) |
| minimal-direct-selection | 387052 | 2486 | 384566 | 0.9935770904167915 | [minimal-direct-selection.raw.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/minimal-direct-selection.raw.json) |
| software-delivery | 387052 | 339271 | 47781 | 0.12344852887984044 | [software-delivery.raw.json](../../.scratch/loadout-measurement/18.5.1/orchestration-18-evidence-v1/software-delivery.raw.json) |
