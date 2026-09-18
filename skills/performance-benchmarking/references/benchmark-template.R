# Performance Benchmark Template
# Copy this file and customize the marked sections

# ============================================================================
# CUSTOMIZE: Your function and test data generation
# ============================================================================

# Your function to benchmark
your_function <- function(data) {
  # CUSTOMIZE: Replace with your function call
  # Example: sum(data), sort(data), your_pkg::your_func(data)
  sum(data)
}

# Generate test data based on parameter
generate_test_data <- function(param_value) {
  # CUSTOMIZE: Generate test data appropriate for your function
  # This example generates a vector of size param_value
  seq(1, param_value)

  # For spatial data: terra::rast(nrows=param_value, ncols=param_value, vals=...)
  # For data frames: data.frame(x=1:param_value, y=rnorm(param_value))
}

# ============================================================================
# Benchmark function (do not modify)
# ============================================================================

benchmark_one_config <- function(param_value, n_runs=3, timeout_sec=60) {
  # Generate test data
  test_data <- generate_test_data(param_value)

  # Warm-up (1 run, don't time)
  your_function(test_data)

  # Timed runs
  times <- c()
  for (i in 1:n_runs) {
    t <- system.time(your_function(test_data))[3]
    times <- c(times, t)
  }

  # Check timeout
  mean_time <- mean(times)
  if (mean_time > timeout_sec) {
    return(NA)  # Skip this config
  }

  # Return stats
  list(
    mean = mean_time,
    sd = sd(times),
    median = median(times)
  )
}

# ============================================================================
# CUSTOMIZE: Parameter sweep range
# ============================================================================

param_values <- c(100, 1000, 10000, 100000)  # CUSTOMIZE: Your parameter values

# ============================================================================
# Run benchmark sweep
# ============================================================================

results <- data.frame()

for (param in param_values) {
  cat(sprintf("Testing param=%d... ", param))

  result <- benchmark_one_config(param)

  if (is.na(result$mean)) {
    cat("TIMEOUT (skipped)\n")
  } else {
    cat(sprintf("%.4f s (+/-%.4f s)\n", result$mean, result$sd))
    results <- rbind(results, data.frame(
      param = param,
      mean_time = result$mean,
      sd_time = result$sd,
      median_time = result$median
    ))
  }
}

# ============================================================================
# Save results
# ============================================================================

write.csv(results, "benchmark_results.csv", row.names=FALSE)
cat("\nResults saved to benchmark_results.csv\n")

# ============================================================================
# Plot results (optional)
# ============================================================================

png("benchmark_plot.png", width=800, height=600)
plot(log(results$param), log(results$mean_time),
     main="Performance Scaling",
     xlab="log(parameter)", ylab="log(time_sec)",
     pch=19, cex=1.5,
     ylim=range(c(log(results$mean_time - results$sd_time),
                   log(results$mean_time + results$sd_time))))
# Add error bars
segments(log(results$param), log(results$mean_time - results$sd_time),
         log(results$param), log(results$mean_time + results$sd_time))
dev.off()

cat("Plot saved to benchmark_plot.png\n")
