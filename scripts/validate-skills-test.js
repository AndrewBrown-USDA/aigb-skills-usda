#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { runBehavioralChecks, selectPython } = require('./validate-skills');
const { parseArgs, resolveSourceRoot, updateSkillMetadata } = require('./sync-skills');
const { scanCuratedSkills } = require('./mine-history');
const {
  deriveSourceUrl,
  normalizeMetadata,
  validateMetadata
} = require('./skill-metadata');

const validator = path.join(__dirname, 'validate-skills.js');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aigb-skills-validator-'));

try {
  assert.equal(parseArgs([]).allowNetwork, false);
  assert.equal(parseArgs(['--no-clone']).allowNetwork, false);
  assert.equal(parseArgs(['--allow-network']).allowNetwork, true);
  assert.equal(deriveSourceUrl('aigb-skills'), 'https://github.com/AndrewBrown-USDA/aigb-skills.git');
  assert.equal(deriveSourceUrl('unknown-repo'), null);
  assert.deepEqual(normalizeMetadata({
    source_repo: 'aigb-skills',
    source_path: 'skills/example/SKILL.md',
    source_ref: 'legacy-ref',
    upstream: 'legacy-repo',
    upstream_ref: 'preferred-ref',
    upstream_repo: 'preferred-repo',
    upstream_path: 'skills/example/SKILL.md',
    author: 'Example Author'
  }), {
    source_repo: 'aigb-skills',
    source_path: 'skills/example/SKILL.md',
    source_url: 'https://github.com/AndrewBrown-USDA/aigb-skills.git',
    upstream_repo: 'preferred-repo',
    upstream_ref: 'preferred-ref',
    upstream_path: 'skills/example/SKILL.md',
    author: 'Example Author'
  });
  assert.deepEqual(normalizeMetadata({
    source_repo: 'unknown-repo',
    source_path: 'skills/example/SKILL.md',
    source_ref: 'legacy-ref',
    upstream: 'legacy-repo'
  }), {
    source_repo: 'unknown-repo',
    source_path: 'skills/example/SKILL.md',
    source_url: null,
    upstream_repo: 'legacy-repo',
    upstream_ref: 'legacy-ref'
  });
  assert.equal(validateMetadata({ source_repo: 'repo' }).valid, false);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    source_url: 'not-a-url'
  }).valid, false);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md'
  }).valid, true);
  assert.throws(
    () => resolveSourceRoot({
      source_repo: 'https://github.com/example/pinned-source.git',
      source_url: 'https://github.com/example/pinned-source.git'
    }, { clone: false }),
    (error) => error.message.includes('pinned-source') && !error.message.includes('https:\\github')
  );

  const lockfile = path.join(tempRoot, 'skills.lock.json');
  const skillsDir = path.join(tempRoot, 'skills');
  const report = path.join(tempRoot, 'report.json');
  const skillDir = path.join(skillsDir, 'example-alias');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example-alias\ndescription: Example skill\nmetadata:\n  source_repo: example-repo\n  source_path: skills/example/SKILL.md\n  source_ref: v1.0.0\n  upstream: https://example.test/skills\n  upstream_name: example\n  version: 1.0\n---\n\n# Example\n',
    'utf8'
  );
  fs.writeFileSync(
    lockfile,
    JSON.stringify({
      skills: [{
        name: 'example-alias',
        source_repo: 'example-repo',
        source_path: 'skills/example/SKILL.md',
        source_ref: 'v1.0.0',
        upstream: 'https://example.test/skills',
        upstream_name: 'example',
        version: { status: 'resolved', value: '1.0' }
      }]
    }),
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

  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example-alias\ndescription: Example skill\nsource_repo: example-repo\nmetadata:\n  source_repo: example-repo\n---\n\n# Example\n',
    'utf8'
  );
  const topLevelCustom = spawnSync(process.execPath, [
    validator, '--lockfile', lockfile, '--skills-dir', skillsDir
  ], { encoding: 'utf8' });
  assert.equal(topLevelCustom.status, 1);
  assert.match(topLevelCustom.stdout + topLevelCustom.stderr, /Custom top-level metadata keys/i);

  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example-alias\ndescription: Example skill\nmetadata:\n  source_repo: wrong-repo\n---\n\n# Example\n',
    'utf8'
  );
  const mismatchedMetadata = spawnSync(process.execPath, [
    validator, '--lockfile', lockfile, '--skills-dir', skillsDir
  ], { encoding: 'utf8' });
  assert.equal(mismatchedMetadata.status, 1);
  assert.match(mismatchedMetadata.stdout + mismatchedMetadata.stderr, /does not match catalog entry/i);

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

  const probes = [];
  const fakeRunner = (command) => {
    probes.push(command);
    return { status: command === 'python' ? 0 : 1 };
  };
  assert.equal(selectPython({ env: {}, platform: 'win32', runner: fakeRunner }), 'python');
  assert.deepEqual(probes, ['python']);
  assert.equal(selectPython({ env: { PYTHON: 'custom-python' }, platform: 'win32', runner: fakeRunner }), 'custom-python');
  assert.equal(selectPython({
    env: {},
    platform: 'win32',
    runner: (command) => ({ status: command === 'python3' ? 0 : 1 })
  }), 'python3');
  assert.equal(selectPython({
    env: {},
    platform: 'win32',
    runner: () => ({ status: 1, error: new Error('not found') })
  }), 'python');

  const metadataRoot = path.join(tempRoot, 'metadata-round-trip');
  const metadataSkill = path.join(metadataRoot, 'skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(metadataSkill), { recursive: true });
  fs.writeFileSync(metadataSkill, [
    '---',
    'name: old-name',
    'metadata:',
    '    source_ref: stale-ref',
    '    upstream: stale-repo',
    '    upstream_ref: stale-upstream-ref',
    '    upstream_repo: stale-upstream-repo',
    '    version: stale-version',
    '---',
    '# Example'
  ].join('\n'), 'utf8');
  updateSkillMetadata(metadataSkill, {
    name: 'normalized-name',
    source_repo: 'aigb-skills',
    source_path: 'skills/example/SKILL.md',
    source_url: 'https://github.com/AndrewBrown-USDA/aigb-skills.git',
    source_ref: 'normalized-ref',
    upstream_ref: 'normalized-upstream-ref',
    upstream_repo: 'normalized-upstream-repo',
    version: '1.0.0'
  });
  const normalizedContent = fs.readFileSync(metadataSkill, 'utf8');
  assert.match(normalizedContent, /name: normalized-name/);
  assert.match(normalizedContent, /source_ref: normalized-ref/);
  assert.match(normalizedContent, /upstream_ref: normalized-upstream-ref/);
  assert.match(normalizedContent, /upstream_repo: normalized-upstream-repo/);
  assert.doesNotMatch(normalizedContent, /stale-(ref|repo|version)/);

  const curatedRoot = path.join(tempRoot, 'curated-round-trip');
  const curatedSkill = path.join(curatedRoot, 'new-keys', 'SKILL.md');
  const legacySkill = path.join(curatedRoot, 'legacy-keys', 'SKILL.md');
  fs.mkdirSync(path.dirname(curatedSkill), { recursive: true });
  fs.mkdirSync(path.dirname(legacySkill), { recursive: true });
  const frontmatter = (name, metadata) => [
    '---',
    `name: ${name}`,
    'metadata:',
    ...Object.entries(metadata).map(([key, value]) => `  ${key}: ${value}`),
    '---',
    '# Example'
  ].join('\n');
  fs.writeFileSync(curatedSkill, frontmatter('new-keys', {
    source_repo: 'aigb-skills',
    source_path: 'skills/new-keys/SKILL.md',
    upstream_ref: 'new-ref',
    upstream_repo: 'new-repo',
    source_url: 'https://provenance.example.test/should-not-be-used'
  }), 'utf8');
  fs.writeFileSync(legacySkill, frontmatter('legacy-keys', {
    source_repo: 'aigb-skills',
    source_path: 'skills/legacy-keys/SKILL.md',
    source_ref: 'legacy-ref',
    upstream: 'legacy-repo'
  }), 'utf8');
  const mined = scanCuratedSkills(curatedRoot);
  const minedNew = mined.find((entry) => entry.name === 'new-keys');
  const minedLegacy = mined.find((entry) => entry.name === 'legacy-keys');
  assert.equal(minedNew.upstream_ref, 'new-ref');
  assert.equal(minedNew.upstream_repo, 'new-repo');
  assert.equal(minedNew.upstream_path, undefined);
  assert.equal(minedNew.source_url, 'https://github.com/AndrewBrown-USDA/aigb-skills.git');
  assert.equal(minedLegacy.upstream_ref, 'legacy-ref');
  assert.equal(minedLegacy.upstream_repo, 'legacy-repo');
  console.log('Validator tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
