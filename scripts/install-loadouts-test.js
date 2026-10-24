'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
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
  installer.installResolved(result, { sourceDir: source, target, mode: 'copy' });
  assert.ok(fs.existsSync(path.join(target, 'c', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(target, 'a', 'extra.txt')));
  assert.throws(() => installer.installResolved(result, { sourceDir: source, target, mode: 'copy' }), /already exist/);
  installer.installResolved(result, { sourceDir: source, target, mode: 'copy', force: true });
  const symlinkTarget = path.join(root, 'links');
  installer.installResolved(result, { sourceDir: source, target: symlinkTarget, mode: 'symlink' });
  assert.ok(fs.lstatSync(path.join(symlinkTarget, 'a')).isSymbolicLink() || process.platform === 'win32');
  assert.throws(() => installer.installResolved(result, { sourceDir: source, target: source, mode: 'copy' }), /overlap/);
  assert.throws(() => installer.installResolved(installer.resolveLoadout(['missing'], catalog), {
    sourceDir: source, target: path.join(root, 'failed')
  }));
  assert.ok(!fs.existsSync(path.join(root, 'failed')));
  const invalidCatalog = path.join(root, 'catalog.json');
  fs.writeFileSync(invalidCatalog, JSON.stringify({ skills: [{ name: 'a', source_path: 'https://example.invalid/a' }] }));
  assert.throws(() => installer.readCatalog({ catalogPath: invalidCatalog, sourceDir: source }), /Invalid catalog|packaged source path/);
  assert.throws(() => installer.installResolved({ ok: false, skills: [] }, { sourceDir: source, target: path.join(root, 'bad') }), /unsuccessful/);
  console.log('Install loadout tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(scratch, { recursive: true, force: true });
}
