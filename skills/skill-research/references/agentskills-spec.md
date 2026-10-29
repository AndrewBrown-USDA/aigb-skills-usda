# Agent Skills Specification

Use this reference when checking a skill's package contract.

## Required structure

- The skill directory name and frontmatter `name` must match.
- `name` uses lowercase letters, numbers, and single hyphens; keep it within the supported length.
- Frontmatter must include `name` and `description`.
- Keep repository-specific synchronization data under `metadata`.

## Progressive disclosure

Keep trigger-critical instructions in `SKILL.md`. Move detailed procedures, examples, scripts, and templates into focused `references/`, `scripts/`, or `assets/` files. Link directly from the skill root and avoid reference chains.

## Repository boundary

The packaged validator is authoritative for this repository's shipped structure. The external Agent Skills specification remains the authority for interoperable skill behavior; document any intentional repository-specific rule rather than silently assuming the two validators are identical.
