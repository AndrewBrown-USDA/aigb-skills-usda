'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { resolve } = require('./skill-loadouts');
const s = (name, extra = {}) => ({ name, source_repo: 'aigb-skills', source_path: `skills/${name}/SKILL.md`, ...extra });
const names = result => result.skills.map(x => x.name);
const catalog = { skills: [
  s('a', { loadout: 'base', dependencies: ['c'] }),
  s('b', { loadout: 'base', dependencies: ['c'] }),
  s('c'),
  s('opt', { optional_dependencies: ['c'] }),
  s('bad-opt', { optional_dependencies: ['gone'] }),
  s('versioned', { version: '1.0.0' })
] };
const scratch = path.join(__dirname, '..', '.scratch', 'loadout-tests');
fs.mkdirSync(scratch, { recursive: true });
try {
  assert.deepStrictEqual(names(resolve(['loadout:base'], catalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['a', 'b'], catalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['opt'], catalog)), ['opt']);
  assert.deepStrictEqual(names(resolve(['opt'], catalog, { include: ['c'] })), ['c', 'opt']);
  assert.deepStrictEqual(names(resolve(['a'], catalog, { include: ['c'], exclude: ['c'], force: ['c'] })), ['c', 'a']);
  assert.strictEqual(resolve(['a'], catalog, { exclude: ['a'] }).ok, false);
  assert.strictEqual(resolve(['a'], catalog, { exclude: ['a'], force: ['a'] }).ok, true);
  assert.strictEqual(resolve(['loadout:not-real'], catalog).diagnostics[0].code, 'missing-loadout');
  assert.strictEqual(resolve([], catalog, { include: ['c'] }).diagnostics[0].code, 'roots-required');
  assert.deepStrictEqual(resolve(['opt'], catalog, { include: ['gone'] }).diagnostics.map(d => [d.code, d.subject]), [
    ['unknown-override', 'gone']
  ]);
  assert.strictEqual(resolve(['missing'], catalog).diagnostics[0].code, 'missing-root');
  assert.deepStrictEqual(resolve(['missing'], catalog).diagnostics.map(d => [d.code, d.subject, d.path]), [
    ['missing-root', 'missing', []]
  ]);
  const shaped = resolve(['missing'], catalog).diagnostics[0];
  assert.strictEqual(shaped.severity, 'error');
  assert.strictEqual(typeof shaped.message, 'string');
  assert.ok(Array.isArray(shaped.path));
  assert.throws(() => resolve(['invalid name'], catalog), /invalid skill selection/);
  assert.strictEqual(resolve(['versioned'], catalog, { constraints: { versioned: '1.0.0' } }).ok, true);
  assert.match(resolve(['versioned'], catalog, { constraints: { versioned: '2.0.0' } }).diagnostics[0].message, /does not match/);
  assert.match(resolve(['versioned'], catalog, { constraints: { versioned: '>=1' } }).diagnostics[0].message, /exact version strings only/);
  assert.match(resolve(['a'], catalog, { constraints: { a: '1.0.0' } }).diagnostics[0].message, /no resolved version/);
  assert.strictEqual(resolve(['versioned'], catalog, { constraints: { absent: '1.0' } }).diagnostics[0].code, 'unknown-constraint');
  const cycle = { skills: [s('x', { dependencies: ['y'] }), s('y', { dependencies: ['x'] })] };
  const cycleResult = resolve(['x'], cycle);
  assert.strictEqual(cycleResult.ok, false);
  assert.deepStrictEqual(cycleResult.diagnostics.map(d => [d.code, d.subject, d.path]), [['cycle', 'x', ['x', 'y', 'x']]]);
  const unsafe = { skills: [s('x', { source_path: '../x/SKILL.md' })] };
  const unsafeResult = resolve(['x'], unsafe);
  assert.strictEqual(unsafeResult.ok, false);
  assert.deepStrictEqual(unsafeResult.diagnostics.map(d => [d.code, d.subject]), [['invalid-catalog', '', ''].slice(0, 2)]);
  assert.strictEqual(resolve(['x'], { skills: [s('x', { source_path: path.join('skills', 'x', 'SKILL.md') })] }).ok, false);
  assert.strictEqual(resolve(['a'], catalog).skills[1].source_path, 'skills/a/SKILL.md');
  assert.deepStrictEqual(resolve(['a', 'a'], catalog).skills.map(x => x.name), ['c', 'a']);
  console.log('Skill loadout tests passed.');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
