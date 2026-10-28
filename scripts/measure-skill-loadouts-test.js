#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const testRoot = path.join(
  root,
  '.scratch',
  'loadout-measurement',
  '16.2.2',
  `self-test-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
);
const fixture = path.join(testRoot, 'fixture');
const source = path.join(fixture, 'skills');
const catalog = path.join(fixture, 'catalog.json');
const output = path.join(testRoot, 'runs');
const script = path.join(__dirname, 'measure-skill-loadouts.js');

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
writeSkill('alpha', '# Alpha\n');
writeSkill('beta', '# Beta fixture with different bytes\n');
fs.writeFileSync(catalog, `${JSON.stringify({
  skills: [
    { name: 'alpha', description: 'Alpha', source_repo: 'fixture', source_path: 'skills/alpha/SKILL.md' },
    { name: 'beta', description: 'Beta', source_repo: 'fixture', source_path: 'skills/beta/SKILL.md', dependencies: ['alpha'] }
  ]
}, null, 2)}\n`, 'utf8');

try {
  const help = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);

  const first = run('preserved-run');
  assert.equal(first.status, 0, first.stderr);
  const runDir = path.join(output, 'preserved-run');
  const evidence = JSON.parse(fs.readFileSync(path.join(runDir, 'measurement.json'), 'utf8'));
  assert.equal(evidence.samples_per_scenario, 5);
  assert.equal(evidence.tokenizer_model_metrics, null);
  assert.match(evidence.serialization, /NUL/);
  assert.match(evidence.cache_state.declaration, /fresh serial Node\.js child process/);
  assert.equal(evidence.environment.node, process.version);
  assert.equal(evidence.environment.platform, process.platform);
  assert.ok(evidence.source_commit);
  assert.equal(evidence.corpus_files.length, 2);
  for (const entry of evidence.corpus_files) {
    const file = path.join(fixture, ...entry.path.split('/'));
    assert.equal(entry.sha256, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
  }

  for (const result of evidence.results) {
    const raw = JSON.parse(fs.readFileSync(path.join(runDir, result.raw_sample_file), 'utf8'));
    assert.equal(raw.length, 5);
    assert.equal(new Set(raw.map(sample => sample.execution_id)).size, 5);
    assert.equal(new Set(raw.map(sample => sample.process_id)).size, 5);
    const values = raw.map(sample => sample.bytes).sort((a, b) => a - b);
    assert.equal(result.minimum_bytes, values[0]);
    assert.equal(result.maximum_bytes, values[4]);
    assert.equal(result.median_bytes, values[2]);
    assert.equal(result.spread_bytes, values[4] - values[0]);
    assert.deepEqual(result.diagnostics, raw[0].diagnostics);
  }

  const before = fs.readFileSync(path.join(runDir, 'measurement.json'), 'utf8');
  const duplicate = run('preserved-run');
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /exist/i);
  assert.equal(fs.readFileSync(path.join(runDir, 'measurement.json'), 'utf8'), before);
  process.stdout.write('Loadout measurement protocol tests passed.\n');
} finally {
  fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
