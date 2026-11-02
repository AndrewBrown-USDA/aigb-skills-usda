# `testthat` Reference (3rd Edition)

Use this reference when authoring or running tests in packages configured with `testthat`.

## 1. Prerequisites & Setup

In `DESCRIPTION`:
```dcf
Suggests:
    testthat (>= 3.0.0)
Config/testthat/edition: 3
```

Standard runner file `tests/testthat.R`:
```r
library(testthat)
library(<pkg>)

test_check("<pkg>")
```

## 2. Running Tests

```r
# Full test suite via devtools
devtools::test()

# Focused tests matching a filter regex (debugging only)
devtools::test(filter = "classify")

# Single test file with progress reporter
testthat::test_file("tests/testthat/test-classify.R", reporter = "progress")

# Full CRAN-style check
devtools::check(args = c("--as-cran"))
```

### Source vs. Installed Package Note
- `devtools::test()` uses `pkgload::load_all()` for fast source feedback, which does not verify that all files made it into the built tarball.
- Always run a tarball `R CMD check --as-cran` (`test_check()`) before release, especially when the package has native code (`src/`), installation hooks, or packaged datasets.

## 3. Skips, Fixtures, and State Isolation

### Conditional Skips
Skip only for an explicit, documented condition:
```r
test_that("optional spatial backend works", {
  skip_if_not_installed("sf")
  skip_on_cran()
  expect_s4_class(run_workflow(), "SpatRaster")
})
```
Avoid blanket `skip_on_ci()` calls so CI does not mask core regressions.

### Fixtures
Store test-only fixtures under `tests/testthat/fixtures/` and resolve paths with `testthat::test_path()`:
```r
fixture_csv <- testthat::test_path("fixtures", "sample.csv")
df <- read.csv(fixture_csv)
```

## 4. Parallel Execution & Snapshots

### Parallel Tests
Opt-in via `DESCRIPTION` when tests are fully isolated (no shared mutable temp files or global state):
```dcf
Config/testthat/parallel: true
```
Debug ordering or concurrency issues with `Sys.setenv(TESTTHAT_PARALLEL = "false")`.

### Snapshots
Commit snapshots under `tests/testthat/_snaps/`. Normalize unstable values (timestamps, temp paths, random IDs, locale formatting) before snapshotting, and review diffs carefully before calling `testthat::snapshot_accept()`.
