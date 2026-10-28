#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE_DIR = path.join(REPO_ROOT, 'skills');
const DEFAULT_CATALOG_PATH = path.join(REPO_ROOT, 'catalog', 'skills.lock.json');
const { loadCatalog, resolve: resolveLoadout } = require('./skill-loadouts');

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/install.js [options]',
    '   or: npx --no-install skills install [options]',
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
    include: null,
    exclude: null,
    help: false
  };
  const optionValue = (arg, index, description) => {
    const value = argv[index + 1];
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
      throw new Error(`${arg} requires ${description}`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case '--mode':
        options.mode = optionValue(arg, i, 'copy or symlink');
        i += 1;
        break;
      case '--source':
        options.source = path.resolve(process.cwd(), expandHomeDir(optionValue(arg, i, 'a path')));
        i += 1;
        break;
      case '--target':
        options.target = path.resolve(process.cwd(), expandHomeDir(optionValue(arg, i, 'a path')));
        i += 1;
        break;
      case '--skill':
      case '--skills': {
        const val = optionValue(arg, i, 'a non-empty skill name or comma-separated list');
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
      case '--include':
      case '--exclude': {
        const val = optionValue(arg, i, 'a non-empty skill name or comma-separated list');
        i += 1;
        if (!val || typeof val !== 'string' || val.trim().length === 0) {
          throw new Error(`${arg} requires a non-empty skill name or comma-separated list`);
        }
        const key = arg.slice(2);
        if (!options[key]) options[key] = [];
        options[key].push(...val.split(',').map(s => s.trim()).filter(Boolean));
        break;
      }
      case '--lockfile':
        optionValue(arg, i, 'a path');
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

function resolveCanonicalPath(targetPath) {
  let currentPath = path.resolve(targetPath);
  const suffix = [];

  while (true) {
    const exists = fs.existsSync(currentPath) || fs.lstatSync(currentPath, { throwIfNoEntry: false });
    if (exists) {
      try {
        return path.join(fs.realpathSync(currentPath), ...suffix);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return path.join(currentPath, ...suffix);
    }
    suffix.unshift(path.basename(currentPath));
    currentPath = parentPath;
  }
}

function readCatalog(options = {}) {
  const catalogPath = options.catalogPath || DEFAULT_CATALOG_PATH;
  const sourceDir = path.resolve(options.sourceDir || DEFAULT_SOURCE_DIR);
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read catalog: ${error.message}`);
  }
  const loaded = loadCatalog(catalog);
  if (loaded.errors.length) throw new Error(`Invalid catalog: ${loaded.errors.join('; ')}`);
  for (const record of loaded.skills.values()) {
    const expected = path.posix.join('skills', record.name, 'SKILL.md');
    if (record.source_path !== expected) throw new Error(`Invalid packaged source path for ${record.name}`);
  }
  return { ...catalog, skills: [...loaded.skills.values()], sourceDir };
}

function buildCatalog(options = {}) {
  return require('./mine-history').buildLockfile(options.skillsDir || DEFAULT_SOURCE_DIR);
}

function installResolved(result, options = {}) {
  if (!result || result.ok !== true || !Array.isArray(result.skills)) {
    throw new Error('Cannot install an unsuccessful resolution');
  }
  const sourceDir = path.resolve(options.sourceDir || DEFAULT_SOURCE_DIR);
  const names = result.skills.map(record => record.name);
  const installed = installMaterialized(names, sourceDir, options);
  return { ...installed, installed: [...installed.skills], skipped: [] };
}

function installMaterialized(skillDirs, sourceDir, options) {
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
  const absoluteSource = path.resolve(sourceDir);
  const canonicalTarget = resolveCanonicalPath(targetDir);
  const isWithin = (parent, child) => {
    const relative = path.relative(parent, child);
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
  };
  if (
    isWithin(resolvedSource, canonicalTarget)
    || isWithin(canonicalTarget, resolvedSource)
    || isWithin(canonicalTarget, absoluteSource)
  ) {
    throw new Error(`Source and target directories must not overlap: ${resolvedSource} and ${canonicalTarget}`);
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const availableSkillDirs = entries
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(sourceDir, entry.name, 'SKILL.md')))
    .map(entry => entry.name);

  if (availableSkillDirs.length === 0) {
    throw new Error(`No skills with SKILL.md found in source directory: ${sourceDir}`);
  }

  skillDirs = Array.from(new Set(skillDirs));
  const missing = skillDirs.filter(s => !availableSkillDirs.includes(s));
  if (missing.length > 0) throw new Error(`Skill(s) not found in ${sourceDir}: ${missing.join(', ')}`);

  const targetEntry = fs.lstatSync(targetDir, { throwIfNoEntry: false });
  if (targetEntry) {
    let targetIsDirectory = false;
    try {
      targetIsDirectory = fs.statSync(targetDir).isDirectory();
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    if (!targetIsDirectory) {
      throw new Error(`Target is not a directory: ${targetDir}`);
    }
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

function installSkills(options) {
  const catalog = readCatalog({ sourceDir: options.source });
  if ((!options.skills || options.skills.length === 0) &&
      ((options.include && options.include.length) || (options.exclude && options.exclude.length))) {
    throw new Error('roots-required: --include and --exclude require --skill or --skills');
  }
  const result = options.skills && options.skills.length
    ? resolveLoadout(options.skills, catalog, {
      include: options.include,
      exclude: options.exclude,
      force: options.force
        ? options.skills.filter(name => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
        : [],
      constraints: options.constraints
    })
    : { ok: true, skills: catalog.skills, diagnostics: [] };
  if (!result.ok) {
    const diagnostics = result.diagnostics || [];
    const legacyNotFound = diagnostics.length > 0
      && diagnostics.every(d => d.code === 'missing-root' || d.code === 'invalid-selection');
    if (legacyNotFound) {
      const missing = diagnostics.map(d => d.subject).filter(Boolean);
      throw new Error(`Skill(s) not found in ${catalog.sourceDir}: ${missing.join(', ')}`);
    }
    throw new Error(diagnostics.map(d => `${d.code}: ${d.message || d.detail || d.subject}`).join('; '));
  }
  return installResolved(result, { ...options, sourceDir: options.source });
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
    const message = String(error && error.message ? error.message : error);
    if (message.includes('invalid skill selection:')) {
      process.stderr.write('install: Skill(s) not found\n');
      return 1;
    }
    process.stderr.write(`install: ${message}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  main,
  parseArgs,
  readCatalog,
  resolveLoadout,
  installResolved,
  buildCatalog,
  installSkills,
  printHelp
};
