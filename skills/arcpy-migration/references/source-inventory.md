# Source Inventory and Tool Mapping

Record every source of implicit state before migration:

- `arcpy.env` values, current workspace, scratch workspace, overwrite mode, extent, mask, cell size, snap raster, and output coordinate system.
- `CURRENT` project, active map, layer selections, definition queries, symbology, layouts, and map insertion.
- Implicit relative paths, temporary files, progress callbacks, and global caches.

For each item, record its explicit replacement, whether it affects semantics, and the test that proves the replacement.

| ArcPy behavior | Preferred seam |
|---|---|
| Geometry and attributes | Shapely, GeoPandas, pandas, NumPy |
| Raster windows and masks | Rasterio |
| CRS transformation | PyProj |
| Feature/table I/O | Fiona or GeoPandas |
| Workspace and scratch state | Workflow context and explicit directories |
| Map or layer mutation | Optional presentation adapter or documented reduction |

Choose by semantic contract, not by matching tool names. Record gaps and parity evidence.
