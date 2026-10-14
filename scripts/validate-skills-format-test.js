'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  main,
  parseFrontmatter,
  selectPython
} = require('./validate-skills');

const REPO_ROOT = path.resolve(__dirname, '..');

function writeFixture(root, metadata, frontmatterMetadata = metadata) {
  const skillsDir = path.join(root, 'skills');
  const skillDir = path.join(skillsDir, 'fixture');
  fs.mkdirSync(skillDir, { recursive: true });
  const metadataLines = Object.entries(frontmatterMetadata)
    .filter(([key]) => ['author', 'authors', 'source_repo', 'source_path', 'source_url', 'upstream_path'].includes(key))
    .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`);
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
    '---',
    'name: fixture',
    'description: Fixture skill',
    'metadata:',
    ...metadataLines,
    '---',
    '',
    '# Fixture',
    ''
  ].join('\n'));
  const lockfile = path.join(root, 'skills.lock.json');
  fs.writeFileSync(lockfile, `${JSON.stringify({ skills: [metadata] }, null, 2)}\n`);
  return { lockfile, skillsDir };
}

function runFixture(metadata, frontmatterMetadata = metadata) {
  fs.mkdirSync(path.join(REPO_ROOT, '.scratch'), { recursive: true });
  const root = fs.mkdtempSync(path.join(REPO_ROOT, '.scratch', 'format-test-'));
  const fixture = writeFixture(root, metadata, frontmatterMetadata);
  const report = path.join(root, 'report.json');
  const exitCode = main([
    '--lockfile', fixture.lockfile,
    '--skills-dir', fixture.skillsDir,
    '--report', report
  ]);
  return { root, exitCode, report: JSON.parse(fs.readFileSync(report, 'utf8')) };
}

const parsed = parseFrontmatter([
  '---',
  'name: fixture',
  'description: "Levels: lite"',
  'metadata:',
  '  author: Example Author',
  '  source_url: https://example.test/source',
  '---',
  '',
  '# Fixture'
].join('\n'));
assert.equal(parsed.fields.description, 'Levels: lite');
assert.equal(parsed.metadata.source_url, 'https://example.test/source');

const probes = [];
assert.equal(selectPython({
  env: {},
  platform: 'win32',
  runner: (command) => {
    probes.push(command);
    return { status: command === 'py' ? 0 : 1 };
  }
}), 'py');
assert.deepEqual(probes, ['python', 'python3', 'py']);

const validMetadata = {
  name: 'fixture',
  author: 'Example Author',
  source_repo: 'example-repo',
  source_path: 'skills/fixture/SKILL.md',
  source_url: 'https://example.test/source',
  upstream_path: 'skills/fixture/SKILL.md'
};
const valid = runFixture(validMetadata);
assert.equal(valid.exitCode, 0);
assert.equal(valid.report.checks.some((check) => check.status === 'failed'), false);
fs.rmSync(valid.root, { recursive: true, force: true });

const badAuthor = runFixture(validMetadata, { ...validMetadata, author: 'Frontmatter Author' });
const authorMismatch = badAuthor.report.checks.find((check) => check.details.includes('metadata.author'));
assert.equal(badAuthor.exitCode, 1);
assert.ok(authorMismatch);
fs.rmSync(badAuthor.root, { recursive: true, force: true });

const badUrl = runFixture(validMetadata, { ...validMetadata, source_url: 'not-a-url' });
const urlMismatch = badUrl.report.checks.find((check) => check.details.includes('metadata.source_url'));
assert.equal(badUrl.exitCode, 1);
assert.ok(urlMismatch);
fs.rmSync(badUrl.root, { recursive: true, force: true });

for (const field of ['source_url', 'author', 'upstream_path']) {
  const missingMetadata = { ...validMetadata };
  delete missingMetadata[field];
  const missing = runFixture(validMetadata, missingMetadata);
  assert.equal(missing.exitCode, 1);
  assert.ok(missing.report.checks.some((check) => check.details.includes(`metadata.${field} is required`)));
  fs.rmSync(missing.root, { recursive: true, force: true });
}

for (const field of ['source_url', 'author', 'upstream_path']) {
  const mismatchMetadata = { ...validMetadata, [field]: `different-${field}` };
  const mismatch = runFixture(validMetadata, mismatchMetadata);
  assert.equal(mismatch.exitCode, 1);
  assert.ok(mismatch.report.checks.some((check) => check.details.includes(`metadata.${field} does not match`)));
  fs.rmSync(mismatch.root, { recursive: true, force: true });
}

const legacyMetadata = {
  name: 'fixture',
  source_repo: 'example-repo',
  source_path: 'skills/fixture/SKILL.md'
};
const legacy = runFixture(legacyMetadata, legacyMetadata);
assert.equal(legacy.exitCode, 0);
fs.rmSync(legacy.root, { recursive: true, force: true });

console.log('Validator format tests passed.');
