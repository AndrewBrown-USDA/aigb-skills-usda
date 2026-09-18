# Scripts

Executable utilities for rubber-ducking implementation.

## Language Detection

**Script**: `language_detect.py`

Detects programming language from code snippet via pattern matching.

```bash
python3 language_detect.py [file]
cat code.py | python3 language_detect.py
# Output: Python (confidence: 0.56)
```

**Returns**: Language name + confidence (0.0-1.0)

**Supported**: Python, JavaScript, TypeScript, R, Java, C, C++, Go, Rust, SQL, Bash, YAML

**Tests**: Run `python3 test_language_detect.py`

**Docs**: See `language_detect.md`

---

## AST Chunking

**Script**: `ast_chunking.py`

Breaks code into logical chunks (functions, loops, conditionals, statements).

```bash
python3 ast_chunking.py [file]
cat code.py | python3 ast_chunking.py
# Output:
# Lines   1-  3 (function    ): def foo(...)
# Lines   4-  8 (loop        ): for ...
# Lines   9- 10 (statement   ): return result
```

**Returns**: List of chunks with:
- Start line (1-indexed)
- End line (1-indexed)
- Chunk type (function, class, loop, conditional, statement, exception)
- Description

**Supported**: Python, JavaScript, TypeScript, Java (others fall back to generic statement-per-line)

**Tests**: Run `python3 test_ast_chunking.py`

**Docs**: See `ast_chunking.md`

---

## Usage Notes

- Both scripts are deterministic (no randomness, same input -> same output)
- Language detection confidence is heuristic-based; may be low for ambiguous code
- Chunking respects logical structure (don't split function from body)
- Nested structures inside functions treated as single chunk (use "step" to zoom in)

## Integration

Agents implementing rubber-ducking should:

1. Use `language_detect()` to identify code language
2. Use `chunk_code()` to get initial chunks
3. For "step" navigation, re-run `chunk_code()` on sub-range or implement recursive stepping
4. Both functions available as importable Python modules:

```python
from language_detect import detect_language
from ast_chunking import chunk_code

lang, conf = detect_language(user_code)
chunks = chunk_code(user_code)
```
