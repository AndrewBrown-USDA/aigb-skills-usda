# `tinytest` Reference

Use this reference when authoring or running tests in packages configured with `tinytest`. `tinytest` has zero recursive dependencies, runs tests inside the installed package (`inst/tinytest/`), and treats test files as plain R scripts.

## 1. Prerequisites & Directory Structure

In `DESCRIPTION`:
```dcf
Suggests:
    tinytest
```

### Standard Runner (`tests/tinytest.R`)
```r
if (requireNamespace("tinytest", quietly = TRUE)) {
  tinytest::test_package("<pkg>")
}
```

### Test Files (`inst/tinytest/test_<topic>.R`)
Because `tinytest` installs tests into `inst/tinytest/`, users and CI can run `tinytest::test_package("<pkg>")` against the installed library at any time.

## 2. Running Tests

Always install the current package (`R CMD INSTALL .`) before running `tinytest` so `test_package()` and `library(<pkg>)` test the latest code:

```bash
# Install current package and run the full tinytest suite
R CMD INSTALL .
Rscript -e "tinytest::test_package('<pkg>')"

# Run a single test file directly from source during inner-loop development
Rscript -e "pkgload::load_all(); tinytest::run_test_file('inst/tinytest/test_<topic>.R')"

# Run all test files in inst/tinytest directory
Rscript -e "library(<pkg>); tinytest::run_test_dir('inst/tinytest')"
```

Note: In non-interactive `Rscript` calls, wrap `tinytest::run_test_file(...)` or `tinytest::run_test_dir(...)` with `if (!all(res)) stop("Tests failed")` if you need a non-zero shell exit code (`tinytest::test_package()` handles exit failure automatically under `R CMD check`).

## 3. Assertions & Conditional Execution

### Core Assertions
```r
library(<pkg>)

# Equality & tolerance
expect_equal(actual, expected, tolerance = 1e-6)
expect_identical(actual, expected)

# Booleans & classes
expect_true(is.numeric(x))
expect_false(anyNA(x))
expect_inherits(obj, "SpatRaster")

# Conditions & side effects
expect_error(bad_call(), pattern = "must be positive")
expect_warning(warn_call(), pattern = "deprecated")
expect_message(msg_call())
expect_silent(clean_call())
```

### Conditional Skips (`exit_file`)
To skip the remainder of a test file when an optional `Suggests` package or environment variable is unavailable, call `exit_file()` at the top of the script:

```r
if (!requireNamespace("terra", quietly = TRUE)) {
  exit_file("terra not installed")
}

if (!isTRUE(as.logical(Sys.getenv("R_<PKG>_RUN_LONG_EXAMPLES", unset = "FALSE")))) {
  exit_file("Skipping long-running tests (set R_<PKG>_RUN_LONG_EXAMPLES=TRUE to enable)")
}
```

## 4. State Isolation & Side Effects

- Plain R script execution: Variables created in one `test_*.R` file do not leak into other files, but global side effects (`options()`, `Sys.setenv()`, working directory) do.
- Monitor side effects within a test file using `tinytest::report_side_effects(TRUE)` and always restore state with `on.exit(..., add = TRUE)`.
