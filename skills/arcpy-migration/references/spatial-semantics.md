# Spatial Semantics

Every operation must state input CRS, output CRS, horizontal units, and vertical units when elevation is involved. Reproject mixed-CRS inputs explicitly before overlay, clipping, distance, or area. Reject unknown CRS and missing required units; never infer them silently.

State whether measurements are geodesic or planar, where reprojection occurs, and which raster resampling method is used.

Declare the NoData value or mask, whether NaN is distinct, how all-NoData windows are represented, and whether the output preserves the source policy. Keep NoData, empty coverage, service failure, and numeric zero distinct in both results and tests.

Test empty, invalid, multipart, overlapping, boundary-touching, out-of-bounds, and unclosed geometries. Decide whether invalid inputs are rejected or repaired. Report repairs, exclusions, normalized identifiers, and per-feature diagnostics rather than silently changing data.
