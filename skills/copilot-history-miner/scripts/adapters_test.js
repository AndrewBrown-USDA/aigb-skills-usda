'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const { isWithin, loadSource } = require('./adapters');
const { mine } = require('./history_miner');

const fixtures = path.join(__dirname, '..', 'fixtures');
const adapterSource = fs.readFileSync(path.join(__dirname, 'adapters.js'), 'utf8');
const scratch = path.join(__dirname, '..', '..', '..', '.scratch', 'miner-tests', `run-${process.pid}`);
const root = path.join(scratch, 'root');
const store = path.join(root, 'store');
const outside = path.join(scratch, 'outside');

const originalFetch = global.fetch;
const originalRequest = http.request;
const originalConnect = net.connect;
global.fetch = () => { throw new Error('outbound request is not allowed'); };
http.request = () => { throw new Error('outbound request is not allowed'); };
net.connect = () => { throw new Error('outbound connection is not allowed'); };

try {
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.mkdirSync(store, { recursive: true });
  fs.mkdirSync(outside, { recursive: true });

  fs.copyFileSync(path.join(fixtures, 'local-history.json'), path.join(store, 'local-history.json'));
  fs.writeFileSync(path.join(store, 'sessions.ndjson'), [
    JSON.stringify({ type: 'sessions', id: 'nd-1', repository: 'example/repo', created_at: '2026-02-01T00:00:00Z' })
  ].join('\n'));
  fs.writeFileSync(path.join(store, 'turns.ndjson'), [
    JSON.stringify({ type: 'turns', session_id: 'nd-1', turn_index: 0, user_message: 'hello' }),
    '{"oops',
    JSON.stringify({ type: 'manifest', backend: 'cloud' }),
    JSON.stringify({ table: 'turns', session_id: 'nd-1', rows: [{ turn_index: 1, assistant_response: 'hi' }] })
  ].join('\n'));
  fs.writeFileSync(path.join(store, 'tool_executions.ndjson'), [
    JSON.stringify({ type: 'tool_executions', session_id: 'nd-1', tool_call_id: 't1', tool_name: 'edit' }),
    JSON.stringify({ type: 'tool_executions', tool_call_id: 'orphan' })
  ].join('\n'));
  fs.writeFileSync(path.join(store, 'notes.txt'), 'not a session store');
  fs.writeFileSync(path.join(store, 'other.json'), JSON.stringify({ unrelated: [{ id: 'nope' }] }));
  fs.writeFileSync(path.join(outside, 'leak.json'), JSON.stringify({
    sessions: [{ id: 'outside-1', created_at: '2026-01-01T00:00:00Z' }]
  }));
  let symlinkCreated = false;
  try {
    fs.symlinkSync(path.join(outside, 'leak.json'), path.join(store, 'link.json'));
    symlinkCreated = true;
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
  }

  // No outbound API may appear in the adapter source.
  const forbidden = [
    /require\(\s*['"](?:node:)?(?:http|https|net|tls|dns|child_process)['"]\s*\)/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bchild_process\b/,
    /\.request\s*\(/
  ];
  for (const pattern of forbidden) assert.doesNotMatch(adapterSource, pattern);

  // Path containment helper rejects traversal and absolute escapes.
  assert.equal(isWithin('/a/b', '/a/b/c'), true);
  assert.equal(isWithin('/a/b', '/a/b/../c'), false);
  assert.equal(isWithin('/a/b', '/a/c'), false);
  assert.equal(isWithin('/a/b', '/a/b'), true);

  // Local backend: JSON fixture plus NDJSON rows from a caller-supplied root.
  const local = loadSource({ root });
  assert.deepEqual(Object.keys(local).sort(), ['backend', 'errors', 'incomplete_sources', 'raw']);
  assert.equal(local.backend, 'local');
  assert.ok(Object.keys(local.raw).length > 0);
  for (const table of Object.keys(local.raw)) {
    assert.ok(['sessions', 'turns', 'checkpoints', 'session_files', 'session_refs', 'usage', 'session_usage', 'tool_executions'].includes(table));
  }
  assert.deepEqual(local.raw.sessions.map(row => row.id).sort(), ['nd-1', 'session-1']);
  assert.equal(local.raw.turns.length, 4);
  const stamped = local.raw.turns.find(row => row.assistant_response === 'hi');
  assert.ok(stamped && stamped.session_id === 'nd-1' && stamped.turn_index === 1);
  assert.equal(local.raw.tool_executions.length, 1);
  assert.equal(local.raw.tool_executions[0].tool_call_id, 't1');
  assert.deepEqual(local.raw.checkpoints, []);
  assert.ok(local.errors.some(entry => /^local:file:store\/turns\.ndjson:invalid-line:2$/.test(entry)));
  assert.ok(!local.errors.some(entry => entry.includes('notes.txt')));
  assert.ok(!local.incomplete_sources.includes('local:sessions:missing'));
  assert.ok(!local.incomplete_sources.includes('local:turns:partial'));
  assert.ok(local.incomplete_sources.includes('local:usage:missing'));
  assert.ok(local.incomplete_sources.includes('local:session_usage:missing'));
  assert.ok(local.incomplete_sources.includes('local:tool_executions:partial'));
  assert.ok(!local.raw.sessions.some(row => row.id === 'outside-1'));
  assert.deepEqual(local.errors, [...local.errors].sort());

  // The caller's absolute root never leaks into reports.
  for (const entry of [...local.errors, ...local.incomplete_sources]) {
    assert.ok(!entry.includes(scratch), `absolute root leaked in: ${entry}`);
  }
  assert.ok(!JSON.stringify(local.errors).includes(scratch));

  // Legacy callers keep working through mine/normalizeHistory.
  const artifact = mine(local.raw, { backend: local.backend });
  assert.equal(artifact.record_counts.sessions, 2);
  assert.equal(artifact.record_counts.turns, 4);
  assert.equal(artifact.record_counts.tools, 1);

  // Missing tables in a single-table root are reported, not fabricated.
  const onlySessions = path.join(scratch, 'sessions-only');
  fs.mkdirSync(onlySessions, { recursive: true });
  fs.writeFileSync(path.join(onlySessions, 'sessions.json'), JSON.stringify({
    sessions: [{ id: 'solo', created_at: '2026-01-01T00:00:00Z' }]
  }));
  const sparse = loadSource({ root: onlySessions });
  assert.deepEqual(Object.keys(sparse.raw), ['sessions']);
  assert.ok(sparse.incomplete_sources.includes('local:turns:missing'));
  assert.ok(sparse.incomplete_sources.includes('local:usage:missing'));

  // Cloud backend through an injected transport only.
  const cloudFixture = JSON.parse(fs.readFileSync(path.join(fixtures, 'cloud-history.json'), 'utf8'));
  let transportCalls = 0;
  const transport = () => {
    transportCalls += 1;
    return cloudFixture;
  };
  const cloud = loadSource({ backend: 'cloud', transport });
  assert.equal(transportCalls, 1);
  assert.equal(cloud.backend, 'cloud');
  assert.deepEqual(Object.keys(cloud).sort(), ['backend', 'errors', 'incomplete_sources', 'raw']);
  assert.deepEqual(cloud.raw.sessions.map(row => row.id), ['cloud-1']);
  assert.equal(cloud.raw.usage.length, 1);
  assert.equal(cloud.raw.tool_executions.length, 1);
  assert.ok(cloud.incomplete_sources.includes('cloud:turns:missing'));
  const cloudArtifact = mine(cloud.raw, { backend: cloud.backend });
  assert.equal(cloudArtifact.record_counts.usage, 1);
  assert.equal(cloudArtifact.record_counts.sessions, 1);

  // Auto precedence: readable root wins and the transport is never called.
  transportCalls = 0;
  const autoLocal = loadSource({ root, transport });
  assert.equal(autoLocal.backend, 'local');
  assert.equal(transportCalls, 0);
  assert.equal(autoLocal.raw.sessions.length, 2);

  // Unreadable root falls back to cloud, keeping the local error.
  const fallback = loadSource({ root: path.join(scratch, 'missing-root'), transport });
  assert.equal(fallback.backend, 'cloud');
  assert.equal(transportCalls, 1);
  assert.ok(fallback.errors.some(entry => /^local: root unreadable: ENOENT$/.test(entry)));
  assert.ok(fallback.errors.every(entry => !entry.includes(scratch)));

  // No root and no transport: unknown with an explicit limitation.
  const unknown = loadSource({});
  assert.equal(unknown.backend, 'unknown');
  assert.deepEqual(unknown.raw, {});
  assert.ok(unknown.incomplete_sources.includes('unknown:no-source'));
  assert.ok(unknown.errors.some(entry => /no readable local root or cloud transport/.test(entry)));

  // Explicit unknown labels are reported, not silently coerced.
  const labelled = loadSource({ backend: 'sqlite' });
  assert.equal(labelled.backend, 'unknown');
  assert.ok(labelled.errors.some(entry => /unknown backend: sqlite/.test(entry)));

  // Cloud failures route to errors and incomplete_sources.
  const thrown = loadSource({
    backend: 'cloud',
    transport: () => {
      const error = new Error('connection refused');
      error.code = 'ECONNREFUSED';
      throw error;
    }
  });
  assert.ok(thrown.errors.includes('cloud:transport: ECONNREFUSED'));
  assert.ok(thrown.incomplete_sources.includes('cloud:sessions:missing'));
  const asyncTransport = loadSource({ backend: 'cloud', transport: () => Promise.resolve(cloudFixture) });
  assert.ok(asyncTransport.errors.includes('cloud:transport: unsupported async transport'));
  const malformed = loadSource({ backend: 'cloud', transport: () => ({ sessions: 'nope' }) });
  assert.ok(malformed.errors.includes('cloud:invalid-table:sessions'));
  assert.ok(malformed.incomplete_sources.includes('cloud:sessions:missing'));

  assert.equal(symlinkCreated, true);
  console.log('history miner adapter tests passed');
} finally {
  global.fetch = originalFetch;
  http.request = originalRequest;
  net.connect = originalConnect;
  fs.rmSync(scratch, { recursive: true, force: true });
}
