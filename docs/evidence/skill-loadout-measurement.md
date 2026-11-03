# Skill Loadout Measurement Summary

- **Run:** `orchestration-18-evidence-v1`
- **Source commit:** `cefa5c77d305e0e1631d2911751a5e079927f86a`
- **Command:** `node scripts/measure-skill-loadouts.js`
- **Environment:** Node v26.12.1 on win32 x64; 10.0.26200
- **Calculation:** baseline is the full-corpus median UTF-8 byte count; target is each scenario median; reduction ratio is `(baseline - target) / baseline`.
- **Evidence status:** Real curated-loadout byte evidence from the pinned packaged corpus; tokenizer/model metrics are unavailable.
- **Manifest:** [manifest.json](manifest.json)
- **Measurement:** [measurement.json](measurement.json)

| Scenario | Baseline bytes | Target bytes | Reduction bytes | Reduction ratio | Raw samples |
| --- | ---: | ---: | ---: | ---: | --- |
| full-corpus | 507710 | 507710 | 0 | 0 | [full-corpus.raw.json](full-corpus.raw.json) |
| direct-plan-wave | 507710 | 21100 | 486610 | 0.9584408422130744 | [direct-plan-wave.raw.json](direct-plan-wave.raw.json) |
| wave-delivery | 507710 | 57062 | 450648 | 0.8876090681688366 | [wave-delivery.raw.json](wave-delivery.raw.json) |
| wave-delivery-with-code-review-2axis | 507710 | 28541 | 479169 | 0.9437848378011069 | [wave-delivery-with-code-review-2axis.raw.json](wave-delivery-with-code-review-2axis.raw.json) |
| minimal-direct-selection | 507710 | 2486 | 505224 | 0.9951035039688011 | [minimal-direct-selection.raw.json](minimal-direct-selection.raw.json) |
| software-delivery | 507710 | 395657 | 112053 | 0.22070276338854858 | [software-delivery.raw.json](software-delivery.raw.json) |
