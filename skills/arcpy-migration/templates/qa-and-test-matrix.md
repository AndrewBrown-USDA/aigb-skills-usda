# Migration QA Report and Test Matrix

## Source and target
- Source entrypoint:
- ArcGIS/ArcPy versions:
- Target adapter and core:

## Contract parity
- Inputs and outputs:
- CRS and units:
- NoData and geometry policy:
- Naming and deterministic output rules:

## Evidence
- Default tests:
- ArcGIS reference fixtures:
- Differential comparisons:
- Repeated-run determinism:

## Differences and limitations
- Intentional scope reductions:
- Unsupported ArcGIS behaviors:
- Assumptions:
- Blockers:

## Provenance
- Source data:
- Configuration/version:
- Authority statement:
- Output locations:

## Test matrix

| Category | Cases |
|---|---|
| Geometry | point, line, polygon, multipart, invalid, unclosed ring |
| Boundaries | empty intersection, boundary-touching, out-of-bounds |
| CRS | geographic, projected, mixed, missing |
| Raster | integer, floating, NoData, NaN |
| Behavior | repeated run, input immutability, differential reference, adapter failure |
