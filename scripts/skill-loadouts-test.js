'use strict';
const assert = require('assert');
const { resolve } = require('./skill-loadouts');
const s = (name, extra = {}) => ({ name, source_repo: 'aigb-skills', source_path: `skills/${name}/SKILL.md`, ...extra });
const catalog = { skills: [
  s('a', { loadout: 'base', dependencies: ['c'] }),
  s('b', { loadout: 'base', dependencies: ['c'] }),
  s('c'),
  s('opt', { optional_dependencies: ['c'] })
] };
assert.deepStrictEqual(resolve(['loadout:base'], catalog).skills.map((x) => x.name), ['c', 'a', 'b']);
assert.deepStrictEqual(resolve(['opt'], catalog, { include: ['c'] }).skills.map((x) => x.name), ['c', 'opt']);
assert.strictEqual(resolve(['missing'], catalog).ok, false);
assert.strictEqual(resolve(['a'], catalog, { exclude: ['a'] }).ok, false);
console.log('Skill loadout tests passed.');
