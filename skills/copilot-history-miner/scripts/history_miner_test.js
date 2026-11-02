'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { loadSessionEvidence, mine, normalizeHistory, redact, toNdjson } = require('./history_miner');

const fixture = require(path.join(__dirname, '..', 'fixtures', 'local-history.json'));
const artifact = mine(fixture, {
  backend: 'local',
  generated_at: '2026-01-03T00:00:00.000Z',
  repository: 'example/repo',
  query: { repository: 'example/repo' }
});

assert.equal(artifact.schema_version, '1.0');
assert.equal(artifact.backend, 'local');
assert.equal(artifact.sessions.length, 1);
assert.equal(artifact.record_counts.turns, 2);
assert.equal(artifact.metrics.find(metric => metric.name === 'user_interactions').value, 1);
assert.equal(artifact.metrics.find(metric => metric.name === 'assistant_interactions').value, 2);
assert.equal(artifact.refs.length, 1);
const manifestArtifact = {
  ...artifact,
  incomplete_sources: ['tools'],
  errors: ['partial source']
};
const ndjson = toNdjson(manifestArtifact).trim().split('\n').map(line => JSON.parse(line));
assert.equal(ndjson[0].type, 'manifest');
assert.equal(ndjson[0].schema_version, '1.0');
assert.equal(ndjson[0].backend, 'local');
assert.deepEqual(ndjson[0].record_counts, manifestArtifact.record_counts);
assert.deepEqual(ndjson[0].metrics, manifestArtifact.metrics);
assert.deepEqual(ndjson[0].errors, manifestArtifact.errors);
assert.deepEqual(ndjson[0].incomplete_sources, manifestArtifact.incomplete_sources);
assert.match(toNdjson(artifact), /"type":"sessions"/);
assert.doesNotMatch(JSON.stringify(mine({
  sessions: fixture.sessions,
  turns: [{ session_id: 'session-1', turn_index: 0, user_message: 'token=secret-value' }]
}, { backend: 'local' })), /secret-value/);
assert.equal(redact('Unix /workspace/repo and Windows C:\\workspace\\repo'), 'Unix [REDACTED_PATH] and Windows [REDACTED_PATH]');
assert.equal(redact('nested https://example.com/path?session=abc123'), 'nested https://example.com/path?[REDACTED]');
assert.equal(redact('Windows C:\\Users\\Jane Doe\\repo'), 'Windows [REDACTED_PATH]');
assert.doesNotMatch(redact('token=secret-value', { redactPatterns: [] }), /secret-value/);
assert.equal(normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [{ session_id: 's1', payload: { token: 'secret', password: 'secret2' } }]
}).turns[0].payload.token, '[REDACTED]');
assert.equal(JSON.parse(toNdjson({
  ...artifact,
  sessions: [{ type: 'source-type' }]
}).split('\n')[1]).type, 'sessions');
const nested = normalizeHistory({
  sessions: [{ id: 's1', created_at: '2026-01-01T00:00:00Z' }],
  turns: [{
    session_id: 's1',
    payload: { cwd: '/home/user/repo', args: ['C:\\workspace\\repo', 'token=hidden'] }
  }]
});
assert.deepEqual(nested.turns[0].payload, {
  cwd: '[REDACTED_PATH]',
  args: ['[REDACTED_PATH]', 'token=[REDACTED]']
});
const hashed = normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [
    { session_id: 's1', payload: { nested: 'a' } },
    { session_id: 's1', payload: { nested: 'b' } }
  ]
});
assert.equal(new Set(hashed.turns.map(row => row.source_ref)).size, 2);
const ordered = normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [
    { session_id: 's1', turn_index: 1, timestamp: '2026-01-01', user_message: 'b' },
    { session_id: 's1', turn_index: 0, timestamp: '2026-01-02', user_message: 'a' }
  ]
}, { generated_at: '2026-01-03T00:00:00.000Z' });
const reversed = normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [
    { session_id: 's1', turn_index: 0, timestamp: '2026-01-02', user_message: 'a' },
    { session_id: 's1', turn_index: 1, timestamp: '2026-01-01', user_message: 'b' }
  ]
}, { generated_at: '2026-01-03T00:00:00.000Z' });
assert.deepEqual(ordered, reversed);
assert.deepEqual(ordered.turns.map(row => row.source_ref), ['turns:s1:0', 'turns:s1:1']);
assert.equal(normalizeHistory({ sessions: [{ id: 's1' }] }).sessions[0].status, 'unknown');
const canonical = normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [{ session_id: 's1' }],
  checkpoints: [{ session_id: 's1' }],
  session_files: [{ session_id: 's1' }],
  session_refs: [{ session_id: 's1' }],
  session_usage: [{ session_id: 's1', usage_model: 'test' }],
  tool_executions: [{ session_id: 's1', tool_call_id: 'tool-1' }]
});
assert.equal(canonical.turns[0].user_message, null);
assert.equal(canonical.checkpoints[0].overview, null);
assert.equal(canonical.files[0].file_path, null);
assert.equal(canonical.refs[0].ref_value, null);
assert.equal(canonical.usage[0].cost, null);
assert.equal(canonical.tools[0].success, null);
const files = normalizeHistory({
  sessions: [{ id: 's1' }],
  session_files: [
    { session_id: 's1', file_path: 'one.js', tool_name: 'edit' },
    { session_id: 's1', file_path: 'two.js', tool_name: 'edit' },
    { session_id: 's1', file_path: 'two.js', tool_name: 'create' }
  ]
});
assert.equal(new Set(files.files.map(row => row.source_ref)).size, 3);
assert.equal(redact('cwd C:\\workspace\\repo, branch main'), 'cwd [REDACTED_PATH], branch main');
assert.equal(redact('paths C:\\one\\two; C:\\three\\four'), 'paths [REDACTED_PATH]; [REDACTED_PATH]');
const leakyFiles = normalizeHistory({
  sessions: [{ id: 's1' }],
  session_files: [
    { session_id: 's1', file_path: 'C:\\Users\\Jane Doe\\repo\\src\\index.js', tool_name: 'edit' },
    { session_id: 's1', file_path: 'C:\\Users\\Other\\repo\\src\\index.js', tool_name: 'edit' }
  ]
});
assert.deepEqual(leakyFiles.files.map(row => row.file_path), ['[REDACTED_PATH]', '[REDACTED_PATH]']);
assert.equal(new Set(leakyFiles.files.map(row => row.source_ref)).size, 2);
assert.doesNotMatch(JSON.stringify(leakyFiles.files.map(row => row.source_ref)), /Users|Jane|repo|index|\\\\/);
const sensitive = normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [{
    session_id: 's1',
    payload: {
      access_token: 'a', refresh_token: 'b', client_secret: 'c', private_key: 'd',
      authorization: 'e', credential: 'f', input_tokens: 10, cache_read_tokens: 5
    }
  }],
  session_usage: [{ session_id: 's1', usage_model: 'm', input_tokens: 10, cache_read_tokens: 5 }]
});
assert.deepEqual(sensitive.turns[0].payload, {
  access_token: '[REDACTED]', refresh_token: '[REDACTED]', client_secret: '[REDACTED]',
  private_key: '[REDACTED]', authorization: '[REDACTED]', credential: '[REDACTED]',
  input_tokens: 10, cache_read_tokens: 5
});
assert.equal(sensitive.usage[0].input_tokens, 10);
assert.equal(sensitive.usage[0].cache_read_tokens, 5);
const evidence = loadSessionEvidence({
  sessions: [{ id: 's1' }, { id: 's2' }],
  turns: [{ session_id: 's1' }, { session_id: 's2' }, { turn_index: 0 }]
}, ['s1']);
assert.deepEqual(evidence.sessions.map(row => row.id), ['s1']);
assert.deepEqual(evidence.turns, [{ session_id: 's1' }]);
const bounded = normalizeHistory({
  sessions: [{ id: 's1' }, { id: 's2' }],
  turns: [{ session_id: 's1' }, { session_id: 's2' }, { turn_index: 0 }],
  session_files: [{ file_path: 'orphan.js' }],
  session_refs: [{ ref_value: 'orphan' }],
  session_usage: [{ usage_model: 'm' }],
  tool_executions: [{ tool_call_id: 'orphan' }]
}, { session: ['s1'] });
assert.deepEqual(bounded.sessions.map(row => row.id), ['s1']);
assert.equal(bounded.turns.length, 1);
assert.equal(bounded.files.length, 0);
assert.equal(bounded.refs.length, 0);
assert.equal(bounded.usage.length, 0);
assert.equal(bounded.tools.length, 0);
const unselected = normalizeHistory({
  sessions: [{ id: 's1' }, { id: 's2' }],
  turns: [{ session_id: 's1' }, { turn_index: 0 }]
});
assert.equal(unselected.sessions.length, 2);
assert.equal(unselected.turns.length, 1);
const failingPattern = { [Symbol.replace]() { throw new Error('pattern boom'); } };
const failedRedaction = normalizeHistory({
  sessions: [{ id: 's1' }],
  turns: [{ session_id: 's1', user_message: 'hello' }]
}, { redactPatterns: [failingPattern] });
assert.equal(failedRedaction.turns[0].user_message, 'hello');
assert.equal(failedRedaction.errors.filter(message => /pattern boom/.test(message)).length, 1);
assert.doesNotThrow(() => mine(fixture, { redactPatterns: [failingPattern] }));
assert.equal(mine(fixture, { redactPatterns: [failingPattern] }).errors
  .filter(message => /pattern boom/.test(message)).length, 1);

console.log('history miner tests passed');
