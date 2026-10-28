'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const installer = require('./install');
const scratch = path.join(__dirname, '..', '.scratch', 'loadout-tests');
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
  const installedResult = installer.installResolved(result, { sourceDir: source, target, mode: 'copy' });
  assert.deepStrictEqual(installedResult.installed, ['c', 'a']);
  assert.deepStrictEqual(installedResult.skipped, []);
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
  const selectedTarget = path.join(root, 'selected');
  let cliResult = runCli('--target', selectedTarget, '--skill', rootName, '--include', rootName, '--include', rootName, '--exclude', rootName);
  assert.equal(cliResult.status, 1);
  assert.match(cliResult.stderr, /excluded-root/);
  assert.ok(!fs.existsSync(selectedTarget));
  const forcedTarget = path.join(root, 'forced');
  cliResult = runCli('--target', forcedTarget, '--skill', rootName, '--exclude', rootName, '--exclude', rootName);
  assert.equal(cliResult.status, 1);
  assert.match(cliResult.stderr, /excluded-root/);
  assert.ok(!fs.existsSync(forcedTarget));
  cliResult = runCli('--target', forcedTarget, '--skill', rootName, '--exclude', rootName, '--force');
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.deepStrictEqual(fs.readdirSync(forcedTarget).sort(), [rootName]);
  fs.writeFileSync(path.join(forcedTarget, rootName, 'changed.txt'), 'old');
  cliResult = runCli('--target', forcedTarget, '--skill', rootName, '--force');
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.ok(!fs.existsSync(path.join(forcedTarget, rootName, 'changed.txt')));
  const missingTarget = path.join(root, 'missing-target');
  const missing = runCli('--target', missingTarget, '--skill', 'missing');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Skill\(s\) not found/);
  assert.ok(!fs.existsSync(missingTarget));
  const sentinelTarget = path.join(root, 'sentinel');
  fs.mkdirSync(sentinelTarget);
  fs.writeFileSync(path.join(sentinelTarget, 'sentinel.txt'), 'keep');
  const invalid = runCli('--target', sentinelTarget, '--skill', 'missing');
  assert.equal(invalid.status, 1);
  assert.equal(fs.readFileSync(path.join(sentinelTarget, 'sentinel.txt'), 'utf8'), 'keep');
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
  assert.equal(cliResult.status, 1);
  assert.match(cliResult.stderr, /missing-loadout/);
  assert.ok(!fs.existsSync(missingLoadoutTarget));
  const rootlessTarget = path.join(root, 'rootless');
  cliResult = runCli('--target', rootlessTarget, '--include', rootName);
  assert.equal(cliResult.status, 1);
  assert.match(cliResult.stderr, /roots-required/);
  assert.ok(!fs.existsSync(rootlessTarget));
  for (const [option, expected] of [
    ['--target', /--target requires a path/],
    ['--source', /--source requires a path/],
    ['--skill', /--skill requires a non-empty skill name/],
    ['--include', /--include requires a non-empty skill name/],
    ['--exclude', /--exclude requires a non-empty skill name/],
    ['--mode', /--mode requires copy or symlink/]
  ]) {
    cliResult = runCli(option);
    assert.equal(cliResult.status, 1);
    assert.match(cliResult.stderr, expected);
  }
  const invalidCatalog = path.join(root, 'catalog.json');
  fs.writeFileSync(invalidCatalog, JSON.stringify({ skills: [{ name: 'a', source_path: 'https://example.invalid/a' }] }));
  assert.throws(() => installer.readCatalog({ catalogPath: invalidCatalog, sourceDir: source }), /Invalid catalog|packaged source path/);
  assert.throws(() => installer.installResolved({ ok: false, skills: [] }, { sourceDir: source, target: path.join(root, 'bad') }), /unsuccessful/);
  console.log('Install loadout tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(scratch, { recursive: true, force: true });
}
