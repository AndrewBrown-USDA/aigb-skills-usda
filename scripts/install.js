#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE_DIR = path.join(REPO_ROOT, 'skills');

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/install.js [options]',
    '   or: npx skills install [options]',
    '',
    'Description:',
    '  Installs pre-packaged skills directly from the local ./skills directory',
    '  into an agent or user skills destination.',
    '',
    'Options:',
    '  --target <path>          Destination directory (required or e.g. ~/.agents/skills)',
    '  --source <path>          Source skills directory (default: ./skills)',
    '  --skill, --skills <name> Single skill name or comma-separated list of skills',
    '  --mode <copy|symlink>    Materialization mode (default: copy)',
    '  --force                  Replace matching skills; conflicts are refused by default',
    '  Source and target directories must not overlap.',
    '  --help, -h               Show this help message',
    '',
    'Common target locations:',
    '  ~/.agents/skills         Copilot CLI / Universal Agents directory',
    '  ~/.claude/skills         Claude Code skills directory',
    '  ~/.pi/agent/skills       Pi coding agent skills directory',
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
    source: DEFAULT_SOURCE_DIR,
    target: null,
    skills: null,
    force: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case '--mode':
        options.mode = argv[i + 1];
        i += 1;
        break;
      case '--source':
        options.source = path.resolve(process.cwd(), expandHomeDir(argv[i + 1]));
        i += 1;
        break;
      case '--target':
        options.target = path.resolve(process.cwd(), expandHomeDir(argv[i + 1]));
        i += 1;
        break;
      case '--skill':
      case '--skills': {
        const val = argv[i + 1];
        i += 1;
        if (!val || typeof val !== 'string' || val.trim().length === 0) {
          throw new Error(`${arg} requires a non-empty skill name or comma-separated list`);
        }
        const parsed = val.split(',').map(s => s.trim()).filter(Boolean);
        if (parsed.length === 0) {
          throw new Error(`${arg} requires at least one non-empty skill name`);
        }
        if (!options.skills) {
          options.skills = [];
        }
        options.skills.push(...parsed);
        break;
      }
      case '--lockfile':
        i += 1;
        break;
      case '--force':
        options.force = true;
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

function createRelativeLinkTarget(sourceDir, destDir) {
  const relativeTarget = path.relative(path.dirname(destDir), sourceDir);
  return relativeTarget.length > 0 ? relativeTarget : sourceDir;
}

function linkSkill(sourceDir, destDir) {
  if (fs.existsSync(destDir) || fs.lstatSync(destDir, { throwIfNoEntry: false })) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  if (process.platform === 'win32') {
    try {
      fs.symlinkSync(sourceDir, destDir, 'junction');
      return;
    } catch (junctionError) {
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

function installSkills(options) {
  const sourceDir = options.source;
  const targetDir = options.target;
  const mode = options.mode;

  if (!targetDir) {
    throw new Error('Missing required option: --target <path> (e.g. ~/.agents/skills or .scratch/installed-skills)');
  }

  if (mode !== 'copy' && mode !== 'symlink') {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Source skills directory not found: ${sourceDir}`);
  }

  const resolvedSource = fs.realpathSync(sourceDir);
  const resolvedTarget = path.resolve(targetDir);
  const targetParent = path.dirname(resolvedTarget);
  const targetExists = fs.existsSync(resolvedTarget) || fs.lstatSync(resolvedTarget, { throwIfNoEntry: false });
  const resolvedTargetParent = fs.existsSync(targetParent) ? fs.realpathSync(targetParent) : targetParent;
  const canonicalTarget = targetExists
    ? fs.realpathSync(resolvedTarget)
    : path.join(resolvedTargetParent, path.basename(resolvedTarget));
  const isWithin = (parent, child) => {
    const relative = path.relative(parent, child);
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
  };
  if (isWithin(resolvedSource, canonicalTarget) || isWithin(canonicalTarget, resolvedSource)) {
    throw new Error(`Source and target directories must not overlap: ${resolvedSource} and ${canonicalTarget}`);
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const availableSkillDirs = entries
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(sourceDir, entry.name, 'SKILL.md')))
    .map(entry => entry.name);

  if (availableSkillDirs.length === 0) {
    throw new Error(`No skills with SKILL.md found in source directory: ${sourceDir}`);
  }

  let skillDirs = availableSkillDirs;

  if (options.skills && options.skills.length > 0) {
    const requested = Array.from(new Set(options.skills));
    const missing = requested.filter(s => !availableSkillDirs.includes(s));
    if (missing.length > 0) {
      throw new Error(`Skill(s) not found in ${sourceDir}: ${missing.join(', ')}`);
    }
    skillDirs = requested;
  }

  if (fs.existsSync(targetDir) && !fs.statSync(targetDir).isDirectory()) {
    throw new Error(`Target is not a directory: ${targetDir}`);
  }
  const conflicts = skillDirs.filter(skillName => {
    const dest = path.join(targetDir, skillName);
    return fs.existsSync(dest) || fs.lstatSync(dest, { throwIfNoEntry: false });
  });
  if (conflicts.length > 0 && !options.force) {
    throw new Error(`Skill(s) already exist in target: ${conflicts.join(', ')}. Use --force to replace them.`);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const skillName of skillDirs) {
    const src = path.join(sourceDir, skillName);
    const dest = path.join(targetDir, skillName);

    if (mode === 'symlink') {
      linkSkill(src, dest);
    } else {
      copySkill(src, dest);
    }
  }

  return {
    mode,
    sourceDir,
    targetDir,
    count: skillDirs.length,
    skills: skillDirs
  };
}

function main(argv) {
  try {
    const options = parseArgs(argv);

    if (options.help) {
      printHelp();
      return 0;
    }

    const result = installSkills(options);
    process.stdout.write(`Installed ${result.count} skills to ${result.targetDir} using ${result.mode} mode.\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`install: ${error.message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  main,
  parseArgs,
  installSkills,
  printHelp
};
