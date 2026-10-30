#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const evidenceArgument = process.argv.indexOf('--evidence');

function verifyEvidence(file) {
  const evidence = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  assert.equal(evidence.protocol, 'packaged-skill-context-bytes-v3');
  assert.equal(evidence.samples_per_scenario, 5);
  assert.equal(evidence.tokenizer_model_metrics, null);
  assert.equal(evidence.results.length, 6);
  const names = evidence.results.map(result => result.name);
  assert.deepEqual(names, [
    'full-corpus',
    'direct-plan-wave',
    'wave-delivery',
    'wave-delivery-with-code-review-2axis',
    'minimal-direct-selection',
    'software-delivery'
  ]);
  const direct = evidence.results.find(result => result.name === 'direct-plan-wave');
  const optional = evidence.results.find(result => result.name === 'wave-delivery-with-code-review-2axis');
  assert.deepEqual(direct.resolved_names, ['wave-orchestration', 'grilling', 'plan-wave']);
  assert.ok(optional.resolved_names.includes('code-review-2axis'));
  assert.ok(optional.resolved_names.length > direct.resolved_names.length);
  for (const result of evidence.results) {
    assert.equal(result.sample_count, 5);
    assert.equal(result.tokenizer_model_metrics, null);
  }
  process.stdout.write('Loadout measurement evidence verification passed.\n');
}

if (evidenceArgument !== -1) {
  verifyEvidence(process.argv[evidenceArgument + 1]);
  process.exit(0);
}

const testRoot = path.join(
  root,
  '.scratch',
  'loadout-measurement',
  '18.5.1',
  `self-test-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
);
const fixture = path.join(testRoot, 'fixture');
const source = path.join(fixture, 'skills');
const catalog = path.join(fixture, 'catalog.json');
const output = path.join(testRoot, 'runs');
const script = path.join(__dirname, 'measure-skill-loadouts.js');

const records = [
  { name: 'plan-wave', loadouts: ['software-delivery', 'wave-delivery'], dependencies: ['wave-orchestration', 'grilling'], optional_dependencies: ['code-review-2axis'] },
  { name: 'wave-orchestration', loadouts: ['software-delivery', 'wave-delivery'] },
  { name: 'grilling', loadouts: ['software-delivery', 'wave-delivery'] },
  { name: 'code-review-2axis', loadouts: ['software-delivery'] },
  { name: 'alpha', loadouts: ['software-delivery'] }
].map(record => ({
  description: record.name,
  source_repo: 'fixture',
  source_path: `skills/${record.name}/SKILL.md`,
  ...record
}));

function writeSkill(name, content) {
  const directory = path.join(source, name);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'SKILL.md'), content, 'utf8');
}

function run(id) {
  return spawnSync(process.execPath, [
    script, '--source', source, '--catalog', catalog, '--out-root', output, '--run-id', id
  ], { encoding: 'utf8' });
}

fs.mkdirSync(fixture, { recursive: true });
for (const record of records) writeSkill(record.name, `# ${record.name}\n${record.name}\n`);
fs.writeFileSync(catalog, `${JSON.stringify({ skills: records }, null, 2)}\n`, 'utf8');

try {
  const help = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  const invalidOption = spawnSync(process.execPath, [script, '--samples', '4'], { encoding: 'utf8' });
  assert.equal(invalidOption.status, 1);
  assert.match(invalidOption.stderr, /unknown option: --samples/);

  const first = run('preserved-run');
  assert.equal(first.status, 0, first.stderr);
  const runDir = path.join(output, 'preserved-run');
  const evidence = JSON.parse(fs.readFileSync(path.join(runDir, 'measurement.json'), 'utf8'));
  assert.equal(evidence.results.length, 6);
  assert.deepEqual(evidence.results[1].resolved_names, ['wave-orchestration', 'grilling', 'plan-wave']);
  assert.ok(evidence.results[3].resolved_names.includes('code-review-2axis'));
  for (const result of evidence.results) {
    const raw = JSON.parse(fs.readFileSync(path.join(runDir, result.raw_sample_file), 'utf8'));
    assert.equal(raw.length, 5);
    assert.equal(new Set(raw.map(sample => sample.execution_id)).size, 5);
    assert.equal(new Set(raw.map(sample => sample.process_id)).size, 5);
  }

  const before = fs.readFileSync(path.join(runDir, 'measurement.json'), 'utf8');
  const duplicate = run('preserved-run');
  assert.equal(duplicate.status, 0, duplicate.stderr);
  assert.equal(fs.readFileSync(path.join(runDir, 'measurement.json'), 'utf8'), before);
  assert.ok(fs.existsSync(path.join(runDir, 'checksums.json')));
  process.stdout.write('Loadout measurement protocol tests passed.\n');
} finally {
  fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
