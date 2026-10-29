'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { mine, toNdjson } = require('./history_miner');

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
assert.match(toNdjson(artifact), /"type":"sessions"/);
assert.doesNotMatch(JSON.stringify(mine({
  sessions: fixture.sessions,
  turns: [{ session_id: 'session-1', turn_index: 0, user_message: 'token=secret-value' }]
}, { backend: 'local' })), /secret-value/);

console.log('history miner tests passed');
