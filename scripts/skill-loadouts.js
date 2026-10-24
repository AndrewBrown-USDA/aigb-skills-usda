'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeMetadata, validateMetadata } = require('./skill-metadata');

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function diagnostic(code, subject, edgePath = [], detail = '') {
  return { code, subject, path: edgePath.join(' -> '), detail };
}

function loadCatalog(input) {
  const catalog = typeof input === 'string' ? JSON.parse(fs.readFileSync(input, 'utf8')) : input;
  const errors = [];
  if (!catalog || !Array.isArray(catalog.skills)) return { skills: new Map(), errors: ['catalog.skills must be an array'] };
  const skills = new Map();
  for (const record of catalog.skills) {
    if (!record || typeof record.name !== 'string' || !NAME.test(record.name) || skills.has(record.name)) {
      errors.push(`invalid or duplicate skill name: ${record && record.name}`);
      continue;
    }
    const checked = validateMetadata(record);
    const sourcePath = record.source_path;
    if (typeof sourcePath !== 'string' || !sourcePath.startsWith('skills/') ||
        path.posix.isAbsolute(sourcePath) || sourcePath.split('/').includes('..')) {
      checked.errors.push('source_path must be a packaged relative skills path');
    }
    if (!checked.valid || checked.errors.length) errors.push(...checked.errors.map((e) => `${record.name}: ${e}`));
    skills.set(record.name, { ...record, ...normalizeMetadata(record) });
  }
  return { skills, errors };
}

function names(value, field) {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',') : null);
  if (!list || list.some((x) => typeof x !== 'string' || !NAME.test(x.trim()))) {
    throw new Error(`${field} must contain skill names only`);
  }
  return [...new Set(list.map((x) => x.trim()))];
}

function versionValue(record) {
  const v = record.version;
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number') return v;
  if (v && (v.status === 'resolved' || v.status === 'missing') && ('value' in v)) return v.value;
  throw new Error(`unsupported version metadata for ${record.name}`);
}

function resolve(request = [], catalogInput, options = {}) {
  const loaded = loadCatalog(catalogInput);
  const diagnostics = loaded.errors.map((e) => diagnostic('invalid-catalog', '', [], e));
  const catalog = loaded.skills;
  const include = names(options.include, 'include');
  const exclude = names(options.exclude, 'exclude');
  const force = names(options.force, 'force');
  if (options.constraints !== undefined) {
    if (!options.constraints || typeof options.constraints !== 'object' || Array.isArray(options.constraints)) {
      throw new Error('constraints must be a skill-name map');
    }
    for (const [name, constraint] of Object.entries(options.constraints)) {
      if (!NAME.test(name) || typeof constraint !== 'string' || !constraint.trim() ||
          /[\s<>=|*^~]/.test(constraint)) throw new Error(`unsupported version constraint for ${name}`);
      if (!catalog.has(name)) diagnostics.push(diagnostic('unknown-constraint', name));
    }
  }
  const known = new Set(catalog.keys());
  for (const n of [...include, ...exclude, ...force]) if (!known.has(n)) diagnostics.push(diagnostic('unknown-override', n));
  const roots = [];
  for (const token of (Array.isArray(request) ? request : [request])) {
    if (typeof token !== 'string') throw new Error('request must contain skill names or loadout selectors');
    if (token.startsWith('loadout:')) {
      const loadout = token.slice(8);
      if (!NAME.test(loadout)) throw new Error(`invalid loadout selector: ${token}`);
      [...catalog.values()].filter((s) => s.loadout === loadout).sort((a, b) => a.name.localeCompare(b.name))
        .forEach((s) => roots.push(s.name));
    } else if (NAME.test(token)) roots.push(token);
    else throw new Error(`invalid skill selection: ${token}`);
  }
  const state = new Map(), output = [], stack = [];
  const visit = (name, kind, parentPath) => {
    const record = catalog.get(name);
    if (!record) {
      if (kind === 'optional') diagnostics.push(diagnostic('missing-optional', name, parentPath));
      else diagnostics.push(diagnostic('missing-skill', name, parentPath));
      return;
    }
    if (exclude.includes(name) && !force.includes(name)) {
      if (kind === 'optional') return;
      diagnostics.push(diagnostic('excluded-required', name, parentPath));
      return;
    }
    if (state.get(name) === 'active') {
      const start = stack.indexOf(name);
      diagnostics.push(diagnostic('cycle', name, stack.slice(start).concat(name), kind));
      return;
    }
    if (state.get(name) === 'complete') return;
    state.set(name, 'active'); stack.push(name);
    for (const dep of record.dependencies || []) visit(dep, 'required', stack.slice());
    for (const dep of record.optional_dependencies || []) {
      if (include.includes(dep) || force.includes(dep)) visit(dep, 'optional', stack.slice());
    }
    stack.pop(); state.set(name, 'complete'); output.push(record);
  };
  for (const name of roots) {
    if (!catalog.has(name)) diagnostics.push(diagnostic('missing-root', name));
    else if (exclude.includes(name) && !force.includes(name)) diagnostics.push(diagnostic('excluded-root', name));
    else visit(name, 'direct', [name]);
  }
  diagnostics.sort((a, b) => (a.path || '').localeCompare(b.path || '') || a.code.localeCompare(b.code) || a.subject.localeCompare(b.subject));
  const errors = diagnostics.filter((d) => !d.code.startsWith('missing-optional'));
  return { ok: errors.length === 0, skills: errors.length ? [] : output, diagnostics };
}

module.exports = { loadCatalog, resolve, resolveLoadout: resolve };
