# `knitr` + `rmarkdown` Vignette Reference (`rmarkdown::html_vignette`)

Use this reference when authoring or building vignettes in packages configured with `VignetteBuilder: knitr`.

## 1. `DESCRIPTION` Setup

Ensure `DESCRIPTION` includes:

```dcf
Suggests:
    knitr,
    rmarkdown
VignetteBuilder: knitr
Encoding: UTF-8
```

## 2. YAML Frontmatter

```yaml
---
title: "<Vignette Title>"
output: rmarkdown::html_vignette
vignette: >
  %\VignetteIndexEntry{<Vignette Title>}
  %\VignetteEngine{knitr::rmarkdown}
  %\VignetteEncoding{UTF-8}
---
```

## 3. Conditional Evaluation Guard (`knitr::opts_chunk$set`)

Place the setup chunk immediately after the YAML frontmatter to configure chunk defaults and gate expensive or optional-dependency chunks (such as `NOT_CRAN` or `R_<PKG>_RUN_LONG_EXAMPLES`):

````markdown
```{r setup, include = FALSE}
EVAL <- isTRUE(as.logical(Sys.getenv("R_<PKG>_RUN_LONG_EXAMPLES", unset = "FALSE"))) &&
  requireNamespace("<optional_pkg>", quietly = TRUE)

knitr::opts_chunk$set(
  eval = EVAL,
  collapse = TRUE,
  comment = "#>",
  fig.width = 7,
  fig.height = 5
)
```
````

## 4. Chunk Options & Cleanup

- **Standard evaluated chunks** inherit `eval = EVAL` from `knitr::opts_chunk$set()`.
- **Non-evaluated chunks** (e.g., remote downloads or interactive-only authentication):
  ````markdown
  ```{r, eval = FALSE}
  # Acquisition or interactive setup
  ```
  ````
- **End-of-Vignette Cleanup Chunk**: Encapsulate temporary file cleanup in a hidden chunk at the end of the file so sequential CI runs do not exhaust disk space:
  ````markdown
  ```{r cleanup, include = FALSE, eval = EVAL}
  unlink(temp_files, recursive = TRUE)
  ```
  ````

## 5. Rendering & Verification Commands

1. **Install the current package state**:
   ```bash
   R CMD INSTALL .
   ```
2. **Render single vignette with evaluation guard enabled**:
   ```bash
   Rscript -e "Sys.setenv(R_<PKG>_RUN_LONG_EXAMPLES = 'TRUE'); rmarkdown::render('vignettes/<name>.Rmd')"
   ```
3. **Build all vignettes via `devtools` or `tools`**:
   ```bash
   Rscript -e "devtools::build_vignettes()"
   ```
4. **`pkgdown` article verification** (when the repository uses `pkgdown`):
   ```bash
   Rscript -e "pkgdown::build_articles(new_process = TRUE)"
   ```
5. **Remove transient output**:
   ```bash
   rm -f vignettes/<name>.html vignettes/<name>.R
   ```
