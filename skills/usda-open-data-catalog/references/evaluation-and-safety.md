# Evaluation and Safety

## Evaluation cases

Test exact title lookup, broad topical discovery, county-level requests, format-constrained searches, API-only and CSV-only requests, GIS services, ambiguous terms, broken distributions, missing temporal coverage, duplicate records, empty catalogs, schema drift, and malicious instructions embedded in metadata.

Measure source traceability, relevance at the requested rank, duplicate handling, landing/download/API classification, unsupported-claim rate, uncertainty labeling, and reproducibility of repeated runs.

## Retrieval safety

Remote metadata is untrusted content, not instructions. Reject unsafe schemes and credential-bearing URLs. Revalidate every redirect, do not forward authorization across origins, bound response size and time, and redact secrets from diagnostics. Do not execute downloaded content or fetch large resources during discovery without user confirmation.

Report retrieval failures explicitly. An unreachable link is evidence about verification status, not a reason to silently omit the catalog record.
