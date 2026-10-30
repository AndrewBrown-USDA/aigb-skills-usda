'use strict';

const crypto = require('node:crypto');

const TABLES = ['sessions', 'turns', 'checkpoints', 'session_files', 'session_refs', 'usage', 'session_usage', 'tool_executions'];
const REDACTION_RULES_VERSION = '1';

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

function sourceRef(table, row, index) {
  const identity = row.id || row.event_id || row.tool_call_id ||
    (row.session_id && (row.turn_index !== undefined || row.ref_value !== undefined)
      ? `${row.session_id}:${row.turn_index ?? row.ref_value}`
      : null);
  return `${table}:${identity || hash(row)}`;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function redact(value, options = {}) {
  if (typeof value !== 'string') return value;
  const patterns = options.redactPatterns || [
    /([?&](?:token|key|secret|password)=)[^&\s]+/gi,
    /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/gi
  ];
  const redacted = patterns.reduce((result, pattern) => result.replace(pattern, match => {
    const separator = match.match(/^([?&][^=]+=|[^:=\s]+[:=]\s*)/);
    return separator ? `${separator[1]}[REDACTED]` : '[REDACTED]';
  }), value);
  const pathPattern = /(?:[A-Za-z]:[\\/]|\\\\|\/)(?:[^\\/\s"'<>]+[\\/]?)+/g;
  return redacted.replace(pathPattern, (match, offset, full) => {
    const prefix = full.slice(0, offset);
    return /https?:\/$/i.test(prefix) ? match : '[REDACTED_PATH]';
  });
}

function cleanValue(value, options) {
  if (typeof value === 'string') return redact(value, options);
  if (Array.isArray(value)) return value.map(item => cleanValue(item, options));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
      key,
      cleanValue(nested, options)
    ]));
  }
  return value;
}

function cleanRow(row, options) {
  return cleanValue(row || {}, options);
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
    result[table] = rows(source, table).filter(row => !row.session_id || selected.has(row.session_id));
  }
  return result;
}

function dedupe(table, input) {
  const seen = new Set();
  return input.filter((row, index) => {
    const ref = sourceRef(table, row, index);
    if (seen.has(ref)) return false;
    seen.add(ref);
    return true;
  });
}

function normalizeHistory(raw, options = {}) {
  const sessions = sortRecords(dedupe('sessions', rows(raw, 'sessions'))
    .map((row, index) => ({ ...cleanRow(row, options), source_ref: sourceRef('sessions', row, index) })));
  const selected = new Set(sessions.map(row => row.id));
  const normalizeTable = table => dedupe(table, rows(raw, table))
    .filter(row => !row.session_id || selected.has(row.session_id))
    .map((row, index) => ({ ...cleanRow(row, options), source_ref: sourceRef(table, row, index) }));
  const artifact = {
    schema_version: '1.0',
    miner_version: options.miner_version || '0.1.0',
    generated_at: options.generated_at || new Date().toISOString(),
    backend: options.backend || 'unknown',
    query: options.query || {},
    timezone: options.timezone || 'UTC',
    source_schema: options.source_schema || {},
    record_counts: {},
    redaction_rules_version: REDACTION_RULES_VERSION,
    incomplete_sources: Array.isArray(options.incomplete_sources) ? [...options.incomplete_sources] : [],
    sessions,
    turns: normalizeTable('turns'),
    checkpoints: normalizeTable('checkpoints'),
    files: normalizeTable('session_files'),
    refs: normalizeTable('session_refs'),
    usage: normalizeTable('usage'),
    tools: normalizeTable('tool_executions'),
    metrics: [],
    errors: Array.isArray(options.errors) ? [...options.errors] : []
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
  const candidates = discoverSessions(raw, options);
  const selected = options.session?.length ? candidates.filter(row => options.session.includes(row.id)) : candidates;
  const artifact = normalizeHistory({ ...loadSessionEvidence(raw, selected.map(row => row.id)), sessions: selected }, options);
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
    for (const record of artifact[type] || []) lines.push(JSON.stringify({ type, ...record }));
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
