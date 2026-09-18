---
name: web-source-bundler
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
version: 1.1.0
description: Captures web sources and compiles deterministic Markdown reference bundles with metadata and checksums. Use when asked to capture URLs, research web links, bundle search results, or archive web pages into an LLM-ready reference document.
---

# Web Source Bundler

Capture URLs, file lists, or search results into deterministic, verifiable Markdown reference bundles with SHA-256 provenance using `web-source-bundler`.

## Installation & Setup

`web-source-bundler` requires Python 3.10+ and Playwright.

1. **Install from GitHub repository**:
   ```bash
   pip install git+https://github.com/AndrewBrown-USDA/web-source-bundler.git
   ```
   *(Or if developing locally within the repository workspace: `pip install -e .`)*

2. **Install Playwright browser binaries**:
   ```bash
   python -m playwright install chromium
   ```

*Both `web-source-bundler` and `source-bundler` CLI entrypoints are available once installed.*

## Execution Workflow

1. **Extract source inputs** from user prompt:
   - Explicit URLs: `https://...`
   - URL list files (plain text `.txt` with one URL per line)
   - Search result lists (JSON containing `url` or `link`, `title`, and optional `snippet`)
2. **Determine execution options**:
   - Output destination: `--out <dir>` (defaults to `./source-bundle-<timestamp>`)
   - Interactive prompt: `--interactive` if user requested manual selection
   - Artifacts: `--no-screenshot`, `--no-pdf`, `--include-raw-html`
   - Data privacy: `--redact-pattern "<regex>"` if sensitive tokens/PII are mentioned
   - Link indexing: `--include-links-table` if an appendix of all extracted links is requested
3. **Run `web-source-bundler` command**:
   - **Direct URLs**:
     ```bash
     web-source-bundler urls https://example.com https://another.com --out ./bundle
     ```
   - **URL list file**:
     ```bash
     web-source-bundler file urls.txt --out ./bundle
     ```
   - **Search results JSON**:
     ```bash
     web-source-bundler search-results results.json --out ./bundle
     ```
4. **Inspect output bundle**:
   - Read `manifest.json` to verify capture status and review any reported errors.
   - Reference `combined.md` for conversational grounding and reference citation by Source ID (e.g., `Source 001`).
5. **Report summary** to the user:
   - State the bundle ID, output path, count of captured sources, and cite the primary contents from `combined.md`.

## Deterministic Artifact Layout

A complete bundle follows this directory structure:

```text
source-bundle-20260918-120000/
+-- manifest.json              # Provenance metadata, capture config, and error logs
+-- combined.md                # Single consolidated reference file for AI prompts
+-- checksums.sha256           # SHA-256 hashes of all files in bundle
+-- sources/
    +-- 001/
    |   +-- metadata.json      # Source metadata, HTTP status, and timings
    |   +-- readable.md        # Clean Markdown with YAML front matter
    |   +-- rendered.html      # Rendered DOM HTML
    |   +-- ast.json           # Block AST of extracted text
    |   +-- screenshot.png     # Full-page screenshot (if enabled)
    |   +-- page.pdf           # Vector PDF printout (if enabled)
    |   +-- raw.html           # Raw HTTP body (with --include-raw-html)
    |   +-- response_headers.json # HTTP headers (with --include-raw-html)
    +-- 002/
        +-- metadata.json
        +-- readable.md
```

### Combined Markdown (`combined.md`)

`combined.md` joins all sources into one document for AI prompts:

```markdown
# Source Bundle

Bundle ID: source-bundle-20260918-120000
Created: 2026-09-18T12:00:00Z
Tool: web-source-bundler 0.1.0

Use this document as the reference source bundle. Cite material by source ID.

---

## Source 001: Example Domain

- Input URL: https://example.com
- Final URL: https://example.com/
- Fetched: 2026-09-18T12:00:05Z
- SHA-256 readable Markdown: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

### Content

---
source_id: 001
title: "Example Domain"
input_url: https://example.com
final_url: https://example.com/
fetched_at: 2026-09-18T12:00:05Z
http_status: 200
---

Example Domain

This domain is for use in illustrative examples in documents.
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Ad-hoc unchecksummed scraping | Misses dynamic JS rendering, screenshots, and PDFs | Install and run `web-source-bundler` with headless Playwright |
| Silent error swallowing | Corrupts audit records and leads to hallucinated sources | Check `manifest.json` and report any failed URLs |
| Omitting Source ID citations | Loses verifiable traceability back to original web source | Always cite findings by `Source ID` (e.g. `Source 001`) from `combined.md` |
| Unstructured output dumps | Fragile for downstream LLM reasoning and indexing | Always output standardized `manifest.json` and `combined.md` |
