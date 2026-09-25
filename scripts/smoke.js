#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

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
  }

  const planFirst = lockfile.skills.find(s => s.name === 'plan-first');
  assert.ok(planFirst, 'plan-first must exist');
  assert.equal(planFirst.version.status, 'resolved');
  assert.equal(planFirst.version.value, '1.0');

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

  // 6. Test scripts/install.js (copy mode)
  const installOutput = runNode([
    'scripts/install.js',
    '--mode',
    'copy',
    '--lockfile',
    lockfilePath,
    '--target',
    installTarget
  ]).trim();

  assert.equal(
    installOutput,
    `Synced ${expectedCount} skills to ${installTarget} using copy mode.`
  );
  assertSkillLayout(installTarget, lockfile.skills);
  assertSkillAttribution(installTarget);

  // 7. Test symlink mode
  const symlinkOutput = runNode([
    'scripts/sync-skills.js',
    '--mode',
    'symlink',
    '--lockfile',
    lockfilePath,
    '--target',
    symlinkTarget
  ]).trim();

  assert.equal(
    symlinkOutput,
    `Synced ${expectedCount} skills to ${symlinkTarget} using symlink mode.`
  );
  assertSkillLayout(symlinkTarget, lockfile.skills);

  // 8. Verify non-destructive / amending behavior on pre-existing skills in target
  const foreignSkillDir = path.join(installTarget, 'untracked-custom-skill');
  fs.mkdirSync(foreignSkillDir, { recursive: true });
  fs.writeFileSync(path.join(foreignSkillDir, 'SKILL.md'), '---\nname: untracked-custom-skill\n---\n');

  runNode([
    'scripts/install.js',
    '--mode',
    'copy',
    '--lockfile',
    lockfilePath,
    '--target',
    installTarget
  ]);

  assert.ok(
    fs.existsSync(path.join(foreignSkillDir, 'SKILL.md')),
    'custom untracked skills must not be deleted when installing'
  );

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

