#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, spawnSync } = require('node:child_process');
const { parseFrontmatter } = require('./validate-skills');

const repoRoot = path.resolve(__dirname, '..');
const scratchRoot = path.join(repoRoot, '.scratch');
const syncTarget = path.join(scratchRoot, 'smoke-sync-target');
const installTarget = path.join(scratchRoot, 'smoke-install-target');
const symlinkTarget = path.join(scratchRoot, 'smoke-symlink-target');
const packageJsonPath = path.join(repoRoot, 'package.json');
const lockfilePath = path.join(repoRoot, 'catalog', 'skills.lock.json');
const licensePath = path.join(repoRoot, 'LICENSE');

function cleanup() {
  fs.rmSync(scratchRoot, { recursive: true, force: true });
}

function runNode(args) {
  return execFileSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });
}

function runNodeResult(args, env = process.env) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function runMake(args, env = process.env) {
  return execFileSync('make', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env
  });
}

function runMakeResult(args, env = process.env) {
  const result = spawnSync('make', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertSkillLayout(targetDir, skills) {
  for (const skill of skills) {
    const skillDir = path.join(targetDir, skill.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    assert.ok(fs.existsSync(skillDir), `missing skill directory: ${skillDir}`);
    assert.ok(fs.existsSync(skillFile), `missing skill file: ${skillFile}`);
  }
}

function assertSkillAttribution(targetDir) {
  const grillingMd = path.join(targetDir, 'grilling', 'SKILL.md');
  const codeReviewMd = path.join(targetDir, 'code-review-2axis', 'SKILL.md');

  if (fs.existsSync(grillingMd)) {
    const content = fs.readFileSync(grillingMd, 'utf8');
    assert.match(parseFrontmatter(content).metadata.author, /Matt Pocock/i);
  }

  if (fs.existsSync(codeReviewMd)) {
    const content = fs.readFileSync(codeReviewMd, 'utf8');
    assert.match(parseFrontmatter(content).metadata.author, /Matt Pocock/i);
  }
}

function assertGrillingContent(targetDir, requireAttribution = true) {
  const grillingMd = path.join(targetDir, 'grilling', 'SKILL.md');
  const content = fs.readFileSync(grillingMd, 'utf8');
  assert.match(content, /Each question should be formatted like so:/);
  if (requireAttribution) {
    const metadata = parseFrontmatter(content).metadata;
    assert.equal(metadata.upstream_ref || metadata.source_ref, 'v1.2.0');
    assert.match(parseFrontmatter(content).metadata.author, /Matt Pocock/i);
  }
}

function main() {
  cleanup();
  fs.mkdirSync(scratchRoot, { recursive: true });

  // 1. Verify package.json and LICENSE
  const pkg = readJson(packageJsonPath);
  assert.equal(pkg.bin && pkg.bin.skills, 'bin/skills.js');

  const licenseContent = fs.readFileSync(licensePath, 'utf8');
  assert.match(licenseContent, /MIT License/);
  assert.match(licenseContent, /Matt Pocock/);

  // 2. Verify CLI help
  const helpOutput = runNode(['bin/skills.js', '--help']);
  assert.match(helpOutput, /Usage:/);
  assert.match(helpOutput, /Commands:/);
  assert.match(helpOutput, /skills/);

  // 2a. Verify interval-ledger regression coverage
  runNode(['skills/git-history-interval-study/scripts/interval_ledger-test.js']);

  // 2b. Verify copilot history skill test scripts
  runNode(['skills/copilot-history-miner/scripts/history_miner_test.js']);
  runNode(['skills/copilot-history-miner/scripts/adapters_test.js']);
  runNode(['skills/copilot-history-briefing/scripts/briefing_contract_test.js']);

  // 3. Verify lockfile schema and curated skills
  const lockfile = readJson(lockfilePath);
  assert.equal(lockfile.schema_version, 1);
  assert.ok(Array.isArray(lockfile.skills), 'lockfile.skills must be an array');
  assert.ok(lockfile.skills.length >= 22, 'lockfile.skills must contain at least 22 curated skills');

  const skillNames = lockfile.skills.map(s => s.name);
  assert.ok(skillNames.includes('dr-lexus'), 'dr-lexus must be present in lockfile');
  assert.ok(skillNames.includes('rubber-ducking'), 'rubber-ducking must be present in lockfile');
  assert.ok(skillNames.includes('web-source-bundler'), 'web-source-bundler must be present in lockfile');
  assert.ok(skillNames.includes('grilling'), 'grilling must be present in lockfile');
  assert.ok(skillNames.includes('code-review-2axis'), 'code-review-2axis must be present in lockfile');
  assert.ok(skillNames.includes('arcpy-migration'), 'arcpy-migration must be present in lockfile');

  for (const entry of lockfile.skills) {
    assert.equal(typeof entry.name, 'string');
    assert.equal(typeof entry.source_repo, 'string');
    assert.equal(typeof entry.source_path, 'string');
    assert.equal(entry.source_url, 'https://github.com/AndrewBrown-USDA/aigb-skills.git');
    assert.equal(entry.publishability, undefined);
    assert.equal(entry.provenance, undefined);
    assert.equal(entry.selection_status, undefined);
    assert.equal(entry.rationale, undefined);
    assert.ok(entry.version && typeof entry.version === 'object', 'entry.version must be an object');
    assert.ok(
      entry.version.status === 'resolved' || entry.version.status === 'missing',
      `invalid version status: ${entry.version.status} for ${entry.name}`
    );
    if (entry.version.status === 'resolved') {
      assert.equal(typeof entry.version.value, 'string', `resolved version must be a string for ${entry.name}`);
      assert.ok(entry.version.value.length > 0, `resolved version must not be empty for ${entry.name}`);
    } else {
      assert.equal(entry.version.value, null, `missing version value must be null for ${entry.name}`);
    }
    if (entry.upstream_repo !== undefined) assert.match(entry.upstream_repo, /^https?:\/\//);
    if (entry.upstream_path !== undefined) assert.equal(typeof entry.upstream_path, 'string');
  }

  const planFirst = lockfile.skills.find(s => s.name === 'plan-first');
  assert.ok(planFirst, 'plan-first must exist');
  assert.equal(planFirst.version.status, 'resolved');
  assert.equal(planFirst.version.value, '1.0');
  assert.match(planFirst.upstream_repo, /https:\/\/www\.reddit\.com\/r\/LocalLLaMA\/s\/w0G0mMp1js/);

  const grilling = lockfile.skills.find(s => s.name === 'grilling');
  assert.ok(grilling, 'grilling must exist');
  assert.equal(grilling.upstream_ref, 'v1.2.0');
  assert.equal(grilling.upstream_repo, 'https://github.com/mattpocock/skills');

  const tdd = lockfile.skills.find(s => s.name === 'tdd');
  assert.ok(tdd, 'tdd must exist');
  assert.match(tdd.author, /Matt Pocock/i);
  assert.equal(tdd.license, 'MIT');
  assert.equal(tdd.source_repo, 'aigb-skills');
  assert.equal(tdd.source_url, 'https://github.com/AndrewBrown-USDA/aigb-skills.git');
  assert.equal(tdd.upstream_ref, 'v1.2.0');
  assert.match(tdd.upstream_repo, /github\.com\/mattpocock\/skills/);

  const applyFedOssLicense = lockfile.skills.find(s => s.name === 'apply-fed-oss-license');
  assert.ok(applyFedOssLicense, 'apply-fed-oss-license must exist');
  assert.equal(applyFedOssLicense.version.status, 'resolved');
  assert.equal(applyFedOssLicense.version.value, '1.0.1');

  const packagedSkillNames = fs.readdirSync(path.join(repoRoot, 'skills'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const catalogSkillNames = lockfile.skills.map(skill => skill.name).sort();
  const expectedCount = packagedSkillNames.length;
  assert.deepEqual(
    catalogSkillNames,
    packagedSkillNames,
    'lockfile skills must exactly match packaged skill directories'
  );
  for (const skillName of ['conventional-commits', 'arcpy-migration', 'goal-alignment']) {
    assert.ok(catalogSkillNames.includes(skillName), `${skillName} must exist in the catalog`);
  }
  const standardFields = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools', 'argument-hint']);
  for (const skill of lockfile.skills) {
    const skillFile = path.join(repoRoot, 'skills', skill.name, 'SKILL.md');
    const parsed = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'));
    assert.equal(parsed.fields.name, skill.name);
    assert.equal(typeof parsed.fields.description, 'string');
    assert.ok(parsed.metadata && typeof parsed.metadata === 'object');
    for (const key of ['source_repo', 'source_path', 'source_ref', 'upstream_repo', 'upstream_ref']) {
      if (skill[key] !== undefined) {
        const actual = key === 'upstream_repo'
          ? (parsed.metadata.upstream_repo || parsed.metadata.upstream)
          : key === 'upstream_ref'
            ? (parsed.metadata.upstream_ref || parsed.metadata.source_ref)
          : parsed.metadata[key];
        assert.equal(actual, skill[key], `${skill.name} metadata.${key}`);
      }
    }
    if (skill.version && skill.version.value !== null) {
      assert.equal(parsed.metadata.version, String(skill.version.value), `${skill.name} metadata.version`);
    }
    assert.deepEqual(
      Object.keys(parsed.fields).filter(key => !standardFields.has(key)),
      [],
      `${skill.name} has prohibited top-level custom metadata`
    );
  }

  // 4. Test CLI sync (copy mode)
  const cliSyncOutput = runNode([
    'bin/skills.js',
    'sync',
    '--allow-network',
    '--mode',
    'copy',
    '--lockfile',
    lockfilePath,
    '--target',
    syncTarget
  ]).trim();

  assert.equal(
    cliSyncOutput,
    `Synced ${expectedCount} skills to ${syncTarget} using copy mode.`
  );
  assertSkillLayout(syncTarget, lockfile.skills);
  assertSkillAttribution(syncTarget);
  assertGrillingContent(syncTarget);
  for (const skill of lockfile.skills) {
    const content = fs.readFileSync(path.join(syncTarget, skill.name, 'SKILL.md'), 'utf8');
    assert.match(content, new RegExp(`^name:\\s*${skill.name}$`, 'm'));
    if (skill.license !== undefined) {
      assert.match(content, new RegExp(`^license:\\s*${skill.license}$`, 'm'));
    }
    assert.doesNotMatch(content, /[\u2013\u2014\u2011\u2190-\u21ff\u2300-\u23ff\u2600-\u27bf]/u);
    assert.doesNotMatch(content, /[âðï][\u0080-\u00bf]|Ã.|Â./u);
  }

  // 5. Test scripts/sync-skills.js (copy mode)
  const syncOutput = runNode([
    'scripts/sync-skills.js',
    '--allow-network',
    '--mode',
    'copy',
    '--lockfile',
    lockfilePath,
    '--target',
    syncTarget
  ]).trim();

  assert.equal(
    syncOutput,
    `Synced ${expectedCount} skills to ${syncTarget} using copy mode.`
  );
  assertSkillLayout(syncTarget, lockfile.skills);
  assertSkillAttribution(syncTarget);
  assertGrillingContent(syncTarget);

  // 6. Test scripts/install.js (installing packaged skills directly)
  const installOutput = runNode([
    'scripts/install.js',
    '--mode',
    'copy',
    '--target',
    installTarget
  ]).trim();

  assert.equal(
    installOutput,
    `Installed ${expectedCount} skills to ${installTarget} using copy mode.`
  );
  assertSkillLayout(installTarget, lockfile.skills);
  assertSkillAttribution(installTarget);

  const sentinelPath = path.join(installTarget, 'plan-first', 'sentinel.txt');
  fs.writeFileSync(sentinelPath, 'preserve me');
  const refusal = runNodeResult(['scripts/install.js', '--target', installTarget, '--skill', 'plan-first']);
  assert.equal(refusal.status, 1);
  assert.match(refusal.stderr, /Use --force to replace/);
  assert.equal(fs.readFileSync(sentinelPath, 'utf8'), 'preserve me');
  const forceResult = runNodeResult(['scripts/install.js', '--target', installTarget, '--skill', 'plan-first', '--force']);
  assert.equal(forceResult.status, 0);
  assert.ok(!fs.existsSync(sentinelPath));
  fs.writeFileSync(path.join(installTarget, 'unrelated.txt'), 'keep');
  const selectedTarget = path.join(scratchRoot, 'smoke-selected-force');
  fs.mkdirSync(path.join(selectedTarget, 'plan-first'), { recursive: true });
  fs.writeFileSync(path.join(selectedTarget, 'plan-first', 'sentinel'), 'replace');
  fs.mkdirSync(path.join(selectedTarget, 'custom'), { recursive: true });
  fs.writeFileSync(path.join(selectedTarget, 'custom', 'keep'), 'keep');
  runNode(['scripts/install.js', '--target', selectedTarget, '--skill', 'plan-first', '--force']);
  assert.ok(fs.existsSync(path.join(selectedTarget, 'custom', 'keep')));

  // 6b. Test CLI install command
  const cliInstallOutput = runNode([
    'bin/skills.js',
    'install',
    '--mode',
    'copy',
    '--target',
    installTarget,
    '--force'
  ]).trim();

  assert.equal(
    cliInstallOutput,
    `Installed ${expectedCount} skills to ${installTarget} using copy mode.`
  );

  // 6b. Verify Make forwards an explicit --force argument without making it the default.
  const makeInstallDryRun = runMake(['-n', 'install-skills']);
  assert.doesNotMatch(makeInstallDryRun, /--force/);
  const makeForceInstallDryRun = runMake(['-n', 'install-skills', '--', '--force']);
  assert.match(makeForceInstallDryRun, /--force/);
  const makeSelectedInstallDryRun = runMake(['-n', 'install-skills', 'SKILLS=plan-first,dr-lexus']);
  assert.match(makeSelectedInstallDryRun, /--skill "\$SKILLS"/);
  const makeSingularInstallDryRun = runMake(['-n', 'install-skill', 'SKILL=plan-first']);
  assert.match(makeSingularInstallDryRun, /SKILLS="\$SKILL"/);
  const makeForceTargetDryRun = runMake(['-n', 'install-skills-force', 'SKILLS=plan-first,dr-lexus']);
  assert.match(makeForceTargetDryRun, /--skill "\$SKILLS"/);
  assert.match(makeForceTargetDryRun, /--force/);
  const missingSingular = runMakeResult(['install-skill']);
  assert.equal(missingSingular.status, 2);
  assert.match(missingSingular.stderr, /requires SKILL=<name>/);
  const hostileSkills = runMakeResult(
    ['install-skills'],
    { ...process.env, SKILLS: 'x"; echo INJECTED; #' }
  );
  assert.notEqual(hostileSkills.status, 0);
  assert.match(hostileSkills.stderr, /Skill\(s\) not found/);
  assert.doesNotMatch(hostileSkills.stdout + hostileSkills.stderr, /^INJECTED$/m);

  // 6c. Test single and comma-separated skill filtering
  const filterSingleTarget = path.join(scratchRoot, 'smoke-filter-single');
  const cliSingleOutput = runNode([
    'bin/skills.js',
    'install',
    '--target',
    filterSingleTarget,
    '--skill',
    'plan-first'
  ]).trim();
  assert.equal(
    cliSingleOutput,
    `Installed 1 skills to ${filterSingleTarget} using copy mode.`
  );
  assert.ok(fs.existsSync(path.join(filterSingleTarget, 'plan-first', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(filterSingleTarget, 'dr-lexus')));

  const filterMultiTarget = path.join(scratchRoot, 'smoke-filter-multi');
  const cliMultiOutput = runNode([
    'bin/skills.js',
    'install',
    '--target',
    filterMultiTarget,
    '--skills',
    'plan-first, dr-lexus, grilling'
  ]).trim();
  assert.equal(
    cliMultiOutput,
    `Installed 3 skills to ${filterMultiTarget} using copy mode.`
  );
  assert.ok(fs.existsSync(path.join(filterMultiTarget, 'plan-first', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(filterMultiTarget, 'dr-lexus', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(filterMultiTarget, 'grilling', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(filterMultiTarget, 'rubber-ducking')));

  // 6d. Test invalid skill name error
  const invalidResult = runNodeResult([
    'bin/skills.js',
    'install',
    '--target',
    path.join(scratchRoot, 'smoke-filter-invalid'),
    '--skill',
    'non-existent-skill-xyz'
  ]);
  assert.equal(invalidResult.status, 1, 'Install must exit with status 1 on invalid skill');
  assert.match(
    invalidResult.stderr,
    /install: Skill\(s\) not found in .+: non-existent-skill-xyz/i
  );

  // 6e. Test empty or missing --skill filter flag error
  const emptySkillResult = runNodeResult([
    'bin/skills.js',
    'install',
    '--target',
    path.join(scratchRoot, 'smoke-filter-empty'),
    '--skill',
    ''
  ]);
  assert.equal(emptySkillResult.status, 1, 'Install must exit with status 1 on empty --skill argument');
  assert.match(
    emptySkillResult.stderr,
    /requires a non-empty skill name/i
  );

  const missingSkillArgResult = runNodeResult([
    'bin/skills.js',
    'install',
    '--target',
    path.join(scratchRoot, 'smoke-filter-missing-arg'),
    '--skill'
  ]);
  assert.equal(missingSkillArgResult.status, 1, 'Install must exit with status 1 when --skill is missing argument');
  assert.match(
    missingSkillArgResult.stderr,
    /requires a non-empty skill name/i
  );

  // 7. Test symlink mode for sync
  const symlinkResult = runNodeResult([
    'scripts/sync-skills.js',
    '--allow-network',
    '--mode',
    'symlink',
    '--lockfile',
    lockfilePath,
    '--target',
    symlinkTarget
  ]);

  assert.equal(
    symlinkResult.status,
    0
  );
  assert.equal(
    symlinkResult.stdout.trim(),
    `Synced ${expectedCount} skills to ${symlinkTarget} using symlink mode.`
  );
  assert.match(
    symlinkResult.stderr,
    /symlink mode is unavailable for (?:git-pinned|aliased) skill ".+"; falling back to copy mode/i
  );
  assertSkillLayout(symlinkTarget, lockfile.skills);
  assertGrillingContent(symlinkTarget, false);
  const aliasedSkill = lockfile.skills.find(skill => skill.upstream_name);
  if (aliasedSkill && !aliasedSkill.source_ref) {
    const aliasedSkillFile = path.join(symlinkTarget, aliasedSkill.name, 'SKILL.md');
    assert.equal(fs.lstatSync(path.dirname(aliasedSkillFile)).isSymbolicLink(), false);
    assert.match(
      fs.readFileSync(aliasedSkillFile, 'utf8'),
      new RegExp(`^name:\\s*${aliasedSkill.name}$`, 'm')
    );
    assert.match(
      symlinkResult.stderr,
      new RegExp(`symlink mode is unavailable for aliased skill "${aliasedSkill.name}"`)
    );
  }

  // 8. Test install overlap rejection before mutation in both modes.
  const overlapRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-install-overlap-'));
  try {
    const overlapSource = path.join(overlapRoot, 'source');
    const overlapCatalog = path.join(overlapRoot, 'catalog.json');
    fs.writeFileSync(overlapCatalog, JSON.stringify({
      skills: [{ name: 'fixture', source_repo: 'aigb-skills', source_path: 'skills/fixture/SKILL.md' }]
    }));
    fs.mkdirSync(path.join(overlapSource, 'fixture'), { recursive: true });
    fs.writeFileSync(path.join(overlapSource, 'fixture', 'SKILL.md'), 'name: fixture');
    for (const mode of ['copy', 'symlink']) {
      const fixtures = [
        { source: overlapSource, target: overlapSource, marker: path.join(overlapSource, 'fixture', 'SKILL.md') },
        {
          source: path.join(overlapRoot, `${mode}-target-outer`, 'source'),
          target: path.join(overlapRoot, `${mode}-target-outer`),
          marker: path.join(overlapRoot, `${mode}-target-outer`, 'marker')
        },
        {
          source: path.join(overlapRoot, `${mode}-source-outer`),
          target: path.join(overlapRoot, `${mode}-source-outer`, 'target'),
          marker: path.join(overlapRoot, `${mode}-source-outer`, 'marker')
        }
      ];
      for (const { source, target, marker } of fixtures) {
        fs.mkdirSync(path.join(source, 'fixture'), { recursive: true });
        fs.writeFileSync(path.join(source, 'fixture', 'SKILL.md'), 'name: fixture');
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(marker, 'untouched');
        const result = runNodeResult([
          'scripts/install.js',
          '--source',
          source,
          '--lockfile',
          overlapCatalog,
          '--target',
          target,
          '--mode',
          mode
        ]);
        assert.equal(result.status, 1, `${mode} overlap must fail: ${source} -> ${target}`);
        assert.match(result.stderr, /Source and target directories must not overlap:/i);
        assert.equal(fs.readFileSync(marker, 'utf8'), 'untouched');
        if (marker !== path.join(source, 'fixture', 'SKILL.md')) {
          assert.equal(fs.readFileSync(path.join(source, 'fixture', 'SKILL.md'), 'utf8'), 'name: fixture');
        }
      }
    }
  } finally {
    fs.rmSync(overlapRoot, { recursive: true, force: true });
  }

  // 8a. Reject targets below a symlinked intermediate ancestor before mutation.
  const ancestorSymlinkRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-install-ancestor-symlink-'));
  try {
    const ancestorSource = path.join(ancestorSymlinkRoot, 'source');
    const symlinkParent = path.join(ancestorSymlinkRoot, 'alias');
    const ancestorCatalog = path.join(ancestorSymlinkRoot, 'catalog.json');
    fs.writeFileSync(ancestorCatalog, JSON.stringify({
      skills: [{ name: 'fixture', source_repo: 'aigb-skills', source_path: 'skills/fixture/SKILL.md' }]
    }));
    fs.mkdirSync(path.join(ancestorSource, 'fixture'), { recursive: true });
    fs.writeFileSync(path.join(ancestorSource, 'fixture', 'SKILL.md'), 'name: fixture');
    fs.symlinkSync(ancestorSource, symlinkParent, process.platform === 'win32' ? 'junction' : 'dir');

    for (const mode of ['copy', 'symlink']) {
      const redirectedTarget = path.join(symlinkParent, `${mode}-new`, 'nested');
      const result = runNodeResult([
        'scripts/install.js',
        '--source',
        ancestorSource,
        '--lockfile',
        ancestorCatalog,
        '--target',
        redirectedTarget,
        '--mode',
        mode
      ]);
      assert.equal(result.status, 1, `${mode} must reject targets below symlinked ancestors`);
      assert.match(result.stderr, /Source and target directories must not overlap:/i);
      assert.equal(fs.existsSync(path.join(ancestorSource, `${mode}-new`)), false);
      assert.equal(fs.readFileSync(path.join(ancestorSource, 'fixture', 'SKILL.md'), 'utf8'), 'name: fixture');
    }
  } finally {
    fs.rmSync(ancestorSymlinkRoot, { recursive: true, force: true });
  }

  // 8b. Reject source symlink aliases under the target before force-mode mutation.
  const sourceAliasRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-install-source-alias-'));
  try {
    const sourceAliasTarget = path.join(sourceAliasRoot, 'target');
    const sourceAliasActual = path.join(sourceAliasRoot, 'actual');
    const sourceAlias = path.join(sourceAliasTarget, 'fixture');
    fs.mkdirSync(path.join(sourceAliasActual, 'fixture'), { recursive: true });
    fs.writeFileSync(path.join(sourceAliasActual, 'fixture', 'SKILL.md'), 'name: fixture');
    fs.mkdirSync(sourceAliasTarget, { recursive: true });
    fs.symlinkSync(sourceAliasActual, sourceAlias, process.platform === 'win32' ? 'junction' : 'dir');
    fs.writeFileSync(path.join(sourceAliasRoot, 'catalog.json'), JSON.stringify({
      skills: [{ name: 'fixture', source_repo: 'aigb-skills', source_path: 'skills/fixture/SKILL.md' }]
    }));
    const aliasResult = runNodeResult([
      'scripts/install.js',
      '--source',
      sourceAlias,
      '--lockfile',
      path.join(sourceAliasRoot, 'catalog.json'),
      '--target',
      sourceAliasTarget,
      '--skill',
      'fixture',
      '--force'
    ]);
    assert.equal(aliasResult.status, 1);
    assert.match(aliasResult.stderr, /Source and target directories must not overlap:/i);
    assert.equal(fs.lstatSync(sourceAlias).isSymbolicLink(), true);
    assert.equal(fs.readFileSync(path.join(sourceAliasActual, 'fixture', 'SKILL.md'), 'utf8'), 'name: fixture');
  } finally {
    fs.rmSync(sourceAliasRoot, { recursive: true, force: true });
  }

  // 8c. Report dangling target symlinks as invalid targets.
  const danglingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-install-dangling-target-'));
  try {
    const danglingTarget = path.join(danglingRoot, 'target');
    fs.symlinkSync(path.join(danglingRoot, 'missing'), danglingTarget, process.platform === 'win32' ? 'junction' : 'dir');
    const danglingResult = runNodeResult([
      'scripts/install.js',
      '--source',
      path.join(repoRoot, 'skills'),
      '--target',
      danglingTarget
    ]);
    assert.equal(danglingResult.status, 1);
    assert.match(danglingResult.stderr, /Target is not a directory/);
  } finally {
    fs.rmSync(danglingRoot, { recursive: true, force: true });
  }

  // 8. Test symlink mode for install
  const installSymlinkTarget = path.join(scratchRoot, 'smoke-install-symlink');
  const installSymlinkOutput = runNode([
    'bin/skills.js',
    'install',
    '--mode',
    'symlink',
    '--target',
    installSymlinkTarget
  ]).trim();

  assert.equal(
    installSymlinkOutput,
    `Installed ${expectedCount} skills to ${installSymlinkTarget} using symlink mode.`
  );
  assertSkillLayout(installSymlinkTarget, lockfile.skills);

  // 9. Verify non-destructive / amending behavior on pre-existing skills in target
  const foreignSkillDir = path.join(installTarget, 'untracked-custom-skill');
  fs.mkdirSync(foreignSkillDir, { recursive: true });
  fs.writeFileSync(path.join(foreignSkillDir, 'SKILL.md'), '---\nname: untracked-custom-skill\n---\n');

  runNode([
    'scripts/install.js',
    '--mode',
    'copy',
    '--target',
    installTarget,
    '--force'
  ]);

  assert.ok(
    fs.existsSync(path.join(foreignSkillDir, 'SKILL.md')),
    'custom untracked skills must not be deleted when installing'
  );

  // 10. Verify maintainer error message when sync fails due to missing source repos
  let syncErrorCaught = false;
  try {
    const invalidLockfilePath = path.join(scratchRoot, 'invalid.lock.json');
    const missingSourceName = `missing-sync-fixture-${process.pid}`;
    fs.rmSync(path.resolve(repoRoot, '..', missingSourceName), { recursive: true, force: true });
    fs.writeFileSync(
      invalidLockfilePath,
      JSON.stringify({
        schema_version: 1,
        skills: [
          {
            name: 'fake-skill',
            source_repo: missingSourceName,
            source_path: 'skills/fake-skill/SKILL.md',
            source_url: 'https://github.com/AndrewBrown-USDA/aigb-skills.git',
            upstream_repo: 'https://example.invalid/non-existent-source-repo-xyz.git',
            version: { status: 'resolved', value: '1.0.0' }
          }
        ]
      }, null, 2)
    );
    const defaultResult = runNodeResult([
      'scripts/sync-skills.js',
      '--lockfile',
      invalidLockfilePath,
      '--target',
      path.join(scratchRoot, 'invalid-target')
    ]);
    assert.equal(defaultResult.status, 1);
    assert.match(defaultResult.stderr, /Automatic cloning and fetching are disabled by default/i);

    const optInResult = runNodeResult([
      'scripts/sync-skills.js',
      '--allow-network',
      '--lockfile',
      invalidLockfilePath,
      '--target',
      path.join(scratchRoot, 'network-target')
    ]);
    assert.equal(optInResult.status, 1);
    assert.match(optInResult.stderr, /Failed to clone canonical source repository|Skill source directory not found/i);
    assert.doesNotMatch(optInResult.stdout, /^Synced /m);
    syncErrorCaught = true;
    assert.match(defaultResult.stderr, /Maintainer sync error/i);
  } catch (err) {
    syncErrorCaught = true;
    assert.match(err.stderr || err.message, /Maintainer sync error|Skill source directory not found/i);
    assert.match(err.stderr || err.message, /Automatic cloning and fetching are disabled by default/i);
  }
  assert.ok(syncErrorCaught, 'Sync must fail with clear maintainer error on missing source repos');

  cleanup();
  console.log(`Smoke checks passed for ${expectedCount} skills.`);
}

try {
  main();
} catch (error) {
  cleanup();
  console.error(`smoke: ${error.message}`);
  process.exitCode = 1;
}
