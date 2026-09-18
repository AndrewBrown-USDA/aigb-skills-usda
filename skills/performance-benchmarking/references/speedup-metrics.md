# Speedup Metrics Interpretation Guide

## Speedup Ratio

**Definition**: `speedup = time_before / time_after`

If the optimized version takes 1 second and the old version took 8 seconds:
```
speedup = 8 / 1 = 8x
```

This means the optimized version is **8 times faster**.

## Interpreting Ratios

| Ratio | Meaning | Confidence | Action |
|-------|---------|------------|--------|
| 0.9-1.1 | Within noise margin | [FAIL] Low | Don't claim speedup |
| 1.2-1.5 | Measurable improvement | [WARN] Medium | Accept if consistent across runs |
| 1.5-3.0 | Significant speedup | [PASS] High | Highlight in release notes |
| 3.0-10.0 | Major performance win | [PASS] High | Strong evidence of improvement |
| 10.0+ | Breakthrough (likely algorithmic) | [PASS] Very High | Celebrate; investigate why |

## Noise vs. Real Improvement

**Single run**: High variance, unreliable  
**Multiple runs (>=3)**: Report mean +/- SD

Example:
- Old: [8.0, 8.1, 7.9] -> mean = 8.0 +/- 0.1 s
- New: [1.0, 1.05, 0.95] -> mean = 1.0 +/- 0.05 s
- Speedup: 8.0 / 1.0 = **8x** (very stable, low noise)

## Scaling Behavior

Plot `log(parameter)` vs `log(time)` on log-log scale:

- **Slope ~ 1 (45 deg)**: O(n) scaling
- **Slope ~ 0.5 (shallow)**: O(sqrtn) or better
- **Slope ~ 2 (steep)**: O(n^2) scaling
- **Flat line**: O(1) constant-time

**Algorithm change signature**:
- Before: O(n^2) slope = 2 (steep)
- After: O(1) slope = 0 (flat)
- Speedup grows with n (larger parameters see bigger wins)

## When to Trust

[PASS] **Trust this speedup**:
- Consistent across >=3 runs (tight error bars)
- Consistent across multiple parameter values
- Matches expected asymptotic change
- Reproduced on independent hardware

[FAIL] **Don't trust this speedup**:
- Based on single run
- Huge error bars (high variance)
- Only visible at one parameter value
- Unexplained deviation from expected scaling

## Speedup Interpretation Examples

### Example 1: Hash Map Optimization
```
n_lookup=10:     1.04x (no gain at small n)
n_lookup=100:    1.02x (hash map overhead visible)
n_lookup=1000:   2.67x (hash map wins)
n_lookup=10000: 20.69x (dramatic win; O(n^2)->O(1))
```
**Interpretation**: Algorithmic change (nested loop to hash lookup). Speedup increases with parameter (hallmark of O(n^2)->O(1) transformation).

### Example 2: Cache Optimization
```
n=1000:    1.15x
n=10000:   1.18x
n=100000:  1.22x
```
**Interpretation**: Constant-factor improvement (better cache locality or branch prediction). Speedup stable across scales (typical of O(1) constant factor).

### Example 3: Noisy Results
```
n=1000:   1.0x (within noise)
n=10000:  2.5x (good)
n=100000: 1.1x (oops, back to noise?)
```
**Interpretation**: Likely an outlier or system load variance. Need more runs to confirm. Don't claim speedup until noise is resolved.
