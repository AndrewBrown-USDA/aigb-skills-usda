#!/usr/bin/env python3
"""Test AST chunking."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ast_chunking import chunk_code


def test_python_simple():
    code = """
def add(a, b):
    return a + b
"""
    chunks = chunk_code(code)
    assert len(chunks) > 0, "Expected chunks"
    assert any(c.type == "function" for c in chunks), "Expected function chunk"
    print("[OK] Python simple function")


def test_python_with_loop():
    code = """
items = [1, 2, 3]
for item in items:
    print(item)

if len(items) > 0:
    print("Done")
"""
    chunks = chunk_code(code)
    assert len(chunks) >= 2, f"Expected at least 2 chunks, got {len(chunks)}"
    assert any(c.type == "loop" for c in chunks), "Expected loop"
    assert any(c.type == "conditional" for c in chunks), "Expected conditional"
    print("[OK] Python with top-level loop and conditional")


def test_python_class():
    code = """
class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        return a * b
"""
    chunks = chunk_code(code)
    assert any(c.type == "class" for c in chunks), "Expected class chunk"
    print("[OK] Python class definition")


def test_javascript_arrow():
    code = """
const greet = (name) => {
    console.log(`Hello, ${name}!`);
};
"""
    chunks = chunk_code(code)
    assert len(chunks) > 0, "Expected chunks"
    assert any(c.type == "function" for c in chunks), "Expected function chunk"
    print("[OK] JavaScript arrow function")


def test_javascript_multiple():
    code = """
const x = 5;
const fn = () => console.log("test");
"""
    chunks = chunk_code(code)
    assert len(chunks) >= 1, "Expected at least one chunk"
    print("[OK] JavaScript multi-statement")


def test_javascript_class():
    code = """
class Calculator {
    add(a, b) {
        return a + b;
    }
}
"""
    chunks = chunk_code(code)
    assert len(chunks) >= 1, "Expected at least one chunk"
    print("[OK] JavaScript class")


def test_java_class():
    code = """
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}
"""
    chunks = chunk_code(code)
    assert any(c.type == "class" for c in chunks), "Expected class"
    print("[OK] Java class")


def test_java_simple():
    code = """
int x = 5;
System.out.println(x);
"""
    chunks = chunk_code(code)
    assert len(chunks) >= 1, "Expected at least one chunk"
    print("[OK] Java simple statements")


def test_empty_code():
    code = ""
    chunks = chunk_code(code)
    assert len(chunks) == 0, "Expected no chunks for empty code"
    print("[OK] Empty code handling")


def test_comments_only():
    code = """
# This is a comment
# So is this
"""
    chunks = chunk_code(code)
    assert len(chunks) == 0, "Expected no chunks for comments only"
    print("[OK] Comments-only code")


def test_mixed_statements():
    code = """
x = 1
y = 2
z = x + y
"""
    chunks = chunk_code(code)
    assert len(chunks) == 3, f"Expected 3 statements, got {len(chunks)}"
    assert all(c.type == "statement" for c in chunks), "Expected statement chunks"
    print("[OK] Simple statements")


def test_chunk_line_ranges():
    code = """def foo():
    return 42"""
    chunks = chunk_code(code)
    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.start_line == 1, f"Expected start_line=1, got {chunk.start_line}"
    assert chunk.end_line == 2, f"Expected end_line=2, got {chunk.end_line}"
    print("[OK] Chunk line ranges correct")


if __name__ == "__main__":
    test_python_simple()
    test_python_with_loop()
    test_python_class()
    test_javascript_arrow()
    test_javascript_multiple()
    test_javascript_class()
    test_java_class()
    test_java_simple()
    test_empty_code()
    test_comments_only()
    test_mixed_statements()
    test_chunk_line_ranges()
    print("\n[PASS] All AST chunking tests passed")
