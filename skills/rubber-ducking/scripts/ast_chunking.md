# AST Chunking Strategy

Breaks code into logical, walkable chunks. Language-specific rules identify semantic units (functions, classes, loops, conditionals) for step-by-step walkthrough.

## Usage

```bash
python3 ast_chunking.py [file]
```

Returns list of chunks with line ranges and types.

```bash
cat myfile.py | python3 ast_chunking.py
# Output:
# Lines   1-  2 (function    ): def fibonacci(...)
# Lines   3-  8 (loop        ): for ...
# Lines   9- 10 (conditional ): if ...
```

## Chunk Types

- `statement`: Single line (assignment, call, return)
- `function`: Function/method definition and body
- `class`: Class definition and body
- `loop`: For/while/do loop
- `conditional`: If/elif/else block
- `exception`: Try/except/catch/finally

## Language-Specific Rules

### Python

**Top-level chunks**:
- Function definitions: `def name():` through dedent
- Class definitions: `class Name:` through dedent
- For/while loops: `for/while` through dedent
- If/elif/else blocks: `if/elif/else` through dedent
- Try/except/finally blocks: `try:` through `except/finally` dedent
- Single statements: All other lines

**Granularity**: Top-level only. Step into functions to see nested loops/conditionals.

**Edge cases**:
- Decorators (`@`) are part of the following function
- Multiline function definitions (wrapped params) treated as single chunk header
- Lambda expressions treated as single-statement chunks

### JavaScript / TypeScript

**Top-level chunks**:
- Function declarations: `function name()` or `const name = () =>` through closing `}`
- Arrow functions with `async`
- If/else: `if ()` through closing `}`
- For/while/do: Loop header through closing `}`
- Try/catch: `try {` through `catch` and `finally` (if present)
- Single statements: All other lines

**Granularity**: Brace-matched chunks. Closing brace closes the block.

**Edge cases**:
- Template literals with `${}` inside strings are ignored
- Method calls (`.then()`, `.catch()`) on same line as function call stay in same chunk
- Nested functions are treated as single chunk (step to explore)

### Java

**Top-level chunks**:
- Class/interface definitions: `class/interface Name` through closing `}`
- Method definitions: `[modifier] returnType method()` through closing `}`
- If/else, for/while: Brace-matched chunks
- Single statements

**Granularity**: Brace-matched. Inner classes/methods treated as single chunk (step to explore).

**Edge cases**:
- Annotations (`@Override`) grouped with following method
- Generic types (`<T>`) don't affect chunking

### R, Go, Rust, C, C++

**Current support**: Generic brace-matching (falls back to language-generic chunker).

**Top-level chunks**: Statements only (one-per-line).

**To improve**: Add language-specific regex patterns for functions, loops, conditionals (same approach as Python/JavaScript/Java above).

### SQL, Bash, YAML

**Current support**: Generic statement-per-line chunking.

## How Chunking Works

1. **Language detection** (via language_detect.py)
2. **Language-specific parser**:
   - Scans lines for regex patterns (keywords, braces, indents)
   - Identifies chunk boundaries (start of function, end of block, etc.)
   - Returns list of Chunk objects
3. **Fallback**: If language unsupported, chunks code line-by-line as generic statements

## Chunk Object

```python
class Chunk(NamedTuple):
    start_line: int     # 1-indexed
    end_line: int       # 1-indexed, inclusive
    description: str    # "def foo(...)", "if ...", "for ...", etc.
    type: str          # "function", "loop", "statement", etc.
```

## Limitations

- Nested structures inside functions treated as single chunk (use "step" to zoom in)
- Multiline string literals can confuse line counting
- No actual AST parsing (regex-based only)
- JavaScript/TypeScript: Comments inside braces not handled specially
- Java: Anonymous inner classes treated as single chunk

## Adding Support for New Languages

1. Create `chunk_<language>()` function following same pattern
2. Identify distinctive keywords/syntax for your language
3. Implement brace/indent matching as needed
4. Add test cases to `test_ast_chunking.py`
5. Register in `chunk_code()` dispatch:
   ```python
   elif lang == "MyLang":
       return chunk_mylang(lines)
   ```

Example: Add Go support

```python
def chunk_go(lines: List[str]) -> List[Chunk]:
    """Go chunking via brace-matching."""
    chunks = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith("//"):
            i += 1
            continue
        
        # func keyword
        if re.match(r"func\s+\w+", line):
            start = i
            brace_depth = line.count("{") - line.count("}")
            i += 1
            while i < len(lines) and brace_depth > 0:
                brace_depth += lines[i].count("{") - lines[i].count("}")
                i += 1
            chunks.append(Chunk(start + 1, i, "func", "function"))
            continue
        
        # Single statement
        chunks.append(Chunk(i + 1, i + 1, line[:50], "statement"))
        i += 1
    
    return chunks
```

## Performance

- Linear in code length (single pass)
- No tree construction, no backtracking
- Fast enough for files up to ~10k lines
