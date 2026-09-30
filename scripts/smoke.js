#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

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

function runNodeResult(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8'
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
    assert.match(content, /author:\s*Matt Pocock/i);
    assert.match(content, /license:\s*MIT/i);
  }

  if (fs.existsSync(codeReviewMd)) {
    const content = fs.readFileSync(codeReviewMd, 'utf8');
    assert.match(content, /author:\s*Matt Pocock/i);
    assert.match(content, /license:\s*MIT/i);
  }
}

function assertGrillingContent(targetDir, requireAttribution = true) {
  const grillingMd = path.join(targetDir, 'grilling', 'SKILL.md');
  const content = fs.readFileSync(grillingMd, 'utf8');
  assert.match(content, /Each question should be formatted like so:/);
  if (requireAttribution) {
    assert.match(content, /author:\s*Matt Pocock/i);
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

  for (const entry of lockfile.skills) {
    assert.equal(typeof entry.name, 'string');
    assert.equal(typeof entry.source_repo, 'string');
    assert.equal(typeof entry.source_path, 'string');
    assert.equal(entry.publishability, 'publishable');
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
    if (entry.provenance !== undefined) {
      assert.ok(entry.provenance && typeof entry.provenance === 'object');
      assert.ok(
        entry.provenance.type === 'git' || entry.provenance.type === 'web',
        `invalid provenance type for ${entry.name}`
      );
    }
  }

  const planFirst = lockfile.skills.find(s => s.name === 'plan-first');
  assert.ok(planFirst, 'plan-first must exist');
  assert.equal(planFirst.version.status, 'resolved');
  assert.equal(planFirst.version.value, '1.0');
  assert.equal(planFirst.provenance.type, 'web');
  assert.match(planFirst.provenance.url, /https:\/\/www\.reddit\.com\/r\/LocalLLaMA\/s\/w0G0mMp1js/);

  const grilling = lockfile.skills.find(s => s.name === 'grilling');
  assert.ok(grilling, 'grilling must exist');
  assert.equal(grilling.source_ref, 'v1.2.0');
  assert.equal(grilling.provenance.type, 'git');
  assert.equal(grilling.provenance.ref, 'v1.2.0');

  const tdd = lockfile.skills.find(s => s.name === 'tdd');
  assert.ok(tdd, 'tdd must exist');
  assert.match(tdd.author, /Matt Pocock/i);
  assert.equal(tdd.license, 'MIT');
  assert.equal(tdd.source_repo, 'mattpocock-skills');
  assert.equal(tdd.source_ref, 'v1.2.0');
  assert.equal(tdd.provenance.type, 'git');
  assert.equal(tdd.provenance.ref, 'v1.2.0');
  assert.match(tdd.provenance.repository, /github\.com\/mattpocock\/skills/);

  const applyFedOssLicense = lockfile.skills.find(s => s.name === 'apply-fed-oss-license');
  assert.ok(applyFedOssLicense, 'apply-fed-oss-license must exist');
  assert.equal(applyFedOssLicense.version.status, 'resolved');
  assert.equal(applyFedOssLicense.version.value, '1.0.0');

  const expectedCount = lockfile.skills.length;

  // 4. Test CLI sync (copy mode)
  const cliSyncOutput = runNode([
    'bin/skills.js',
    'sync',
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

  // 5. Test scripts/sync-skills.js (copy mode)
  const syncOutput = runNode([
    'scripts/sync-skills.js',
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

  // 6b. Test CLI install command
  const cliInstallOutput = runNode([
    'bin/skills.js',
    'install',
    '--mode',
    'copy',
    '--target',
    installTarget
  ]).trim();

  assert.equal(
    cliInstallOutput,
    `Installed ${expectedCount} skills to ${installTarget} using copy mode.`
  );

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
    /Skill\(s\) not found in/i
  );

  // 7. Test symlink mode for sync
  const symlinkResult = runNodeResult([
    'scripts/sync-skills.js',
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
    /symlink mode is unavailable for git-pinned skill "grilling"; falling back to copy mode/i
  );
  assertSkillLayout(symlinkTarget, lockfile.skills);
  assertGrillingContent(symlinkTarget, false);

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
    installTarget
  ]);

  assert.ok(
    fs.existsSync(path.join(foreignSkillDir, 'SKILL.md')),
    'custom untracked skills must not be deleted when installing'
  );

  // 10. Verify maintainer error message when sync fails due to missing source repos
  let syncErrorCaught = false;
  try {
    const invalidLockfilePath = path.join(scratchRoot, 'invalid.lock.json');
    fs.writeFileSync(
      invalidLockfilePath,
      JSON.stringify({
        schema_version: 1,
        skills: [
          {
            name: 'fake-skill',
            source_repo: 'non-existent-source-repo-xyz',
            source_path: 'skills/fake-skill/SKILL.md',
            publishability: 'publishable',
            version: { status: 'resolved', value: '1.0.0' }
          }
        ]
      }, null, 2)
    );
    runNode([
      'scripts/sync-skills.js',
      '--lockfile',
      invalidLockfilePath,
      '--target',
      path.join(scratchRoot, 'invalid-target')
    ]);
  } catch (err) {
    syncErrorCaught = true;
    assert.match(err.stderr || err.message, /Maintainer sync error/i);
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
