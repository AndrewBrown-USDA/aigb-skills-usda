# Ecosystem Search Patterns

Use these patterns to identify project configurations and extract metadata.

## Python
- **Files**: `pyproject.toml`, `requirements.txt`, `setup.py`, `__init__.py`
- **Metadata (pyproject.toml)**: `^version\s*=\s*["']([^"']+)["']`
- **Dependencies (pyproject.toml)**: `^\s*["']([A-Za-z0-9_-]+)(?:[<>=\!~]+[0-9.]*)?["']\s*,?`
- **FastAPI Routes**: `@app\.(?:get|post|put|delete)\(\s*["']([^"']+)["']`
- **Flask Routes**: `@app\.route\(\s*["']([^"']+)["']`

## R
- **Files**: `DESCRIPTION`, `NAMESPACE`, `renv.lock`, `global.R`, `ui.R`, `server.R`, `entrypoint.R`
- **Dependencies (DESCRIPTION)**: `^\s*(?:Imports|Depends|Suggests)\s*:(?:\s*[A-Za-z0-9.]+[^\,\n]*)*`
- **Exports (NAMESPACE)**: `^\s*export\(\s*([A-Za-z0-9._]+)\s*\)`
- **Plumber Routes**: `^\#\*\s*@(get|post|put|delete)\s+(\S+)`

## C / C++
- **Files**: `CMakeLists.txt`, `Makefile`, `.h`, `.hpp`, `.hxx`
- **Targets (CMake)**: `^\s*add_(?:executable|library)\(\s*(\w+)`
- **Targets (Makefile)**: `^([A-Za-z0-9_.-]+)\s*:[^=]*$`

## Julia
- **Files**: `Project.toml`, `Manifest.toml`, `src/`
- **Dependencies (Project.toml)**: `^\s*([A-Za-z0-9_]+)\s*=\s*["']([a-f0-9-]+)["']`
- **Inclusions**: `\binclude\(\s*["']([^"']+\.jl)["']\s*\)`
- **Modules**: `^\s*module\s+(\w+)`

## Rust
- **Files**: `Cargo.toml`, `Cargo.lock`, `src/lib.rs`, `src/main.rs`, `mod.rs`
- **Workspace Dependencies**: `^\s*([A-Za-z0-9_-]+)\s*=\s*\{\s*workspace\s*=\s*true`

## Generic
- **Docker Base Image**: `^\s*FROM\s+([a-zA-Z0-9_/.-\:]+)`
- **Env Templates**: `^([A-Z0-9_]+)\s*=\s*(.*)$`
