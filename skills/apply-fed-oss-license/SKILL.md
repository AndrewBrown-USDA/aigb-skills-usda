---
name: apply-fed-oss-license
author: Andrew G. Brown (https://github.com/AndrewBrown-USDA)
license: MIT
description: Audit and update an arbitrary codebase to follow the Code.mil federal open-source licensing model (MIT with 17 U.S.C. § 105 disclaimers and INTENT.md), including CRAN/R package DESCRIPTION setup.
version: 1.0.0
---

# Federal Open Source Licensing (Code.mil Model)

## Context & Objectives
Under 17 U.S.C. § 105, copyright protection is unavailable for works created by United States Government officers or employees as part of their official duties. However:
1. International jurisdictions may recognize government copyright under the Berne Convention.
2. Third-party/community contributors retain copyright in their own contributions.
3. Users and government authors need liability disclaimers ("AS IS").

Following the [Code.mil](https://code.mil/) pattern, this workflow transitions repositories (e.g., from GPL or undefined licenses) to an **MIT License** paired with an **`INTENT.md`** statement and explicit federal public-domain notices.

---

## Workflow Steps

### Step 1: Contributor & Licensing Audit
1. Run a contributor audit to determine whether non-federal third-party code exists:
   ```bash
   git log --format='%an <%ae>' | sort -u
   ```

2. Inspect legacy license files (`LICENSE`, `COPYING`, `LICENSE.txt`).
3. Identify whether any non-federal contributions exist in the active codebase:
   - If non-federal code is substantial and was licensed under GPL, verify consent from original authors before downgrading to MIT, or replace/rewrite the specific routine.
   - If all historical/active maintainers were federal employees acting within their official duties, or if non-federal code has been superseded, proceed directly.

### Step 2: Create Root Licensing Files

#### 1. INTENT.md
Create `INTENT.md` in the repository root:

```markdown
# Open Source Intent & Licensing

This project is authored and maintained by United States Government employees as part of their official duties, alongside open-source community contributors.

## 1. Domestic Status (United States)
Pursuant to 17 U.S.C. § 105, works of the United States Government are not eligible for copyright protection within the United States. Work authored by U.S. Government personnel in the scope of employment resides in the public domain domestically.

## 2. International & Permissive Licensing
To ensure clarity across international jurisdictions where foreign copyright may be recognized under international conventions, and to govern contributions from non-federal entities, this software is made available under the terms of the [MIT License](LICENSE.md).

## 3. External Contributions
Any contributions submitted to this project by non-federal contributors are accepted under the terms of the project's MIT License.

## 4. Disclaimer
This software is provided "as is", without warranty of any kind, express or implied. Use of this software does not constitute official endorsement by the U.S. Government or any of its agencies.
```

#### 2. LICENSE.md
Create or update `LICENSE.md` in the repository root:

```markdown
# MIT License

Copyright (c) [YEAR] U.S. Federal Government (in countries where recognized)
Copyright (c) [YEAR] Project Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

### U.S. Government Notice
Portions of this software are a work of the United States Government and are in
the public domain within the United States pursuant to 17 U.S.C. § 105. For
jurisdictions where copyright may subsist, and for third-party contributions,
the terms of the MIT License above apply.
```

---

## Step 3: Ecosystem-Specific Adjustments

### R Packages (CRAN / Bioconductor)
R package tooling (`R CMD check`, CRAN automated parsers) expects strict formatting. A raw `LICENSE.md` alone is insufficient if the `DESCRIPTION` specifies `file LICENSE`.

1. **Update DESCRIPTION**:
   Set the `License` field to:
   ```dcf
   License: MIT + file LICENSE
   ```

2. **Generate Top-Level LICENSE File**:
   CRAN requires this file to contain only two specific key-value lines (`YEAR` and `COPYRIGHT HOLDER`). Do not put full markdown or narrative prose in this exact file:
   ```text
   YEAR: [YEAR]
   COPYRIGHT HOLDER: U.S. Federal Government (in countries where recognized), package contributors
   ```

3. **Retain Full Text in LICENSE.md or LICENSE.note**:
   Leave `LICENSE.md` (from Step 2) in the repository root or provide a `LICENSE.note` so developers and package inspectors have access to the complete MIT text and § 105 rider.

4. **Add to .Rbuildignore**:
   Ensure markdown-only artifacts do not trigger build warnings during `R CMD check`:
   ```regex
   ^INTENT\.md$
   ^LICENSE\.md$
   ```

5. **Document in NEWS.md and cran-comments.md**:
   - In `NEWS.md`:
     - Relicensed package to MIT (+ file LICENSE) with federal open source disclaimer (17 U.S.C. § 105) per Code.mil guidance.
   - In `cran-comments.md` (for CRAN release submissions):
     ```markdown
     ## License Update
     * Changed License field to 'MIT + file LICENSE' to align with federal open-source guidance.
     ```

### Python Packages (pyproject.toml / setup.cfg)
- In `pyproject.toml`:
  ```toml
  [project]
  license = { text = "MIT" }
  classifiers = [
      "License :: OSI Approved :: MIT License",
  ]
  ```
- Reference both `LICENSE.md` and `INTENT.md` in package build manifests if required.

---

## Step 4: Verification Checklist
- [ ] `git status` verifies old copyleft licenses (e.g., `GPL-3`, `COPYING`) have been removed.
- [ ] `INTENT.md` is present at the repository root.
- [ ] `LICENSE.md` includes the scoped copyright line and the 17 U.S.C. § 105 notice.
- [ ] For R packages: `DESCRIPTION` reads `License: MIT + file LICENSE`, and the `LICENSE` file contains only `YEAR` and `COPYRIGHT HOLDER`.
- [ ] For R packages: `R CMD check --as-cran` passes with zero warnings or notes regarding licensing.
