#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LOCKFILE = path.join(REPO_ROOT, 'catalog', 'skills.lock.json');
const DEFAULT_SKILLS_DIR = path.join(REPO_ROOT, 'skills');

function parseArgs(argv) {
  const options = {
    lockfile: DEFAULT_LOCKFILE,
    skillsDir: DEFAULT_SKILLS_DIR,
    report: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case '--lockfile':
        options.lockfile = path.resolve(process.cwd(), argv[++i]);
        break;
      case '--skills-dir':
        options.skillsDir = path.resolve(process.cwd(), argv[++i]);
        break;
      case '--report':
        options.report = path.resolve(process.cwd(), argv[++i]);
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${argv[i]}`);
    }
  }

  return options;
}

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/validate-skills.js [options]',
    '',
    'Options:',
    '  --lockfile <path>    Catalog lockfile (default: ./catalog/skills.lock.json)',
    '  --skills-dir <path>  Packaged skills directory (default: ./skills)',
    '  --report <path>      Write JSON results to this path',
    '  --help, -h           Show this help message',
    ''
  ].join('\n'));
}

function addResult(results, skill, type, status, details) {
  results.push({ skill, type, status, details });
}

function readLockfile(lockfilePath) {
  if (!fs.existsSync(lockfilePath)) {
    throw new Error(`Lockfile not found: ${lockfilePath}`);
  }
  const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  if (!lockfile || !Array.isArray(lockfile.skills)) {
    throw new Error('Lockfile must contain a skills array');
  }
  return lockfile;
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return null;
  }
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return null;
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) {
      fields[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return { fields, body: content.slice(match[0].length) };
}

function findLocalReferences(body, skillDir) {
  const references = [];
  const patterns = [
    /`([^`]+\.(?:md|json|py|js|sh|yaml|yml|toml|txt))`/g,
    /\]\(([^)#][^)]*)\)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      const candidate = match[1].trim();
      if (
        !candidate.includes('://') &&
        (candidate.startsWith('./') || candidate.startsWith('../'))
      ) {
        references.push(candidate);
      }
    }
  }

  return [...new Set(references)].filter((reference) => {
    const normalized = reference.replace(/\\/g, path.sep);
    const resolved = path.resolve(skillDir, normalized);
    return resolved.startsWith(`${path.resolve(skillDir)}${path.sep}`);
  });
}

function validateSkill(entry, skillsDir, results) {
  const skillDir = path.join(skillsDir, entry.name);
  const skillPath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillDir) || !fs.statSync(skillDir).isDirectory()) {
    addResult(results, entry.name, 'structure', 'failed', `Missing packaged directory: ${skillDir}`);
    return;
  }
  if (!fs.existsSync(skillPath) || !fs.statSync(skillPath).isFile()) {
    addResult(results, entry.name, 'structure', 'failed', 'Missing packaged SKILL.md');
    return;
  }

  const content = fs.readFileSync(skillPath, 'utf8');
  if (/[\u2013\u2014\u2011\u2190-\u21ff\u2300-\u23ff\u2600-\u27bf]/u.test(content)) {
    addResult(results, entry.name, 'metadata', 'failed', 'Skill contains prohibited Unicode punctuation or emoji');
  }
  if (/[âðï][\u0080-\u00bf]|Ã.|Â./u.test(content)) {
    addResult(results, entry.name, 'metadata', 'failed', 'Skill contains mojibake');
  }
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    addResult(results, entry.name, 'structure', 'failed', 'Missing or malformed YAML frontmatter');
    return;
  }
  if (frontmatter.fields.name !== entry.name) {
    addResult(results, entry.name, 'structure', 'failed', 'Frontmatter name does not match catalog entry');
  }
  if (!frontmatter.fields.description) {
    addResult(results, entry.name, 'structure', 'failed', 'Frontmatter description is missing');
  }
  if (frontmatter.fields.source !== entry.source_repo) {
    addResult(results, entry.name, 'metadata', 'failed', 'Frontmatter source does not match catalog entry');
  }
  if (entry.source_ref && frontmatter.fields.source_ref !== entry.source_ref) {
    addResult(results, entry.name, 'metadata', 'failed', 'Frontmatter source_ref does not match catalog entry');
  }
  if (entry.upstream && frontmatter.fields.upstream !== entry.upstream) {
    addResult(results, entry.name, 'metadata', 'failed', 'Frontmatter upstream does not match catalog entry');
  }
  if (frontmatter.body.trim().length === 0) {
    addResult(results, entry.name, 'structure', 'failed', 'Markdown body is empty');
  }

  for (const reference of findLocalReferences(frontmatter.body, skillDir)) {
    if (!fs.existsSync(path.resolve(skillDir, reference))) {
      addResult(results, entry.name, 'reference', 'failed', `Missing local reference: ${reference}`);
    }
  }

  const skillFailures = results.filter((result) => result.skill === entry.name && result.status === 'failed');
  if (skillFailures.length === 0) {
    addResult(results, entry.name, 'structure', 'passed', 'Packaged skill contract satisfied');
  }
}

function runBehavioralChecks(skillsDir, results, repositoryRoot = REPO_ROOT) {
  const checks = [
    ['rubber-ducking', 'skills/rubber-ducking/scripts/test_ast_chunking.py'],
    ['rubber-ducking', 'skills/rubber-ducking/scripts/test_language_detect.py']
  ];

  for (const [skill, relativeScript] of checks) {
    const scriptPath = path.join(repositoryRoot, relativeScript);
    if (!fs.existsSync(scriptPath)) {
      addResult(results, skill, 'behavior', 'failed', `Missing bundled check: ${relativeScript}`);
      continue;
    }
    const result = spawnSync('python', [scriptPath], { cwd: REPO_ROOT, encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      addResult(
        results,
        skill,
        'behavior',
        'failed',
        (result.stderr || result.error?.message || `Exit code ${result.status}`).trim()
      );
    } else {
      addResult(results, skill, 'behavior', 'passed', relativeScript);
    }
  }
}

function writeReport(reportPath, report) {
  if (!reportPath) {
    return;
  }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return 0;
  }

  const lockfile = readLockfile(options.lockfile);
  const results = [];
  for (const entry of lockfile.skills) {
    validateSkill(entry, options.skillsDir, results);
  }
  runBehavioralChecks(options.skillsDir, results);

  const report = {
    schema_version: 1,
    repository: path.basename(REPO_ROOT),
    checks: results
  };
  writeReport(options.report, report);

  const failures = results.filter((result) => result.status === 'failed');
  for (const result of results) {
    process.stdout.write(`[${result.status.toUpperCase()}] ${result.skill} ${result.type}: ${result.details}\n`);
  }
  process.stdout.write(`Validated ${lockfile.skills.length} packaged skills with ${results.length} checks.\n`);
  return failures.length === 0 ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`validate-skills: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main, parseArgs, parseFrontmatter, findLocalReferences, runBehavioralChecks };
