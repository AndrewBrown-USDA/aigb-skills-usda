#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

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
    return sourceRepo;
  }

  const siblingCandidate = path.resolve(REPO_ROOT, '..', sourceRepo);
  if (fs.existsSync(siblingCandidate)) {
    return siblingCandidate;
  }

  const localCandidate = path.resolve(REPO_ROOT, sourceRepo);
  if (fs.existsSync(localCandidate)) {
    return localCandidate;
  }

  return siblingCandidate;
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Each lockfile entry must be an object');
  }

  if (typeof entry.name !== 'string' || entry.name.length === 0) {
    throw new Error('Each lockfile entry must include a non-empty name');
  }

  if (typeof entry.source_repo !== 'string' || entry.source_repo.length === 0) {
    throw new Error(`Skill ${entry.name} is missing source_repo`);
  }

  if (typeof entry.source_path !== 'string' || entry.source_path.length === 0) {
    throw new Error(`Skill ${entry.name} is missing source_path`);
  }

  if (entry.publishability !== 'publishable') {
    throw new Error(`Skill ${entry.name} is not publishable`);
  }
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

    if (seenNames.has(entry.name)) {
      throw new Error(`Duplicate skill name in lockfile: ${entry.name}`);
    }
    seenNames.add(entry.name);

    const sourceRoot = sourceRoots.get(entry.source_repo) || resolveSourceRoot(entry.source_repo);
    sourceRoots.set(entry.source_repo, sourceRoot);

    const sourcePath = path.resolve(sourceRoot, entry.source_path);
    const sourceDir = path.dirname(sourcePath);

    validateSourceSkill(entry.name, sourcePath);

    resolvedSkills.push({
      name: entry.name,
      sourceDir
    });
  }

  ensureTargetDir(targetDir);

  for (const skill of resolvedSkills) {
    const destDir = path.join(targetDir, skill.name);

    if (mode === 'symlink') {
      linkSkill(skill.sourceDir, destDir);
    } else {
      copySkill(skill.sourceDir, destDir);
    }
  }

  // Ensure Matt Pocock attribution is applied on copied skills if author is present
  if (mode === 'copy') {
    for (const entry of lockfile.skills) {
      if (entry.author && entry.author.toLowerCase().includes('matt pocock')) {
        const destSkillMd = path.join(targetDir, entry.name, 'SKILL.md');
        if (fs.existsSync(destSkillMd)) {
          let content = fs.readFileSync(destSkillMd, 'utf8');
          if (!content.includes('author: Matt Pocock')) {
            content = content.replace(
              /^---[\r\n]+([\s\S]*?)---[\r\n]+/,
              (match, p1) => {
                let block = p1.trimEnd();
                if (!block.includes('author:')) {
                  block += '\nauthor: Matt Pocock (https://github.com/mattpocock/skills)';
                }
                if (!block.includes('license:')) {
                  block += '\nlicense: MIT';
                }
                return `---\n${block}\n---\n\n`;
              }
            );
            fs.writeFileSync(destSkillMd, content, 'utf8');
          }
        }
      }
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
  resolveSourceRoot
};
