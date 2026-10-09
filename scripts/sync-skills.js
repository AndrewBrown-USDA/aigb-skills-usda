#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LOCKFILE = path.join(REPO_ROOT, 'catalog', 'skills.lock.json');
const DEFAULT_TARGET_DIR = path.join(REPO_ROOT, 'skills');

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/sync-skills.js [options]',
    '',
    'Options:',
    '  --mode <copy|symlink>   Materialization mode (default: copy)',
    '  --lockfile <path>       Path to catalog/skills.lock.json',
    '  --target <path>         Destination directory (default: ./skills)',
    '  --help, -h              Show this help message',
    ''
  ].join('\n'));
}

function expandHomeDir(inputPath) {
  if (inputPath.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE;
    return path.join(home, inputPath.slice(1));
  }
  return inputPath;
}

function parseArgs(argv) {
  const options = {
    mode: 'copy',
    lockfile: DEFAULT_LOCKFILE,
    target: DEFAULT_TARGET_DIR,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case '--mode':
        options.mode = argv[i + 1];
        i += 1;
        break;
      case '--lockfile':
        options.lockfile = path.resolve(process.cwd(), expandHomeDir(argv[i + 1]));
        i += 1;
        break;
      case '--target':
        options.target = path.resolve(process.cwd(), expandHomeDir(argv[i + 1]));
        i += 1;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function loadLockfile(lockfilePath) {
  if (!fs.existsSync(lockfilePath)) {
    throw new Error(`Lockfile not found: ${lockfilePath}`);
  }

  const raw = fs.readFileSync(lockfilePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data || typeof data !== 'object') {
    throw new Error('Lockfile must contain a JSON object');
  }

  if (!Array.isArray(data.skills)) {
    throw new Error('Lockfile must contain a skills array');
  }

  return data;
}

function resolveSourceRoot(sourceRepo) {
  if (path.isAbsolute(sourceRepo)) {
    if (fs.existsSync(sourceRepo)) {
      return sourceRepo;
    }
    throw new Error(
      `Maintainer sync error: Absolute source repository path does not exist: "${sourceRepo}". ` +
      `"sync" is for maintainers synchronizing from upstream source repositories. ` +
      `To install skills into your environment, run "npx skills install --target <dir>" instead.`
    );
  }

  const siblingCandidate = path.resolve(REPO_ROOT, '..', sourceRepo);
  if (fs.existsSync(siblingCandidate)) {
    return siblingCandidate;
  }

  const localCandidate = path.resolve(REPO_ROOT, sourceRepo);
  if (fs.existsSync(localCandidate)) {
    return localCandidate;
  }

  throw new Error(
    `Maintainer sync error: Upstream source repository "${sourceRepo}" was not found (checked "${siblingCandidate}" and "${localCandidate}"). ` +
    `The "sync" command is intended for repository maintainers with local checkout of source repos. ` +
    `For users and agents installing packaged skills, run "npx skills install --target <dir>" (or "make install-skills") instead.`
  );
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Each lockfile entry must be an object');
  }

  if (typeof entry.name !== 'string' || entry.name.length === 0) {
    throw new Error('Each lockfile entry must include a non-empty name');
  }

  const metadata = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  const sourceRepo = metadata.source_repo || entry.source_repo;
  const sourcePath = metadata.source_path || entry.source_path;

  if (typeof sourceRepo !== 'string' || sourceRepo.length === 0) {
    throw new Error(`Skill ${entry.name} is missing source_repo`);
  }

  if (typeof sourcePath !== 'string' || sourcePath.length === 0) {
    throw new Error(`Skill ${entry.name} is missing source_path`);
  }
}

function normalizedEntry(entry) {
  const metadata = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  const version = metadata.version || entry.version;
  return {
    ...entry,
    ...metadata,
    source_repo: metadata.source_repo || entry.source_repo,
    source_path: metadata.source_path || entry.source_path,
    upstream_name: metadata.upstream_name || entry.upstream_name,
    source_ref: metadata.source_ref || entry.source_ref,
    upstream: metadata.upstream || entry.upstream,
    version: version && typeof version === 'object' ? version.value : version
  };
}

function validateSourceSkill(skillName, sourcePath) {
  const sourceDir = path.dirname(sourcePath);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Skill source directory not found for ${skillName}: ${sourceDir}`);
  }

  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error(`Skill source is missing SKILL.md for ${skillName}: ${sourcePath}`);
  }
}

function runGit(sourceRoot, args) {
  return execFileSync('git', ['-C', sourceRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function sanitizeSkillContent(content) {
  let sanitized = '';

  for (const character of content) {
    const codePoint = character.codePointAt(0);
    if (codePoint === 0x2011 || codePoint === 0x2013 || codePoint === 0x2014) {
      sanitized += '-';
    } else if (codePoint === 0x2753) {
      sanitized += 'Question';
    } else if (codePoint === 0x27a1 || codePoint === 0xfe0f) {
      sanitized += codePoint === 0x27a1 ? 'Recommended: ' : '';
    } else if (
      (codePoint >= 0x2190 && codePoint <= 0x21ff) ||
      (codePoint >= 0x2300 && codePoint <= 0x23ff) ||
      (codePoint >= 0x2600 && codePoint <= 0x27bf) ||
      (codePoint >= 0x1f000 && codePoint <= 0x1faff)
    ) {
      sanitized += '->';
    } else {
      sanitized += character;
    }
  }

  return sanitized;
}

function extractGitSkill(sourceRoot, sourceRef, sourceDirRel, destDir) {
  let normalizedSourceDir = sourceDirRel.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (normalizedSourceDir === '.') {
    normalizedSourceDir = '';
  }
  let treeOutput;

  try {
    const lsArgs = ['ls-tree', '-r', '--name-only', sourceRef];
    if (normalizedSourceDir) {
      lsArgs.push('--', normalizedSourceDir);
    }
    treeOutput = runGit(sourceRoot, lsArgs);
  } catch (error) {
    throw new Error(
      `Unable to read git-pinned skill ${sourceRef}:${normalizedSourceDir || '.'}: ${error.message}`
    );
  }

  const files = treeOutput.split(/\r?\n/).filter(Boolean);
  if (files.length === 0) {
    throw new Error(`Git-pinned skill contains no files: ${sourceRef}:${normalizedSourceDir || '.'}`);
  }

  const expectedSkillMdRel = normalizedSourceDir ? `${normalizedSourceDir}/SKILL.md` : 'SKILL.md';
  if (!files.includes(expectedSkillMdRel)) {
    throw new Error(
      `Git-pinned skill is missing required SKILL.md: ${sourceRef}:${expectedSkillMdRel}`
    );
  }

  if (fs.existsSync(destDir) || fs.lstatSync(destDir, { throwIfNoEntry: false })) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  for (const repositoryPath of files) {
    const relativePath = normalizedSourceDir
      ? repositoryPath.slice(normalizedSourceDir.length).replace(/^\/+/, '')
      : repositoryPath;
    if (!relativePath || relativePath.includes('..')) {
      continue;
    }

    const destinationPath = path.join(destDir, ...relativePath.split('/'));
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    let content;
    try {
      content = runGit(sourceRoot, ['show', `${sourceRef}:${repositoryPath}`]);
    } catch (error) {
      throw new Error(
        `Unable to extract git-pinned file ${sourceRef}:${repositoryPath}: ${error.message}`
      );
    }
    fs.writeFileSync(
      destinationPath,
      relativePath === 'SKILL.md' ? sanitizeSkillContent(content) : content,
      'utf8'
    );
  }
}

function ensureTargetDir(targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
}

function createRelativeLinkTarget(sourceDir, destDir) {
  const relativeTarget = path.relative(path.dirname(destDir), sourceDir);
  return relativeTarget.length > 0 ? relativeTarget : sourceDir;
}

function linkSkill(sourceDir, destDir) {
  // If target skill already exists, clean only this skill target to allow safe update/amend
  if (fs.existsSync(destDir) || fs.lstatSync(destDir, { throwIfNoEntry: false })) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  if (process.platform === 'win32') {
    try {
      fs.symlinkSync(sourceDir, destDir, 'junction');
      return;
    } catch (junctionError) {
      // If junction fails, attempt standard directory symlink
      try {
        fs.symlinkSync(sourceDir, destDir, 'dir');
        return;
      } catch (symlinkError) {
        throw new Error(
          `Failed to create Windows link from ${sourceDir} to ${destDir}: ${junctionError.message} / ${symlinkError.message}`
        );
      }
    }
  }

  const relativeTarget = createRelativeLinkTarget(sourceDir, destDir);
  fs.symlinkSync(relativeTarget, destDir, 'dir');
}

function copySkill(sourceDir, destDir) {
  // If target skill already exists, clean only this skill target to allow safe update/amend
  if (fs.existsSync(destDir) || fs.lstatSync(destDir, { throwIfNoEntry: false })) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  fs.cpSync(sourceDir, destDir, {
    recursive: true,
    force: true,
    dereference: false,
    preserveTimestamps: true
  });
}

function updateSkillMetadata(destSkillMd, entry) {
  if (!fs.existsSync(destSkillMd)) {
    return;
  }

  let content = fs.readFileSync(destSkillMd, 'utf8');
  const normalized = normalizedEntry(entry);
  const metadata = [];
  const license = normalized.license;
  if (normalized.author && normalized.author.toLowerCase().includes('matt pocock')) {
    metadata.push(['author', 'Matt Pocock (https://github.com/mattpocock/skills)']);
  }
  for (const key of ['source_repo', 'source_path', 'source_ref', 'upstream', 'upstream_name', 'version']) {
    if (normalized[key]) metadata.push([key, normalized[key]]);
  }

  if (metadata.length === 0) {
    return;
  }

  const addMissingMetadata = (block) => {
    const lines = block.split(/\r?\n/).filter((line) => !/^(author|license|source|source_repo|source_path|source_ref|upstream|upstream_name|version):/.test(line));
    let updatedBlock = lines.join('\n').trimEnd();
    const packagedNamePattern = /^name:\s*.*$/m;
    if (packagedNamePattern.test(updatedBlock)) {
      updatedBlock = updatedBlock.replace(packagedNamePattern, `name: ${entry.name}`);
    } else {
      updatedBlock = `name: ${entry.name}\n${updatedBlock}`;
    }
    if (license) {
      const blockLines = updatedBlock.split('\n').filter((line) => !/^license:\s*/.test(line));
      const metadataLineIndex = blockLines.findIndex((line) => /^metadata:\s*$/.test(line));
      const licenseLine = `license: ${license}`;
      if (metadataLineIndex < 0) {
        blockLines.push(licenseLine);
      } else {
        blockLines.splice(metadataLineIndex, 0, licenseLine);
      }
      updatedBlock = blockLines.join('\n');
    }
    const metadataIndex = lines.findIndex((line) => line === 'metadata:' || line.startsWith('metadata:'));
    if (metadataIndex < 0) {
      updatedBlock += `\nmetadata:`;
      for (const [key, value] of metadata) updatedBlock += `\n  ${key}: ${value}`;
      return updatedBlock;
    }
    for (const [key, value] of metadata) {
      const keyPattern = new RegExp(`^\\s{2}${key}:`, 'm');
      if (!keyPattern.test(updatedBlock)) {
        updatedBlock += `\n  ${key}: ${value}`;
      }
    }
    return updatedBlock;
  };

  if (/^---[\r\n]/.test(content)) {
    content = content.replace(
      /^---[\r\n]+([\s\S]*?)---[\r\n]*/,
      (match, block) => `---\n${addMissingMetadata(block)}\n---\n`
    );
  } else {
    content = `---\nmetadata:\n${metadata.map(([key, value]) => `  ${key}: ${value}`).join('\n')}\n---\n\n${content}`;
  }
  fs.writeFileSync(destSkillMd, sanitizeSkillContent(content), 'utf8');
}

function syncSkills(options) {
  const lockfile = loadLockfile(options.lockfile);
  const targetDir = options.target;
  const mode = options.mode;
  const seenNames = new Set();
  const sourceRoots = new Map();
  const resolvedSkills = [];

  if (mode !== 'copy' && mode !== 'symlink') {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  if (typeof lockfile.schema_version !== 'number' || lockfile.schema_version !== 1) {
    throw new Error(`Unsupported lockfile schema_version: ${lockfile.schema_version}`);
  }

  if (!Array.isArray(lockfile.skills) || lockfile.skills.length === 0) {
    throw new Error('Lockfile contains no skills to sync');
  }

  for (const entry of lockfile.skills) {
    validateEntry(entry);
    const normalized = normalizedEntry(entry);

    if (seenNames.has(normalized.name)) {
      throw new Error(`Duplicate skill name in lockfile: ${normalized.name}`);
    }
    seenNames.add(normalized.name);

    const sourceRoot = sourceRoots.get(normalized.source_repo) || resolveSourceRoot(normalized.source_repo);
    sourceRoots.set(normalized.source_repo, sourceRoot);

    const sourcePath = path.resolve(sourceRoot, normalized.source_path);
    const sourceDir = path.dirname(sourcePath);
    const sourceDirRel = path.posix.dirname(normalized.source_path.replace(/\\/g, '/'));

    if (!normalized.source_ref) {
      validateSourceSkill(normalized.name, sourcePath);
    }

    resolvedSkills.push({
      name: normalized.name,
      sourceDir,
      sourceRoot,
      sourceDirRel,
      sourceRef: normalized.source_ref || null
    });
  }

  ensureTargetDir(targetDir);

  for (const skill of resolvedSkills) {
    const destDir = path.join(targetDir, skill.name);

    if (skill.sourceRef) {
      if (mode === 'symlink') {
        process.stderr.write(
          `Warning: symlink mode is unavailable for git-pinned skill "${skill.name}"; falling back to copy mode.\n`
        );
      }
      extractGitSkill(skill.sourceRoot, skill.sourceRef, skill.sourceDirRel, destDir);
    } else if (mode === 'symlink') {
      linkSkill(skill.sourceDir, destDir);
    } else {
      copySkill(skill.sourceDir, destDir);
    }
  }

  // Ensure Matt Pocock attribution is applied on copied skills if author is present
  if (mode === 'copy') {
    for (const entry of lockfile.skills) {
      updateSkillMetadata(path.join(targetDir, entry.name, 'SKILL.md'), entry);
    }
  }

  return {
    mode,
    targetDir,
    count: lockfile.skills.length
  };
}

function main(argv) {
  try {
    const options = parseArgs(argv);

    if (options.help) {
      printHelp();
      return 0;
    }

    const result = syncSkills(options);
    process.stdout.write(`Synced ${result.count} skills to ${result.targetDir} using ${result.mode} mode.\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`sync-skills: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  main,
  parseArgs,
  syncSkills,
  loadLockfile,
  resolveSourceRoot,
  extractGitSkill
};
