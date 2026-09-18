---
name: github-actions-ci
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: GitHub Actions CI/CD setup for Python, R, and multi-platform testing. Use when creating, debugging, or optimizing CI/CD pipelines.
version: 1.0
---

# GitHub Actions CI/CD Setup

## Overview

GitHub Actions automates testing, linting, and deployment on every push and pull request. This guide covers common workflows for Python, R, and multi-platform testing.

## Templates by Language

- **Python** -- Minimal workflow + testing + linting + coverage
- **R** -- Multi-platform matrix testing + CRAN check
- **Node.js** -- Matrix testing + type checking + publishing
- **Go** -- Build matrix + Docker builds + release artifacts
- **Multi-language** -- Orchestrated jobs across repos

Find your language below and copy the workflow template directly into `.github/workflows/`.

## Quick Start: Python Project

### Minimal Python Testing Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Python Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.8', '3.9', '3.10', '3.11']

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt

      - name: Lint with Ruff
        run: ruff check .

      - name: Type check with mypy
        run: mypy src/

      - name: Format check with Black
        run: black --check .

      - name: Run tests with pytest
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
```

Commit and push:
```bash
git add .github/workflows/test.yml
git commit -m "Add GitHub Actions CI/CD"
git push
```

## R Package Testing Workflow

### Comprehensive R Testing

```yaml
# .github/workflows/r-check.yml
name: R Package Check

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  check:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        r-version: ['4.2', '4.3', '4.4']

    steps:
      - uses: actions/checkout@v3

      - name: Set up R
        uses: r-lib/actions/setup-r@v2
        with:
          r-version: ${{ matrix.r-version }}

      - name: Install system dependencies (Ubuntu)
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libgdal-dev \
            libgeos-dev \
            libproj-dev \
            libspatialindex-dev

      - name: Install system dependencies (macOS)
        if: runner.os == 'macOS'
        run: |
          brew install gdal geos proj spatialindex

      - name: Install dependencies
        uses: r-lib/actions/setup-r-dependencies@v2
        with:
          extra-packages: any::devtools, any::roxygen2, any::testthat

      - name: Run roxygen
        run: Rscript -e "devtools::load_all(); roxygen2::roxygenise()"

      - name: Check
        uses: r-lib/actions/check-r-package@v2
        with:
          upload-snapshots: true

      - name: Test coverage
        run: |
          Rscript -e "install.packages('covr')"
          Rscript -e "covr::codecov()"
```

### R Memory Testing (ASAN)

```yaml
# .github/workflows/r-memory-test.yml
name: R Memory Tests

on: [push, pull_request]

jobs:
  asan-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up R
        uses: r-lib/actions/setup-r@v2
        with:
          r-version: '4.3'

      - name: Install ASAN
        run: |
          sudo apt-get update
          sudo apt-get install -y clang valgrind

      - name: Install package with ASAN
        run: |
          export CC=clang
          export CFLAGS="-fsanitize=address -g"
          export LDFLAGS="-fsanitize=address"
          R CMD INSTALL .

      - name: Run tests under ASAN
        run: |
          export ASAN_OPTIONS="halt_on_error=1"
          Rscript -e "testthat::test_all()"

      - name: Valgrind testing
        run: |
          valgrind --leak-check=full \
            Rscript -e "library(mypackage); TRUE"
```

## Docker-Based Testing

### Multi-OS Testing with Docker

```yaml
# .github/workflows/docker-test.yml
name: Docker Tests

on: [push, pull_request]

jobs:
  docker:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        os: ['ubuntu:22.04', 'ubuntu:20.04', 'debian:11']

    steps:
      - uses: actions/checkout@v3

      - name: Build and test with ${{ matrix.os }}
        run: |
          docker run --rm -v $(pwd):/workspace -w /workspace \
            ${{ matrix.os }} \
            bash -c "
              apt-get update && apt-get install -y \
                r-base-dev build-essential gfortran &&
              R CMD INSTALL . &&
              Rscript -e 'testthat::test_all()'
            "
```

## Conditional Steps

### Only on Main Branch

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: ./deploy.sh
```

### Only on Pull Requests

```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  run: echo "Running PR checks"
```

### Only on Tags

```yaml
- name: Create release
  if: startsWith(github.ref, 'refs/tags/')
  run: ./release.sh
```

### Skip Specific Commits

```yaml
- uses: actions/checkout@v3
  if: "!contains(github.event.head_commit.message, '[skip ci]')"
```

## Environment Variables and Secrets

### Use Repository Secrets

1. Go to **Settings > Secrets and variables > Actions**
2. Click "New repository secret"
3. Add `API_KEY`, `DOCKER_TOKEN`, etc.

In workflow:
```yaml
- name: Use secret
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: ./script.sh
```

### Set Workflow-Level Variables

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      BUILD_TYPE: release
    steps:
      - run: echo "Building ${{ env.IMAGE_NAME }}"
```

## Artifact Handling

### Upload Test Results

```yaml
- name: Run tests
  run: pytest --junit-xml=results.xml

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results-${{ matrix.os }}
    path: results.xml
```

### Download and Use Artifacts

```yaml
- name: Download artifacts
  uses: actions/download-artifact@v3
  with:
    name: test-results

- name: Process results
  run: cat results.xml
```

## Matrix Testing

### Test Multiple Combinations

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    python: ['3.8', '3.9', '3.10']
    include:
      - os: windows-latest
        python: '3.11'  # Only test Windows with Python 3.11
    exclude:
      - os: macos-latest
        python: '3.8'   # Skip old Python on macOS
```

## Caching Dependencies

### Cache Python Dependencies

```yaml
- uses: actions/setup-python@v4
  with:
    python-version: '3.10'
    cache: 'pip'
    cache-dependency-path: requirements*.txt
```

### Cache R Dependencies

```yaml
- uses: r-lib/actions/setup-r-dependencies@v2
  with:
    cache-version: 1
```

### Manual Cache

```yaml
- name: Cache Maven packages
  uses: actions/cache@v3
  with:
    path: ~/.m2/repository
    key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
    restore-keys: |
      ${{ runner.os }}-maven-
```

## Notifications and Reports

### Create Badge

Add to README.md:
```markdown
![Tests](https://github.com/username/repo/actions/workflows/test.yml/badge.svg)
```

### Send Slack Notification

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Build failed for ${{ github.repository }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Failed: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
```

### Publish Test Report

```yaml
- name: Publish test results
  uses: EnricoMi/publish-unit-test-result-action@v2
  if: always()
  with:
    files: 'test-results.xml'
```

## Code Coverage

### Generate and Upload Coverage

```yaml
- name: Generate coverage
  run: |
    pip install coverage
    coverage run -m pytest
    coverage xml

- name: Upload to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
    flags: unittests
    fail_ci_if_error: false
```

### Add Coverage Badge

In README:
```markdown
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

## Common Workflow Patterns

### Full Test Suite

```yaml
name: Complete CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements-dev.txt
      - run: black --check .
      - run: ruff check .

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pytest

  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install bandit safety
      - run: bandit -r src/
      - run: safety check
```

## Troubleshooting

### Debug Workflow

Add `debug: true` to step:
```yaml
- run: echo "Debugging..."
  shell: bash
  env:
    ACTIONS_STEP_DEBUG: true
```

View detailed logs in job output.

### Re-run Failed Jobs

In GitHub UI: Click "Re-run jobs" on failed workflow

Or via CLI:
```bash
gh run rerun <run_id>
```

### Disable Workflow

Rename file or add to `.github/workflows/workflow.yml`:
```yaml
# Add this at top to disable
on:
  workflow_dispatch:  # Manual only
```

## Performance Optimization

### Parallel Jobs with Needs

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Setup complete"

  test1:
    runs-on: ubuntu-latest
    needs: setup
    steps:
      - run: npm test -- src/module1

  test2:
    runs-on: ubuntu-latest
    needs: setup
    steps:
      - run: npm test -- src/module2
```

### Use Actions/runner

Pin versions for reproducibility:
```yaml
- uses: actions/checkout@v3  # Pinned version
- uses: actions/setup-python@v4
```

## Best Practices

1. **Keep workflows simple**: One workflow per CI concern (test, lint, security)
2. **Use matrix for variations**: Test multiple versions systematically
3. **Cache dependencies**: Reduce setup time
4. **Fail fast**: Use conditional steps to skip unnecessary work
5. **Document secrets**: List required secrets in README
6. **Use workflow templates**: Create reusable workflows in `.github/workflows/`
7. **Monitor build times**: Keep under 30 minutes
8. **Test locally first**: Use `act` to run workflows locally:
   ```bash
   brew install act
   act -j test
   ```
