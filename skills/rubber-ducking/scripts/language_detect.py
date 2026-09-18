#!/usr/bin/env python3
"""
Detect programming language from code snippet.

Identifies language via syntax patterns (keywords, operators, syntax markers).
Returns language name and confidence level.
"""

import re
from typing import Tuple


LANGUAGE_PATTERNS = {
    "Python": [
        r"\bdef\s+\w+\s*\(",
        r"\bclass\s+\w+",
        r"\bimport\s+\w+",
        r"\bfrom\s+\w+\s+import",
        r":\s*\n",  # line ends with colon
        r"\bif\s+.*:",
        r"\bfor\s+\w+\s+in\s+",
        r"\breturn\s+",
        r"@\w+",  # decorators
        r"\belif\s+",
        r"\belse:",
        r"\btry:",
        r"\bexcept",
    ],
    "JavaScript": [
        r"\bfunction\s*\(",
        r"=>\s*{?",  # arrow functions (JS/TS specific)
        r"\bconst\s+\w+\s*=",
        r"\blet\s+\w+\s*=",
        r"\bvar\s+\w+\s*=",
        r"\bimport\s+{?.*}?\s+from",
        r"\brequire\s*\(",
        r"console\.",
        r"\basync\s+function",
        r"\bawait\s+",
        r"`[^`]*\$\{",  # template literals (JS/TS specific)
        r"\.then\s*\(",
        r"\.catch\s*\(",
        r"this\.",
        r"\bnew\s+\w+\(",
    ],
    "TypeScript": [
        r":\s*\w+\s*[=;]",  # type annotations
        r"interface\s+\w+",
        r"\btype\s+\w+\s*=",
        r"<\w+>",  # generics
        r"\bimport\s+{?.*}?\s+from",
    ],
    "R": [
        r"<-",  # R assignment (very R-specific)
        r"\bfunction\s*\(",
        r"library\(",
        r"data\.frame\(",
        r"install\.packages\(",
        r"\bggplot\(",
        r"\bdplyr::",
    ],
    "Java": [
        r"\bpublic\s+class\s+",
        r"\bpublic\s+static\s+void",
        r"\bprivate\s+\w+",
        r"\bimport\s+java\.",
        r"\bthrows\s+",
        r"new\s+\w+\(",
    ],
    "C": [
        r"#include\s*[<\"]",
        r"\bvoid\s+\w+\s*\(",
        r"\bint\s+main\s*\(",
        r"\bprintf\s*\(",
        r"\bscanf\s*\(",
        r"malloc\(",
    ],
    "C++": [
        r"#include\s*<",
        r"\bstd::",
        r"template\s*<",
        r"class\s+\w+\s*{",
        r"\bpublic:\s*$",
        r"new\s+\w+\(",
    ],
    "Go": [
        r"\bpackage\s+",
        r"\bfunc\s+\w+\(",
        r"\bimport\s+\(",
        r":=",  # short assignment
        r"\berr\s+!=\s+nil",
        r"\bdefer\s+",
    ],
    "Rust": [
        r"\bfn\s+\w+\(",
        r"\blet\s+\w+\s*=",
        r"\bmut\s+",
        r"\bimpl\s+\w+",
        r"println!",
        r"\bunwrap\(",
    ],
    "SQL": [
        r"\bSELECT\s+",
        r"\bFROM\s+",
        r"\bWHERE\s+",
        r"\bJOIN\s+",
        r"\bINSERT\s+INTO",
        r"\bUPDATE\s+",
        r"\bDELETE\s+FROM",
    ],
    "Bash": [
        r"^#!/bin/bash",
        r"\b\$\{?\w+\}?",  # variables
        r"\becho\s+",
        r"\bif\s+\[\s*",
        r"\bfor\s+\w+\s+in\s+",
        r"\bwhile\s+\[\s*",
    ],
    "YAML": [
        r"^---\s*$",  # document start
        r"^[\w-]+:\s+",  # key: value
        r"^\s{2,}-\s+",  # list items
        r":\s+['\"]",  # quoted values
    ],
}


def detect_language(code: str) -> Tuple[str, float]:
    """
    Detect language from code snippet.

    Args:
        code: Source code as string

    Returns:
        Tuple of (language_name, confidence_0_to_1)
        Returns ("Unknown", 0.0) if no match found.
    """
    if not code or not code.strip():
        return ("Unknown", 0.0)

    scores = {}

    for language, patterns in LANGUAGE_PATTERNS.items():
        matches = 0
        for pattern in patterns:
            if re.search(pattern, code, re.MULTILINE | re.IGNORECASE):
                matches += 1

        if matches > 0:
            scores[language] = matches / len(patterns)

    if not scores:
        return ("Unknown", 0.0)

    best_lang = max(scores, key=scores.get)
    confidence = scores[best_lang]

    return (best_lang, confidence)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        code_file = sys.argv[1]
        with open(code_file) as f:
            code = f.read()
    else:
        code = sys.stdin.read()

    lang, conf = detect_language(code)
    print(f"{lang} (confidence: {conf:.2f})")
