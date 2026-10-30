'use strict';
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { isLoadoutMember, resolve } = require('./skill-loadouts');
const { scanCuratedSkills, buildLockfile } = require('./mine-history');
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
const fixtureCatalog = { skills: [
  s('a', { loadout: 'base', loadouts: ['shared'], dependencies: ['c'] }),
  s('b', { loadout: 'base', loadouts: ['shared'], dependencies: ['c'] }),
  s('c'),
  s('opt', { optional_dependencies: ['c'] }),
  s('bad-opt', { optional_dependencies: ['gone'] }),
  s('versioned', { version: '1.0.0' })
] };
const catalogPath = path.join(__dirname, '..', 'catalog', 'skills.lock.json');
const realCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const packaged = scanCuratedSkills();
const generated = buildLockfile();
const scratch = path.join(__dirname, '..', '.scratch', 'loadout-tests', '18.4.1');
fs.mkdirSync(scratch, { recursive: true });
try {
  assert.strictEqual(realCatalog.schema_version, 1);
  assert.strictEqual(realCatalog.generated_by, 'scripts/mine-history.js');
  assert.deepStrictEqual(realCatalog.generated_from, generated.generated_from);
  assert.strictEqual(realCatalog.skills.length, 40);
  assert.deepStrictEqual(realCatalog.skills.map(x => x.name), [...realCatalog.skills.map(x => x.name)].sort());
  assert.deepStrictEqual(realCatalog.skills, packaged);
  assert.deepStrictEqual(realCatalog.skills, generated.skills);

  const firstJson = JSON.stringify(buildLockfile());
  const secondJson = JSON.stringify(buildLockfile());
  const firstPath = path.join(scratch, 'lockfile-a.json');
  const secondPath = path.join(scratch, 'lockfile-b.json');
  fs.writeFileSync(firstPath, firstJson, 'utf8');
  fs.writeFileSync(secondPath, secondJson, 'utf8');
  const firstBytes = fs.readFileSync(firstPath);
  const secondBytes = fs.readFileSync(secondPath);
  assert.deepStrictEqual(firstBytes, secondBytes);
  assert.strictEqual(
    crypto.createHash('sha256').update(firstBytes).digest('hex'),
    crypto.createHash('sha256').update(secondBytes).digest('hex')
  );

  const softwareDelivery = resolve(['loadout:software-delivery'], realCatalog);
  assert.strictEqual(softwareDelivery.ok, true);
  assert.deepStrictEqual(names(softwareDelivery), [
    'adr-distillation', 'agent-onboarding', 'apply-fed-oss-license',
    'arcpy-migration', 'bull-in-a-china-shop', 'code-review-2axis',
    'conventional-commits', 'doc-consistency', 'git-history-interval-study',
    'github-actions-ci', 'goal-alignment', 'grilling', 'install-skills',
    'json-processing-with-jq', 'makefile-development-workflow',
    'performance-benchmarking', 'plan-first', 'wave-orchestration',
    'plan-wave', 'ponytail', 'r-package-testing-workflow',
    'reviewer-architecture', 'reviewer-correctness', 'rubber-ducking',
    'skill-research', 'tdd', 'worker-validation'
  ]);
  assert.strictEqual(new Set(names(softwareDelivery)).size, names(softwareDelivery).length);

  const waveDelivery = resolve(['loadout:wave-delivery'], realCatalog);
  assert.strictEqual(waveDelivery.ok, true);
  assert.deepStrictEqual(names(waveDelivery), [
    'adr-distillation', 'conventional-commits', 'goal-alignment', 'grilling',
    'plan-first', 'wave-orchestration', 'plan-wave', 'worker-validation'
  ]);
  assert.strictEqual(new Set(names(waveDelivery)).size, names(waveDelivery).length);

  const directPlanWave = resolve(['plan-wave'], realCatalog);
  assert.strictEqual(directPlanWave.ok, true);
  assert.deepStrictEqual(names(directPlanWave), [
    'wave-orchestration', 'grilling', 'plan-wave'
  ]);
  assert.ok(names(directPlanWave).indexOf('wave-orchestration') < names(directPlanWave).indexOf('plan-wave'));
  assert.ok(names(directPlanWave).indexOf('grilling') < names(directPlanWave).indexOf('plan-wave'));
  assert.strictEqual(names(directPlanWave).includes('code-review-2axis'), false);

  const planWaveWithOptional = resolve(['plan-wave'], realCatalog, {
    include: ['code-review-2axis']
  });
  assert.strictEqual(planWaveWithOptional.ok, true);
  assert.deepStrictEqual(names(planWaveWithOptional), [
    'wave-orchestration', 'grilling', 'code-review-2axis', 'plan-wave'
  ]);
  assert.deepStrictEqual(planWaveWithOptional.diagnostics, []);

  assert.strictEqual(isLoadoutMember(fixtureCatalog.skills[0], 'base'), true);
  assert.strictEqual(isLoadoutMember(fixtureCatalog.skills[0], 'shared'), true);
  assert.strictEqual(isLoadoutMember(fixtureCatalog.skills[0], 'missing'), false);
  assert.strictEqual(isLoadoutMember(null, 'base'), false);
  assert.deepStrictEqual(names(resolve(['loadout:base'], fixtureCatalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['loadout:shared'], fixtureCatalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['a', 'b'], fixtureCatalog)), ['c', 'a', 'b']);
  assert.deepStrictEqual(names(resolve(['opt'], fixtureCatalog)), ['opt']);
  assert.deepStrictEqual(names(resolve(['opt'], fixtureCatalog, { include: ['c'] })), ['c', 'opt']);
  assert.deepStrictEqual(names(resolve(['a'], fixtureCatalog, { include: ['c'], exclude: ['c'], force: ['c'] })), ['c', 'a']);
  const excludedRoot = assertFailure(resolve(['a'], fixtureCatalog, { exclude: ['a'] }), 'excluded-root', 'a');
  assert.strictEqual(excludedRoot.message, 'a');
  const forcedRoot = resolve(['a'], fixtureCatalog, { exclude: ['a'], force: ['a'] });
  assert.strictEqual(forcedRoot.ok, true);
  assert.deepStrictEqual(names(forcedRoot), ['c', 'a']);
  assert.deepStrictEqual(forcedRoot.diagnostics, []);
  const missingLoadout = assertFailure(resolve(['loadout:not-real'], fixtureCatalog), 'missing-loadout', 'not-real');
  assert.match(missingLoadout.message, /no packaged members/);
  assert.match(resolve(['a'], { schema_version: 2, skills: [s('a')] }).diagnostics[0].message, /unsupported catalog schema_version/);
  for (const options of [{ include: ['c'] }, { exclude: ['c'] }]) {
    const rootless = assertFailure(resolve([], fixtureCatalog, options), 'roots-required');
    assert.match(rootless.message, /require at least one explicit skill or loadout root/);
  }
  assert.deepStrictEqual(resolve(['opt'], fixtureCatalog, { include: ['gone'] }).diagnostics.map(d => [d.code, d.subject]), [
    ['unknown-override', 'gone']
  ]);
  const shaped = assertFailure(resolve(['missing'], fixtureCatalog), 'missing-root', 'missing');
  assert.deepStrictEqual(shaped.path, []);
  assert.strictEqual(shaped.legacyPath, '');
  assert.throws(() => resolve(['invalid name'], fixtureCatalog), /invalid skill selection/);
  const exactVersion = resolve(['versioned'], fixtureCatalog, { constraints: { versioned: '1.0.0' } });
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
    resolve(['versioned'], fixtureCatalog, { constraints: { versioned: '2.0.0' } }),
    'version-constraint',
    'versioned'
  ).message, /does not match/);
  assert.match(assertFailure(
    resolve(['versioned'], fixtureCatalog, { constraints: { versioned: '>=1' } }),
    'version-constraint',
    'versioned'
  ).message, /exact version strings only/);
  assert.match(assertFailure(
    resolve(['a'], fixtureCatalog, { constraints: { a: '1.0.0' } }),
    'version-constraint',
    'a'
  ).message, /no resolved version/);
  assert.match(assertFailure(
    resolve(['versioned'], fixtureCatalog, { constraints: { absent: '1.0' } }),
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
  const missingOptional = resolve(['bad-opt'], fixtureCatalog, { include: ['gone'] });
  const missingOptionalDiagnostic = missingOptional.diagnostics.find(d => d.code === 'missing-optional');
  assert.ok(missingOptionalDiagnostic);
  assert.match(missingOptionalDiagnostic.message, /bad-opt -> gone/);
  assert.deepStrictEqual(missingOptionalDiagnostic.path, ['bad-opt']);
  const unsafe = { skills: [s('x', { source_path: '../x/SKILL.md' })] };
  const unsafeResult = resolve(['x'], unsafe);
  assert.strictEqual(unsafeResult.ok, false);
  assert.deepStrictEqual(unsafeResult.diagnostics.map(d => [d.code, d.subject]), [['invalid-catalog', '', ''].slice(0, 2)]);
  assert.strictEqual(resolve(['x'], { skills: [s('x', { source_path: path.join('skills', 'x', 'SKILL.md') })] }).ok, false);
  assert.strictEqual(resolve(['a'], fixtureCatalog).skills[1].source_path, 'skills/a/SKILL.md');
  assert.deepStrictEqual(resolve(['a', 'a'], fixtureCatalog).skills.map(x => x.name), ['c', 'a']);
  console.log('Skill loadout tests passed.');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
