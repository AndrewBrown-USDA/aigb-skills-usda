# `litedown` Vignette Reference (`litedown::vignette`)

Use this reference when authoring or building vignettes in packages configured with `VignetteBuilder: litedown`.

## 1. `DESCRIPTION` Setup

Ensure `DESCRIPTION` includes:

```dcf
Suggests:
    litedown
VignetteBuilder: litedown
Encoding: UTF-8
```

## 2. YAML Frontmatter

```yaml
---
title: "<Vignette Title>"
output: litedown::vignette
vignette: >
  %\VignetteIndexEntry{<Vignette Title>}
  %\VignetteEngine{litedown::vignette}
  %\VignetteEncoding{UTF-8}
knit: litedown:::knit
---
```

## 3. Conditional Evaluation Guard (`litedown::reactor`)

Place the setup chunk immediately after the YAML frontmatter to configure chunk defaults and gate expensive or optional-dependency chunks:

````markdown
```{r, include = FALSE}
run_long <- isTRUE(as.logical(Sys.getenv("R_<PKG>_RUN_LONG_EXAMPLES", unset = "FALSE"))) &&
  requireNamespace("<optional_pkg>", quietly = TRUE)
litedown::reactor(eval = run_long, collapse = TRUE, comment = "#>")
```
````

## 4. Chunk Options & Syntax

`litedown` supports both comma-separated chunk headers and `#|` pipe comments inside the chunk body:

````markdown
```{r}
#| label = "example-workflow",
#| fig.width = 7,
#| fig.height = 5
library(<pkg>)
data("<dataset>")
```
````

For acquisition or network code that should never run during package checks:

````markdown
```{r}
#| eval = FALSE
# Acquisition workflow (see data-raw/<dataset>.R)
```
````

### End-of-Vignette Cleanup Chunk

When temporary files are created during vignette execution, clean them up in a hidden chunk at the end:

````markdown
```{r, include = FALSE}
#| eval = run_long
unlink(temp_files, recursive = TRUE)
```
````

## 5. Rendering & Verification Commands

1. **Install the current package state**:
   ```bash
   R CMD INSTALL .
   ```
2. **Fuse with evaluation guard enabled**:
   ```bash
   Rscript -e "Sys.setenv(R_<PKG>_RUN_LONG_EXAMPLES = 'TRUE'); litedown::fuse('vignettes/<name>.Rmd')"
   ```
3. **Fuse with default CRAN/CI guard (`FALSE`)** to confirm graceful skipping when optional dependencies or env vars are absent:
   ```bash
   Rscript -e "Sys.unsetenv('R_<PKG>_RUN_LONG_EXAMPLES'); litedown::fuse('vignettes/<name>.Rmd')"
   ```
4. **Remove transient output**:
   ```bash
   rm -f vignettes/<name>.html vignettes/<name>.md
   ```
