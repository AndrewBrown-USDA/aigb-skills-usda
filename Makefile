.PHONY: help install test smoke sync sync-symlink catalog clean

.DEFAULT_GOAL := help

help: ## Show available Makefile targets
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install package dependencies
	npm install

test: ## Run smoke test suite
	npm test

smoke: ## Run smoke checks directly
	node scripts/smoke.js

sync: ## Sync and materialize skills in copy mode
	node scripts/sync-skills.js --mode copy

sync-symlink: ## Sync and materialize skills in symlink mode
	node scripts/sync-skills.js --mode symlink

catalog: ## Regenerate catalog lockfile from seed definitions
	node scripts/mine-history.js --output catalog/skills.lock.json

clean: ## Clean scratch and build artifacts
	@node -e "const fs = require('fs'); fs.rmSync('.scratch', { recursive: true, force: true }); console.log('Cleaned .scratch');"
