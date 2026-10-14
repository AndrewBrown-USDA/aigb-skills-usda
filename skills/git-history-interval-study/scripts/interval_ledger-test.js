#!/usr/bin/env node
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const { normalizeMainlineBoundaries, parseNameStatus, parseArgs } = require('./interval_ledger');

function withArgs(argv, callback) {
  const original = process.argv;
  process.argv = ['node', 'interval_ledger.js', ...argv];
  try {
    return callback();
  } finally {
    process.argv = original;
  }
}

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

assert.strictEqual(withArgs(['--mainline'], () => parseArgs().strategy), 'mainline');
assert.throws(() => withArgs(['--pattern'], parseArgs), /--pattern requires a value/);
assert.throws(() => withArgs(['--range', '--tags'], parseArgs), /--range requires a value/);
assert.throws(() => withArgs(['--unknown'], parseArgs), /Unknown option: --unknown/);
assert.throws(
  () => withArgs(['--mainline', '--tags'], parseArgs),
  /Boundary strategies are mutually exclusive: mainline, tags/,
);

function run(command, args, options = {}) {
  return childProcess.spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  });
}

function gitFixture(repoDir, args) {
  const result = run('git', args, { cwd: repoDir });
  assert.strictEqual(result.status, 0, `${args.join(' ')} failed:\n${result.stderr}`);
  return result;
}

function createGitFixture(rootDir) {
  const repoDir = path.join(rootDir, 'repo');
  fs.mkdirSync(repoDir, { recursive: true });
  gitFixture(repoDir, ['init', '-q']);
  gitFixture(repoDir, ['config', 'user.email', 'interval-test@example.invalid']);
  gitFixture(repoDir, ['config', 'user.name', 'Interval Test']);

  fs.writeFileSync(path.join(repoDir, 'tracked.txt'), 'initial\n');
  gitFixture(repoDir, ['add', 'tracked.txt']);
  gitFixture(repoDir, ['commit', '-qm', 'feat: add tracked file']);

  fs.renameSync(path.join(repoDir, 'tracked.txt'), path.join(repoDir, 'renamed.txt'));
  gitFixture(repoDir, ['add', '-A']);
  gitFixture(repoDir, ['commit', '-qm', 'refactor: rename tracked file']);

  fs.copyFileSync(path.join(repoDir, 'renamed.txt'), path.join(repoDir, 'copy.txt'));
  gitFixture(repoDir, ['add', 'copy.txt']);
  gitFixture(repoDir, ['commit', '-qm', 'chore: copy tracked file']);
  return repoDir;
}

function runLedger(repoDir, outDir, args, env = process.env) {
  return run(process.execPath, [path.join(__dirname, 'interval_ledger.js'), ...args, '--out', outDir], {
    cwd: repoDir,
    env,
  });
}

function assertNoLedgerArtifacts(outDir) {
  assert.ok(!fs.existsSync(path.join(outDir, 'interval-ledger.json')));
  assert.ok(!fs.existsSync(path.join(outDir, 'evolution-digest.md')));
}

const fixtureRoot = path.resolve(__dirname, '..', '..', '..', '.scratch', 'interval-ledger-cli-fixtures');
fs.rmSync(fixtureRoot, { recursive: true, force: true });
fs.mkdirSync(fixtureRoot, { recursive: true });
try {
  const repoDir = createGitFixture(fixtureRoot);
  const validOut = path.join(fixtureRoot, 'valid-output');
  const validRun = runLedger(repoDir, validOut, ['--range', 'HEAD~2..HEAD']);
  assert.strictEqual(validRun.status, 0, validRun.stderr);
  const ledger = JSON.parse(fs.readFileSync(path.join(validOut, 'interval-ledger.json'), 'utf8'));
  for (const field of ['strategy', 'boundaries', 'summary', 'subsystem', 'convergence', 'intervals']) {
    assert.ok(Object.prototype.hasOwnProperty.call(ledger, field), `missing ledger field: ${field}`);
  }
  assert.strictEqual(ledger.strategy, 'range');
  assert.ok(ledger.boundaries.length >= 2);
  assert.ok(ledger.intervals.length >= 1);
  assert.ok(ledger.intervals.every(interval => (
    interval.fromTrigger
    && interval.toTrigger
    && Array.isArray(interval.commits)
    && interval.metrics
    && Array.isArray(interval.fileStatuses)
    && interval.subsystemFileModifications
    && interval.convergenceStatus
  )));
  const renameOrCopy = ledger.intervals
    .flatMap(interval => interval.fileStatuses)
    .filter(item => /^R|^C/.test(item.status));
  assert.ok(renameOrCopy.some(item => item.status.startsWith('R')));
  assert.ok(renameOrCopy.some(item => item.status.startsWith('C')));
  for (const item of renameOrCopy) {
    assert.ok(item.path);
    assert.ok(item.oldPath);
  }

  const invalidOut = path.join(fixtureRoot, 'invalid-output');
  const invalidRun = runLedger(repoDir, invalidOut, ['--range', 'missing-revision..HEAD']);
  assert.notStrictEqual(invalidRun.status, 0);
  assert.match(`${invalidRun.stderr}${invalidRun.stdout}`, /missing-revision|unknown revision|bad revision/i);
  assertNoLedgerArtifacts(invalidOut);

  const logFailOut = path.join(fixtureRoot, 'log-failure-output');
  const logFail = runLedger(repoDir, logFailOut, ['--range', 'HEAD~2..HEAD'], {
    ...process.env,
    INTERVAL_GIT_FAIL: 'log',
  });
  assert.notStrictEqual(logFail.status, 0);
  assert.match(logFail.stderr, /controlled git log failure/);
  assertNoLedgerArtifacts(logFailOut);

  const diffFailOut = path.join(fixtureRoot, 'diff-failure-output');
  const diffFail = runLedger(repoDir, diffFailOut, ['--range', 'HEAD~2..HEAD'], {
    ...process.env,
    INTERVAL_GIT_FAIL: 'diff',
  });
  assert.notStrictEqual(diffFail.status, 0);
  assert.match(diffFail.stderr, /controlled git diff failure/);
  assertNoLedgerArtifacts(diffFailOut);
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Interval ledger tests passed.');
