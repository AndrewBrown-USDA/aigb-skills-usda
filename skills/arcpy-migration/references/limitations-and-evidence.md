# Limitations and Evidence

Document ArcGIS-only tools, map-document insertion, symbology, layout/export, licensing-dependent behavior, and unresolved parity gaps. A scope reduction is acceptable when workflow intent is preserved and the limitation is visible in the manifest and QA report.

Preserve exact inputs and configuration needed for replay. Keep timeout detection, per-unit diagnostics, failure snapshots, and replay evidence distinct from success claims.

Compare semantic outputs against retained ArcPy fixtures where available:

- Geometry after normalization.
- Raster dimensions, transform, CRS, NoData, and values within declared tolerance.
- Attribute schema and values.
- File naming, artifact set, stable ordering, and repeated-run determinism.

Use checksums only when byte-level equality is meaningful. Do not claim universal tool coverage, zero failures, runtime improvement, or official determinations without direct run evidence and source citations.
