'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeMetadata, validateMetadata } = require('./skill-metadata');

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function diagnostic(code, subject, edgePath = [], detail = '', severity = 'error') {
  const diagnosticPath = [...edgePath];
  const message = detail || subject || code;
  return {
    code,
    severity,
    message,
    subject,
    path: diagnosticPath,
    detail,
    legacyPath: diagnosticPath.join(' -> ')
  };
}

function loadCatalog(input) {
  const catalog = typeof input === 'string' ? JSON.parse(fs.readFileSync(input, 'utf8')) : input;
  const errors = [];
  if (catalog && catalog.schema_version !== undefined && catalog.schema_version !== 1) {
    errors.push(`unsupported catalog schema_version: ${catalog.schema_version}`);
  }
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
  if (request && !Array.isArray(request) && typeof request === 'object') {
    options = { ...request, ...options };
    request = request.names || [];
  }
  const loaded = loadCatalog(catalogInput);
  const diagnostics = loaded.errors.map((e) => diagnostic('invalid-catalog', '', [], e));
  const catalog = loaded.skills;
  const include = names(options.include, 'include');
  const exclude = names(options.exclude, 'exclude');
  const force = names(options.force, 'force');
  const requested = Array.isArray(request) ? request : [request];
  if (requested.length === 0 && (include.length || exclude.length)) {
    diagnostics.push(diagnostic(
      'roots-required',
      '',
      [],
      'include and exclude overrides require at least one explicit skill or loadout root'
    ));
  }
  if (options.constraints !== undefined) {
    if (!options.constraints || typeof options.constraints !== 'object' || Array.isArray(options.constraints)) {
      throw new Error('constraints must be a skill-name map');
    }
    for (const [name, constraint] of Object.entries(options.constraints)) {
      if (!NAME.test(name)) {
        diagnostics.push(diagnostic('version-constraint', name, [], `invalid constrained skill name: ${name}`));
        continue;
      }
      if (typeof constraint !== 'string' || !constraint.trim()) {
        diagnostics.push(diagnostic('version-constraint', name, [], `version constraint for ${name} must be a non-empty string`));
        continue;
      }
      if (constraint !== constraint.trim() || /[\s<>=|*^~]/.test(constraint)) {
        diagnostics.push(diagnostic('version-constraint', name, [], `unsupported version constraint for ${name}: exact version strings only`));
        continue;
      }
      if (!catalog.has(name)) {
        diagnostics.push(diagnostic('unknown-constraint', name, [], `version constraint references unknown skill: ${name}`));
        continue;
      }
      let actual;
      try {
        actual = versionValue(catalog.get(name));
      } catch (error) {
        diagnostics.push(diagnostic('version-constraint', name, [], error.message));
        continue;
      }
      if (actual === null || actual === undefined || actual === '') {
        diagnostics.push(diagnostic('version-constraint', name, [], `skill ${name} has no resolved version`));
      } else if (typeof actual !== 'string' || actual !== constraint) {
        diagnostics.push(diagnostic(
          'version-constraint',
          name,
          [],
          `skill ${name} version ${String(actual)} does not match required exact version ${constraint}`
        ));
      }
    }
  }
  const known = new Set(catalog.keys());
  for (const n of [...include, ...exclude, ...force]) {
    if (!known.has(n)) diagnostics.push(diagnostic('unknown-override', n, [], `override references unknown skill: ${n}`));
  }
  const roots = [];
  for (const token of requested) {
    if (typeof token !== 'string') throw new Error('request must contain skill names or loadout selectors');
    if (token.startsWith('loadout:')) {
      const loadout = token.slice(8);
      if (!NAME.test(loadout)) throw new Error(`invalid loadout selector: ${token}`);
      const members = [...catalog.values()]
        .filter((s) => s.loadout === loadout || (Array.isArray(s.loadouts) && s.loadouts.includes(loadout)))
        .sort((a, b) => a.name.localeCompare(b.name));
      if (members.length === 0) {
        diagnostics.push(diagnostic('missing-loadout', loadout, [], `loadout has no packaged members: ${loadout}`));
      } else {
        members.forEach((s) => roots.push(s.name));
      }
    } else if (NAME.test(token)) roots.push(token);
    else throw new Error(`invalid skill selection: ${token}`);
  }
  const state = new Map(), output = [], stack = [];
  const visit = (name, kind, parentPath) => {
    const record = catalog.get(name);
    if (!record) {
      if (kind === 'optional') {
        diagnostics.push(diagnostic('missing-optional', name, parentPath, `selected optional dependency is not packaged: ${name}`, 'warning'));
      } else {
        diagnostics.push(diagnostic('missing-skill', name, parentPath, `required skill is not packaged: ${name}`));
      }
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
  diagnostics.sort((a, b) => a.path.join(' -> ').localeCompare(b.path.join(' -> ')) ||
    a.code.localeCompare(b.code) || a.subject.localeCompare(b.subject));
  const errors = diagnostics.filter((d) => d.severity === 'error');
  return { ok: errors.length === 0, skills: errors.length ? [] : output, diagnostics };
}

module.exports = { loadCatalog, resolve, resolveLoadout: resolve };
