---
name: r-package-testing-workflow
description: Test and check R packages with devtools, testthat, CRAN-style checks, and built source tarballs. Use when running package tests, release checks, coverage, or focused R tests.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/r-package-testing-workflow/SKILL.md
  group: domain-workflows
  loadouts: specialist-workflows, software-delivery, r-package-quality, test-validation
  optional_dependencies: github-actions-ci
---

# R Package Testing Workflow

Run commands from the package root. Check that `DESCRIPTION`, `NAMESPACE`,
and required package metadata are valid before running tests.

Use this skill for package test and check decisions. Use `github-actions-ci`
for GitHub Actions matrices, dependency setup, coverage jobs, and CI artifacts.

## Decision flow

1. If `devtools` is installed:
   - Full test suite: `devtools::test()`
   - Full CRAN-style check: `devtools::check(args = c("--as-cran"))`
2. Without `devtools`:
   - Build a source tarball: `R CMD build .`
   - Check that tarball: `R CMD check --as-cran <built-tarball>`
3. For focused work, use `devtools::test(filter = "...")` or
   `testthat::test_file()` only when a specific test was requested.

Do not use `R CMD check --as-cran .` as the preferred full workflow. Check the
built source tarball.

## Prerequisites

For testthat 3rd edition, confirm:

```text
Suggests: testthat (>= 3.0.0)
Config/testthat/edition: 3
```

The standard `tests/testthat.R` file should run the installed-package check:

```r
library(testthat)
library(mypackage)

test_check("mypackage")
```

## Commands

```r
# Complete package test suite
devtools::test()

# Focused tests, only when requested
devtools::test(filter = "addition")

# One test file, only when requested
testthat::test_file("tests/testthat/test_main.R")

# Full CRAN-style check
devtools::check(args = c("--as-cran"))
```

The lower-level tarball workflow from R is:

```text
R CMD build .
R CMD check --as-cran <built-tarball>
```

On Windows, use PowerShell to select the newest tarball created by the build:

```powershell
R CMD build .
$tarball = Get-ChildItem -File -Filter "*.tar.gz" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 -ExpandProperty FullName
R CMD check --as-cran "$tarball"
```

If `devtools` is installed but you need to check the exact artifact:

```r
tarball <- devtools::build()
system2("R", c("CMD", "check", "--as-cran", shQuote(tarball)))
```

## Source and installed packages

`devtools::test()` is for fast source-package feedback. It does not prove that
the built package installs or that all files made it into the tarball.

Use `pkgload::load_all()` with `testthat::test_dir()` only to diagnose unusual
source-loading problems. It is not the preferred package test workflow.

The tarball check runs the installed-package path through `test_check()`.
Use that path for release evidence, especially when the package has native code,
compiled libraries, installation hooks, or package data.

## Focused tests, reporters, and skips

Use focused tests for debugging, not as evidence that the full suite passes:

```r
devtools::test(filter = "addition")
testthat::test_file("tests/testthat/test_main.R", reporter = "progress")
```

Useful reporters include `progress`, `summary`, `tap`, `junit`, and `list`.

Skip only for a stated condition:

```r
test_that("optional feature", {
  skip_if_not_installed("pkgname")
  skip_on_os("windows")
  expect_true(feature_works())
})
```

Avoid broad `skip_on_ci()` use. Review skipped tests in CI so skips do not hide
core failures.

## Fixtures and isolation

For files under `tests/testthat/fixtures`, use `testthat::test_path()`:

```r
data_file <- testthat::test_path("fixtures", "sample.csv")
data <- read.csv(data_file)
```

Use `system.file()` for resources installed under `inst/`. Use `tempdir()` for
temporary files. Restore options and global state with `on.exit()`.

Make random tests repeatable:

```r
set.seed(123)
```

Also control time zones, locales, encodings, temporary paths, and network use
when those affect results.

## Parallel tests

Parallel tests are opt-in and need testthat 3rd edition:

```text
Config/testthat/parallel: true
TESTTHAT_PARALLEL=false
TESTTHAT_CPUS=4
```

Run the full suite serially at least once. Run a separate parallel job when the
package enables parallel tests. Do not share mutable fixture paths or depend on
test-file order. Use `TESTTHAT_PARALLEL=false` to debug failures.

## Checks and diagnostics

Treat errors as failures. Investigate warnings. Classify every note as accepted
or unresolved. Preserve the tarball, check output, `.Rcheck` directory, and
session information when a CI check fails.

For structured results, use `rcmdcheck`:

```r
result <- rcmdcheck::rcmdcheck(
  path = tarball,
  args = "--as-cran",
  check_dir = "check-output",
  error_on = "warning",
  timeout = 20 * 60
)
print(result)
```

## Coverage and snapshots

Run coverage separately from the main OS/R matrix:

```r
coverage <- covr::package_coverage(type = "tests", clean = TRUE)
print(covr::percent_coverage(coverage))
```

Coverage does not replace tests. Justify exclusions.

Commit testthat snapshots under `tests/testthat/_snaps/`. Review snapshot
changes. Normalize timestamps, paths, random IDs, locale output, and other
unstable values before snapshotting. Use `snapshot_accept()` only after
understanding the change.

## Release checks

Before release:

- Run the complete suite and a fresh tarball check.
- Run `devtools::document()` if documentation is generated.
- Check examples, vignettes, URLs, DOI links, spelling, and `cran-comments.md`.
- Run `pkgdown::build_articles(new_process = TRUE)` when the package uses
  pkgdown.
- Run `revdepcheck::revdep_check()` when reverse dependencies exist.
- For native code, add ASAN or UBSAN checks where practical. These supplement
  normal tests and checks.

## Minimal checklist

- [ ] Package root and metadata are valid.
- [ ] testthat 3rd edition is configured when used.
- [ ] Full suite passes with no unexplained skips.
- [ ] Built tarball passes `R CMD check --as-cran`.
- [ ] Errors, warnings, and notes are reviewed.
- [ ] Release-only checks are complete when applicable.
