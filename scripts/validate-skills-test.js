#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { execFileSync } = require('node:child_process');
const { runBehavioralChecks, runDocumentContractChecks, selectPython } = require('./validate-skills');
const { parseArgs, resolveSourceRoot, syncSkills, updateSkillMetadata } = require('./sync-skills');
const { scanCuratedSkills } = require('./mine-history');
const {
  deriveSourceUrl,
  normalizeMetadata,
  validateMetadata
} = require('./skill-metadata');

const validator = path.join(__dirname, 'validate-skills.js');
const tempRoot = path.join(__dirname, '..', '.scratch', '10.2.1');
fs.rmSync(tempRoot, { recursive: true, force: true });
fs.mkdirSync(tempRoot, { recursive: true });

const run = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
const writeSkill = (root, name, metadata = {}) => {
  const file = path.join(root, metadata.source_path || `skills/${name}/SKILL.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, frontmatter(name, metadata), 'utf8');
};
const commit = (root, message) => {
  run(root, ['add', '.']);
  run(root, ['-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-m', message]);
};
const frontmatter = (name, metadata) => [
  '---', `name: ${name}`, 'description: Example skill', 'metadata:',
  ...Object.entries(metadata).map(([key, value]) => `  ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`),
  '---', '# Example'
].join('\n');

try {
  assert.equal(parseArgs([]).allowNetwork, false);
  assert.equal(parseArgs(['--no-clone']).allowNetwork, false);
  assert.equal(parseArgs(['--allow-network']).allowNetwork, true);
  const help = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'cli.js'), '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--allow-network\s+Allow clone\/fetch recovery/);
  assert.match(help.stdout, /--no-clone\s+Compatibility alias for the local-only default/);
  for (const option of ['--skill, --skills', '--include', '--exclude', '--mode <copy|symlink>', '--source <path>', '--force']) {
    assert.match(help.stdout, new RegExp(option.replace(/[<>|]/g, '\\$&')));
  }
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  assert.match(readme, /--include`\s+and\s+`--exclude/);
  assert.match(readme, /Invalid selections produce deterministic\s+diagnostics/);
  assert.match(readme, /`catalog\/skills\.lock\.json` is generated\s+compatibility/);
  assert.equal(deriveSourceUrl('aigb-skills'), 'https://github.com/AndrewBrown-USDA/aigb-skills.git');
  assert.equal(deriveSourceUrl('unknown-repo'), null);
  assert.deepEqual(normalizeMetadata({
    source_repo: 'aigb-skills',
    source_path: 'skills/example/SKILL.md',
    source_ref: 'legacy-ref',
    upstream: 'legacy-repo',
    upstream_ref: 'preferred-ref',
    upstream_repo: 'preferred-repo',
    upstream_path: 'skills/example/SKILL.md',
    author: 'Example Author'
  }), {
    source_repo: 'aigb-skills',
    source_path: 'skills/example/SKILL.md',
    source_url: 'https://github.com/AndrewBrown-USDA/aigb-skills.git',
    upstream_repo: 'preferred-repo',
    upstream_ref: 'preferred-ref',
    upstream_path: 'skills/example/SKILL.md',
    author: 'Example Author'
  });
  assert.deepEqual(normalizeMetadata({
    source_repo: 'unknown-repo',
    source_path: 'skills/example/SKILL.md',
    source_ref: 'legacy-ref',
    upstream: 'legacy-repo'
  }), {
    source_repo: 'unknown-repo',
    source_path: 'skills/example/SKILL.md',
    source_url: null,
    upstream_repo: 'legacy-repo',
    upstream_ref: 'legacy-ref'
  });
  assert.equal(validateMetadata({ source_repo: 'repo' }).valid, false);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    source_url: 'not-a-url'
  }).valid, false);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md'
  }).valid, true);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    version: { status: 'missing', value: null }
  }).valid, true);
  assert.equal(validateMetadata(normalizeMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    version: { status: 'missing', value: null }
  })).valid, true);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    version: '   '
  }).valid, false);
  assert.equal(validateMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    inspired_by: 'Ryon Morrison (idea shared with GitHub Copilot CoP)'
  }).valid, true);
  for (const value of ['', '   ', ['Ryon Morrison'], { name: 'Ryon Morrison' }, 42, null]) {
    const validation = validateMetadata({
      source_repo: 'repo',
      source_path: 'skills/example/SKILL.md',
      inspired_by: value
    });
    assert.equal(validation.valid, false);
    assert.deepEqual(validation.errors, ['inspired_by must be a non-empty scalar string']);
  }
  assert.equal(normalizeMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    inspired_by: '  Ryon Morrison  '
  }).inspired_by, 'Ryon Morrison');
  assert.deepEqual(normalizeMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    dependencies: 'second-skill, first-skill, second-skill',
    optional_dependencies: 'third-skill, fourth-skill'
  }).dependencies, ['second-skill', 'first-skill']);
  assert.deepEqual(normalizeMetadata({
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    dependencies: 'second-skill, first-skill',
    optional_dependencies: 'third-skill, fourth-skill'
  }).optional_dependencies, ['third-skill', 'fourth-skill']);
  for (const field of ['dependencies', 'optional_dependencies', 'loadouts']) {
    const validation = validateMetadata({
      source_repo: 'repo',
      source_path: 'skills/example/SKILL.md',
      [field]: '[first-skill, second-skill]'
    });
    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('; '), new RegExp(`${field} contains an invalid identifier`));
  }
  for (const [field, value] of [
    ['dependencies', 'first-skill, first-skill'],
    ['optional_dependencies', 'second-skill, second-skill'],
    ['dependencies', ['first-skill', 'first-skill']],
    ['optional_dependencies', ['second-skill', 'second-skill']]
  ]) {
    const validation = validateMetadata({
      name: 'example',
      source_repo: 'repo',
      source_path: 'skills/example/SKILL.md',
      [field]: value
    });
    assert.equal(validation.valid, false);
    assert.deepEqual(validation.errors, [`${field} contains duplicate dependencies`]);
  }
  assert.deepEqual(validateMetadata({
    name: 'example',
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    dependencies: 'first-skill,',
    optional_dependencies: 'first-skill'
  }).errors, [
    'dependencies contains an invalid identifier or empty token',
    'dependencies overlap optional_dependencies: first-skill'
  ]);
  assert.deepEqual(validateMetadata({
    name: 'example',
    source_repo: 'repo',
    source_path: 'skills/example/SKILL.md',
    dependencies: 'example',
    optional_dependencies: 'Bad_Name'
  }).errors, [
    'optional_dependencies contains an invalid identifier or empty token',
    'dependencies cannot reference the skill itself'
  ]);
  assert.throws(
    () => resolveSourceRoot({
      source_repo: 'https://github.com/example/pinned-source.git',
      source_url: 'https://github.com/example/pinned-source.git'
    }, { clone: false }),
    (error) => error.message.includes('pinned-source') && !error.message.includes('https:\\github')
  );

  const sourceRepo = path.join(tempRoot, 'source-repo');
  fs.mkdirSync(sourceRepo, { recursive: true });
  run(sourceRepo, ['init', '-q']);
  writeSkill(sourceRepo, 'pinned', { source_path: 'skills/pinned/SKILL.md' });
  commit(sourceRepo, 'initial');
  run(sourceRepo, ['tag', 'pinned-v1']);
  writeSkill(sourceRepo, 'pinned', { source_path: 'skills/pinned/SKILL.md', description: 'second' });
  commit(sourceRepo, 'second');
  const pinnedLock = path.join(tempRoot, 'pinned.lock.json');
  fs.writeFileSync(pinnedLock, JSON.stringify({
    schema_version: 1,
    skills: [{ name: 'pinned', source_repo: sourceRepo, source_path: 'skills/pinned/SKILL.md',
      source_url: 'https://example.test/pinned.git', source_ref: 'pinned-v1' }]
  }), 'utf8');
  const pinnedTarget = path.join(tempRoot, 'pinned-target');
  syncSkills({ lockfile: pinnedLock, target: pinnedTarget, mode: 'copy', clone: false, allowNetwork: false });
  assert.ok(fs.existsSync(path.join(pinnedTarget, 'pinned', 'SKILL.md')));

  for (const [label, source_url] of [['omitted', undefined], ['null', null]]) {
    const localOnlyLock = path.join(tempRoot, `local-only-${label}.lock.json`);
    const localOnlyEntry = {
      name: 'pinned',
      source_repo: sourceRepo,
      source_path: 'skills/pinned/SKILL.md'
    };
    if (source_url !== undefined) localOnlyEntry.source_url = source_url;
    fs.writeFileSync(localOnlyLock, JSON.stringify({
      schema_version: 1,
      skills: [localOnlyEntry]
    }), 'utf8');
    const localOnlyTarget = path.join(tempRoot, `local-only-${label}-target`);
    syncSkills({ lockfile: localOnlyLock, target: localOnlyTarget, mode: 'copy', clone: false, allowNetwork: false });
    assert.ok(fs.existsSync(path.join(localOnlyTarget, 'pinned', 'SKILL.md')));
  }

  const malformedSourceUrlLock = path.join(tempRoot, 'malformed-source-url.lock.json');
  fs.writeFileSync(malformedSourceUrlLock, JSON.stringify({
    schema_version: 1,
    skills: [{ name: 'pinned', source_repo: sourceRepo, source_path: 'skills/pinned/SKILL.md',
      source_url: 'not-a-url' }]
  }), 'utf8');
  assert.throws(
    () => syncSkills({
      lockfile: malformedSourceUrlLock,
      target: path.join(tempRoot, 'malformed-source-url-target'),
      mode: 'copy',
      clone: false,
      allowNetwork: false
    }),
    /metadata:.*source_url/
  );

  const missingUpstreamRepo = path.join(tempRoot, 'missing-upstream-repo');
  fs.mkdirSync(missingUpstreamRepo, { recursive: true });
  run(missingUpstreamRepo, ['init', '-q']);
  writeSkill(missingUpstreamRepo, 'pinned', { source_path: 'skills/pinned/SKILL.md' });
  commit(missingUpstreamRepo, 'upstream');
  const missingLock = path.join(tempRoot, 'missing.lock.json');
  fs.writeFileSync(missingLock, JSON.stringify({
    schema_version: 1,
    skills: [{ name: 'pinned', source_repo: sourceRepo, source_path: 'skills/pinned/SKILL.md',
      source_url: 'https://example.test/pinned.git', upstream_repo: missingUpstreamRepo,
      upstream_path: 'skills/pinned/SKILL.md', upstream_ref: 'definitely-missing-ref-10-2-1' }]
  }), 'utf8');
  assert.throws(
    () => syncSkills({ lockfile: missingLock, target: path.join(tempRoot, 'missing-target'), mode: 'copy', clone: false, allowNetwork: false }),
    /Automatic fetching is disabled by default/
  );

  const fetchRemoteRepo = path.join(tempRoot, 'fetch-remote-repo');
  fs.mkdirSync(fetchRemoteRepo, { recursive: true });
  run(fetchRemoteRepo, ['init', '-q']);
  writeSkill(fetchRemoteRepo, 'pinned', { source_path: 'skills/pinned/SKILL.md' });
  commit(fetchRemoteRepo, 'remote');
  run(fetchRemoteRepo, ['tag', 'definitely-missing-ref-10-2-1']);
  run(missingUpstreamRepo, ['remote', 'add', 'origin', fetchRemoteRepo]);
  try {
    const fetchTarget = path.join(tempRoot, 'fetch-target');
    syncSkills({ lockfile: missingLock, target: fetchTarget, mode: 'copy', clone: true, allowNetwork: true });
    assert.ok(fs.existsSync(path.join(fetchTarget, 'pinned', 'SKILL.md')));
  } finally {
    run(missingUpstreamRepo, ['remote', 'remove', 'origin']);
  }

  const upstreamRepo = path.join(tempRoot, 'upstream-repo');
  fs.mkdirSync(upstreamRepo, { recursive: true });
  run(upstreamRepo, ['init', '-q']);
  writeSkill(upstreamRepo, 'selected', { source_path: 'skills/selected/SKILL.md' });
  commit(upstreamRepo, 'upstream');
  run(upstreamRepo, ['tag', 'upstream-v1']);
  const distinctLock = path.join(tempRoot, 'distinct.lock.json');
  fs.writeFileSync(distinctLock, JSON.stringify({
    schema_version: 1,
    skills: [{ name: 'selected', source_repo: sourceRepo, source_path: 'skills/selected/SKILL.md',
      source_url: 'https://example.test/source.git', upstream_repo: upstreamRepo,
      upstream_path: 'skills/selected/SKILL.md', upstream_ref: 'upstream-v1' }]
  }), 'utf8');
  syncSkills({ lockfile: distinctLock, target: path.join(tempRoot, 'distinct-target'), mode: 'copy', clone: false, allowNetwork: false });
  assert.ok(fs.existsSync(path.join(tempRoot, 'distinct-target', 'selected', 'SKILL.md')));

  const legacyLock = path.join(tempRoot, 'legacy.lock.json');
  fs.writeFileSync(legacyLock, JSON.stringify({
    schema_version: 1,
    skills: [{ name: 'pinned', source_repo: sourceRepo, source_path: 'skills/pinned/SKILL.md',
      source_url: 'https://example.test/source.git', source_ref: 'pinned-v1', upstream: sourceRepo }]
  }), 'utf8');
  syncSkills({ lockfile: legacyLock, target: path.join(tempRoot, 'legacy-target'), mode: 'copy', clone: false, allowNetwork: false });

  const lockfile = path.join(tempRoot, 'skills.lock.json');
  const skillsDir = path.join(tempRoot, 'skills');
  const report = path.join(tempRoot, 'report.json');
  const skillDir = path.join(skillsDir, 'example-alias');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example-alias\ndescription: Example skill\nmetadata:\n  source_repo: example-repo\n  source_path: skills/example/SKILL.md\n  source_ref: v1.0.0\n  upstream: https://example.test/skills\n  upstream_name: example\n  version: 1.0\n---\n\n# Example\n',
    'utf8'
  );

  const cliTarget = path.join(tempRoot, 'cli-target');
  const cliSource = path.join(__dirname, '..', 'skills');
  const cli = path.join(__dirname, '..', 'src', 'cli.js');
  const runCli = (args) => spawnSync(process.execPath, [cli, 'install', '--source', cliSource, '--target', cliTarget, ...args], {
    encoding: 'utf8'
  });
  const selected = runCli(['--skill', 'plan-first']);
  assert.equal(selected.status, 0, selected.stderr);
  assert.deepEqual(fs.readdirSync(cliTarget), ['plan-first']);
  const aliases = runCli(['--skills', 'dr-lexus', '--mode', 'copy']);
  assert.equal(aliases.status, 0, aliases.stderr);
  assert.deepEqual(fs.readdirSync(cliTarget).sort(), ['dr-lexus', 'plan-first']);
  const conflict = runCli(['--skill', 'plan-first']);
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /already exist.*--force/);
  const forced = runCli(['--skill', 'plan-first', '--force']);
  assert.equal(forced.status, 0, forced.stderr);
  const invalid = runCli(['--skill', 'missing']);
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stderr, `install: Skill(s) not found in ${cliSource}: missing\n`);
  const deterministicInvalid = runCli(['--skill', 'missing']);
  assert.equal(deterministicInvalid.stderr, invalid.stderr);
  const sourceOnly = runCli([]);
  assert.equal(sourceOnly.status, 1);
  assert.match(sourceOnly.stderr, /already exist/);
  assert.equal(fs.existsSync(path.join(cliTarget, 'missing')), false);
  assert.deepEqual(require('./skill-loadouts').resolve('plan-first', require('./install').readCatalog()).diagnostics, []);
  const catalogFixture = path.join(tempRoot, 'catalog-skills');
  fs.mkdirSync(path.join(catalogFixture, 'owned'), { recursive: true });
  fs.writeFileSync(path.join(catalogFixture, 'owned', 'SKILL.md'),
    '---\nname: owned\nmetadata:\n  source_repo: example\n  source_path: skills/owned/SKILL.md\n---\n# Owned\n', 'utf8');
  const generated = require('./mine-history').buildLockfile(catalogFixture);
  assert.equal(generated.schema_version, 1);
  assert.equal(generated.skills[0].source_path, 'skills/owned/SKILL.md');
  const legacyCatalog = { schema_version: 1, skills: [{ name: 'owned', source_repo: 'example', source_path: 'skills/owned/SKILL.md' }] };
  const loadedLegacy = require('./skill-loadouts').loadCatalog(legacyCatalog);
  assert.equal(loadedLegacy.errors.length, 0);
  assert.equal(loadedLegacy.skills.get('owned').source_repo, 'example');
  const handEdited = { ...generated, skills: generated.skills.map((entry) => ({ ...entry, source_path: 'skills/other/SKILL.md' })) };
  assert.notEqual(handEdited.skills[0].source_path, generated.skills[0].source_path);
  fs.writeFileSync(path.join(catalogFixture, 'catalog.json'), JSON.stringify(handEdited), 'utf8');
  const regenerated = require('./mine-history').buildLockfile(catalogFixture);
  assert.deepEqual(regenerated, generated);
  fs.writeFileSync(
    lockfile,
    JSON.stringify({
      skills: [{
        name: 'example-alias',
        source_repo: 'example-repo',
        source_path: 'skills/example/SKILL.md',
        source_ref: 'v1.0.0',
        upstream: 'https://example.test/skills',
        upstream_name: 'example',
        version: { status: 'resolved', value: '1.0' }
      }]
    }),
    'utf8'
  );

  const passing = spawnSync(process.execPath, [
    validator,
    '--lockfile',
    lockfile,
    '--skills-dir',
    skillsDir,
    '--report',
    report
  ], { encoding: 'utf8' });
  assert.equal(passing.status, 0, passing.stderr);
  const passingReport = JSON.parse(fs.readFileSync(report, 'utf8'));
  assert.ok(passingReport.checks.some((check) => check.status === 'passed'));

  for (const [field, value] of [
    ['dependencies', 'duplicate-skill, duplicate-skill'],
    ['optional_dependencies', 'duplicate-skill, duplicate-skill'],
    ['dependencies', ['duplicate-skill', 'duplicate-skill']],
    ['optional_dependencies', ['duplicate-skill', 'duplicate-skill']]
  ]) {
    const duplicateEntry = JSON.parse(fs.readFileSync(lockfile, 'utf8'));
    duplicateEntry.skills[0][field] = value;
    try {
      fs.writeFileSync(lockfile, JSON.stringify(duplicateEntry), 'utf8');
      const duplicateResult = spawnSync(process.execPath, [
        validator, '--lockfile', lockfile, '--skills-dir', skillsDir
      ], { encoding: 'utf8' });
      assert.equal(duplicateResult.status, 1);
      assert.match(
        duplicateResult.stdout + duplicateResult.stderr,
        new RegExp(`${field} contains duplicate dependencies`)
      );
    } finally {
      delete duplicateEntry.skills[0][field];
      fs.writeFileSync(lockfile, JSON.stringify(duplicateEntry), 'utf8');
    }
  }

  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    [
      '---', 'name: example-alias', 'description: Example skill', 'metadata:',
      '  source_repo: example-repo', '  source_path: skills/example/SKILL.md',
      '  source_ref: v1.0.0', '  upstream: https://example.test/skills',
      '  upstream_name: example', '  version: 1.0', '---', '',
      '# Example', '', 'See `./references/missing.md`.'
    ].join('\n')
  );
  const missingReference = spawnSync(process.execPath, [
    validator, '--lockfile', lockfile, '--skills-dir', skillsDir
  ], { encoding: 'utf8' });
  assert.equal(missingReference.status, 1);
  assert.match(missingReference.stdout + missingReference.stderr, /Missing local reference/);

  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example-alias\ndescription: Example skill\nsource_repo: example-repo\nmetadata:\n  source_repo: example-repo\n---\n\n# Example\n',
    'utf8'
  );
  const topLevelCustom = spawnSync(process.execPath, [
    validator, '--lockfile', lockfile, '--skills-dir', skillsDir
  ], { encoding: 'utf8' });
  assert.equal(topLevelCustom.status, 1);
  assert.match(topLevelCustom.stdout + topLevelCustom.stderr, /Custom top-level metadata keys/i);

  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: example-alias\ndescription: Example skill\nmetadata:\n  source_repo: wrong-repo\n---\n\n# Example\n',
    'utf8'
  );
  const mismatchedMetadata = spawnSync(process.execPath, [
    validator, '--lockfile', lockfile, '--skills-dir', skillsDir
  ], { encoding: 'utf8' });
  assert.equal(mismatchedMetadata.status, 1);
  assert.match(mismatchedMetadata.stdout + mismatchedMetadata.stderr, /does not match catalog entry/i);

  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# malformed\n', 'utf8');
  const failing = spawnSync(process.execPath, [
    validator,
    '--lockfile',
    lockfile,
    '--skills-dir',
    skillsDir,
    '--report',
    report
  ], { encoding: 'utf8' });
  assert.equal(failing.status, 1);
  const failingReport = JSON.parse(fs.readFileSync(report, 'utf8'));
  assert.ok(failingReport.checks.some((check) => check.status === 'failed'));

  const behaviorRoot = path.join(tempRoot, 'behavior-root');
  const behaviorScriptDir = path.join(behaviorRoot, 'skills', 'rubber-ducking', 'scripts');
  fs.mkdirSync(behaviorScriptDir, { recursive: true });
  for (const name of ['test_ast_chunking.py', 'test_language_detect.py']) {
    fs.writeFileSync(path.join(behaviorScriptDir, name), 'raise SystemExit(1)\n', 'utf8');
  }
  const behaviorResults = [];
  runBehavioralChecks(skillsDir, behaviorResults, behaviorRoot);
  assert.equal(behaviorResults.length, 2);
  assert.ok(behaviorResults.every((check) => check.status === 'failed'));

  const documentContractResults = [];
  runDocumentContractChecks(path.join(__dirname, '..', 'skills'), documentContractResults);
  assert.deepEqual(
    documentContractResults.map((check) => [check.skill, check.status]),
    [
      ['conventional-commits', 'passed'],
      ['arcpy-migration', 'passed'],
      ['goal-alignment', 'passed']
    ]
  );

  const probes = [];
  const fakeRunner = (command) => {
    probes.push(command);
    return { status: command === 'python' ? 0 : 1 };
  };
  assert.equal(selectPython({ env: {}, platform: 'win32', runner: fakeRunner }), 'python');
  assert.deepEqual(probes, ['python']);
  assert.equal(selectPython({ env: { PYTHON: 'custom-python' }, platform: 'win32', runner: fakeRunner }), 'custom-python');
  assert.equal(selectPython({
    env: {},
    platform: 'win32',
    runner: (command) => ({ status: command === 'python3' ? 0 : 1 })
  }), 'python3');
  assert.equal(selectPython({
    env: {},
    platform: 'win32',
    runner: () => ({ status: 1, error: new Error('not found') })
  }), 'python');

  const metadataRoot = path.join(tempRoot, 'metadata-round-trip');
  const metadataSkill = path.join(metadataRoot, 'skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(metadataSkill), { recursive: true });
  fs.writeFileSync(metadataSkill, [
    '---',
    'name: old-name',
    'metadata:',
    '    source_ref: stale-ref',
    '    upstream: stale-repo',
    '    upstream_ref: stale-upstream-ref',
    '    upstream_repo: stale-upstream-repo',
    '    version: stale-version',
    '---',
    '# Example'
  ].join('\n'), 'utf8');
  updateSkillMetadata(metadataSkill, {
    name: 'normalized-name',
    source_repo: 'aigb-skills',
    source_path: 'skills/example/SKILL.md',
    source_url: 'https://github.com/AndrewBrown-USDA/aigb-skills.git',
    source_ref: 'normalized-ref',
    upstream_ref: 'normalized-upstream-ref',
    upstream_repo: 'normalized-upstream-repo',
    version: '1.0.0'
  });
  const normalizedContent = fs.readFileSync(metadataSkill, 'utf8');
  assert.match(normalizedContent, /name: normalized-name/);
  assert.match(normalizedContent, /source_ref: normalized-ref/);
  assert.match(normalizedContent, /upstream_ref: normalized-upstream-ref/);
  assert.match(normalizedContent, /upstream_repo: normalized-upstream-repo/);
  assert.doesNotMatch(normalizedContent, /stale-(ref|repo|version)/);

  const authorsSkill = path.join(metadataRoot, 'authors', 'SKILL.md');
  fs.mkdirSync(path.dirname(authorsSkill), { recursive: true });
  fs.writeFileSync(authorsSkill, '---\nname: authors\n---\n# Example\n', 'utf8');
  updateSkillMetadata(authorsSkill, { name: 'authors', source_repo: 'repo', source_path: 'skills/authors/SKILL.md',
    author: 'Scalar Author', authors: ['First Author', 'Second Author'] });
  const authorsContent = fs.readFileSync(authorsSkill, 'utf8');
  assert.match(authorsContent, /author: Scalar Author/);
  assert.match(authorsContent, /authors: \["First Author","Second Author"\]/);

  const synchronizedMetadataSkill = path.join(metadataRoot, 'synchronized', 'SKILL.md');
  fs.mkdirSync(path.dirname(synchronizedMetadataSkill), { recursive: true });
  fs.writeFileSync(synchronizedMetadataSkill, '---\nname: synchronized\nmetadata:\n  source_repo: stale-repo\n---\n# Example\n', 'utf8');
  updateSkillMetadata(synchronizedMetadataSkill, {
    name: 'synchronized',
    source_repo: 'external-repo',
    source_path: 'skills/synchronized/SKILL.md',
    group: 'quality-assurance',
    loadouts: ['software-delivery', 'code-quality'],
    dependencies: ['required-skill'],
    optional_dependencies: ['optional-skill']
  });
  const synchronizedContent = fs.readFileSync(synchronizedMetadataSkill, 'utf8');
  assert.match(synchronizedContent, /group: quality-assurance/);
  assert.match(synchronizedContent, /loadouts: software-delivery,code-quality/);
  assert.match(synchronizedContent, /dependencies: required-skill/);
  assert.match(synchronizedContent, /optional_dependencies: optional-skill/);
  assert.doesNotMatch(synchronizedContent, /source_repo: stale-repo/);

  const curatedRoot = path.join(tempRoot, 'curated-round-trip');
  const curatedSkill = path.join(curatedRoot, 'new-keys', 'SKILL.md');
  const legacySkill = path.join(curatedRoot, 'legacy-keys', 'SKILL.md');
  fs.mkdirSync(path.dirname(curatedSkill), { recursive: true });
  fs.mkdirSync(path.dirname(legacySkill), { recursive: true });
  const frontmatter = (name, metadata) => [
    '---',
    `name: ${name}`,
    'metadata:',
    ...Object.entries(metadata).map(([key, value]) => `  ${key}: ${value}`),
    '---',
    '# Example'
  ].join('\n');
  fs.writeFileSync(curatedSkill, frontmatter('new-keys', {
    source_repo: 'aigb-skills',
    source_path: 'skills/new-keys/SKILL.md',
    group: 'quality-assurance',
    loadouts: 'software-delivery, code-quality',
    dependencies: 'legacy-keys',
    optional_dependencies: 'worker-validation',
    inspired_by: 'Ryon Morrison',
    upstream_ref: 'new-ref',
    upstream_repo: 'new-repo',
    source_url: 'https://provenance.example.test/should-not-be-used'
  }), 'utf8');
  fs.writeFileSync(legacySkill, frontmatter('legacy-keys', {
    source_repo: 'aigb-skills',
    source_path: 'skills/legacy-keys/SKILL.md',
    source_ref: 'legacy-ref',
    upstream: 'legacy-repo'
  }), 'utf8');
  const mined = scanCuratedSkills(curatedRoot);
  const minedNew = mined.find((entry) => entry.name === 'new-keys');
  const minedLegacy = mined.find((entry) => entry.name === 'legacy-keys');
  assert.equal(minedNew.upstream_ref, 'new-ref');
  assert.equal(minedNew.upstream_repo, 'new-repo');
  assert.equal(minedNew.upstream_path, undefined);
  assert.equal(minedNew.source_url, 'https://github.com/AndrewBrown-USDA/aigb-skills.git');
  assert.equal(minedNew.group, 'quality-assurance');
  assert.deepEqual(minedNew.loadouts, ['software-delivery', 'code-quality']);
  assert.deepEqual(minedNew.dependencies, ['legacy-keys']);
  assert.deepEqual(minedNew.optional_dependencies, ['worker-validation']);
  assert.equal(minedNew.inspired_by, 'Ryon Morrison');
  assert.equal(minedLegacy.upstream_ref, 'legacy-ref');
  assert.equal(minedLegacy.upstream_repo, 'legacy-repo');
  const invalidRoot = path.join(tempRoot, 'invalid-metadata');
  fs.mkdirSync(path.join(invalidRoot, 'invalid'), { recursive: true });
  fs.writeFileSync(path.join(invalidRoot, 'invalid', 'SKILL.md'), frontmatter('invalid', {
    source_repo: 'aigb-skills',
    source_path: 'skills/invalid/SKILL.md',
    loadouts: 'Bad_Name'
  }), 'utf8');
  assert.throws(() => require('./mine-history').scanCuratedSkills(invalidRoot), /Invalid metadata for invalid/);
  const emptyAttributionRoot = path.join(tempRoot, 'empty-attribution-root');
  fs.mkdirSync(path.join(emptyAttributionRoot, 'empty-attribution'), { recursive: true });
  fs.writeFileSync(path.join(emptyAttributionRoot, 'empty-attribution', 'SKILL.md'), frontmatter('empty-attribution', {
    source_repo: 'aigb-skills',
    source_path: 'skills/empty-attribution/SKILL.md',
    inspired_by: '""'
  }), 'utf8');
  assert.throws(
    () => require('./mine-history').scanCuratedSkills(emptyAttributionRoot),
    /Invalid metadata for empty-attribution: inspired_by must be a non-empty scalar string/
  );
  console.log('Validator tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
