'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const installer = require('./install');
const scratch = path.join(__dirname, '..', '.scratch', 'loadout-tests', '16.2.1', 'installer');
fs.mkdirSync(scratch, { recursive: true });
const root = fs.mkdtempSync(path.join(scratch, 'skills-install-'));
try {
  const source = path.join(root, 'skills');
  for (const name of ['a', 'c']) {
    fs.mkdirSync(path.join(source, name), { recursive: true });
    fs.writeFileSync(path.join(source, name, 'SKILL.md'), `# ${name}\n`);
  }
  fs.writeFileSync(path.join(source, 'a', 'extra.txt'), 'a');
  const catalog = { skills: [
    { name: 'a', source_repo: 'aigb-skills', source_path: 'skills/a/SKILL.md', dependencies: ['c'] },
    { name: 'c', source_repo: 'aigb-skills', source_path: 'skills/c/SKILL.md' }
  ] };
  const result = installer.resolveLoadout(['a'], catalog);
  assert.deepStrictEqual(result.skills.map(skill => skill.name), ['c', 'a']);
  assert.ok(installer.readCatalog && installer.installResolved && installer.buildCatalog);
  const target = path.join(root, 'target');
  const installedResult = installer.installResolved(result, { sourceDir: source, targetDir: target, mode: 'copy' });
  assert.deepStrictEqual(installedResult, {
    mode: 'copy',
    sourceDir: source,
    targetDir: target,
    count: 2,
    skills: ['c', 'a'],
    installed: ['c', 'a'],
    skipped: []
  });
  assert.ok(fs.existsSync(path.join(target, 'c', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(target, 'a', 'extra.txt')));
  assert.throws(() => installer.installResolved(result, { sourceDir: source, target, mode: 'copy' }), /already exist/);
  const symlinkTarget = path.join(root, 'links');
  installer.installResolved(result, { sourceDir: source, target: symlinkTarget, mode: 'symlink' });
  assert.ok(fs.lstatSync(path.join(symlinkTarget, 'a')).isSymbolicLink() || process.platform === 'win32');
  const cli = path.join(__dirname, 'install.js');
  const packaged = installer.readCatalog();
  const rootName = packaged.skills[0].name;
  const runCli = (...args) => spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8'
  });
  const assertCliFailure = (cliResult, expected, targetPath) => {
    assert.equal(cliResult.status, 1);
    assert.equal(cliResult.stdout, '');
    assert.match(cliResult.stderr, expected);
    assert.doesNotMatch(cliResult.stderr, /(TypeError|ReferenceError|at\s+\S+\s+\(|node:internal)/);
    if (targetPath) assert.ok(!fs.existsSync(targetPath));
  };
  const selectedTarget = path.join(root, 'selected');
  let cliResult = runCli('--target', selectedTarget, '--skill', rootName, '--include', rootName, '--include', rootName, '--exclude', rootName);
  assertCliFailure(cliResult, /excluded-root/, selectedTarget);
  const forcedTarget = path.join(root, 'forced');
  cliResult = runCli('--target', forcedTarget, '--skill', rootName, '--exclude', rootName, '--exclude', rootName);
  assertCliFailure(cliResult, /excluded-root/, forcedTarget);
  cliResult = runCli('--target', forcedTarget, '--skill', rootName, '--exclude', rootName, '--force');
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.equal(cliResult.stdout, `Installed 1 skills to ${forcedTarget} using copy mode.\n`);
  assert.equal(cliResult.stderr, '');
  assert.deepStrictEqual(fs.readdirSync(forcedTarget).sort(), [rootName]);
  fs.writeFileSync(path.join(forcedTarget, rootName, 'changed.txt'), 'old');
  cliResult = runCli('--target', forcedTarget, '--skill', rootName, '--force');
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.ok(!fs.existsSync(path.join(forcedTarget, rootName, 'changed.txt')));
  const missingTarget = path.join(root, 'missing-target');
  const missing = runCli('--target', missingTarget, '--skill', 'missing');
  assertCliFailure(missing, /Skill\(s\) not found/, missingTarget);
  const sentinelTarget = path.join(root, 'sentinel');
  fs.mkdirSync(sentinelTarget);
  fs.writeFileSync(path.join(sentinelTarget, 'sentinel.txt'), 'keep');
  const invalid = runCli('--target', sentinelTarget, '--skill', 'missing');
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, '');
  assert.match(invalid.stderr, /Skill\(s\) not found/);
  assert.equal(fs.readFileSync(path.join(sentinelTarget, 'sentinel.txt'), 'utf8'), 'keep');
  assert.deepStrictEqual(fs.readdirSync(sentinelTarget), ['sentinel.txt']);
  const omittedTarget = path.join(root, 'omitted');
  cliResult = runCli('--target', omittedTarget);
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.deepStrictEqual(fs.readdirSync(omittedTarget).sort(), packaged.skills.map(skill => skill.name).sort());
  assert.throws(() => installer.installResolved(result, { sourceDir: source, target: source, mode: 'copy' }), /overlap/);
  assert.throws(() => installer.installResolved(installer.resolveLoadout(['missing'], catalog), {
    sourceDir: source, target: path.join(root, 'failed')
  }));
  assert.ok(!fs.existsSync(path.join(root, 'failed')));
  const missingLoadoutTarget = path.join(root, 'missing-loadout');
  cliResult = runCli('--target', missingLoadoutTarget, '--skill', 'loadout:not-real');
  assertCliFailure(cliResult, /missing-loadout/, missingLoadoutTarget);
  for (const option of ['--include', '--exclude']) {
    const rootlessTarget = path.join(root, `rootless-${option.slice(2)}`);
    cliResult = runCli('--target', rootlessTarget, option, 'missing');
    assertCliFailure(cliResult, /roots-required/, rootlessTarget);
  }
  for (const [option, expected] of [
    ['--target', /--target requires a path/],
    ['--source', /--source requires a path/],
    ['--skill', /--skill requires a non-empty skill name or comma-separated list/],
    ['--skills', /--skills requires a non-empty skill name or comma-separated list/],
    ['--include', /--include requires a non-empty skill name or comma-separated list/],
    ['--exclude', /--exclude requires a non-empty skill name or comma-separated list/],
    ['--mode', /--mode requires copy or symlink/]
  ]) {
    cliResult = runCli(option);
    assertCliFailure(cliResult, expected);
  }
  const invalidCatalog = path.join(root, 'catalog.json');
  fs.writeFileSync(invalidCatalog, JSON.stringify({ skills: [{ name: 'a', source_path: 'https://example.invalid/a' }] }));
  assert.throws(() => installer.readCatalog({ catalogPath: invalidCatalog, sourceDir: source }), /Invalid catalog|packaged source path/);
  assert.throws(() => installer.installResolved({ ok: false, skills: [] }, { sourceDir: source, target: path.join(root, 'bad') }), /unsuccessful/);
  const customCatalog = path.join(root, 'custom-catalog.json');
  fs.writeFileSync(customCatalog, JSON.stringify(catalog));
  const customTarget = path.join(root, 'custom-target');
  const customCliResult = runCli('--source', source, '--lockfile', customCatalog, '--target', customTarget, '--skill', 'a');
  assert.equal(customCliResult.status, 0, customCliResult.stderr);
  assert.deepStrictEqual(fs.readdirSync(customTarget).sort(), ['a', 'c']);
  console.log('Install loadout tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(path.join(__dirname, '..', '.scratch', 'loadout-tests', '16.2.1'), { recursive: true, force: true });
}
