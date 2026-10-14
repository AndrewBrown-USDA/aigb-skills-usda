#!/usr/bin/env node
const assert = require('assert');
const { normalizeMainlineBoundaries, parseNameStatus } = require('./interval_ledger');

const statuses = parseNameStatus(
  'R100\told/name.js\tnew/name.js\nC100\told/source.js\tnew/copy.js\nM\tsrc/index.js\n',
);
assert.deepStrictEqual(statuses, [
  { status: 'R100', path: 'new/name.js', oldPath: 'old/name.js' },
  { status: 'C100', path: 'new/copy.js', oldPath: 'old/source.js' },
  { status: 'M', path: 'src/index.js' },
]);

const root = { sha: 'root', trigger: 'root' };
const mergeA = { sha: 'merge-a', trigger: 'merge-a' };
const mergeB = { sha: 'merge-b', trigger: 'merge-b' };
const head = { sha: 'head', trigger: 'HEAD' };

assert.deepStrictEqual(
  normalizeMainlineBoundaries([], root, head, ['root', 'head']).map(boundary => boundary.sha),
  ['root', 'head'],
);
assert.deepStrictEqual(
  normalizeMainlineBoundaries([mergeA], root, head, ['root', 'merge-a', 'head'])
    .map(boundary => boundary.sha),
  ['root', 'merge-a', 'head'],
);
assert.deepStrictEqual(
  normalizeMainlineBoundaries([mergeB, mergeA], root, head, ['root', 'merge-a', 'merge-b', 'head'])
    .map(boundary => boundary.sha),
  ['root', 'merge-a', 'merge-b', 'head'],
);

assert.throws(
  () => {
    const args = process.argv;
    process.argv = ['node', 'interval_ledger.js', '--mainline', '--tags'];
    try {
      require('./interval_ledger').parseArgs();
    } finally {
      process.argv = args;
    }
  },
  /Boundary strategies are mutually exclusive: mainline, tags/,
);

console.log('Interval ledger tests passed.');
