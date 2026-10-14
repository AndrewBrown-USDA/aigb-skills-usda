#!/usr/bin/env node
const assert = require('assert');
const { parseNameStatus } = require('./interval_ledger');

const statuses = parseNameStatus(
  'R100\told/name.js\tnew/name.js\nC100\told/source.js\tnew/copy.js\nM\tsrc/index.js\n',
);
assert.deepStrictEqual(statuses, [
  { status: 'R100', path: 'new/name.js', oldPath: 'old/name.js' },
  { status: 'C100', path: 'new/copy.js', oldPath: 'old/source.js' },
  { status: 'M', path: 'src/index.js' },
]);
console.log('Interval ledger tests passed.');
