#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const { loadCatalog, resolve } = require('./skill-loadouts');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'skills');
const catalogPath = path.join(root, 'catalog', 'skills.lock.json');
const outDir = path.join(root, '.scratch', 'loadout-measurement');
const samples = 5;

function help() {
  console.log(`Usage: node scripts/measure-skill-loadouts.js [--help]

Measures packaged skill contexts with deterministic UTF-8 byte counts.
Writes JSON, Markdown, manifest, and raw samples to .scratch/loadout-measurement/.
Token/model metrics are intentionally unavailable unless pinned tooling is added.`);
}

function commit() {
  try { return cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return 'unavailable'; }
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

function context(names) {
  const chunks = [];
  for (const name of names) {
    const dir = path.join(source, name);
    for (const file of files(dir)) {
      const relative = path.relative(root, file).split(path.sep).join('/');
      chunks.push(Buffer.from(`${relative}\0`, 'utf8'), fs.readFileSync(file), Buffer.from('\0', 'utf8'));
    }
  }
  return Buffer.concat(chunks);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(name, request, options, baseline) {
  const result = resolve(request, catalogPath, options);
  const names = result.skills.map(skill => skill.name);
  const bytes = context(names).length;
  const raw = Array.from({ length: samples }, () => bytes);
  const target = median(raw);
  return {
    name, roots: request, include: options.include || [], exclude: options.exclude || [],
    resolved_names: names, omitted: [...loaded.skills.keys()].filter(skill => !names.includes(skill)),
    diagnostics: result.diagnostics, raw_samples_bytes: raw,
    median_bytes: target, minimum_bytes: Math.min(...raw), maximum_bytes: Math.max(...raw),
    spread_bytes: Math.max(...raw) - Math.min(...raw),
    baseline_bytes: baseline, target_bytes: target,
    absolute_reduction_bytes: baseline - target,
    reduction_ratio: baseline ? (baseline - target) / baseline : 0,
    baseline_tokens: null, target_tokens: null, absolute_reduction_tokens: null,
    reduction_ratio_tokens: null
  };
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  help();
  process.exit(0);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const loaded = loadCatalog(catalogPath);
if (loaded.errors.length) throw new Error(loaded.errors.join('; '));
const all = [...loaded.skills.keys()];
const baseline = context(all).length;
const loadout = [...new Set([...loaded.skills.values()].map(s => s.loadout).filter(Boolean))].sort()[0];
const members = loadout ? all.filter(name => loaded.skills.get(name).loadout === loadout).sort() : all.slice(0, Math.min(3, all.length));
const optional = members.flatMap(name => loaded.skills.get(name).optional_dependencies || []).find(name => loaded.skills.has(name));
const direct = members[0];
const scenarios = [
  { name: 'full-corpus', request: all, options: {} },
  { name: 'representative-loadout', request: loadout ? [`loadout:${loadout}`] : members, options: {} },
  { name: 'loadout-with-optional', request: loadout ? [`loadout:${loadout}`] : members, options: optional ? { include: [optional] } : {} },
  { name: 'minimal-direct-selection', request: [direct], options: {} }
];
const results = scenarios.map(s => measure(s.name, s.request, s.options, baseline));
for (const result of results) fs.writeFileSync(path.join(outDir, `${result.name}.raw.json`), JSON.stringify(result.raw_samples_bytes) + '\n');
const manifest = {
  protocol: 'packaged-skill-context-bytes-v1', encoding: 'utf8',
  assembly: 'sorted packaged files; each record is skills/<name>/<file> NUL content NUL',
  corpus: all, source_commit: commit(), catalog: path.relative(root, catalogPath).replaceAll(path.sep, '/'),
  scenarios: results.map(({ name, roots, include, exclude, resolved_names, omitted, diagnostics }) =>
    ({ name, roots, include, exclude, resolved_names, omitted, diagnostics }))
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const evidence = { ...manifest, command: 'node scripts/measure-skill-loadouts.js', environment: { node: process.version, platform: process.platform, arch: process.arch, locale: process.env.LC_ALL || process.env.LANG || 'default' }, samples_per_scenario: samples, results };
fs.writeFileSync(path.join(outDir, 'measurement.json'), JSON.stringify(evidence, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'README.md'), `# Loadout measurement

Generated by \`node scripts/measure-skill-loadouts.js\` at commit \`${manifest.source_commit}\`.
Contexts use deterministic sorted packaged files and UTF-8 byte lengths. Five serial
samples are retained in each \`*.raw.json\` file. Tokenizer/model metrics are
unavailable and are recorded as null; no token estimates are made.

- [Machine-readable evidence](measurement.json)
- [Selection manifest](manifest.json)
- [Calculation procedure](../../scripts/measure-skill-loadouts.js)
`);
