'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const installer = require('./install');
fs.mkdirSync(path.join(__dirname, '..', '.scratch'), { recursive: true });
const root = fs.mkdtempSync(path.join(__dirname, '..', '.scratch', 'skills-install-'));
try {
  const source = path.join(root, 'skills');
  for (const name of ['a', 'c']) {
    fs.mkdirSync(path.join(source, name), { recursive: true });
    fs.writeFileSync(path.join(source, name, 'SKILL.md'), `# ${name}\n`);
  }
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
  assert.throws(() => installer.installResolved(installer.resolveLoadout(['missing'], catalog), {
    sourceDir: source, target: path.join(root, 'failed')
  }));
  assert.ok(!fs.existsSync(path.join(root, 'failed')));
  console.log('Install loadout tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
