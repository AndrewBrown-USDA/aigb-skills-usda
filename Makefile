.PHONY: help install install-skills test smoke sync sync-symlink catalog clean

.DEFAULT_GOAL := help

help: ## Show available Makefile targets
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install npm package dependencies
	npm install

install-skills: ## Install pre-packaged skills into agent directory (~/.agents/skills)
	node scripts/install.js --mode copy --target ~/.agents/skills

test: ## Run smoke test suite
	npm test

smoke: ## Run smoke checks directly
	node scripts/smoke.js

sync: ## (Maintainers) Sync and materialize skills from upstream source repos
	node scripts/sync-skills.js --mode copy

sync-symlink: ## (Maintainers) Sync and materialize skills in symlink mode
	node scripts/sync-skills.js --mode symlink

catalog: ## (Maintainers) Regenerate catalog lockfile from seed definitions
	node scripts/mine-history.js --output catalog/skills.lock.json

clean: ## Clean scratch and build artifacts
	@node -e "const fs = require('fs'); fs.rmSync('.scratch', { recursive: true, force: true }); console.log('Cleaned .scratch');"
