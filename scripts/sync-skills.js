#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LOCKFILE = path.join(REPO_ROOT, 'catalog', 'skills.lock.json');
const DEFAULT_TARGET_DIR = path.join(REPO_ROOT, 'skills');
const { normalizeMetadata, validateMetadata } = require('./skill-metadata');

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/sync-skills.js [options]',
    '',
    'Options:',
    '  --mode <copy|symlink>   Materialization mode (default: copy)',
    '  --lockfile <path>       Path to catalog/skills.lock.json',
    '  --target <path>         Destination directory (default: ./skills)',
    '  --allow-network         Allow clone/fetch recovery for missing repositories or refs',
    '  --no-clone              Compatibility alias for the local-only default',
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
    clone: false,
    allowNetwork: false,
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
      case '--no-clone':
        options.clone = false;
        break;
      case '--allow-network':
        options.clone = true;
        options.allowNetwork = true;
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

function runGit(sourceRoot, args) {
  return execFileSync('git', ['-C', sourceRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function cloneSourceRepo(sourceUrl, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  execFileSync('git', ['clone', sourceUrl, targetPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function resolveSourceRoot(entry, options) {
  const sourceRepo = entry.source_repo;
  const sourcePath = /^https?:\/\//.test(sourceRepo)
    ? new URL(sourceRepo).pathname.split('/').filter(Boolean).slice(-2).join('-').replace(/\.git$/, '')
    : sourceRepo;
  if (path.isAbsolute(sourceRepo)) {
    if (fs.existsSync(sourceRepo)) {
      return sourceRepo;
    }
    throw new Error(
      `Maintainer sync error: Absolute source repository path does not exist: "${sourceRepo}". ` +
      `"sync" is for maintainers synchronizing from upstream source repositories. ` +
      `To install skills into your environment, run "npx --no-install skills install --target <dir>" instead.`
    );
  }

  const siblingCandidate = path.resolve(REPO_ROOT, '..', sourcePath);
  if (fs.existsSync(siblingCandidate)) {
    return siblingCandidate;
  }

  const localCandidate = path.resolve(REPO_ROOT, sourcePath);
  if (fs.existsSync(localCandidate)) {
    return localCandidate;
  }

  if (options.clone && entry.source_url) {
    try {
      cloneSourceRepo(entry.source_url, siblingCandidate);
      return siblingCandidate;
    } catch (error) {
      throw new Error(
        `Maintainer sync error: Failed to clone canonical source repository "${sourceRepo}" from "${entry.source_url}" to "${siblingCandidate}": ${error.message}`
      );
    }
  }

  const cloneHint = options.allowNetwork
    ? 'No canonical source_url is available in the lockfile, so it cannot be cloned automatically. '
    : 'Automatic cloning and fetching are disabled by default; use --allow-network to permit network recovery. ';
  throw new Error(
    `Maintainer sync error: Upstream source repository "${sourceRepo}" was not found (checked "${siblingCandidate}" and "${localCandidate}"). ` +
    cloneHint +
    `The "sync" command is intended for repository maintainers with local checkout of source repos. ` +
    `For users and agents installing packaged skills, run "npx --no-install skills install --target <dir>" (or "make install-skills") instead.`
  );
}

function isCloneableRepositoryUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (
      url.hostname === 'github.com' ||
      url.hostname === 'gitlab.com' ||
      url.hostname === 'bitbucket.org' ||
      url.pathname.endsWith('.git')
    );
  } catch (error) {
    return false;
  }
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Each lockfile entry must be an object');
  }

  if (typeof entry.name !== 'string' || entry.name.length === 0) {
    throw new Error('Each lockfile entry must include a non-empty name');
  }

  const metadata = normalizeMetadata({
    ...(entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}),
    ...entry
  });
  const validation = validateMetadata(metadata);
  if (!validation.valid) throw new Error(`Skill ${entry.name} metadata: ${validation.errors.join('; ')}`);
  const { sourceRepo, sourcePath, sourceUrl } = {
    sourceRepo: metadata.source_repo,
    sourcePath: metadata.source_path,
    sourceUrl: metadata.source_url
  };

  if (typeof sourceRepo !== 'string' || sourceRepo.length === 0) {
    throw new Error(`Skill ${entry.name} is missing source_repo`);
  }

  if (typeof sourcePath !== 'string' || sourcePath.length === 0) {
    throw new Error(`Skill ${entry.name} is missing source_path`);
  }

  if (sourceUrl !== null && sourceUrl !== undefined &&
      (typeof sourceUrl !== 'string' || !/^https?:\/\//.test(sourceUrl))) {
    throw new Error(`Skill ${entry.name} is missing a valid canonical source_url`);
  }
}

function normalizedEntry(entry) {
  const metadata = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
  const version = metadata.version || entry.version;
  const normalized = normalizeMetadata({
    ...entry,
    ...metadata,
    source_repo: metadata.source_repo || entry.source_repo,
    source_path: metadata.source_path || entry.source_path,
    source_url: metadata.source_url || entry.source_url,
    upstream_repo: metadata.upstream_repo || entry.upstream_repo || entry.upstream,
    upstream_ref: metadata.upstream_ref || entry.upstream_ref,
    upstream_path: metadata.upstream_path || entry.upstream_path
  });
  return {
    ...entry,
    ...metadata,
    ...normalized,
    upstream_name: metadata.upstream_name || entry.upstream_name,
    source_ref: metadata.source_ref || entry.source_ref,
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

function fetchSourceRef(sourceRoot, sourceRef, options = {}) {
  if (!sourceRef) return;
  try {
    runGit(sourceRoot, ['rev-parse', '--verify', `${sourceRef}^{commit}`]);
    return;
  } catch (error) {
    // Resolve locally before contacting the network.
  }
  if (!options.allowNetwork) {
    throw new Error(
      `Unable to resolve git ref "${sourceRef}" in ${sourceRoot}: ` +
      'Automatic fetching is disabled by default; use --allow-network to permit network recovery.'
    );
  }
  try {
    runGit(sourceRoot, ['fetch', '--tags', 'origin']);
    runGit(sourceRoot, ['fetch', 'origin', sourceRef]);
    runGit(sourceRoot, ['rev-parse', '--verify', `${sourceRef}^{commit}`]);
  } catch (error) {
    throw new Error(`Unable to resolve git ref "${sourceRef}" in ${sourceRoot}: ${error.message}`);
  }
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

function extractGitSkill(sourceRoot, sourceRef, sourceDirRel, destDir, packagedName = null) {
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
    if (relativePath === 'SKILL.md') {
      content = sanitizeSkillContent(content);
      if (packagedName) content = content.replace(/^name:\s*.*$/m, `name: ${packagedName}`);
    }
    fs.writeFileSync(destinationPath, content, 'utf8');
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

function sameFilesystemEntry(firstPath, secondPath) {
  try {
    return fs.realpathSync(firstPath) === fs.realpathSync(secondPath);
  } catch (error) {
    return path.resolve(firstPath) === path.resolve(secondPath);
  }
}

function linkSkill(sourceDir, destDir) {
  if (fs.existsSync(sourceDir) && fs.existsSync(destDir) && sameFilesystemEntry(sourceDir, destDir)) {
    return;
  }

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
  if (fs.existsSync(sourceDir) && fs.existsSync(destDir) && sameFilesystemEntry(sourceDir, destDir)) {
    return;
  }

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
  content = content.replace(/(^---[\r\n]+)([\s\S]*?)(^---[\r\n]+)/m, (match, start, block, end) => {
    const renamed = block.replace(/^name:\s*.*$/m, `name: ${entry.name}`);
    return `${start}${renamed}${end}`;
  });
  if (
    normalized.source_repo === 'aigb-skills' &&
    !normalized.source_ref &&
    !normalized.source_url &&
    !normalized.upstream_name
  ) {
    content = content.replace(/^name:\s*.*$/m, `name: ${entry.name}`);
    fs.writeFileSync(destSkillMd, sanitizeSkillContent(content), 'utf8');
    return;
  }

  const metadata = [];
  const license = normalized.license;
  const listKeys = new Set(['loadouts', 'dependencies', 'optional_dependencies']);
  const formatMetadataValue = (key, value) => Array.isArray(value)
    ? (listKeys.has(key) ? value.join(',') : JSON.stringify(value))
    : value;
  if (normalized.author) {
    metadata.push(['author', formatMetadataValue('author', normalized.author)]);
  }
  if (normalized.authors) metadata.push(['authors', formatMetadataValue('authors', normalized.authors)]);
  if (normalized.inspired_by) metadata.push(['inspired_by', formatMetadataValue('inspired_by', normalized.inspired_by)]);
  for (const key of [
    'source_repo', 'source_path', 'source_url', 'source_ref', 'upstream_repo',
    'upstream_ref', 'upstream_path', 'upstream_name', 'version', 'group',
    'loadout', 'loadouts', 'dependencies', 'optional_dependencies'
  ]) {
    if (normalized[key] !== undefined && normalized[key] !== null && normalized[key] !== '') {
      metadata.push([key, formatMetadataValue(key, normalized[key])]);
    }
  }

  if (metadata.length === 0) {
    return;
  }

  const addMissingMetadata = (block) => {
    const lines = block.split(/\r?\n/).filter((line) => !/^\s*(author|authors|inspired_by|license|source|source_repo|source_path|source_url|source_ref|upstream|upstream_repo|upstream_ref|upstream_path|upstream_name|version|group|loadout|loadouts|dependencies|optional_dependencies):/.test(line));
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
      const keyPattern = new RegExp(`^\\s+${key}:`, 'm');
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

    const sourceRoot = sourceRoots.get(normalized.source_repo) || resolveSourceRoot(normalized, options);
    sourceRoots.set(normalized.source_repo, sourceRoot);

    const pinnedRepo = normalized.upstream_repo;
    const pinnedRef = normalized.upstream_ref || (
      !pinnedRepo || pinnedRepo === normalized.source_repo ? normalized.source_ref : null
    );
    let extractionRoot = sourceRoot;
    let extractionRef = null;
    if (pinnedRepo && pinnedRepo !== normalized.source_repo) {
      try {
        extractionRoot = resolveSourceRoot(
          { ...normalized, source_repo: pinnedRepo, source_url: pinnedRepo },
          { ...options, clone: options.clone && isCloneableRepositoryUrl(pinnedRepo) }
        );
        extractionRef = pinnedRef;
      } catch (error) {
        if (isCloneableRepositoryUrl(pinnedRepo)) throw error;
      }
    }
    if (extractionRef) {
      fetchSourceRef(extractionRoot, extractionRef, options);
      try {
        const pinnedPath = (normalized.upstream_path || normalized.source_path).replace(/\\/g, '/');
        if (!runGit(extractionRoot, ['ls-tree', '-r', '--name-only', extractionRef, '--', pinnedPath]).trim()) {
          extractionRoot = sourceRoot;
          extractionRef = null;
        }
      } catch (error) {
        extractionRoot = sourceRoot;
        extractionRef = null;
      }
    }

    const extractionPath = extractionRef
      ? (normalized.upstream_path || normalized.source_path)
      : normalized.source_path;
    const sourcePath = path.resolve(extractionRoot, extractionPath);
    const sourceDir = path.dirname(sourcePath);
    const sourceDirRel = path.posix.dirname(extractionPath.replace(/\\/g, '/'));

    if (!extractionRef) {
      validateSourceSkill(normalized.name, sourcePath);
    }

    resolvedSkills.push({
      name: normalized.name,
      sourceDir,
      sourceRoot: extractionRoot,
      sourceDirRel,
      sourceRef: extractionRef,
      upstreamName: normalized.upstream_name || null
    });
  }

  ensureTargetDir(targetDir);

  for (const skill of resolvedSkills) {
    const destDir = path.join(targetDir, skill.name);

    if (skill.sourceRef) {
      if (mode === 'symlink') {
        const kind = skill.upstreamName ? 'aliased' : 'git-pinned';
        process.stderr.write(`Warning: symlink mode is unavailable for ${kind} skill "${skill.name}"; falling back to copy mode.\n`);
      }
      extractGitSkill(skill.sourceRoot, skill.sourceRef, skill.sourceDirRel, destDir, skill.name);
    } else if (mode === 'symlink' && skill.upstreamName) {
      process.stderr.write(
        `Warning: symlink mode is unavailable for aliased skill "${skill.name}"; falling back to copy mode.\n`
      );
      copySkill(skill.sourceDir, destDir);
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
  extractGitSkill,
  updateSkillMetadata
};
