# Worked Example: Explicit Raster Clip

The ArcPy source reads the current project, uses a scratch geodatabase, and clips a raster with the active layer. The migrated workflow instead accepts `input_raster`, `mask_path`, `input_crs`, `output_crs`, `nodata`, and `output_dir` in a `WorkflowContext`.

The adapter loads the raster and mask, reprojects the mask to the raster CRS, and calls a core function that performs only the clip and metadata calculation. The writer creates a stable `{stem}_clipped.tif` artifact and returns its path, CRS, dimensions, NoData policy, diagnostics, and provenance.

The test matrix includes a mixed-CRS mask, an all-NoData window, a boundary-touching polygon, repeated runs, and comparison with a retained ArcPy fixture. Map insertion and symbology are recorded as unsupported presentation behavior rather than recreated in the core.
