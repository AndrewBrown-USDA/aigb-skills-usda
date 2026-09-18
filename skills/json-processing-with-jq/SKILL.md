---
name: json-processing-with-jq
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Processes JSON on the command line with jq. Use when parsing, filtering, or validating JSON from files or APIs.
version: 1.0
---

# JSON Processing with jq

## Installation

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Verify
jq --version
```

## Basic Usage

### Pretty Print JSON
```bash
curl -s http://api.example.com/data | jq '.'

# Or from file
jq '.' data.json
```

### Extract Single Field
```bash
# Get "name" field from JSON object
echo '{"name": "Alice", "age": 30}' | jq '.name'
# Output: "Alice"

# Get field from nested object
echo '{"user": {"name": "Alice"}}' | jq '.user.name'
# Output: "Alice"
```

### Extract Array Elements
```bash
# Get all items in array
echo '[1, 2, 3]' | jq '.[]'
# Output:
# 1
# 2
# 3

# Get specific index
echo '[1, 2, 3]' | jq '.[0]'
# Output: 1
```

## LLM API Response Parsing

### Extract Tool Calls
```bash
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{...}' | jq '.choices[0].message.tool_calls'
```

### Extract Tool Arguments as JSON Object
```bash
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.choices[0].message.tool_calls[0].function.arguments | fromjson'
```

The `-r` flag outputs raw strings (without quotes).
The `fromjson` converts JSON string to object.

### Extract Multiple Fields
```bash
# Get all tool call names
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{...}' | jq '.choices[0].message.tool_calls[].function.name'
```

### Validate Tool Arguments are Valid JSON
```bash
# Test if arguments parse as JSON
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -e '.choices[0].message.tool_calls[0].function.arguments | fromjson' > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

## Configuration File Parsing

### Extract Configuration Value
```bash
# From .continue/config.json
jq '.models[0].temperature' .continue/config.json
# Output: 0.5

# Get all model names
jq '.models[].title' .continue/config.json
```

### Validate Configuration Structure
```bash
# Check if required fields exist
jq 'has("models") and has("tools")' .continue/config.json
# Output: true
```

### Merge Configuration Objects
```bash
# Combine two config files
jq -s '.[0] * .[1]' config1.json config2.json
```

## Common jq Patterns

### Filter Objects
```bash
# Select objects where condition is true
echo '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]' \
  | jq '.[] | select(.age > 26)'
# Output:
# {
#   "name": "Alice",
#   "age": 30
# }

# Select by string match
jq '.[] | select(.name == "Alice")' data.json
```

### Transform Objects
```bash
# Create new object from existing fields
echo '{"first": "Alice", "last": "Smith"}' \
  | jq '{name: (.first + " " + .last)}'
# Output:
# {
#   "name": "Alice Smith"
# }

# Rename field
jq '.name as $n | {title: $n}' data.json
```

### Map/Transform Arrays
```bash
# Apply operation to all array elements
echo '[1, 2, 3]' | jq 'map(. * 2)'
# Output: [2, 4, 6]

# Filter and transform
echo '[1, 2, 3, 4, 5]' | jq 'map(select(. > 2))'
# Output: [3, 4, 5]

# Extract field from each object in array
echo '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]' \
  | jq 'map(.name)'
# Output: ["Alice", "Bob"]
```

### Count Objects
```bash
# Count array elements
echo '[1, 2, 3]' | jq 'length'
# Output: 3

# Count objects matching condition
echo '[{"age": 30}, {"age": 25}, {"age": 35}]' \
  | jq '[.[] | select(.age > 26)] | length'
# Output: 2
```

### Group and Aggregate
```bash
# Group by field
jq 'group_by(.category) | map({category: .[0].category, count: length})' data.json

# Sum values
echo '[{"amount": 10}, {"amount": 20}, {"amount": 30}]' \
  | jq '[.[] | .amount] | add'
# Output: 60
```

## Advanced Patterns

### Recursive Descent
```bash
# Find all values of a key, anywhere in nested structure
jq '.. | .name? | select(. != null)' nested_data.json
```

### Conditional Logic
```bash
# if-then-else
jq 'if .age > 30 then "Adult" else "Young" end' data.json

# Multiple conditions
jq 'if .status == "active" and .verified then "Verified" else "Unverified" end' data.json
```

### Array/Object Construction
```bash
# Build array from objects
jq '[.id, .name, .email]' data.json

# Build object from arrays
jq '{id: .[0], name: .[1], email: .[2]}' <<< '["1", "Alice", "alice@example.com"]'
```

### Error Handling
```bash
# Use default if field doesn't exist
jq '.optional_field // "default_value"' data.json

# Try operation, catch errors
jq '.[] | try .nested.field catch "not found"' data.json
```

## Useful Command-Line Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `-r` | Raw output (no quotes on strings) | `jq -r '.name'` |
| `-s` | Read entire input as array | `jq -s '.'` file.json |
| `-c` | Compact output (no pretty-print) | `jq -c '.'` file.json |
| `-e` | Exit with error if result is false/null | `jq -e '.found'` file.json |
| `-f` | Read filter from file | `jq -f filter.jq` file.json |
| `--arg` | Pass string variable | `jq --arg name "Alice" '.[$name]'` |
| `--argjson` | Pass JSON variable | `jq --argjson obj '{}' '.obj'` |

## Python Integration

### Parse jq Results in Python

```python
import subprocess
import json

# Run jq and parse result
result = subprocess.run(
    ['jq', '.models[0].temperature', '.continue/config.json'],
    capture_output=True,
    text=True
)

temperature = float(result.stdout.strip())
print(f"Temperature: {temperature}")
```

### Validate JSON in Python

```python
def validate_json(text):
    """Check if text is valid JSON"""
    try:
        json.loads(text)
        return True
    except json.JSONDecodeError:
        return False

# Alternative: use jq
result = subprocess.run(
    ['jq', '-e', '.'],  # -e exits with error if not valid JSON
    input=text,
    text=True,
    capture_output=True
)
return result.returncode == 0
```

### Transform JSON with jq in Python

```python
import subprocess

def jq_transform(data, filter_str):
    """Apply jq filter to data"""
    result = subprocess.run(
        ['jq', filter_str],
        input=json.dumps(data),
        text=True,
        capture_output=True
    )

    if result.returncode != 0:
        raise ValueError(f"jq error: {result.stderr}")

    return json.loads(result.stdout)

# Usage
data = {"models": [{"temperature": 0.5}, {"temperature": 0.7}]}
temps = jq_transform(data, '.models[].temperature')
# Result: [0.5, 0.7]
```

## Performance Tips

### Large Files
For files > 100MB, use streaming:
```bash
jq --stream '.' large_file.json | jq -s 'fromstream'
```

### Batch Processing
```bash
# Process multiple files efficiently
for file in *.json; do
  jq '.processed = true' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
done
```

### Complex Filters
For complex operations, save filter to file:
```bash
# complex_filter.jq
.models[]
| select(.temperature > 0.5)
| {name: .title, temp: .temperature}
```

Usage:
```bash
jq -f complex_filter.jq config.json
```

## Common Use Cases in Development

### API Testing
```bash
# Test if API returns expected structure
curl -s http://api.example.com/data | jq 'has("data") and has("status")'

# Extract specific fields for logging
curl -s http://api.example.com/data | jq -c '{status: .status, count: (.data | length)}'
```

### Configuration Validation
```bash
# Check all required fields present
jq 'if has("models") and has("tools") then "Valid" else "Invalid" end' config.json

# List all configurations
jq '.models[] | "\(.title): temperature=\(.temperature)"' config.json
```

### Data Transformation for Import
```bash
# Convert CSV-like format to JSON
jq -R 'split(",") | {id: .[0], name: .[1], email: .[2]}' data.csv | jq -s '.'
```

### Debugging
```bash
# Pretty print with indentation for readability
jq '.' data.json

# Show structure without data
jq 'keys' data.json

# Type information
jq 'type' data.json
```
