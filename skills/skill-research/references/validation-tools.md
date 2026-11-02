# Validation Tools

Use this reference when running interoperable skill checks.

`skills-ref` is the reference Agent Skills library and CLI. It is for demonstration and validation, not a production dependency.

Official source: <https://github.com/agentskills/agentskills/tree/main/skills-ref>

## Install

Run these commands from a checkout of the official `agentskills` repository's `skills-ref` directory.

PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
```

Command Prompt:

```bat
python -m venv .venv
.venv\Scripts\activate.bat
pip install -e .
```

With `uv`:

```text
uv sync
.venv\Scripts\Activate.ps1
```

The `skills-ref` command is available while the virtual environment is active. Confirm setup with:

```text
skills-ref --help
```

Do not add `skills-ref` to this package's dependencies. It is optional and external.

## Commands

```text
skills-ref validate path/to/skill
skills-ref read-properties path/to/skill
skills-ref to-prompt path/to/skill-a path/to/skill-b
```

`skills-ref` checks standard skill properties such as frontmatter and naming. It does not replace repository validation for Markdown-link integrity, citation completeness, reference depth, catalog metadata, or packaged-skill policy.

If `skills-ref` is unavailable, run the repository checks instead:

```text
npm run validate:skills
npm run test:validate
```
