# Makefile Anatomy and Patterns

Detailed structure, language-specific templates, and advanced patterns for well-structured Makefiles.

## Anatomy of a Well-Structured Makefile

### 1. Header and Configuration

```makefile
# Project Name -- Makefile
# Development, testing, and deployment commands

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Color codes for terminal output
BLUE   := \033[0;34m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

# Project variables
PYTHON   ?= python3
VENV     ?= .venv
VENV_BIN := $(VENV)/bin
```

### 2. PHONY Declaration

Always declare phony targets to avoid conflicts with files:

```makefile
.PHONY: help build test clean install lint format docs dev all
```

### 3. Auto-Generated Help Target

The most common pattern across all projects:

```makefile
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
```

Or with colored, categorized output:

```makefile
help:
	@echo "$(BLUE)Project Name -- Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Core:$(NC)"
	@echo "  make build          - Build the project"
	@echo "  make test           - Run the test suite"
	@echo "  make clean          - Clean build artifacts"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev            - Start development server"
	@echo "  make install        - Install dependencies"
	@echo ""
	@echo "$(GREEN)Code Quality:$(NC)"
	@echo "  make lint           - Run linter"
	@echo "  make format         - Format code"
	@echo ""
	@echo "$(GREEN)Infrastructure:$(NC)"
	@echo "  make docker-up      - Start Docker services"
	@echo "  make docker-down    - Stop Docker services"
```

---

## Language-Specific Patterns

### Python Projects

```makefile
.PHONY: help install install-dev test test-cov lint lint-fix format clean build docs

.DEFAULT_GOAL := help

PYTHON   ?= python3
VENV     ?= .venv
VENV_BIN := $(VENV)/bin

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install production dependencies
	$(PYTHON) -m venv $(VENV) || true
	$(VENV_BIN)/pip install --upgrade pip setuptools wheel
	$(VENV_BIN)/pip install -e .

install-dev: install ## Install development dependencies
	$(VENV_BIN)/pip install -e ".[dev]"

test: install-dev ## Run test suite
	$(VENV_BIN)/pytest tests/ -v

test-cov: install-dev ## Run tests with coverage
	$(VENV_BIN)/pytest tests/ -v --cov=yourpkg --cov-report=html --cov-report=term-missing

test-fast: install-dev ## Run fast tests only
	$(VENV_BIN)/pytest tests/ -v -m "not slow and not integration"

lint: install-dev ## Run linting
	$(VENV_BIN)/ruff check src/ tests/
	$(VENV_BIN)/mypy src/ --ignore-missing-imports

lint-fix: install-dev ## Auto-fix linting issues
	$(VENV_BIN)/ruff check --fix src/ tests/

format: install-dev ## Format code
	$(VENV_BIN)/ruff format src/ tests/

format-check: install-dev ## Check formatting without changes
	$(VENV_BIN)/ruff format --check src/ tests/

docs: install-dev ## Build documentation
	$(VENV_BIN)/sphinx-build -b html docs/ docs/_build/html

clean: ## Clean build artifacts
	rm -rf build/ dist/ *.egg-info/ .coverage htmlcov/ .pytest_cache/ .mypy_cache/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: ## Build the package
	$(PYTHON) -m build

all: clean install-dev lint-fix test ## Full pipeline
	@echo "All checks passed!"
```

### Go Projects

```makefile
.PHONY: help build test run clean lint fmt tidy docker-up docker-down

.DEFAULT_GOAL := help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build: ## Build the Go binary
	@echo "Building..."
	cd server && go build -o ../bin/server ./cmd/server
	@echo "Build complete: bin/server"

run: ## Run the server locally
	@echo "Starting server..."
	cd server && go run ./cmd/server

test: ## Run all tests
	@echo "Running tests..."
	cd server && go test ./... -v

server-dev: ## Run server with hot reload (requires air)
	@echo "Starting server in development mode..."
	@if command -v air &> /dev/null; then \
		cd server && air; \
	else \
		echo "air not found. Install: go install github.com/cosmtrek/air@latest"; \
		cd server && go run ./cmd/server; \
	fi

lint: ## Run linter
	@echo "Running linter..."
	@if command -v golangci-lint &> /dev/null; then \
		cd server && golangci-lint run; \
	else \
		echo "golangci-lint not found. Install: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
		cd server && go vet ./...; \
	fi

fmt: ## Format Go code
	@echo "Formatting..."
	cd server && go fmt ./...

tidy: ## Go mod tidy
	@echo "Tidying modules..."
	cd server && go mod tidy

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -f bin/server

docker-up: ## Start Docker services
	@echo "Starting Docker services..."
	docker compose up -d

docker-down: ## Stop Docker services
	@echo "Stopping Docker services..."
	docker compose down

docker-logs: ## View Docker logs
	docker compose logs -f

health: ## Check service health
	@echo "Checking service health..."
	docker compose ps

restart-%: ## Restart a specific service (e.g., make restart-server)
	@echo "Restarting $*..."
	docker compose restart $*
```

### Node.js / TypeScript Projects

```makefile
.PHONY: help build dev test test-watch clean typecheck lint publish

.DEFAULT_GOAL := help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build: ## Build TypeScript to dist/
	@npm run build

dev: ## Watch mode - rebuilds on changes
	@npm run dev

test: ## Run all tests
	@npm test

test-watch: ## Watch mode for active development
	@npm run test:watch

test-unit: ## Unit tests only
	@npm run test:unit

test-integration: ## Integration tests only
	@npm run test:integration

test-coverage: ## Generate coverage report
	@npm run test:coverage

typecheck: ## Type check without building
	@npm run typecheck

lint: ## Check code style
	@npm run lint

lint-fix: ## Auto-fix linting issues
	@npm run lint:fix

format: ## Format code
	@npm run format

clean: ## Remove dist/ directory
	@npm run clean

publish-local: ## Create global npm symlink
	@npm run publish:local

publish-cleanup: ## Remove global symlink
	@npm run publish:cleanup

all: clean typecheck lint test ## Full quality check
	@echo "All checks passed!"
```

### R Package Projects

```makefile
.PHONY: help install test check document docs clean all dev

.DEFAULT_GOAL := help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install the package in development mode
	@echo "Installing..."
	Rscript -e "devtools::load_all()" && echo "[OK] Loaded"
	Rscript -e "devtools::install()" && echo "[OK] Installed"

test: ## Run test suite
	@echo "Running tests..."
	Rscript -e "devtools::test()" && echo "[OK] Tests passed"

test-verbose: ## Run tests with verbose output
	Rscript -e "devtools::test(reporter = 'progress')"

check: ## Run R CMD check (full validation)
	@echo "Running R CMD check..."
	Rscript -e "devtools::check()" && echo "[OK] Check passed"

document: ## Generate NAMESPACE and .Rd files from roxygen2
	@echo "Generating documentation..."
	Rscript -e "devtools::document()" && echo "[OK] Documentation generated"

docs: ## Build documentation site
	@echo "Building documentation..."
	Rscript build_docs.R
	@echo "[OK] Documentation built"

docs-serve: ## Serve docs locally
	@echo "Serving docs at http://localhost:8000"
	cd docs && python3 -m http.server 8000

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -f *.Rcheck
	rm -rf Meta
	rm -f .Rbuildignore.orig

all: clean document check test docs ## Full pipeline
	@echo "[OK] All checks passed!"

dev: document test ## Development workflow
	@echo "Development workflow complete"
```

### Multi-Language / Mixed Projects

```makefile
.PHONY: help dev build test clean

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

dev: ## Start both frontend and backend
	@echo "Starting development servers..."
	@make dev-web & make dev-api

dev-web: ## Start web frontend only
	@cd web && npm run dev

dev-api: ## Start API server only
	@python web_api.py

build: ## Build frontend for production
	@cd web && npm run build

test: ## Run all tests
	@cd web && npm test && pytest tests/

clean: ## Clean all build artifacts
	@rm -rf web/dist
	@find . -type d -name __pycache__ -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
```

---

## Advanced Patterns

### Multi-Phase Pipeline

```makefile
# =============================================================================
# Multi-Phase Pipeline Makefile
# =============================================================================
# Targets:
#   make all        -- Full pipeline: clean -> setup -> build -> test -> report
#   make setup      -- Verify dev environment
#   make build      -- Build the project
#   make test       -- Run tests
#   make report     -- Generate reports
#   make clean      -- Remove generated files
# =============================================================================

SHELL := /bin/bash
.PHONY: all setup build test report clean help

# Configuration
PYTHON   ?= python3
VENV_DIR ?= .venv
DB       ?= data.db

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Phase 1: Environment Setup
setup: ## Verify dev environment and create directory structure
	@echo "=== Checking development environment ==="
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "ERROR: $(PYTHON) not found."; exit 1; }
	@$(PYTHON) --version
	@test -f $(DB) || { echo "ERROR: Database not found: $(DB)."; exit 1; }
	@mkdir -p output/{reports,artifacts}
	@echo "=== Environment OK ==="

# Phase 2: Build
build: setup ## Build the project
	@echo "=== Phase 2: Building ==="
	$(PYTHON) build.py
	@echo "=== Build complete ==="

# Phase 3: Test
test: build ## Run tests
	@echo "=== Phase 3: Testing ==="
	$(PYTHON) -m pytest tests/ -v --tb=short
	@echo "=== Tests complete ==="

# Phase 4: Report
report: test ## Generate reports
	@echo "=== Phase 4: Generating reports ==="
	$(PYTHON) generate_report.py
	@echo "=== Reports generated ==="

# Full pipeline
all: clean setup build test report ## Full pipeline
	@echo ""
	@echo "=============================================="
	@echo "  ALL PHASES COMPLETE"
	@echo "=============================================="
```

### Conditional Tool Detection

```makefile
# Check if a tool is available, fall back gracefully
lint: ## Run linter
	@echo "Running linter..."
	@if command -v golangci-lint &> /dev/null; then \
		golangci-lint run; \
	elif command -v golint &> /dev/null; then \
		golint ./...; \
	else \
		echo "No Go linter found. Installing golangci-lint..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
		golangci-lint run; \
	fi
```

### Variable Override Pattern

Allow users to override variables from the command line:

```makefile
# Variables with defaults (override with: make DB=mydb.sqlite test)
DB       ?= data.db
PYTHON   ?= python3
VENV     ?= .venv
VERBOSE  ?= 0

test: ## Run tests with optional verbose flag
	@if [ "$(VERBOSE)" = "1" ]; then \
		$(PYTHON) -m pytest tests/ -v -s; \
	else \
		$(PYTHON) -m pytest tests/; \
	fi
```

### Pattern Rules for File Processing

```makefile
# Process all .md files to .html
%.html: %.md
	pandoc $< -o $@

# Process all .Rmd files to .html
%.html: %.Rmd
	Rscript -e "rmarkdown::render('$<', output_file='$@')"
```

### Parallel Execution

```makefile
# Run multiple targets in parallel
all: build test lint ## Runs build, test, and lint (may run in parallel)
	@echo "All done!"

# Or use make -j for parallel execution
# make -j4 all  # Run with 4 parallel jobs
```

---

## Docker Integration Patterns

### Docker Compose Management

```makefile
.PHONY: docker-up docker-down docker-logs docker-clean docker-build

docker-up: ## Start all Docker services
	@echo "Starting all services..."
	docker compose up -d
	@echo "Services started. Use 'make docker-logs' to view logs."

docker-down: ## Stop all services
	@echo "Stopping all services..."
	docker compose down

docker-logs: ## View logs from all services
	docker compose logs -f

docker-clean: ## Stop and remove all containers and volumes
	@echo "Cleaning up Docker resources..."
	docker compose down -v
	@echo "Cleanup complete."

docker-build: ## Build Docker images
	@echo "Building Docker images..."
	docker compose build

docker-pull: ## Pull latest images
	@echo "Pulling latest images..."
	docker compose pull

docker-restart-%: ## Restart a specific service (e.g., make docker-restart-web)
	@echo "Restarting $*..."
	docker compose restart $*

docker-df: ## Show Docker disk usage
	@echo "Docker disk usage:"
	docker system df

health: ## Check health of all services
	@echo "Checking service health..."
	docker compose ps
```

### Docker Build and Test

```makefile
# Test in a Docker container
docker-test: ## Run tests inside Docker
	docker run --rm -v $(pwd):/workspace -w /workspace \
		ubuntu:22.04 \
		bash -c "apt-get update && apt-get install -y python3 && python3 -m pytest tests/"

# Build and run Docker image
docker-run: ## Build and run Docker container
	docker build -t myapp . && docker run --rm myapp
```

---

## Common Makefile Recipes

### Clean Target (Comprehensive)

```makefile
clean: ## Clean all build artifacts
	@echo "Cleaning..."
	# Python
	rm -rf build/ dist/ *.egg-info/ .coverage htmlcov/ .pytest_cache/ .mypy_cache/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	# Node.js
	rm -rf node_modules/ dist/ .next/
	# Go
	rm -f bin/*
	# R
	rm -f *.Rcheck
	rm -rf Meta
	# General
	rm -rf .venv/ venv/ .eggs/
	@echo "Clean complete."
```

### Pre-commit Hooks

```makefile
pre-commit-install: ## Install pre-commit hooks
	pre-commit install

pre-commit-run: ## Run pre-commit on all files
	pre-commit run --all-files

pre-commit: pre-commit-install pre-commit-run ## Install and run pre-commit
```

### Environment Variable Checking

```makefile
check-env: ## Check if required environment variables are set
	@echo "Checking environment variables..."
	@if [ -z "$$API_KEY" ]; then echo "WARNING: API_KEY not set"; fi
	@if [ -z "$$DB_URL" ]; then echo "WARNING: DB_URL not set"; fi
	@echo "Environment check complete."
```

### Version Management

```makefile
# Extract version from various sources
VERSION := $(shell grep "^version" pyproject.toml | cut -d'=' -f2 | tr -d ' "')
VERSION := $(shell node -e "console.log(require('./package.json').version)" 2>/dev/null || echo "unknown")

version: ## Show version
	@echo "Version: $(VERSION)"

sync-version: ## Sync version across files
	node scripts/sync-version.js
```

### Status / Info Target

```makefile
status: ## Show project status
	@echo "Project Status"
	@echo ""
	@echo "Tests: All passing"
	@echo "Files:"
	@echo "  - main.py ($(shell wc -l < main.py) lines)"
	@echo "  - tests/ ($(shell find tests/ -name '*.py' | wc -l) files)"
	@echo ""
	@echo "Dependencies:"
	@pip list --format=columns 2>/dev/null || npm list --depth=0 2>/dev/null
```

---

## Common Development Workflows

### Python Project Workflow

```bash
# 1. Setup
make install-dev

# 2. Development
make format && make lint-fix && make test

# 3. Before commit
make clean && make lint && make format && make test

# 4. Full pipeline
make all

# 5. Coverage
make test-cov && open htmlcov/index.html
```

### Go Project Workflow

```bash
# 1. Build and test
make build && make test

# 2. Development with hot reload
make server-dev

# 3. Code quality
make lint && make fmt

# 4. Docker services
make docker-up && make health

# 5. Full pipeline
make build test lint
```

### Node.js Project Workflow

```bash
# 1. Setup
npm install

# 2. Development
make dev

# 3. Quality checks
make typecheck && make lint && make test

# 4. Full pipeline
make all

# 5. Build for production
make build
```

### R Package Workflow

```bash
# 1. Setup
make install

# 2. Development
make dev

# 3. Full validation
make all

# 4. Documentation
make document && make docs && make docs-serve

# 5. CRAN check
make check
```

---

## Troubleshooting

### Issue: "No rule to make target"
**Solution**: Check that the target name is correct and declared in `.PHONY`.

### Issue: "Missing separator"
**Solution**: Makefiles require **tabs**, not spaces, for recipe lines. Use `cat -A Makefile` to verify.

### Issue: Variables not expanding
**Solution**: Use `$$` for shell variables:
```makefile
test:
	@if [ -z "$$VAR" ]; then echo "VAR not set"; fi
```

### Issue: Target not running
**Solution**: Ensure the target is declared in `.PHONY` and doesn't conflict with a file.

### Issue: Help target not showing all targets
**Solution**: Make sure each target has a `##` comment:
```makefile
my-target: ## This comment will appear in help
	@echo "Doing something"
```

---

## Reference: Derived from Real Workspace

This anatomy reference was derived from analyzing Makefiles across 30+ projects in the workspace, including:
- **ideagarden** (Go + Docker)
- **rsbiomes** (React + Python API)
- **py-mpspline** (Python package)
- **mindgarden** (TypeScript CLI)
- **alpinejs** (R package)
- **CVIR-skill** (Python data pipeline)
- **DST** (Node.js data validation)
- **soilmcp** (Python MCP server)
- **openssurgo** (Python + QGIS plugins)
