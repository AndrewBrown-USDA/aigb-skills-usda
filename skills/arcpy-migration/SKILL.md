---
name: arcpy-migration
description: Migrates ArcPy and ArcGIS Pro workflows to explicit, testable open-source Python geospatial workflows. Use when removing ArcPy dependencies, porting geoprocessing scripts, or documenting ArcGIS behavior that will not be migrated.
license: MIT
metadata:
  group: domain-workflows
  loadouts: specialist-workflows,software-delivery,geospatial-migration,test-validation
  optional_dependencies: worker-validation
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/arcpy-migration/SKILL.md
  source_url: https://github.com/AndrewBrown-USDA/aigb-skills.git
---
# ArcPy Migration

Migrate the workflow, not ArcGIS UI state. Create an inventory, explicit contracts, separate adapters, a pure core, parity evidence, and documented limits.

## Phase gates

### Gate 0: Discover the source contract

Before changing code, inventory:

- Entrypoints, ArcPy tools, parameters, environment settings, and implicit defaults.
- Inputs, outputs, intermediate artifacts, file formats, naming rules, overwrite behavior, and side effects.
- `CURRENT` project access, active maps/layers, scratch workspaces, selections, symbology, progress reporting, and global state.
- Horizontal and vertical CRS, units, datum assumptions, resampling, tolerances, NoData, invalid-geometry, and empty-result behavior.
- Dependencies, licenses, ArcGIS version, and any ArcGIS-only behavior.

Write the inventory to a migration manifest. Stop if the behavior cannot be reproduced from explicit inputs or hidden state remains undocumented.

### Gate 1: Approve shared contracts

Define a contract for every operation and output. Each contract names:

- Typed inputs and outputs.
- Source and target CRS, horizontal and vertical units, reprojection point, and raster resampling.
- Geometry validity policy, distance/area semantics, NoData policy, tolerances, ordering, naming, and overwrite rules.
- Side effects, deterministic expectations, semantic parity criteria, unsupported behavior, and tests.

Use explicit status values such as `covered`, `partially_covered`, `unmapped`, and `no_data`. Do not collapse NoData, empty coverage, service failure, and numeric zero into one value. Preserve denominators for weighted calculations.

Stop if an output lacks a type, CRS, naming rule, or semantic parity criterion.

### Gate 2: Separate adapter and core

The core must:

- Accept explicit paths, values, models, CRS, units, tolerances, NoData policy, and output configuration.
- Avoid importing `arcpy`, reading `arcpy.env` or `CURRENT`, mutating map layers, or relying on scratch-workspace state.
- Keep data loading, transformation, and output writing behind narrow seams.
- Return a structured result containing artifacts, diagnostics, status, provenance, and limitations.

The adapter may read ArcGIS projects, extract parameters, report progress, and create ArcGIS-facing outputs. Convert every `arcpy.env` value, scratch location, current-map reference, and implicit relative path into a named workflow-context field.

### Gate 3: Implement and test the pure core

Prefer these defaults where they fit the contract:

| ArcPy concern | Default replacement |
|---|---|
| Geometry and attribute transforms | Shapely, GeoPandas, pandas, NumPy |
| Raster read/write, windows, masks | Rasterio |
| Projection and coordinate transforms | PyProj |
| Feature-class and table I/O | Fiona or GeoPandas |
| `arcpy.env` settings | Explicit workflow-context fields |
| Scratch geodatabase | Explicit temporary or output directory |
| Map/layer mutation | Omit unless explicitly required; otherwise use an optional presentation adapter |
| Symbology/layout/export | Document as a scope reduction or isolate in a presentation adapter |

Extract reusable helpers for I/O, projection, clipping, zoning, raster conditioning, geometry repair, logging, and deterministic artifact writing. Do not duplicate spatial logic across migrated scripts.

Make these decisions visible in code and tests:

- Reject unknown CRS; never infer silently.
- Reproject mixed CRS explicitly before overlay, clipping, distance, or area.
- Do not calculate planar measurements directly in geographic coordinates.
- Require vertical units for elevation or terrain calculations.
- State whether invalid geometries are rejected or repaired, and report repairs.
- Preserve input immutability unless mutation is part of the contract.
- Normalize external identifiers at boundaries and log failures at the feature, tile, or operation level.

### Gate 4: Show behavior matches

Compare the migrated workflow with a retained ArcPy reference fixture where available:

- Geometry after normalization.
- Raster dimensions, transform, CRS, NoData, and values within declared tolerance.
- Attribute schema and values.
- File naming and artifact set.
- Stable ordering and repeated-run determinism.

Use checksums only when byte-level equality is meaningful. Preserve exact inputs and configuration needed for replay. Keep ArcGIS-runtime, network, and live-service tests opt-in; deterministic unit and fixture tests belong in the default suite.

### Gate 5: Release check

Before release, require:

- A fixture-backed end-to-end command.
- Validated manifest and operation contracts.
- Reproducible output locations and cleanup behavior.
- Explicit partial-output and failure behavior.
- QA report with contract parity, tests, intentional differences, limitations, blockers, provenance, authority, and artifact locations.
- A documented list of unsupported ArcGIS behavior and scope reductions.

Do not claim universal tool coverage, zero failures, runtime improvement, or official determinations without direct run evidence and source citations.

## Migration rules

1. Preserve original workflow behavior, file naming, and deterministic outputs before restructuring.
2. Replace ArcGIS global state with explicit paths, configuration, and result objects.
3. Prefer allowlisted domain operations over unrestricted expression or geoprocessing passthrough.
4. Keep I/O, transforms, and writing separate so each can be tested independently.
5. Treat provenance and authority as separate concerns: authoritative source data does not make a derived result official.
6. Keep timeout detection, per-unit diagnostics, failure snapshots, and replay evidence distinct from success claims.

## Required artifacts

At minimum, create:

- A migration manifest.
- An operation contract for each migrated operation.
- A workflow context and structured result model.
- An adapter/core boundary.
- A test matrix covering CRS, units, NoData, geometry, boundaries, determinism, and parity.
- A QA report and assumptions/limitations register.

Use the templates and references in this skill when needed.

Key supporting files:

- Templates: `templates/migration-manifest.yaml`, `templates/operation-contract.yaml`, `templates/workflow-boundary.py`, and `templates/qa-and-test-matrix.md`.
- References: `references/source-inventory.md`, `references/spatial-semantics.md`, and `references/limitations-and-evidence.md`.
- Worked example: `examples/explicit-workflow.md`.

## Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Keep ArcPy globals | Hides dependencies and breaks testability | Pass explicit paths, configuration, and CRS values |
| Recreate ArcGIS UI behavior | Adds unsupported scope | Preserve workflow intent, not the UI |
| Mix file I/O into core math | Makes migration hard to verify | Separate loading, transforms, and writes |
| Use one-off library choices per script | Creates inconsistent behavior | Centralize geospatial helpers |
| Infer unknown CRS or units | Produces plausible but invalid results | Block and require explicit metadata |
| Silently repair or discard data | Makes parity and audit impossible | Report repairs, exclusions, and status |
