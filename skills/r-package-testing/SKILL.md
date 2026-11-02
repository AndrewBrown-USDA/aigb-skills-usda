---
name: r-package-testing
description: Test and check R packages using testthat or tinytest, built source tarball CRAN checks, and ASAN/UBSAN/Valgrind native memory sanitizers. Use when writing or running R unit tests, release checks, coverage, or diagnosing C/C++ memory safety issues.
license: MIT
metadata:
  author: Andrew G. Brown (https://github.com/brownag)
  version: 1.0
  source_repo: aigb-skills
  source_path: skills/r-package-testing/SKILL.md
  group: domain-workflows
  loadouts: specialist-workflows, software-delivery, r-package-quality, test-validation
  optional_dependencies: github-actions-ci
---

# R Package Testing & Sanitizer Workflow

Run commands from the package root. Verify that `DESCRIPTION`, `NAMESPACE`, and required package metadata are valid before running tests.

Use this skill for R unit testing (`testthat` or `tinytest`), CRAN tarball verification, and native C/C++ sanitizer checks (`ASAN`, `UBSAN`, `Valgrind`). Use `github-actions-ci` for GitHub Actions matrices and CI workflows, and `docker-containerized-testing` for multi-stage Docker test environments.

## 1. Discovery & Framework Selection

1. **Inspect `DESCRIPTION` and `tests/`**:
   - **`testthat`**: `Suggests: testthat (>= 3.0.0)`, `Config/testthat/edition: 3`, tests in `tests/testthat/test-*.R`. Read [`./references/testthat.md`](./references/testthat.md).
   - **`tinytest`**: `Suggests: tinytest`, runner at `tests/tinytest.R`, tests installed under `inst/tinytest/test_*.R`. Read [`./references/tinytest.md`](./references/tinytest.md).
   - When scaffolding a new package without existing tests, choose **`tinytest`** for lightweight/zero-dependency packages (or base-R-adjacent spatial/numerical libraries) and **`testthat` (3rd edition)** when snapshot testing, rich matchers, or `devtools` workflows are preferred.
2. **Check for Native Code (`src/`)**:
   - If the package contains C, C++, or Fortran in `src/` (`Rcpp`, `cpp11`, R C API), read [`./references/memory-testing.md`](./references/memory-testing.md) for AddressSanitizer (ASAN), UndefinedBehaviorSanitizer (UBSAN), Valgrind, and C++ index/recycling safety patterns.

## 2. Core Decision Flow: Source Feedback vs. Release Checks

1. **Fast Inner-Loop Feedback (Single File or Suite)**:
   - **`testthat`**: `devtools::test()` or `testthat::test_file("tests/testthat/test-<name>.R")` (see [`./references/testthat.md`](./references/testthat.md)).
   - **`tinytest`**: `R CMD INSTALL .` followed by `tinytest::run_test_dir("inst/tinytest")` or `tinytest::run_test_file("inst/tinytest/test_<name>.R")` (see [`./references/tinytest.md`](./references/tinytest.md)).
2. **Full CRAN-Style Check (Always Check the Built Source Tarball)**:
   - Do **not** use `R CMD check --as-cran .` on the raw working tree as your primary check. Always build the source tarball first so `.Rbuildignore`, vignettes, and installed package paths are tested accurately:
     ```bash
     R CMD build .
     R CMD check --as-cran <pkg>_<version>.tar.gz
     ```
   - Or with `devtools` / `rcmdcheck`:
     ```r
     tarball <- devtools::build()
     rcmdcheck::rcmdcheck(tarball, args = "--as-cran", error_on = "warning")
     ```

## 3. Shared Testing Conventions

### Fixtures, External Files, and Isolation
- **Installed Package Files**: Access `inst/extdata/` or `inst/tinytest/` files via `system.file(..., package = "<pkg>", mustWork = TRUE)`.
- **Temporary Directories**: Write all test outputs to `tempdir()` (`tempfile()`) and clean up via `on.exit(unlink(..., recursive = TRUE), add = TRUE)`.
- **Global State Restoration**: Save and restore `options()`, environment variables (`Sys.setenv()`), working directories, and graphics parameters (`par()`) using `on.exit(..., add = TRUE)` (or `withr::local_*()` in `testthat`).
- **Reproducibility**: Set `set.seed()` explicitly whenever testing stochastic routines, and guard network/optional-dependency tests so offline CRAN checks never fail.

### Guarding Optional Dependencies & CRAN Skips
- Use `isTRUE(as.logical(Sys.getenv("NOT_CRAN", unset = "FALSE")))` or package-specific env vars (`R_<PKG>_RUN_LONG_EXAMPLES`) for consistent boolean checks.
- Guard optional `Suggests` packages with `requireNamespace("<pkg>", quietly = TRUE)` (`skip_if_not_installed("<pkg>")` in `testthat`, or `if (!requireNamespace("<pkg>", quietly = TRUE)) exit_file("...")` in `tinytest`).

## 4. Coverage & Release Readiness

### Code Coverage (`covr`)
Run test coverage in a clean R process:
```r
coverage <- covr::package_coverage(type = "tests", clean = TRUE)
print(covr::percent_coverage(coverage))
```

### Pre-Release Checklist
- [ ] `DESCRIPTION` and `NAMESPACE` are valid (`roxygen2::roxygenise()` is up to date).
- [ ] Full unit test suite (`testthat` or `tinytest`) passes with no unexplained skips.
- [ ] Built source tarball (`R CMD build .`) passes `R CMD check --as-cran` with 0 errors and 0 warnings.
- [ ] Every `NOTE` is inspected and classified as accepted or resolved.
- [ ] Native `src/` packages pass ASAN/UBSAN and Valgrind checks (see [`./references/memory-testing.md`](./references/memory-testing.md)).
