#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { runBehavioralChecks } = require('./validate-skills');

const validator = path.join(__dirname, 'validate-skills.js');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aigb-skills-validator-'));

try {
  const lockfile = path.join(tempRoot, 'skills.lock.json');
  const skillsDir = path.join(tempRoot, 'skills');
  const report = path.join(tempRoot, 'report.json');
  const skillDir = path.join(skillsDir, 'example');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example\ndescription: Example skill\n---\n\n# Example\n',
    'utf8'
  );
  fs.writeFileSync(
    lockfile,
    JSON.stringify({ skills: [{ name: 'example' }] }),
    'utf8'
  );

  const passing = spawnSync(process.execPath, [
    validator,
    '--lockfile',
    lockfile,
    '--skills-dir',
    skillsDir,
    '--report',
    report
  ], { encoding: 'utf8' });
  assert.equal(passing.status, 0, passing.stderr);
  const passingReport = JSON.parse(fs.readFileSync(report, 'utf8'));
  assert.ok(passingReport.checks.some((check) => check.status === 'passed'));

  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# malformed\n', 'utf8');
  const failing = spawnSync(process.execPath, [
    validator,
    '--lockfile',
    lockfile,
    '--skills-dir',
    skillsDir,
    '--report',
    report
  ], { encoding: 'utf8' });
  assert.equal(failing.status, 1);
  const failingReport = JSON.parse(fs.readFileSync(report, 'utf8'));
  assert.ok(failingReport.checks.some((check) => check.status === 'failed'));

  const behaviorRoot = path.join(tempRoot, 'behavior-root');
  const behaviorScriptDir = path.join(behaviorRoot, 'skills', 'rubber-ducking', 'scripts');
  fs.mkdirSync(behaviorScriptDir, { recursive: true });
  for (const name of ['test_ast_chunking.py', 'test_language_detect.py']) {
    fs.writeFileSync(path.join(behaviorScriptDir, name), 'raise SystemExit(1)\n', 'utf8');
  }
  const behaviorResults = [];
  runBehavioralChecks(skillsDir, behaviorResults, behaviorRoot);
  assert.equal(behaviorResults.length, 2);
  assert.ok(behaviorResults.every((check) => check.status === 'failed'));
  console.log('Validator tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
