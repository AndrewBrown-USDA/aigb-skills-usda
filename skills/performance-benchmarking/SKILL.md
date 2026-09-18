---
name: performance-benchmarking
author: Andrew G. Brown (https://github.com/brownag)
license: MIT
description: Design and run reproducible benchmarks. Use when measuring performance scaling, comparing branches, or analyzing speedup metrics.
version: 1.0
---

# Performance Benchmarking

Design and execute reproducible benchmarks to measure scaling, compare implementations, and analyze speedup.

## Quick Start

Test a function's scaling with parameter n:

```bash
# Save this as bench.R
benchmark_test <- function(n) {
  # Setup test data
  test_data <- seq(1, n)
  
  # Warm-up (1 run, don't time)
  sum(test_data)
  
  # Timed runs (3 runs, report mean)
  times <- c()
  for (i in 1:3) {
    t <- system.time(sum(test_data))[3]
    times <- c(times, t)
  }
  
  mean(times)
}

# Run for scaling parameter
for (n in c(1000, 10000, 100000, 1000000)) {
  t <- benchmark_test(n)
  cat(sprintf("n=%d: %.4f s\n", n, t))
}
```

Run: `Rscript bench.R`

## Benchmark Anatomy

Every reproducible benchmark has these components:

### Warm-up Run
Run the function once before timing to stabilize JIT, caches, and memory allocation. Don't measure this run -- just let the system settle.

### Multiple Timed Runs
Execute the function >=3 times per configuration. Record all times, report mean and standard deviation. Single-run benchmarks are noise.

### Timeout Protection
Skip configurations that exceed 60 seconds per run. This prevents expensive branches (e.g., O(n^2) algorithms on master) from running excessively long tests.

```r
mean_time <- mean(times)
if (mean_time > 60) {
  cat(sprintf("TIMEOUT: skipping n=%d (%.1f s/run)\n", n, mean_time))
  next
}
```

### CSV Output
Save results to CSV for comparison across runs and branches:

```r
results <- data.frame(
  param = param_values,
  time_sec = timing_results
)
write.csv(results, "benchmark_results.csv", row.names = FALSE)
```

### Visualization
Generate plots for scaling analysis. Log-log plots reveal asymptotic behavior (O(n), O(n^2), etc.).

## Example 1: Hash Map Benchmarks

**Functions**: `classify()`, `subst()` -- value lookup and substitution  
**Parameter**: Lookup table size (n_lookup)  
**Expected scaling**: O(1) average with hash map, O(n^2) with nested loops

From archive `benchmark_hash.R` pattern:

```r
n_lookup_values <- c(10, 50, 100, 500, 1000, 5000, 10000)
results <- data.frame()

for (n_lookup in n_lookup_values) {
  # Generate test data
  r <- terra::rast(nrows=100, ncols=100, vals=sample(1:100, 10000, replace=TRUE))
  from_vals <- sample(1:100, n_lookup, replace=FALSE)
  to_vals <- seq(1000, 1000 + n_lookup - 1)
  
  # Warm-up
  terra::classify(r, cbind(from_vals, to_vals))
  
  # Timed runs
  times <- c()
  for (i in 1:3) {
    t <- system.time(terra::classify(r, cbind(from_vals, to_vals)))[3]
    if (t > 60) break  # Timeout check
    times <- c(times, t)
  }
  
  if (length(times) > 0) {
    results <- rbind(results, data.frame(
      n_lookup = n_lookup,
      mean_time = mean(times),
      sd_time = sd(times)
    ))
  }
}

# Plot log-log
png("scaling_plot.png", width=800, height=600)
plot(log(results$n_lookup), log(results$mean_time),
     main="Hash Map Scaling",
     xlab="log(n_lookup)", ylab="log(time_sec)",
     pch=19, cex=1.5)
dev.off()
```

**Result interpretation**: Flat slope = O(1), 45 deg slope = O(n), steep slope = O(n^2).

## Example 2: Other Function Benchmarks

**Functions**: catalyze, unique, freq, crosstab  
**Parameters**: Category count, raster size, cardinality (each function differs)  
**Timeout**: 60s per run

From archive `benchmark_other_functions.R` pattern:

```r
# Example: freq() scales with value cardinality
benchmark_freq <- function(n_unique) {
  r <- terra::rast(nrows=1000, ncols=1000,
                   vals=sample(1:n_unique, 1000000, replace=TRUE))
  
  # Warm-up
  terra::freq(r)
  
  # Timed runs
  times <- c()
  for (i in 1:3) {
    t <- system.time(terra::freq(r))[3]
    if (t > 60) break
    times <- c(times, t)
  }
  
  if (length(times) > 0) mean(times) else NA
}

cardinalities <- c(10, 100, 1000, 10000, 50000)
results <- data.frame(
  cardinality = cardinalities,
  time_sec = sapply(cardinalities, benchmark_freq)
)

# Combined faceted plot (ggplot2)
library(ggplot2)
ggplot(results, aes(x=cardinality, y=time_sec)) +
  geom_point(size=3) +
  geom_line() +
  scale_x_log10() + scale_y_log10() +
  theme_minimal() +
  ggtitle("freq() Scaling by Cardinality")
```

## Branch Comparison Workflow

Compare performance across git branches:

```r
# Pseudo-code: full workflow from archive run_all_benchmarks.R

# 1. Save current branch
current_branch <- system("git rev-parse --abbrev-ref HEAD", intern=TRUE)

# 2. Benchmark master
system("git checkout master")
system("R CMD INSTALL .")
results_master <- source("benchmark_hash.R")

# 3. Benchmark current branch
system(sprintf("git checkout %s", current_branch))
system("R CMD INSTALL .")
results_current <- source("benchmark_hash.R")

# 4. Calculate speedup ratios
speedup <- results_master$mean_time / results_current$mean_time

# 5. Report
cat("\nSPEEDUP ANALYSIS\n")
for (i in seq_along(speedup)) {
  cat(sprintf("n_lookup=%5d: %6.2f x faster\n",
              results_current$n_lookup[i], speedup[i]))
}
```

**Expected output**:
```
SPEEDUP ANALYSIS
n_lookup=   10: 1.04 x faster
n_lookup=   50: 1.02 x faster
n_lookup=  100: 1.02 x faster
n_lookup=  500: 2.07 x faster
n_lookup= 1000: 2.67 x faster
n_lookup= 5000: 8.33 x faster
n_lookup=10000:20.69 x faster
```

## Interpreting Results

### Log-Log Scaling
Plot parameter (x-axis, log scale) vs. time (y-axis, log scale):

- **45 deg slope** = O(n) scaling (linear growth)
- **Flatter than 45 deg** = Sublinear (better), e.g., O(log n)
- **Steeper than 45 deg** = Superlinear (worse), e.g., O(n^2)

### Speedup Ratios
Report `master_time / optimized_time`:

| Ratio | Meaning | Action |
|-------|---------|--------|
| 0.9-1.1 | Noise | Ignore |
| 1.2-2.0 | Measurable improvement | Accept |
| 2.0-10.0 | Significant win | Highlight |
| 10.0+ | Algorithmic breakthrough (e.g., O(n^2)->O(n)) | Celebrate |

### When to Trust
- **[OK] Reproducible**: Same result across multiple runs
- **[OK] Multiple runs**: Report mean +/- SD from >=3 runs
- **[OK] Consistent parameter sweep**: No single outliers
- **[FAIL] Single run**: Noise, cache effects, system load vary
- **[FAIL] No timeout**: Extremely long runs suggest wrong algorithm

## Troubleshooting

### Installation Fails Between Branches
- Ensure no uncommitted changes: `git status`
- Manually install: `R CMD INSTALL .` on each branch
- Check build log for compiler errors

### Out of Memory
- Reduce raster sizes (use 1000x1000 instead of 5000x5000)
- Reduce cardinality range (start at lower values)
- Run benchmarks individually, not all at once

### Plots Not Generated
- Install ggplot2: `install.packages("ggplot2")`
- Check that benchmark results were saved to CSV
- Verify PNG/PDF output path is writable

### Results Look Noisy
- Increase number of runs (try 5 instead of 3)
- Increase warm-up runs (let system stabilize longer)
- Run on dedicated machine (avoid background processes)
- Close other R sessions/large applications

## Advanced: Multi-Branch Comparison

When comparing three or more branches, use a matrix approach:

```r
branches <- c("master", "feature-1", "feature-2")
param_values <- c(100, 1000, 10000)
results <- data.frame()

for (branch in branches) {
  system(sprintf("git checkout %s", branch))
  system("R CMD INSTALL .")

  for (param in param_values) {
    time <- benchmark_one_config(param)
    results <- rbind(results, data.frame(
      branch = branch,
      param = param,
      time = time
    ))
  }
}

# Pivot to compare branches side-by-side
library(tidyr)
wide_results <- pivot_wider(results, names_from = branch, values_from = time)
print(wide_results)
```

## Best Practices

### Parameter Selection
Choose parameters that span realistic use cases:
- **Small**: Minimum viable input (sanity check)
- **Medium**: Typical production size (most important)
- **Large**: Stress test (catch O(n^2) issues)

Example for raster analysis: 100x100 (small), 1000x1000 (typical), 10000x10000 (large).

### Warm-up Considerations
- JIT compilation (if applicable) needs 1-2 runs to warm up
- Memory allocation patterns settle after first run
- Cache state changes with size (cold cache vs. warm)

Use separate warm-up runs per parameter size, not global warm-up.

### Error Bars Matter
Never report a single number. Always report mean +/- SD:

```r
cat(sprintf("Time: %.4f +/- %.4f sec (n=%d)\n",
            mean(times), sd(times), param))
```

### Version Control
Record which git commit you benchmarked:

```r
commit <- system("git rev-parse --short HEAD", intern=TRUE)
results$commit <- commit
write.csv(results, sprintf("bench_%s.csv", commit), row.names=FALSE)
```

### Reproducibility Checklist
- [ ] Document exact machine specs (CPU, RAM, OS)
- [ ] Record git commit hashes
- [ ] Save all parameter values and time measurements to CSV
- [ ] Include warm-up count and timeout settings in output
- [ ] Note any background processes during benchmark
- [ ] Specify R version and package versions

## Common Patterns from Production Benchmarks

### Pattern 1: Scaling Analysis
Used to verify algorithmic improvements (e.g., O(n^2) -> O(n)):

```r
# Measure at 10 parameter values
param_values <- 10^seq(1, 4, by=0.5)  # Logarithmic spacing
```

### Pattern 2: Regression Detection
Run nightly to catch performance degradation:

```r
baseline <- read.csv("baseline_times.csv")
current <- benchmark_all_configs()
regressions <- current$mean > baseline$mean * 1.1
if (any(regressions)) {
  warning("Performance regression detected!")
}
```

### Pattern 3: Optimization Validation
Before/after comparison for specific fixes:

```r
# Stash changes, benchmark master
system("git stash")
results_before <- run_benchmark()

# Apply changes
system("git stash pop")
results_after <- run_benchmark()

# Calculate speedup
speedup <- results_before / results_after
print(speedup)
```

## Pitfalls to Avoid

### Pitfall 1: Micro-optimization over Macro
Chasing 5% speedups in rarely-called code. Measure first, optimize where it matters.

### Pitfall 2: Ignoring System Load
Benchmarking on a busy machine. Results won't reproduce. Use a quiet machine.

### Pitfall 3: Single-Parameter Sweep
Testing only one parameter value. True scaling analysis requires multiple points.

### Pitfall 4: No Timeout
Letting slow algorithms run forever. Always cap benchmark runs at 60-120 seconds.

### Pitfall 5: Comparing Different Datasets
Changing data between branches invalidates comparison. Use identical inputs.

## Tools & Libraries

### Base R
- `system.time()` -- Measure elapsed time
- `Rprof()` -- Profile function calls (for bottleneck detection)

### R Packages
- `microbenchmark` -- Sub-millisecond precision
- `rbenchmark` -- High-level benchmark interface
- `ggplot2` -- Professional visualizations

### External Tools
- `perf` (Linux) -- CPU profiling
- `valgrind` (Linux) -- Memory profiling
- `Instruments` (macOS) -- System-wide profiling
