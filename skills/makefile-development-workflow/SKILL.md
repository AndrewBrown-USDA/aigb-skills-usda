---
name: makefile-development-workflow
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Standardizes Makefile-based build and test workflows with reproducible targets. Use when creating or refining helpful build, test, and clean targets.
version: 1.0
---

# Makefile Development Workflow

A minimal, well-structured Makefile for any project:

```makefile
.PHONY: help build test clean

.DEFAULT_GOAL := help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build: ## Build the project
	@echo "Building..."
	# Add your build command here

test: ## Run tests
	@echo "Running tests..."
	# Add your test command here

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf build/ dist/ __pycache__/
```

Run `make help` to see all available commands.

---

## Best Practices

### 1. Always Use `.PHONY`

```makefile
.PHONY: help build test clean install
```
Prevents conflicts with files of the same name and ensures targets always run.

### 2. Use `.DEFAULT_GOAL`

```makefile
.DEFAULT_GOAL := help
```
Makes `make` show help by default instead of the first target.

### 3. Document Targets with `##` Comments

```makefile
build: ## Build the project (required)
	@echo "Building..."

test: ## Run tests (required)
	@echo "Testing..."
```
The `##` comment after the target is picked up by auto-generated help.

### 4. Use `?=` for Overridable Variables

```makefile
PYTHON   ?= python3   # Can be overridden: make PYTHON=python3.11 test
VENV     ?= .venv     # Can be overridden: make VENV=myenv test
```

### 5. Use `SHELL := /bin/bash`

```makefile
SHELL := /bin/bash
```
Ensures bash features (like `command -v`) work consistently.

### 6. Use `@` to Suppress Command Echo

```makefile
build:
	@echo "Building..."  # @ suppresses "echo Building..."
	@cd server && go build -o bin/server ./cmd/server
```

### 7. Use `$$` for Shell Variables in Make

```makefile
check-env:
	@if [ -z "$$API_KEY" ]; then echo "WARNING: API_KEY not set"; fi
```
`$$` becomes `$` in the shell.

### 8. Use `|| true` to Prevent Failures

```makefile
clean:
	@pkill -f "uvicorn" || true   # Don't fail if process isn't running
	@rm -rf build/ || true        # Don't fail if directory doesn't exist
```

### 9. Use Multi-Line Commands with `\`

```makefile
test:
	@if [ "$(VERBOSE)" = "1" ]; then \
		pytest tests/ -v -s; \
	else \
		pytest tests/; \
	fi
```

### 10. Use `&&` for Chained Commands

```makefile
install:
	pip install -e ".[dev]" && echo "[OK] Installed"
```

---

## Quick Command Cheat Sheet

| Command | Purpose |
|---------|---------|
| `make help` | Show all available commands |
| `make build` | Build the project |
| `make test` | Run tests |
| `make clean` | Clean build artifacts |
| `make install` | Install dependencies |
| `make lint` | Run linter |
| `make format` | Format code |
| `make dev` | Start development mode |
| `make all` | Run full pipeline |
| `make docker-up` | Start Docker services |
| `make docker-down` | Stop Docker services |
| `make -j4` | Run with 4 parallel jobs |
| `make VAR=value target` | Override variable for target |

---

## Language-Specific Templates & Patterns

For detailed language-specific Makefiles, patterns, and advanced configurations, see `references/anatomy.md`.

Quick links:
- Python projects: templates, pytest setup, venv targets
- Go projects: build, testing, hot reload patterns
- Node.js / TypeScript: npm integration, test runners
- R packages: devtools targets, documentation
- Docker integration: compose management, build patterns
- Multi-phase pipelines: setup -> build -> test -> report
- Conditional tool detection: graceful fallbacks
- Variable overrides, pattern rules, parallel execution
