#!/usr/bin/env python3
"""Test language detection."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from language_detect import detect_language


def test_python():
    code = """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
"""
    lang, conf = detect_language(code)
    assert lang == "Python", f"Expected Python, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] Python detection")


def test_javascript():
    code = """
const greeting = (name) => {
    console.log(`Hello, ${name}!`);
};
"""
    lang, conf = detect_language(code)
    assert lang == "JavaScript", f"Expected JavaScript, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] JavaScript detection")


def test_typescript():
    code = """
interface User {
    name: string;
    age: number;
}

function greet(user: User): string {
    return `Hello, ${user.name}`;
}
"""
    lang, conf = detect_language(code)
    assert lang in ["TypeScript", "JavaScript"], f"Expected TypeScript/JavaScript, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] TypeScript detection")


def test_r():
    code = """
library(ggplot2)
data <- data.frame(x = 1:10, y = 1:10 * 2)
plot <- ggplot(data, aes(x = x, y = y)) + geom_point()
"""
    lang, conf = detect_language(code)
    assert lang == "R", f"Expected R, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] R detection")


def test_java():
    code = """
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
"""
    lang, conf = detect_language(code)
    assert lang == "Java", f"Expected Java, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] Java detection")


def test_c():
    code = """
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
"""
    lang, conf = detect_language(code)
    assert lang == "C", f"Expected C, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] C detection")


def test_cpp():
    code = """
#include <iostream>
#include <vector>

class Vector {
public:
    void add(int val) {
        data.push_back(val);
    }
private:
    std::vector<int> data;
};
"""
    lang, conf = detect_language(code)
    assert lang == "C++", f"Expected C++, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] C++ detection")


def test_go():
    code = """
package main

import "fmt"

func main() {
    defer fmt.Println("done")
    ch := make(chan int)
}
"""
    lang, conf = detect_language(code)
    assert lang == "Go", f"Expected Go, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] Go detection")


def test_rust():
    code = """
fn main() {
    let mut x = 5;
    println!("x = {}", x);
    let result = std::fs::read_to_string("file.txt").unwrap();
}
"""
    lang, conf = detect_language(code)
    assert lang == "Rust", f"Expected Rust, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] Rust detection")


def test_sql():
    code = """
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id;
"""
    lang, conf = detect_language(code)
    assert lang == "SQL", f"Expected SQL, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] SQL detection")


def test_bash():
    code = """
#!/bin/bash
for file in *.txt; do
    echo "Processing $file"
    if [ -f "$file" ]; then
        cat "$file"
    fi
done
"""
    lang, conf = detect_language(code)
    assert lang == "Bash", f"Expected Bash, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] Bash detection")


def test_yaml():
    code = """
---
name: Deploy
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
"""
    lang, conf = detect_language(code)
    assert lang == "YAML", f"Expected YAML, got {lang}"
    assert conf >= 0.25, f"Confidence too low: {conf}"
    print("[OK] YAML detection")


def test_empty():
    lang, conf = detect_language("")
    assert lang == "Unknown"
    assert conf == 0.0
    print("[OK] Empty code handling")


def test_ambiguous():
    code = "x = 5"
    lang, conf = detect_language(code)
    # Should return something, even if ambiguous
    assert lang != "", f"Expected language guess, got empty"
    print(f"[OK] Ambiguous code returns: {lang} (confidence: {conf:.2f})")


if __name__ == "__main__":
    test_python()
    test_javascript()
    test_typescript()
    test_r()
    test_java()
    test_c()
    test_cpp()
    test_go()
    test_rust()
    test_sql()
    test_bash()
    test_yaml()
    test_empty()
    test_ambiguous()
    print("\n[PASS] All language detection tests passed")
