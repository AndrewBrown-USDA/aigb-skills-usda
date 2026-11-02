---
name: r-package-data
description: Create reproducible data-raw scripts, package serialization-safe R datasets (data/*.rda or inst/extdata/), and document them with roxygen2. Use when adding or updating sample datasets in an R package, choosing between data/*.rda and inst/extdata/, handling spatial/C++ pointer serialization (such as terra SpatRaster/SpatVector), or optimizing .rda size for CRAN.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/r-package-data/SKILL.md
  group: domain-workflows
  loadouts: specialist-workflows, software-delivery, r-package-quality
---

# R Package Dataset Workflow (`data-raw/` -> `data/*.rda` & `inst/extdata/`)

## 1. Discovery & Alignment
- Inspect existing `data-raw/*.R` scripts, `inst/extdata/`, and `R/*-package.R` (or `R/data.R`) to match repository conventions for storage format, object structure, compression, and `roxygen2` documentation location.
- Check `.Rbuildignore` to ensure `^data-raw$` is ignored during package builds.

## 2. Storage Decision Criteria: `data/*.rda` vs. `inst/extdata/`

Choose the storage location based on how package functions, tests, and vignettes consume the data:

| Criterion | `data/<dataset>.rda` | `inst/extdata/<filename>` |
|---|---|---|
| **Primary Use Case** | Ready-to-use R objects for examples, vignettes, and interactive analysis (`data("<dataset>")` or `LazyData: true`). | Testing file readers/parsers, demonstrating import/export pipelines, or passing file paths to native/GDAL routines. |
| **Typical Formats** | Native `data.frame`, `matrix`, `list`, or `terra::wrap()`ed `PackedSpatRaster` / `PackedSpatVector`. | Raw external files: `.tif` (GeoTIFF), `.gpkg` (GeoPackage), `.csv`, `.json`, `.sqlite`, `.shp`. |
| **Access Pattern** | `data("<dataset>", package = "<pkg>")` or direct symbol reference when `LazyData: true`. | `system.file("extdata", "<filename>", package = "<pkg>", mustWork = TRUE)`. |
| **Documentation** | Required `roxygen2` dataset block (`"<dataset>"`) generating `man/<dataset>.Rd`. | No `.Rd` entry required; document provenance in `data-raw/` and reference in function `@examples`. |
| **C++ / GDAL Pointer Safety** | Must strip or wrap external pointers before `save()`. | Inherently serialization-safe on disk; loaded fresh at runtime via `terra::rast()`, `sf::st_read()`, etc. |

### `inst/extdata/` Conventions
- **Provenance**: Always generate `inst/extdata/` files reproducibly from a `data-raw/<dataset>.R` script rather than committing opaque binary blobs without a build script.
- **Format & Compression**:
  - For rasters, use Cloud-Optimized or compressed GeoTIFF (`gdal = c("COMPRESS=DEFLATE", "PREDICTOR=2")`) with small dimensions and appropriate data types (`INT1U`, `INT2S`, `FLT4S`).
  - For vectors/tables, prefer compact single-file formats (`.gpkg`, `.csv`, `.geojson`) over multi-file shapefiles unless specifically testing shapefile readers.
- **Runtime Loading**:
  ```r
  f <- system.file("extdata", "<dataset>.tif", package = "<pkg>", mustWork = TRUE)
  r <- terra::rast(f)
  ```

## 3. Authoring `data-raw/<dataset>.R`
- **Reproducibility**: Include the complete acquisition, projection/alignment, and pre-processing pipeline (e.g., remote queries, CRS alignment, rasterization) in `data-raw/<dataset>.R`.
- **Downsampling & Extent**: Crop, aggregate, or resample spatial/tabular data so it preserves domain relationships while remaining compact (`< 200 KB` compressed, total package `data/` and `inst/extdata/` well under CRAN's 5 MB limit) and fast to load in examples and vignettes.
- **Serialization Safety for `data/*.rda` (No Raw External Pointers)**:
  - Never save objects holding active C++ external pointers (e.g., `terra::SpatRaster`, `terra::SpatVector`, `arrow`, or database connections) directly to `.rda`.
  - Use one of two patterns matching the package's existing convention:
    1. **Native R Structure**: Store a `matrix`, `data.frame`, or `list` of grids with spatial metadata attached as attributes (`crs`, `extent`, lookup tables) and provide a helper or reconstruction snippet.
    2. **Wrapped Objects**: Use `terra::wrap()` to serialize as `PackedSpatRaster` / `PackedSpatVector` (unpacked at runtime via `terra::unwrap()`).
- **Saving & Compression (`data/*.rda`)**:
  ```r
  save(<dataset>, file = "data/<dataset>.rda", compress = "xz") # or "bzip2"
  ```

## 4. Documentation (`roxygen2`)

For datasets stored in `data/<dataset>.rda`, document `<dataset>` in `R/<pkg>-package.R` or `R/data.R`:

```r
#' <Dataset Title>
#'
#' <Brief description of the dataset and its provenance.>
#'
#' @format <Structure description: dimensions, CRS, components/columns, units>
#' @source <Attribution and acquisition details (see `data-raw/<dataset>.R`)>
#' @examplesIf requireNamespace("<optional_pkg>", quietly = TRUE)
#' data("<dataset>")
"<dataset>"
```

## 5. Execution & Verification

1. **Plan First**: Propose the target storage location (`data/*.rda` vs. `inst/extdata/`), resolution/dimensions, exact object or file structure, and estimated size before running the script.
2. **Generate & Document**:
   ```bash
   Rscript data-raw/<dataset>.R
   Rscript -e "roxygen2::roxygenise()"
   ```
3. **Verify Serialization & Size**:
   - For `data/*.rda`: Confirm `data/<dataset>.rda` is under the target size threshold and test loading it in a fresh R session (`Rscript -e "load('data/<dataset>.rda'); str(<dataset>)"`) to ensure no dead pointer errors occur.
   - For `inst/extdata/`: Confirm file size and verify `system.file("extdata", "<filename>", package = "<pkg>", mustWork = TRUE)` resolves after `R CMD INSTALL .`.
