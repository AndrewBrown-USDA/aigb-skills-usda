'use strict';

const crypto = require('node:crypto');

const TABLES = ['sessions', 'turns', 'checkpoints', 'session_files', 'session_refs', 'usage', 'session_usage', 'tool_executions'];
const REDACTION_RULES_VERSION = '1';
const DEFAULT_REDACT_PATTERNS = [
  /([?&](?:token|key|secret|password)=)[^&\s]+/gi,
  /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/gi
];
const SENSITIVE_KEY_PATTERN = /^(?:api[_-]?key|key|password|passwd|secret|token|credential|credentials|authorization|private[_-]?key)$/i;

function isSensitiveKey(key) {
  const normalized = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');
  return normalized.split(/[^A-Za-z0-9]+/).filter(Boolean)
    .some(segment => SENSITIVE_KEY_PATTERN.test(segment));
}

function stableJson(value) {
  const normalize = input => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === 'object') {
      return Object.fromEntries(
        Object.keys(input).sort().map(key => [key, normalize(input[key])])
      );
    }
    return input;
  };
  return JSON.stringify(normalize(value));
}

function hash(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function recordRedactionError(options, error) {
  if (!Array.isArray(options.errors)) return;
  const message = `Redaction pattern failed: ${error && error.message ? error.message : String(error)}`;
  if (!options.errors.includes(message)) options.errors.push(message);
}

function redact(value, options = {}) {
  if (typeof value !== 'string') return value;
  const callerPatterns = Array.isArray(options.redactPatterns) ? options.redactPatterns : [];
  const patterns = [...DEFAULT_REDACT_PATTERNS, ...callerPatterns];
  let redacted = value;
  for (const pattern of patterns) {
    try {
      redacted = redacted.replace(pattern, match => {
        const separator = match.match(/^([?&][^=]+=|[^:=\s]+[:=]\s*)/);
        return separator ? `${separator[1]}[REDACTED]` : '[REDACTED]';
      });
    } catch (error) {
      recordRedactionError(options, error);
    }
  }
  const withQueryRedacted = redacted.replace(/(https?:\/\/[^\s"'<>?]+)\?[^\s"'<>]+/gi, '$1?[REDACTED]');
  const urls = [];
  const protectedUrls = withQueryRedacted.replace(/https?:\/\/[^\s"'<>]+/gi, match => {
    urls.push(match);
    return `__REDACTED_URL_${urls.length - 1}__`;
  });
  const windowsPath = /\b[A-Za-z]:[\\/][^"'<>;|,\r\n]*?(?=\s+(?:and|or)\b|[,;\r\n]|$)/g;
  const unixPath = /(^|[^:])\/(?!\/)(?:[^\/\s"'<>;|]+\/)*[^\/\s"'<>;|]+/g;
  const withoutWindowsPaths = protectedUrls.replace(windowsPath, '[REDACTED_PATH]');
  const withoutUnixPaths = withoutWindowsPaths.replace(unixPath, (match, prefix) => `${prefix}[REDACTED_PATH]`);
  return withoutUnixPaths.replace(/__REDACTED_URL_(\d+)__/g, (_, index) => urls[Number(index)]);
}

function identitySegment(value) {
  const raw = String(value);
  return redact(raw) === raw ? raw : digest(raw);
}

function genericIdentity(row) {
  for (const field of ['id', 'event_id', 'tool_call_id']) {
    const value = row[field];
    if (value !== undefined && value !== null && value !== '') return identitySegment(value);
  }
  return null;
}

function sequenceIdentity(row) {
  if (!row.session_id) return null;
  const position = row.turn_index ?? row.checkpoint_number;
  return position === undefined || position === null
    ? null
    : `${identitySegment(row.session_id)}:${position}`;
}

function sourceFilesIdentity(row) {
  if (!row.session_id || row.file_path === undefined || row.file_path === null || row.file_path === '') return null;
  return `${identitySegment(row.session_id)}:${digest(stableJson([row.file_path, row.tool_name ?? null, row.turn_index ?? null]))}`;
}

function sessionRefsIdentity(row) {
  if (!row.session_id || (!row.ref_type && !row.ref_value)) return null;
  return `${identitySegment(row.session_id)}:${digest(stableJson([row.ref_type ?? null, row.ref_value ?? null, row.turn_index ?? null]))}`;
}

function usageIdentity(row) {
  if (!row.session_id || !row.usage_model) return null;
  return `${identitySegment(row.session_id)}:${identitySegment(row.usage_model)}`;
}

const TABLE_IDENTITY = {
  sessions: genericIdentity,
  turns: row => genericIdentity(row) || sequenceIdentity(row),
  checkpoints: row => genericIdentity(row) || sequenceIdentity(row),
  session_files: row => sourceFilesIdentity(row) || genericIdentity(row),
  session_refs: row => sessionRefsIdentity(row) || genericIdentity(row),
  session_usage: row => usageIdentity(row) || genericIdentity(row),
  usage: row => usageIdentity(row) || genericIdentity(row),
  tool_executions: genericIdentity
};

function sourceRef(table, row) {
  const identity = (TABLE_IDENTITY[table] || genericIdentity)(row);
  return `${table}:${identity || hash(row)}`;
}

function cleanValue(value, options) {
  if (typeof value === 'string') return redact(value, options);
  if (Array.isArray(value)) return value.map(item => cleanValue(item, options));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : cleanValue(nested, options)
    ]));
  }
  return value;
}

function cleanRow(row, options) {
  return cleanValue(row || {}, options);
}

const CANONICAL_FIELDS = {
  sessions: ['id', 'task_id', 'cwd', 'repository', 'branch', 'summary', 'agent_name', 'agent_description', 'created_at', 'updated_at', 'status'],
  turns: ['session_id', 'turn_index', 'user_message', 'assistant_response', 'timestamp'],
  checkpoints: ['session_id', 'checkpoint_number', 'title', 'overview', 'created_at'],
  session_files: ['session_id', 'file_path', 'tool_name', 'turn_index', 'first_seen_at'],
  session_refs: ['session_id', 'ref_type', 'ref_value', 'turn_index', 'created_at'],
  usage: ['session_id', 'usage_model', 'api_call_count', 'input_tokens', 'output_tokens', 'cache_read_tokens', 'cache_write_tokens', 'cost', 'duration', 'first_used_at', 'last_used_at'],
  tool_executions: ['session_id', 'tool_call_id', 'tool_name', 'started_at', 'completed_at', 'duration_ms', 'success', 'error_code']
};

function canonicalize(table, row, options) {
  const cleaned = cleanRow(row, options);
  for (const field of CANONICAL_FIELDS[table] || []) {
    if (cleaned[field] === undefined) cleaned[field] = null;
  }
  if (table === 'sessions' && cleaned.status === null) cleaned.status = 'unknown';
  return cleaned;
}

function recordTimestamp(record) {
  return record.created_at || record.timestamp || record.started_at ||
    record.completed_at || record.updated_at || '';
}

function sortRecords(records) {
  return [...records].sort((a, b) =>
    String(a.source_ref || '').localeCompare(String(b.source_ref || '')) ||
    String(recordTimestamp(a)).localeCompare(String(recordTimestamp(b))) ||
    stableJson(a).localeCompare(stableJson(b))
  );
}

function rows(source, table) {
  if (Array.isArray(source?.[table])) return source[table];
  if (table === 'usage' && Array.isArray(source?.session_usage)) return source.session_usage;
  return [];
}

function matches(session, options) {
  const since = options.since ? new Date(options.since).getTime() : -Infinity;
  const until = options.until ? new Date(options.until).getTime() : Infinity;
  const created = new Date(session.created_at || 0).getTime();
  const haystack = [session.repository, session.cwd, session.branch, session.summary].filter(Boolean).join(' ').toLowerCase();
  return (!options.session || options.session.includes(session.id))
    && (!options.repository || String(session.repository || '').toLowerCase().includes(options.repository.toLowerCase()))
    && (!options.cwd || String(session.cwd || '').toLowerCase().includes(options.cwd.toLowerCase()))
    && (!options.branch || session.branch === options.branch)
    && (!options.keyword || haystack.includes(options.keyword.toLowerCase()))
    && created >= since && created <= until;
}

function discoverSessions(source, options = {}) {
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 50;
  return rows(source, 'sessions')
    .filter(session => matches(session, options))
    .map(session => cleanRow(session, options))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')) || String(a.id).localeCompare(String(b.id)))
    .slice(0, limit);
}

function loadSessionEvidence(source, sessionIds) {
  const selected = new Set(sessionIds);
  const result = {};
  for (const table of TABLES) {
    result[table] = rows(source, table).filter(row =>
      table === 'sessions'
        ? selected.has(row.id)
        : Boolean(row.session_id) && selected.has(row.session_id)
    );
  }
  return result;
}

function dedupe(table, input) {
  const seen = new Set();
  return input.filter(row => {
    const ref = sourceRef(table, row);
    if (seen.has(ref)) return false;
    seen.add(ref);
    return true;
  });
}

function normalizeHistory(raw, options = {}) {
  const errors = Array.isArray(options.errors) ? [...options.errors] : [];
  const settings = { ...options, errors };
  const sessionFilter = Array.isArray(options.session) && options.session.length ? new Set(options.session) : null;
  const sessions = sortRecords(dedupe('sessions', rows(raw, 'sessions'))
    .filter(row => !sessionFilter || sessionFilter.has(row.id))
    .map(row => ({
      ...canonicalize('sessions', row, settings),
      source_ref: sourceRef('sessions', row)
    })));
  const selected = new Set(sessions.map(row => row.id));
  const normalizeTable = table => dedupe(table, rows(raw, table))
    .filter(row => Boolean(row.session_id) && selected.has(row.session_id))
    .map(row => ({
      ...canonicalize(table, row, settings),
      source_ref: sourceRef(table, row)
    }));
  const artifact = {
    schema_version: '1.0',
    miner_version: options.miner_version || '0.1.0',
    generated_at: options.generated_at || new Date().toISOString(),
    backend: options.backend || 'unknown',
    query: cleanValue(options.query || {}, settings),
    timezone: options.timezone || 'UTC',
    source_schema: cleanValue(options.source_schema || {}, settings),
    record_counts: {},
    redaction_rules_version: REDACTION_RULES_VERSION,
    incomplete_sources: cleanValue(Array.isArray(options.incomplete_sources) ? options.incomplete_sources : [], settings),
    sessions,
    turns: normalizeTable('turns'),
    checkpoints: normalizeTable('checkpoints'),
    files: normalizeTable('session_files'),
    refs: normalizeTable('session_refs'),
    usage: normalizeTable('usage'),
    tools: normalizeTable('tool_executions'),
    metrics: [],
    errors: cleanValue(errors, settings)
  };
  for (const key of ['turns', 'checkpoints', 'files', 'refs', 'usage', 'tools']) {
    artifact[key] = sortRecords(artifact[key]);
  }
  for (const key of ['sessions', 'turns', 'checkpoints', 'files', 'refs', 'usage', 'tools']) {
    artifact.record_counts[key] = artifact[key].length;
  }
  return artifact;
}

function evidence(value, kind, sourceRefs, methodVersion, limitations = []) {
  return {
    value,
    kind,
    evidence_tier: kind === 'observed' ? 1 : kind === 'inferred' ? 4 : 2,
    confidence: sourceRefs.length ? 'high' : 'unknown',
    source_refs: sourceRefs,
    method_version: methodVersion,
    limitations
  };
}

function calculateMetrics(artifact) {
  const metrics = [];
  const userTurns = artifact.turns.filter(row => text(row.user_message));
  const assistantTurns = artifact.turns.filter(row => text(row.assistant_response));
  metrics.push({ name: 'user_interactions', ...evidence(userTurns.length, 'derived', userTurns.map(row => row.source_ref), 'interactions-v1', ['Turn semantics may vary.']) });
  metrics.push({ name: 'assistant_interactions', ...evidence(assistantTurns.length, 'derived', assistantTurns.map(row => row.source_ref), 'interactions-v1', ['One response may contain multiple actions.']) });
  const toolSeconds = artifact.tools.reduce((sum, row) => {
    const start = Date.parse(row.started_at);
    const end = Date.parse(row.completed_at);
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? sum + (end - start) / 1000 : sum;
  }, 0);
  metrics.push({ name: 'active_tool_seconds', ...evidence(toolSeconds, 'derived', artifact.tools.map(row => row.source_ref), 'duration-v1', ['Only validated tool execution timestamps are included.']) });
  const skills = new Set();
  for (const row of [...artifact.turns, ...artifact.checkpoints]) {
    const content = `${row.user_message || ''} ${row.assistant_response || ''} ${row.title || ''} ${row.overview || ''}`;
    for (const match of content.matchAll(/(?:\/|skills?\s+)([a-z0-9][a-z0-9-]+)/gi)) skills.add(match[1].toLowerCase());
  }
  metrics.push({ name: 'skills_mentioned', ...evidence([...skills].sort(), 'inferred', artifact.turns.concat(artifact.checkpoints).map(row => row.source_ref), 'skill-match-v1', ['Exact text matches do not prove implicit skill use.']) });
  return metrics;
}

function mine(raw, options = {}) {
  const errors = Array.isArray(options.errors) ? [...options.errors] : [];
  const settings = { ...options, errors };
  const selected = discoverSessions(raw, settings);
  const artifact = normalizeHistory({ ...loadSessionEvidence(raw, selected.map(row => row.id)), sessions: selected }, settings);
  artifact.metrics = calculateMetrics(artifact);
  return artifact;
}

function toNdjson(artifact) {
  const recordTypes = new Set(['sessions', 'turns', 'checkpoints', 'files', 'refs', 'usage', 'tools']);
  const manifest = Object.fromEntries(
    Object.entries(artifact).filter(([type]) => !recordTypes.has(type))
  );
  const lines = [JSON.stringify({ type: 'manifest', ...manifest })];
  for (const type of recordTypes) {
    for (const record of artifact[type] || []) lines.push(JSON.stringify({ ...record, type }));
  }
  return `${lines.join('\n')}\n`;
}

module.exports = {
  discoverSessions,
  loadSessionEvidence,
  normalizeHistory,
  calculateMetrics,
  mine,
  redact,
  toNdjson
};
