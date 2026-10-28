#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const { loadCatalog, resolve } = require('./skill-loadouts');

const root = path.resolve(__dirname, '..');
const defaults = {
  source: path.join(root, 'skills'),
  catalog: path.join(root, 'catalog', 'skills.lock.json'),
  outRoot: path.join(root, '.scratch', 'loadout-measurement', '16.2.2'),
  samples: 5
};
const serialization = 'sorted files; UTF-8 relative path, NUL, raw file bytes, NUL';

function help() {
  console.log(`Usage: node scripts/measure-skill-loadouts.js [--help]

Measures packaged skill contexts with deterministic UTF-8 byte counts.
Writes a unique, non-overwriting run beneath .scratch/loadout-measurement/16.2.2/.
Token/model metrics remain unavailable unless measured with pinned tooling.`);
}

function parseArgs(argv) {
  const options = { ...defaults, runId: null, sample: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (['--source', '--catalog', '--out-root', '--run-id', '--sample'].includes(arg)) {
      if (index + 1 >= argv.length) throw new Error(`${arg} requires a value`);
      const value = argv[++index];
      if (arg === '--source') options.source = path.resolve(value);
      else if (arg === '--catalog') options.catalog = path.resolve(value);
      else if (arg === '--out-root') options.outRoot = path.resolve(value);
      else if (arg === '--run-id') options.runId = value;
      else options.sample = value;
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }
  return options;
}

function commit(cwd) {
  try {
    return cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unavailable';
  }
}

function files(dir) {
  const result = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) result.push(full);
    }
  };
  walk(dir);
  return result;
}

function context(source, repositoryRoot, names) {
  const chunks = [];
  for (const name of names) {
    for (const file of files(path.join(source, name))) {
      const relative = path.relative(repositoryRoot, file).split(path.sep).join('/');
      chunks.push(Buffer.from(`${relative}\0`, 'utf8'), fs.readFileSync(file), Buffer.from('\0', 'utf8'));
    }
  }
  return Buffer.concat(chunks);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sample(payload) {
  const result = resolve(payload.request, payload.catalog, payload.options);
  const names = result.skills.map(skill => skill.name);
  const bytes = context(payload.source, payload.repositoryRoot, names).length;
  return {
    execution_id: payload.executionId,
    process_id: process.pid,
    started_at: new Date().toISOString(),
    bytes,
    resolved_names: names,
    diagnostics: result.diagnostics
  };
}

function runSample(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const result = cp.spawnSync(process.execPath, [__filename, '--sample', encoded], {
    encoding: 'utf8',
    windowsHide: true
  });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `sample process exited ${result.status}`);
  return JSON.parse(result.stdout);
}

function safeRunId(value) {
  if (value && !/^[A-Za-z0-9._-]+$/.test(value)) throw new Error('run identifier contains unsupported characters');
  return value || `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    help();
    return 0;
  }
  if (options.sample) {
    const payload = JSON.parse(Buffer.from(options.sample, 'base64url').toString('utf8'));
    process.stdout.write(`${JSON.stringify(sample(payload))}\n`);
    return 0;
  }

  const loaded = loadCatalog(options.catalog);
  if (loaded.errors.length) throw new Error(loaded.errors.join('; '));
  const all = [...loaded.skills.keys()];
  if (all.length === 0) throw new Error('catalog contains no measurable skills');
  const repositoryRoot = path.dirname(options.source);
  const loadout = [...new Set([...loaded.skills.values()].map(skill => skill.loadout).filter(Boolean))].sort()[0];
  const members = loadout
    ? all.filter(name => loaded.skills.get(name).loadout === loadout).sort()
    : all.slice(0, Math.min(3, all.length));
  const optional = members.flatMap(name => loaded.skills.get(name).optional_dependencies || [])
    .find(name => loaded.skills.has(name));
  const scenarios = [
    { name: 'full-corpus', request: all, options: {} },
    { name: 'representative-selection', request: loadout ? [`loadout:${loadout}`] : members, options: {} },
    { name: 'selection-with-optional', request: loadout ? [`loadout:${loadout}`] : members, options: optional ? { include: [optional] } : {} },
    { name: 'minimal-direct-selection', request: [members[0]], options: {} }
  ];

  const runId = safeRunId(options.runId);
  fs.mkdirSync(options.outRoot, { recursive: true });
  const runDir = path.join(options.outRoot, runId);
  fs.mkdirSync(runDir);

  const corpusFiles = files(options.source).map(file => ({
    path: path.relative(repositoryRoot, file).split(path.sep).join('/'),
    bytes: fs.statSync(file).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  }));
  const results = [];
  for (const scenario of scenarios) {
    const rawSamples = [];
    for (let index = 0; index < options.samples; index += 1) {
      rawSamples.push(runSample({
        source: options.source,
        catalog: options.catalog,
        repositoryRoot,
        request: scenario.request,
        options: scenario.options,
        executionId: `${scenario.name}-${index + 1}`
      }));
    }
    writeJson(path.join(runDir, `${scenario.name}.raw.json`), rawSamples);
    const values = rawSamples.map(entry => entry.bytes);
    results.push({
      ...scenario,
      resolved_names: rawSamples[0].resolved_names,
      diagnostics: rawSamples[0].diagnostics,
      raw_sample_file: `${scenario.name}.raw.json`,
      sample_count: values.length,
      median_bytes: median(values),
      minimum_bytes: Math.min(...values),
      maximum_bytes: Math.max(...values),
      spread_bytes: Math.max(...values) - Math.min(...values),
      tokenizer_model_metrics: null
    });
  }

  const manifest = {
    protocol: 'packaged-skill-context-bytes-v2',
    run_id: runId,
    encoding: 'utf8',
    serialization,
    cache_state: {
      policy: 'no application cache',
      declaration: 'Each sample is a fresh serial Node.js child process reading files from the operating-system filesystem.'
    },
    source_commit: commit(repositoryRoot),
    catalog: path.relative(repositoryRoot, options.catalog).split(path.sep).join('/'),
    corpus: all,
    corpus_files: corpusFiles,
    scenarios: results.map(({ name, request, options: scenarioOptions, resolved_names, diagnostics }) => ({
      name, roots: request, include: scenarioOptions.include || [], exclude: scenarioOptions.exclude || [],
      resolved_names, omitted: all.filter(skill => !resolved_names.includes(skill)), diagnostics
    }))
  };
  writeJson(path.join(runDir, 'manifest.json'), manifest);
  writeJson(path.join(runDir, 'measurement.json'), {
    ...manifest,
    command: 'node scripts/measure-skill-loadouts.js',
    environment: {
      node: process.version,
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      cpus: os.cpus().length,
      locale: process.env.LC_ALL || process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale || 'default'
    },
    samples_per_scenario: options.samples,
    tokenizer_model_metrics: null,
    results
  });
  process.stdout.write(`${runDir}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main, median };
