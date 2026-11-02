---
name: r-package-vignette
description: Author and build R package vignettes using litedown or knitr + rmarkdown. Use when creating or updating vignettes/*.Rmd, configuring VignetteBuilder in DESCRIPTION, gating expensive or optional-dependency chunks with evaluation guards, or verifying vignette builds.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/r-package-vignette/SKILL.md
  group: domain-workflows
  loadouts: specialist-workflows, software-delivery, r-package-quality
---

# R Package Vignette Workflow

Author, guard, and verify R package vignettes (`vignettes/*.Rmd`) using either the lightweight `litedown` engine or the classic `knitr` + `rmarkdown` engine.

## 1. Discovery & Engine Selection

1. **Check `DESCRIPTION`**:
   - Inspect `VignetteBuilder` and `Suggests` to determine which engine the repository uses.
   - Verify which dependencies are in `Imports` (always available) vs. `Suggests` (must be guarded with `requireNamespace()`).
2. **Choose the Engine Reference**:
   - **`litedown` (`VignetteBuilder: litedown`)**: Minimal dependency footprint, fast rendering via `litedown::fuse()`, and chunk options configured with `litedown::reactor()`. Read [`./references/litedown.md`](./references/litedown.md).
   - **`knitr` + `rmarkdown` (`VignetteBuilder: knitr`)**: Standard R Markdown ecosystem (`rmarkdown::html_vignette`), chunk options configured with `knitr::opts_chunk$set()`, and seamless `pkgdown` integration. Read [`./references/knitr-rmarkdown.md`](./references/knitr-rmarkdown.md).
   - When starting a new package without existing vignettes, prefer `litedown` for lightweight/low-dependency packages and `knitr` + `rmarkdown` when `pkgdown` or complex Pandoc features are required.
3. **Inspect Target Code & Data**:
   - Read existing `vignettes/*.Rmd` files to match YAML headers, chunk option styles, and environment variable conventions.
   - Read target `R/*.R` source files to verify exact function signatures, arguments, and return structures before writing examples.
   - If the vignette requires creating or updating a packaged dataset in `data/*.rda` or `inst/extdata/`, use the **`r-package-data`** skill first.

## 2. Shared Vignette Conventions

### Conditional Evaluation Guards (CRAN & CI Safety)
Vignettes must build cleanly on CRAN and CI machines where optional `Suggests` packages, network access, credentials, or long compute budgets are unavailable.

Define a boolean guard at the top of the vignette using the repository's standard pattern (`isTRUE(as.logical(Sys.getenv(...)))`) combined with `requireNamespace()`:

```r
run_long <- isTRUE(as.logical(Sys.getenv("R_<PKG>_RUN_LONG_EXAMPLES", unset = "FALSE"))) &&
  requireNamespace("<optional_pkg>", quietly = TRUE)
```

Pass `eval = run_long` to the engine's global option setter (`litedown::reactor()` or `knitr::opts_chunk$set()`; see engine reference files for exact syntax).

### Dependency & Resource Hygiene
- **Evaluated Chunks**: Only load packages listed in `Imports` or guarded `Suggests`. Operate on pre-packaged `data/*.rda` or `inst/extdata/` datasets.
- **Acquisition / Network Code**: Place heavy data-fetching workflows (e.g., remote spatial queries, web API downloads) in non-evaluated chunks (`eval = FALSE`) or reference the corresponding `data-raw/<dataset>.R` script.
- **Temporary Files & Cleanup**: Write any intermediate files to `tempdir()` and remove downloaded/temporary artifacts in a hidden cleanup chunk at the end of the vignette (`unlink(..., recursive = TRUE)`) so sequential vignette builds in CI do not exhaust disk space.
- **State Restoration**: Save and restore `options()` or `par()` changes when modifying global R state.

## 3. Execution & Verification Workflow

1. **Propose Outline**: Present the target functions, section outline, engine choice, and dataset dependencies for approval before authoring.
2. **Install Current Package State**: Always install the local package (and any new datasets) before rendering so the vignette executes against the current namespace:
   ```bash
   R CMD INSTALL .
   ```
3. **Render & Verify with Guard Enabled**: Execute the engine-specific render command (see [`./references/litedown.md`](./references/litedown.md) or [`./references/knitr-rmarkdown.md`](./references/knitr-rmarkdown.md)) with `R_<PKG>_RUN_LONG_EXAMPLES=TRUE` to verify all code chunks run without errors.
4. **Verify Tarball Build**: Confirm that `R CMD build .` builds the vignette index and outputs cleanly.
5. **Clean Up**: Remove transient `.html`, `.md`, or figure files generated in `vignettes/` that are not tracked in version control.
