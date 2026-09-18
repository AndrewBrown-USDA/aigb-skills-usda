# Language Detection

Detects programming language from code snippet via pattern matching.

## Usage

```bash
python3 language_detect.py [file]
```

Input via file or stdin. Returns language name and confidence (0.0-1.0).

```bash
cat myfile.py | python3 language_detect.py
# Output: Python (confidence: 0.56)
```

## How It Works

Pattern-based detection. For each language, scans for syntax markers (keywords, operators, delimiters). Scores by match count / total patterns. Returns language with highest score.

## Supported Languages

- Python, JavaScript, TypeScript
- R, Java, C, C++, Go, Rust
- SQL, Bash, YAML

## Patterns Per Language

Patterns are regex matches (case-insensitive, multiline mode).

**Python**: `def`, `class`, `import`, `from X import`, `:` (line end), `if/elif/else`, `for X in`, `return`, `@` (decorator), `try/except`

**JavaScript**: `function`, arrow `=>`, `const/let/var`, `import/require`, `console.`, `async`, `await`, template literals, `.then()`, `.catch()`

**TypeScript**: Type annotations (`: Type`), `interface`, `type`, generics `<Type>`, plus all JS patterns

**R**: `<-`, `function()`, `library()`, `data.frame()`, `install.packages()`

**Java**: `public class`, `public static void`, `private`, `import java.`, `throws`, `new X()`

**C**: `#include`, `void func()`, `int main()`, `printf()`, `scanf()`, `malloc()`

**C++**: `#include <...>`, `std::`, `template`, `class { public:`, `new X()`

**Go**: `package`, `func`, `import ()`, `:=` (short assign), `err != nil`, `defer`

**Rust**: `fn`, `let`, `mut`, `impl`, `println!`, `.unwrap()`

**SQL**: `SELECT`, `FROM`, `WHERE`, `JOIN`, `INSERT INTO`, `UPDATE`, `DELETE FROM`

**Bash**: `#!/bin/bash`, `$var`, `echo`, `if [ ]`, `for X in`, `while [ ]`

**YAML**: `---` (doc start), `key:`, list items `- `, quoted values

## Confidence Scoring

Confidence = (patterns matched) / (total patterns for language)

Returned language is the one with highest confidence. If no patterns match, returns `("Unknown", 0.0)`.

**Limitations**

- Very short code (1-2 lines) may not match enough patterns
- Mixed-language files (e.g., HTML + JavaScript) will match multiple languages; highest score wins
- Ambiguous code (simple assignments like `x = 5`) may return low confidence
- Pattern set is heuristic-based, not a full parser

## Extending

To add a new language:

1. Add entry to `LANGUAGE_PATTERNS` dict
2. List 8-12 distinctive regex patterns
3. Add test case to `test_language_detect.py`
4. Run tests: `python3 test_language_detect.py`

Example:

```python
"Lua": [
    r"\bfunction\s+\w+",
    r"\blocal\s+\w+",
    r"\bend\s*$",
    r"--\s*",  # comment
    r"require\s*\(",
]
```

## Edge Cases

- Empty code: Returns `("Unknown", 0.0)`
- Code with only comments: May not match any patterns
- Shebang-only bash (just `#!/bin/bash`): Detected as Bash
- Mixed code: Matches language with most patterns (first wins on tie)
