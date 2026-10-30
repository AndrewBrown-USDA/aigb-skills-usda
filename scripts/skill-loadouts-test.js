'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isLoadoutMember, resolve } = require('./skill-loadouts');
const s = (name, extra = {}) => ({ name, source_repo: 'aigb-skills', source_path: `skills/${name}/SKILL.md`, ...extra });
const names = result => result.skills.map(x => x.name);
const assertFailure = (result, code, subject = '') => {
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.skills, []);
  assert.strictEqual(result.diagnostics.length, 1);
  assert.deepStrictEqual(Object.keys(result.diagnostics[0]).sort(), [
    'code', 'detail', 'legacyPath', 'message', 'path', 'severity', 'subject'
  ]);
  assert.strictEqual(result.diagnostics[0].code, code);
  assert.strictEqual(result.diagnostics[0].severity, 'error');
  assert.strictEqual(result.diagnostics[0].subject, subject);
  assert.strictEqual(typeof result.diagnostics[0].message, 'string');
  assert.strictEqual(typeof result.diagnostics[0].detail, 'string');
  assert.strictEqual(typeof result.diagnostics[0].legacyPath, 'string');
  assert.ok(Array.isArray(result.diagnostics[0].path));
  return result.diagnostics[0];
};
const catalog = { skills: [
  s('a', { loadout: 'base', loadouts: ['shared'], dependencies: ['c'] }),
  s('b', { loadout: 'base', loadouts: ['shared'], dependencies: ['c'] }),
  s('c'),
  s('opt', { optional_dependencies: ['c'] }),
  s('bad-opt', { optional_dependencies: ['gone'] }),
  s('versioned', { version: '1.0.0' })
] };
const scratch = path.join(__dirname, '..', '.scratch', 'loadout-tests', '16.2.1', 'resolver');
fs.mkdirSync(scratch, { recursive: true });
try {
  assert.strictEqual(isLoadoutMember(catalog.skills[0], 'base'), true);
  assert.strictEqual(isLoadoutMember(catalog.skills[0], 'shared'), true);
  assert.strictEqual(isLoadoutMember(catalog.skills[0], 'missing'), false);
  assert.strictEqual(isLoadoutMember(null, 'base'), false);
  assert.deepStrictEqual(names(resolve(['loadout:base'], catalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['loadout:shared'], catalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['a', 'b'], catalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['opt'], catalog)), ['opt']);
  assert.deepStrictEqual(names(resolve(['opt'], catalog, { include: ['c'] })), ['c', 'opt']);
  assert.deepStrictEqual(names(resolve(['a'], catalog, { include: ['c'], exclude: ['c'], force: ['c'] })), ['c', 'a']);
  const excludedRoot = assertFailure(resolve(['a'], catalog, { exclude: ['a'] }), 'excluded-root', 'a');
  assert.strictEqual(excludedRoot.message, 'a');
  const forcedRoot = resolve(['a'], catalog, { exclude: ['a'], force: ['a'] });
  assert.strictEqual(forcedRoot.ok, true);
  assert.deepStrictEqual(names(forcedRoot), ['c', 'a']);
  assert.deepStrictEqual(forcedRoot.diagnostics, []);
  const missingLoadout = assertFailure(resolve(['loadout:not-real'], catalog), 'missing-loadout', 'not-real');
  assert.match(missingLoadout.message, /no packaged members/);
  assert.match(resolve(['a'], { schema_version: 2, skills: [s('a')] }).diagnostics[0].message, /unsupported catalog schema_version/);
  for (const options of [{ include: ['c'] }, { exclude: ['c'] }]) {
    const rootless = assertFailure(resolve([], catalog, options), 'roots-required');
    assert.match(rootless.message, /require at least one explicit skill or loadout root/);
  }
  assert.deepStrictEqual(resolve(['opt'], catalog, { include: ['gone'] }).diagnostics.map(d => [d.code, d.subject]), [
    ['unknown-override', 'gone']
  ]);
  const shaped = assertFailure(resolve(['missing'], catalog), 'missing-root', 'missing');
  assert.deepStrictEqual(shaped.path, []);
  assert.strictEqual(shaped.legacyPath, '');
  assert.throws(() => resolve(['invalid name'], catalog), /invalid skill selection/);
  const exactVersion = resolve(['versioned'], catalog, { constraints: { versioned: '1.0.0' } });
  assert.strictEqual(exactVersion.ok, true);
  assert.deepStrictEqual(exactVersion.diagnostics, []);
  assert.deepStrictEqual(exactVersion.skills[0], {
    name: 'versioned',
    source_repo: 'aigb-skills',
    source_path: 'skills/versioned/SKILL.md',
    version: '1.0.0',
    source_url: 'https://github.com/AndrewBrown-USDA/aigb-skills.git',
    upstream_repo: null,
    upstream_ref: null
  });
  assert.match(assertFailure(
    resolve(['versioned'], catalog, { constraints: { versioned: '2.0.0' } }),
    'version-constraint',
    'versioned'
  ).message, /does not match/);
  assert.match(assertFailure(
    resolve(['versioned'], catalog, { constraints: { versioned: '>=1' } }),
    'version-constraint',
    'versioned'
  ).message, /exact version strings only/);
  assert.match(assertFailure(
    resolve(['a'], catalog, { constraints: { a: '1.0.0' } }),
    'version-constraint',
    'a'
  ).message, /no resolved version/);
  assert.match(assertFailure(
    resolve(['versioned'], catalog, { constraints: { absent: '1.0' } }),
    'unknown-constraint',
    'absent'
  ).message, /unknown skill/);
  const cycle = { skills: [s('x', { dependencies: ['y'] }), s('y', { dependencies: ['x'] })] };
  const cycleResult = resolve(['x'], cycle);
  assert.strictEqual(cycleResult.ok, false);
  assert.deepStrictEqual(cycleResult.diagnostics.map(d => [d.code, d.subject, d.path]), [['cycle', 'x', ['x', 'y', 'x']]]);
  assert.match(cycleResult.diagnostics[0].message, /required edge closes cycle: x -> y -> x/);
  assert.match(cycleResult.diagnostics[0].detail, /required edge closes cycle: x -> y -> x/);
  const missingRequired = resolve(['a'], { skills: [s('a', { dependencies: ['gone'] })] });
  assert.strictEqual(missingRequired.diagnostics[0].code, 'missing-skill');
  assert.match(missingRequired.diagnostics[0].message, /a -> gone/);
  assert.deepStrictEqual(missingRequired.diagnostics[0].path, ['a']);
  const missingOptional = resolve(['bad-opt'], catalog, { include: ['gone'] });
  const missingOptionalDiagnostic = missingOptional.diagnostics.find(d => d.code === 'missing-optional');
  assert.ok(missingOptionalDiagnostic);
  assert.match(missingOptionalDiagnostic.message, /bad-opt -> gone/);
  assert.deepStrictEqual(missingOptionalDiagnostic.path, ['bad-opt']);
  const unsafe = { skills: [s('x', { source_path: '../x/SKILL.md' })] };
  const unsafeResult = resolve(['x'], unsafe);
  assert.strictEqual(unsafeResult.ok, false);
  assert.deepStrictEqual(unsafeResult.diagnostics.map(d => [d.code, d.subject]), [['invalid-catalog', '', ''].slice(0, 2)]);
  assert.strictEqual(resolve(['x'], { skills: [s('x', { source_path: path.join('skills', 'x', 'SKILL.md') })] }).ok, false);
  assert.strictEqual(resolve(['a'], catalog).skills[1].source_path, 'skills/a/SKILL.md');
  assert.deepStrictEqual(resolve(['a', 'a'], catalog).skills.map(x => x.name), ['c', 'a']);
  console.log('Skill loadout tests passed.');
} finally {
  fs.rmSync(path.join(__dirname, '..', '.scratch', 'loadout-tests', '16.2.1'), { recursive: true, force: true });
}
