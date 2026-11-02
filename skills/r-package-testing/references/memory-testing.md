# Native Memory Testing Reference (`ASAN`, `UBSAN`, `Valgrind`, & C++ Patterns)

Use this reference when an R package contains compiled C, C++, or Fortran code in `src/` (`Rcpp`, `cpp11`, or R C API).

## 1. Baseline Compilation Check

Verify clean compilation and address `-Wall -pedantic` compiler warnings before running sanitizers:

```bash
R CMD INSTALL --no-clean-on-error . 2>&1 | tee build.log
```

## 2. AddressSanitizer (ASAN) & UndefinedBehaviorSanitizer (UBSAN)

ASAN detects out-of-bounds heap/stack/global accesses, use-after-free, and double-free (~2-3x slowdown). UBSAN detects signed integer overflow, invalid NaN-to-int casts, and null pointer dereferences.

### Compile & Run with Clang or GCC

```bash
export CC=clang
export CXX=clang++
export CFLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer -O1 -g"
export CXXFLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer -O1 -g"
export LDFLAGS="-fsanitize=address,undefined"
export ASAN_OPTIONS="halt_on_error=1:detect_leaks=0"
export UBSAN_OPTIONS="print_stacktrace=1:halt_on_error=1"

R CMD INSTALL .

# Run testthat or tinytest suite
Rscript -e "devtools::test()"
# or: Rscript -e "tinytest::test_package('<pkg>')"
```

Use `-O1` (rather than `-O0`) to catch optimization-sensitive undefined behavior while preserving readable stack traces. For containerized sanitizer builds, see the **`docker-containerized-testing`** skill.

## 3. Valgrind (`memcheck`)

Valgrind is slower (~10-20x) but catches uninitialized memory reads and definite leaks without recompiling R itself.

### Production Valgrind Command

```bash
valgrind \
  --tool=memcheck \
  --leak-check=full \
  --show-leak-kinds=all \
  --track-origins=yes \
  --error-exitcode=1 \
  --log-file=valgrind_output.txt \
  Rscript -e "library(<pkg>); tinytest::test_package('<pkg>')"

grep -A 5 "ERROR SUMMARY" valgrind_output.txt
```

- `ERROR SUMMARY: 0 errors from 0 contexts` -> Clean.
- `Invalid read of size ...` / `definitely lost:` -> Inspect the C++ file/line stack trace in `valgrind_output.txt`.

## 4. C++ Memory Safety Patterns in R Packages

### Pattern 1: UBSAN Type Cast Failures (`NaN` to `int`)
- **Problem**: Casting `double` `NaN` or out-of-range values to signed `int` causes undefined behavior under UBSAN (`nan is outside the range of representable values of type 'int'`, e.g., `terra` issue #2054 in `lookup_apply()`).
- **Fix**: Check `std::isnan(v)` before casting, and use `size_t` for array indices and LUT sizes:
  ```cpp
  // Unsafe: UBSAN error if from_vals[0] is NaN
  int min_v = (int)from_vals[0];

  // Safe: check NaN and use size_t for index math
  if (!std::isnan(from_vals[0]) && from_vals[0] >= 0) {
      size_t min_v = static_cast<size_t>(from_vals[0]);
  }
  ```

### Pattern 2: Buffer Overflow & Vector Recycling (`recycle()`)
- **Problem**: Iterating over `from_vals.size()` while indexing directly into `to_vals[j]` causes a heap-buffer-overflow (`Invalid read of size 8` in Valgrind) when `to_vals.size() < from_vals.size()` (e.g., `subst(r, 2:10, NA)`).
- **Fix**: Recycle the shorter vector to match the longer vector before entering the indexing loop:
  ```cpp
  template<typename T>
  void recycle(std::vector<T>& shorter, const std::vector<T>& longer) {
      if (shorter.empty()) return;
      size_t orig = shorter.size();
      shorter.reserve(longer.size());
      for (size_t i = orig; i < longer.size(); ++i) {
          shorter.push_back(shorter[i % orig]);
      }
  }
  ```

### Pattern 3: `int` vs. `size_t` Index Checklist
| Aspect | `int` | `size_t` |
|---|---|---|
| **Range (64-bit)** | `-2^31` to `2^31 - 1` | `0` to `2^64 - 1` |
| **Container `.size()` match** | Mismatch (signed/unsigned warning) | Exact match for `std::vector::size()` |
| **Large R vectors (`R_xlen_t`)** | Overflows at > 2 billion elements | Safe for 64-bit indexing |
| **Recommendation** | Domain values that can be negative | All loop counters, array indices, and LUT offsets |
