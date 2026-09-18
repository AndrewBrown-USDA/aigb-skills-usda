#!/usr/bin/env python3
"""
Parse code into logical chunks (statements, functions, loops, etc).

Language-agnostic approach: uses language detection + regex to identify chunk boundaries.
Returns list of chunks with line ranges and descriptions.
"""

import re
from typing import List, Tuple, NamedTuple
from language_detect import detect_language


class Chunk(NamedTuple):
    start_line: int  # 1-indexed
    end_line: int    # 1-indexed inclusive
    description: str
    type: str        # "statement", "function", "class", "loop", "conditional", etc.


def chunk_python(lines: List[str]) -> List[Chunk]:
    """Break Python code into logical chunks."""
    chunks = []
    i = 0
    indent_stack = [0]

    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        indent = len(line) - len(stripped)

        # Skip blank lines and comments
        if not stripped or stripped.startswith("#"):
            i += 1
            continue

        # Function definition
        if re.match(r"def\s+\w+", stripped):
            start = i
            # Find body indent
            i += 1
            if i < len(lines):
                body_indent = len(lines[i]) - len(lines[i].lstrip())
            else:
                chunks.append(Chunk(start + 1, i, f"def ...", "function"))
                break

            # Consume function body
            while i < len(lines):
                next_line = lines[i]
                next_stripped = next_line.lstrip()
                next_indent = len(next_line) - len(next_stripped)

                if next_stripped and not next_stripped.startswith("#"):
                    if next_indent <= indent:
                        break

                i += 1

            func_name = re.search(r"def\s+(\w+)", lines[start]).group(1)
            chunks.append(Chunk(start + 1, i, f"def {func_name}(...)", "function"))
            continue

        # Class definition
        if re.match(r"class\s+\w+", stripped):
            start = i
            i += 1
            if i < len(lines):
                body_indent = len(lines[i]) - len(lines[i].lstrip())
            else:
                class_name = re.search(r"class\s+(\w+)", lines[start]).group(1)
                chunks.append(Chunk(start + 1, i, f"class {class_name}", "class"))
                break

            while i < len(lines):
                next_line = lines[i]
                next_stripped = next_line.lstrip()
                next_indent = len(next_line) - len(next_stripped)

                if next_stripped and not next_stripped.startswith("#"):
                    if next_indent <= indent:
                        break

                i += 1

            class_name = re.search(r"class\s+(\w+)", lines[start]).group(1)
            chunks.append(Chunk(start + 1, i, f"class {class_name}", "class"))
            continue

        # For/while loop
        if re.match(r"(for|while)\s+", stripped):
            start = i
            loop_type = "for" if "for" in stripped else "while"
            i += 1

            if i < len(lines):
                body_indent = len(lines[i]) - len(lines[i].lstrip())
            else:
                chunks.append(Chunk(start + 1, i, f"{loop_type} ...", "loop"))
                break

            while i < len(lines):
                next_line = lines[i]
                next_stripped = next_line.lstrip()
                next_indent = len(next_line) - len(next_stripped)

                if next_stripped and not next_stripped.startswith("#"):
                    if next_indent <= indent:
                        break

                i += 1

            chunks.append(Chunk(start + 1, i, f"{loop_type} ...", "loop"))
            continue

        # If/elif/else
        if re.match(r"(if|elif|else)\s+", stripped):
            start = i
            i += 1

            if i < len(lines):
                body_indent = len(lines[i]) - len(lines[i].lstrip())
            else:
                chunks.append(Chunk(start + 1, i, "if ...", "conditional"))
                break

            while i < len(lines):
                next_line = lines[i]
                next_stripped = next_line.lstrip()
                next_indent = len(next_line) - len(next_stripped)

                if next_stripped and not next_stripped.startswith("#"):
                    if next_indent <= indent:
                        break

                i += 1

            chunks.append(Chunk(start + 1, i, "if ...", "conditional"))
            continue

        # Try/except
        if re.match(r"try\s*:", stripped):
            start = i
            i += 1

            while i < len(lines):
                next_line = lines[i]
                next_stripped = next_line.lstrip()
                next_indent = len(next_line) - len(next_stripped)

                if next_stripped and not next_stripped.startswith("#"):
                    if next_indent <= indent and (
                        "except" not in next_stripped and "finally" not in next_stripped
                    ):
                        break

                i += 1

            chunks.append(Chunk(start + 1, i, "try/except", "exception"))
            continue

        # Single statement
        chunks.append(Chunk(i + 1, i + 1, stripped[:50], "statement"))
        i += 1

    return chunks


def chunk_javascript(lines: List[str]) -> List[Chunk]:
    """Break JavaScript/TypeScript code into logical chunks."""
    chunks = []
    i = 0
    paren_depth = 0
    brace_depth = 0

    while i < len(lines):
        line = lines[i].strip()

        # Skip blank/comment lines
        if not line or line.startswith("//"):
            i += 1
            continue

        # Function declaration or arrow function
        if re.match(r"(async\s+)?(function|const|let|var)\s+\w+", line) and "(" in line:
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            func_match = re.search(r"(?:function\s+)?(\w+)", line)
            func_name = func_match.group(1) if func_match else "anonymous"
            chunks.append(Chunk(start + 1, i, f"{func_name}(...)", "function"))
            continue

        # If/else
        if re.match(r"(if|else if|else)\s*\(", line):
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            chunks.append(Chunk(start + 1, i, "if/else", "conditional"))
            continue

        # For/while/do loop
        if re.match(r"(for|while|do)\s*", line):
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            loop_type = line.split()[0]
            chunks.append(Chunk(start + 1, i, f"{loop_type} ...", "loop"))
            continue

        # Try/catch
        if re.match(r"try\s*{", line):
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and (brace_depth > 0 or "catch" not in lines[i]):
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            if i < len(lines) and "catch" in lines[i]:
                brace_depth = lines[i].count("{") - lines[i].count("}")
                i += 1
                while i < len(lines) and brace_depth > 0:
                    brace_depth += lines[i].count("{") - lines[i].count("}")
                    i += 1

            chunks.append(Chunk(start + 1, i, "try/catch", "exception"))
            continue

        # Single statement
        chunks.append(Chunk(i + 1, i + 1, line[:50], "statement"))
        i += 1

    return chunks


def chunk_java(lines: List[str]) -> List[Chunk]:
    """Break Java code into logical chunks (simplified, brace-matching)."""
    chunks = []
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        if not line or line.startswith("//"):
            i += 1
            continue

        # Class definition
        if re.match(r"(public\s+)?(class|interface)\s+", line):
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            class_match = re.search(r"(class|interface)\s+(\w+)", line)
            class_name = class_match.group(2) if class_match else "AnonymousClass"
            chunks.append(Chunk(start + 1, i, f"class {class_name}", "class"))
            continue

        # Method definition
        if re.match(r"(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\(", line):
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            method_match = re.search(r"(\w+)\s*\(", line)
            method_name = method_match.group(1) if method_match else "method"
            chunks.append(Chunk(start + 1, i, f"{method_name}(...)", "function"))
            continue

        # If/for/while (simplified)
        if re.match(r"(if|for|while)\s*\(", line):
            start = i
            brace_depth = line.count("{") - line.count("}")

            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1

            chunk_type = "conditional" if "if" in line else "loop"
            chunks.append(Chunk(start + 1, i, line.split()[0] + " ...", chunk_type))
            continue

        # Single statement
        chunks.append(Chunk(i + 1, i + 1, line[:50], "statement"))
        i += 1

    return chunks


def chunk_generic(lines: List[str]) -> List[Chunk]:
    """Fallback: simple statement-by-statement chunking."""
    chunks = []

    for i, line in enumerate(lines):
        stripped = line.strip()

        if stripped and not stripped.startswith("#") and not stripped.startswith("//"):
            chunks.append(Chunk(i + 1, i + 1, stripped[:50], "statement"))

    return chunks


def chunk_code(code: str) -> List[Chunk]:
    """
    Parse code into logical chunks.

    Args:
        code: Source code as string

    Returns:
        List of Chunk objects with line ranges and descriptions
    """
    if not code.strip():
        return []

    lines = code.split("\n")
    lang, _ = detect_language(code)

    if lang == "Python":
        return chunk_python(lines)
    elif lang in ["JavaScript", "TypeScript"]:
        return chunk_javascript(lines)
    elif lang == "Java":
        return chunk_java(lines)
    else:
        return chunk_generic(lines)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        code_file = sys.argv[1]
        with open(code_file) as f:
            code = f.read()
    else:
        code = sys.stdin.read()

    chunks = chunk_code(code)
    for chunk in chunks:
        print(
            f"Lines {chunk.start_line:3d}-{chunk.end_line:3d} ({chunk.type:12s}): {chunk.description}"
        )
