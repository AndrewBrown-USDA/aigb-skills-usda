'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Mirrors the table list in history_miner.js. Keep in sync if that list changes.
const TABLES = [
  'sessions',
  'turns',
  'checkpoints',
  'session_files',
  'session_refs',
  'usage',
  'session_usage',
  'tool_executions'
];
const TABLE_SET = new Set(TABLES);
const BACKENDS = new Set(['local', 'cloud', 'unknown']);
const MAX_DEPTH = 6;
const MAX_FILES = 200;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function codeOf(error) {
  return error && typeof error.code === 'string' && error.code ? error.code : 'failed';
}

function emptyResult(backend) {
  return { raw: {}, backend, incomplete_sources: [], errors: [] };
}

function finish(result) {
  result.incomplete_sources = sortedUnique(result.incomplete_sources);
  result.errors = sortedUnique(result.errors);
  return result;
}

function addMissingAll(result, backend) {
  for (const table of TABLES) result.incomplete_sources.push(`${backend}:${table}:missing`);
}

function unknownResult(extraErrors = []) {
  const result = emptyResult('unknown');
  result.errors.push(...extraErrors, 'unknown: no readable local root or cloud transport supplied');
  result.incomplete_sources.push('unknown:no-source');
  return finish(result);
}

function resolveCanonicalPath(targetPath) {
  let currentPath = path.resolve(targetPath);
  const suffix = [];

  while (true) {
    const exists = fs.existsSync(currentPath) || fs.lstatSync(currentPath, { throwIfNoEntry: false });
    if (exists) {
      try {
        return path.join(fs.realpathSync(currentPath), ...suffix);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) return path.join(currentPath, ...suffix);
    suffix.unshift(path.basename(currentPath));
    currentPath = parentPath;
  }
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function probeRoot(rootInput) {
  if (typeof rootInput !== 'string' || rootInput.trim() === '') {
    return { error: 'local: root is required' };
  }
  let canonical;
  try {
    canonical = fs.realpathSync(path.resolve(rootInput));
  } catch (error) {
    return { error: `local: root unreadable: ${codeOf(error)}` };
  }
  let stats;
  try {
    stats = fs.statSync(canonical);
  } catch (error) {
    return { error: `local: root unreadable: ${codeOf(error)}` };
  }
  if (!stats.isDirectory()) return { error: 'local: root is not a directory' };
  try {
    fs.readdirSync(canonical);
  } catch (error) {
    return { error: `local: root unreadable: ${codeOf(error)}` };
  }
  return { canonical };
}

function safeFile(canonicalRoot, absolute) {
  let real;
  try {
    real = fs.realpathSync(absolute);
  } catch (error) {
    return { error: codeOf(error) };
  }
  return isWithin(canonicalRoot, real) ? { real } : { error: 'outside-root' };
}

function listSourceFiles(canonicalRoot) {
  const files = [];
  const errors = [];

  const walk = (directory, depth) => {
    const relativeDirectory = path.relative(canonicalRoot, directory).split(path.sep).join('/');
    if (depth > MAX_DEPTH) {
      errors.push(`local:file:${relativeDirectory || '.'}:depth-exceeded`);
      return;
    }
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      errors.push(`local:file:${relativeDirectory || '.'}:unreadable:${codeOf(error)}`);
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= MAX_FILES) return;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(canonicalRoot, absolute).split(path.sep).join('/');
      // Links are never followed, so a link cannot reach outside the root.
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        walk(absolute, depth + 1);
        continue;
      }
      if (!entry.isFile() || !/\.(json|ndjson)$/i.test(entry.name)) continue;
      const checked = safeFile(canonicalRoot, absolute);
      if (checked.error) {
        errors.push(`local:file:${relative}:unreadable:${checked.error}`);
        continue;
      }
      files.push({ absolute: checked.real, relative });
    }
  };

  walk(canonicalRoot, 0);
  return { files, errors };
}

function pushRows(tables, table, rows) {
  if (!tables[table]) tables[table] = [];
  tables[table].push(...rows);
}

function parseJsonFile(absolute, relative) {
  const parsed = { tables: {}, errors: [], partial: new Set() };
  let data;
  try {
    data = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    parsed.errors.push(`local:file:${relative}:invalid-json:${codeOf(error)}`);
    return parsed;
  }
  const source = isObject(data) && isObject(data.records) ? data.records : data;
  if (!isObject(source)) {
    parsed.errors.push(`local:file:${relative}:invalid-shape`);
    return parsed;
  }
  for (const [table, value] of Object.entries(source)) {
    if (!TABLE_SET.has(table)) continue;
    if (!Array.isArray(value)) {
      parsed.partial.add(table);
      parsed.errors.push(`local:file:${relative}:invalid-table:${table}`);
      continue;
    }
    pushRows(parsed.tables, table, value);
  }
  return parsed;
}

function parseNdjsonFile(absolute, relative) {
  const parsed = { tables: {}, errors: [], partial: new Set() };
  let content;
  try {
    content = fs.readFileSync(absolute, 'utf8');
  } catch (error) {
    parsed.errors.push(`local:file:${relative}:unreadable:${codeOf(error)}`);
    return parsed;
  }
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      parsed.errors.push(`local:file:${relative}:invalid-line:${index + 1}`);
      continue;
    }
    if (!isObject(record)) {
      parsed.errors.push(`local:file:${relative}:invalid-line:${index + 1}`);
      continue;
    }
    const table = typeof record.table === 'string' ? record.table
      : typeof record.type === 'string' ? record.type : null;
    if (!table || !TABLE_SET.has(table)) continue;
    if (record.rows !== undefined) {
      if (!Array.isArray(record.rows)) {
        parsed.partial.add(table);
        parsed.errors.push(`local:file:${relative}:invalid-group:${index + 1}`);
        continue;
      }
      const groupSessionId = record.session_id;
      for (const row of record.rows) {
        if (!isObject(row)) {
          parsed.partial.add(table);
          continue;
        }
        const stamped = !isPresent(row.session_id) && isPresent(groupSessionId)
          ? { ...row, session_id: groupSessionId }
          : row;
        pushRows(parsed.tables, table, [stamped]);
      }
      continue;
    }
    const row = { ...record };
    delete row.table;
    delete row.type;
    pushRows(parsed.tables, table, [row]);
  }
  return parsed;
}

function validateRows(aggregated) {
  const raw = {};
  const partial = new Set();
  for (const table of TABLES) {
    if (!(table in aggregated)) continue;
    const kept = [];
    for (const row of aggregated[table]) {
      if (!isObject(row)) {
        partial.add(table);
        continue;
      }
      if (table === 'sessions' ? !isPresent(row.id) : !isPresent(row.session_id)) {
        partial.add(table);
        continue;
      }
      kept.push(row);
    }
    raw[table] = kept;
  }
  return { raw, partial };
}

function loadLocal(options = {}) {
  const result = emptyResult('local');
  const probe = probeRoot(options.root);
  if (!probe.canonical) {
    result.errors.push(probe.error);
    addMissingAll(result, 'local');
    return finish(result);
  }

  const listing = listSourceFiles(probe.canonical);
  result.errors.push(...listing.errors);

  const aggregated = {};
  const seen = new Set();
  const partial = new Set();

  for (const file of listing.files) {
    const parsed = /\.ndjson$/i.test(file.relative)
      ? parseNdjsonFile(file.absolute, file.relative)
      : parseJsonFile(file.absolute, file.relative);
    result.errors.push(...parsed.errors);
    for (const [table, rows] of Object.entries(parsed.tables)) {
      seen.add(table);
      pushRows(aggregated, table, rows);
    }
    for (const table of parsed.partial) partial.add(table);
  }

  const validated = validateRows(aggregated);
  result.raw = validated.raw;
  for (const table of validated.partial) partial.add(table);
  for (const table of TABLES) {
    if (!seen.has(table)) result.incomplete_sources.push(`local:${table}:missing`);
  }
  for (const table of partial) result.incomplete_sources.push(`local:${table}:partial`);
  return finish(result);
}

function loadCloud(options = {}) {
  const result = emptyResult('cloud');
  if (typeof options.transport !== 'function') {
    result.errors.push('cloud: transport is required');
    addMissingAll(result, 'cloud');
    return finish(result);
  }

  let payload;
  try {
    payload = options.transport({
      query: isObject(options.query) ? { ...options.query } : {},
      session: Array.isArray(options.session) ? [...options.session] : []
    });
  } catch (error) {
    result.errors.push(`cloud:transport: ${codeOf(error)}`);
    addMissingAll(result, 'cloud');
    return finish(result);
  }
  if (payload && typeof payload.then === 'function') {
    result.errors.push('cloud:transport: unsupported async transport');
    addMissingAll(result, 'cloud');
    return finish(result);
  }

  const source = isObject(payload) && isObject(payload.records) ? payload.records
    : isObject(payload) && isObject(payload.tables) ? payload.tables
      : payload;
  if (!isObject(source)) {
    result.errors.push('cloud:transport: invalid response shape');
    addMissingAll(result, 'cloud');
    return finish(result);
  }

  const aggregated = {};
  const seen = new Set();
  for (const [table, value] of Object.entries(source)) {
    if (!TABLE_SET.has(table)) continue;
    if (!Array.isArray(value)) {
      result.errors.push(`cloud:invalid-table:${table}`);
      continue;
    }
    seen.add(table);
    pushRows(aggregated, table, value);
  }

  const validated = validateRows(aggregated);
  result.raw = validated.raw;
  for (const table of TABLES) {
    if (!seen.has(table)) result.incomplete_sources.push(`cloud:${table}:missing`);
  }
  for (const table of validated.partial) result.incomplete_sources.push(`cloud:${table}:partial`);
  return finish(result);
}

function loadSource(options = {}) {
  const requested = options.backend === undefined ? 'auto' : String(options.backend);
  if (requested === 'local') return loadLocal(options);
  if (requested === 'cloud') return loadCloud(options);
  if (requested !== 'auto') {
    return unknownResult([`unknown backend: ${requested}`]);
  }

  const probe = probeRoot(options.root);
  if (probe.canonical) return loadLocal(options);

  const hasRoot = options.root !== undefined && options.root !== null;
  if (typeof options.transport === 'function') {
    const cloud = loadCloud(options);
    if (hasRoot) {
      const local = loadLocal(options);
      cloud.errors = sortedUnique([...cloud.errors, ...local.errors]);
      cloud.incomplete_sources = sortedUnique([...cloud.incomplete_sources, ...local.incomplete_sources]);
    }
    return cloud;
  }

  return unknownResult(hasRoot && probe.error ? [probe.error] : []);
}

module.exports = {
  TABLES,
  loadSource,
  loadLocal,
  loadCloud,
  listSourceFiles,
  parseJsonFile,
  parseNdjsonFile,
  validateRows,
  resolveCanonicalPath,
  isWithin,
  probeRoot
};
