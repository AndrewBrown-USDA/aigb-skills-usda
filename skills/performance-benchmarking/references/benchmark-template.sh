#!/bin/bash
# Benchmark wrapper script
# Usage: ./benchmark-template.sh

set -e

SCRIPT="benchmark_template.R"
OUTPUT_DIR="benchmark_results"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run benchmark
echo "Starting benchmark..."
Rscript "$SCRIPT"

# Move results
mv benchmark_results.csv "$OUTPUT_DIR/" 2>/dev/null || true
mv benchmark_plot.png "$OUTPUT_DIR/" 2>/dev/null || true

echo "Benchmark complete. Results in $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR/"
