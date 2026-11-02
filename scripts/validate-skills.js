#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LOCKFILE = path.join(REPO_ROOT, 'catalog', 'skills.lock.json');
const DEFAULT_SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const { normalizeMetadata, validateMetadata } = require('./skill-metadata');

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
  const metadata = {};
  let inMetadata = false;
  let currentField = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s+/.test(line)) {
      const nested = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/);
      if (inMetadata && nested) {
        metadata[nested[1]] = nested[2].trim().replace(/^['"]|['"]$/g, '');
      } else if (!inMetadata && currentField && line.trim()) {
        fields[currentField] = `${fields[currentField]} ${line.trim()}`.trim();
      } else if (line.trim()) {
        return null;
      }
      continue;
    }
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) {
      fields[field[1]] = field[2].trim() === '>' || field[2].trim() === '|'
        ? ''
        : field[2].trim().replace(/^['"]|['"]$/g, '');
      inMetadata = field[1] === 'metadata';
      currentField = field[1];
      if (inMetadata && field[2].trim()) return null;
    } else if (line.trim()) {
      return null;
    }
  }
  return { fields, metadata, body: content.slice(match[0].length) };
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
  const metadataValidation = validateMetadata({
    ...entry,
    ...(entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {})
  });
  if (!metadataValidation.valid) {
    addResult(results, entry.name, 'metadata', 'failed', metadataValidation.errors.join('; '));
  }

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
  if (frontmatter.metadata.inspired_by !== undefined) {
    const inspiredByErrors = validateMetadata({
      source_repo: entry.source_repo,
      source_path: entry.source_path,
      inspired_by: frontmatter.metadata.inspired_by
    }).errors.filter((error) => error.startsWith('inspired_by'));
    if (inspiredByErrors.length) {
      addResult(results, entry.name, 'metadata', 'failed', inspiredByErrors.join('; '));
    }
  }
  if (frontmatter.fields.name !== entry.name) {
    addResult(results, entry.name, 'structure', 'failed', 'Frontmatter name does not match catalog entry');
  }
  if (!frontmatter.fields.description) {
    addResult(results, entry.name, 'structure', 'failed', 'Frontmatter description is missing');
  }
  const standardFields = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools', 'argument-hint']);
  const customTopLevel = Object.keys(frontmatter.fields).filter((key) => !standardFields.has(key));
  if (customTopLevel.length) {
    addResult(results, entry.name, 'metadata', 'failed', `Custom top-level metadata keys are not allowed: ${customTopLevel.join(', ')}`);
  }
  const normalizedEntry = normalizeMetadata(entry);
  const metadataFields = [
    'author', 'authors', 'inspired_by', 'source_repo', 'source_path', 'source_url',
    'source_ref', 'upstream', 'upstream_name', 'upstream_repo', 'upstream_ref',
    'upstream_path', 'group', 'loadout', 'loadouts', 'dependencies',
    'optional_dependencies'
  ];
  for (const key of metadataFields) {
    const catalogMetadata = entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
    const catalogValue = entry[key] !== undefined ? entry[key] : catalogMetadata[key];
    const expected = key === 'source_ref'
      ? (entry.source_ref !== undefined || catalogMetadata.source_ref !== undefined ? normalizedEntry.upstream_ref : undefined)
      : key === 'source_url'
        ? (catalogValue !== undefined && catalogValue !== normalizeMetadata({ source_repo: entry.source_repo }).source_url
          ? catalogValue
          : undefined)
        : (catalogValue !== undefined ? normalizedEntry[key] : undefined);
    const actual = key === 'source_ref' || key === 'upstream_ref'
      ? (frontmatter.metadata.upstream_ref || frontmatter.metadata.source_ref)
      : key === 'upstream_repo'
        ? (frontmatter.metadata.upstream_repo || frontmatter.metadata.upstream)
        : key === 'source_url'
          ? frontmatter.metadata.source_url
        : frontmatter.metadata[key];
    if (expected !== undefined && expected !== null) {
      const normalizedActual = actual === undefined || key === 'source_ref' || key === 'upstream'
        ? actual
        : normalizeMetadata({ [key]: actual })[key];
      if (actual === undefined || actual === null || actual === '') {
        addResult(results, entry.name, 'metadata', 'failed', `Frontmatter metadata.${key} is required by catalog entry`);
      } else if (JSON.stringify(normalizedActual) !== JSON.stringify(expected)) {
        addResult(results, entry.name, 'metadata', 'failed', `Frontmatter metadata.${key} does not match catalog entry`);
      }
    }
  }
  if (entry.version && entry.version.value !== null && frontmatter.metadata.version !== String(entry.version.value)) {
    addResult(results, entry.name, 'metadata', 'failed', 'Frontmatter metadata.version does not match catalog entry');
  }
  if (entry.compatibility !== undefined && frontmatter.fields.compatibility !== String(entry.compatibility)) {
    addResult(results, entry.name, 'metadata', 'failed', 'Frontmatter compatibility does not match catalog entry');
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

function validateDependencyReferences(entries, results) {
  const names = new Set(entries.map((entry) => entry.name));
  for (const entry of entries) {
    const metadata = normalizeMetadata({
      ...entry,
      ...(entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {})
    });
    for (const [field, label] of [['dependencies', 'required'], ['optional_dependencies', 'optional']]) {
      for (const dependency of metadata[field] || []) {
        if (!names.has(dependency)) {
          addResult(results, entry.name, 'metadata', 'failed',
            `Unknown ${label} dependency reference: ${dependency}`);
        }
      }
    }
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
    const pythonBin = selectPython();
    const result = spawnSync(pythonBin, [scriptPath], { cwd: REPO_ROOT, encoding: 'utf8' });
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

function runDocumentContractChecks(skillsDir, results) {
  const contracts = {
    'conventional-commits': [
      '## Message Format',
      '## Default Type Taxonomy',
      '## Bodies and Footers',
      'Refs: #123',
      'Reviewed-by: Example User',
      'Change-Id: Iabc123',
      'BREAKING CHANGE: callers must pass an explicit format',
      'Status: Valid | Invalid | Valid with project-specific concerns'
    ],
    'arcpy-migration': [
      '## Phase gates',
      '### Gate 1: Approve shared contracts',
      '### Gate 2: Separate adapter and core',
      '### Gate 4: Show behavior matches',
      '### Gate 5: Release check',
      '## Required artifacts'
    ],
    'goal-alignment': [
      '## Traceability model',
      '## Workflow',
      '## Verdict behavior',
      '**ALIGNED**',
      '**PARTIALLY ALIGNED**',
      '**MISALIGNED**',
      '## Unresolved-decision rules',
      'If execution can safely proceed on a bounded subset, mark that subset `PARTIALLY ALIGNED`.'
    ]
  };

  for (const [skill, requiredSections] of Object.entries(contracts)) {
    const skillPath = path.join(skillsDir, skill, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      continue;
    }
    const content = fs.readFileSync(skillPath, 'utf8');
    const missing = requiredSections.filter((section) => !content.includes(section));
    if (missing.length > 0) {
      addResult(results, skill, 'document-contract', 'failed', `Missing required content: ${missing.join('; ')}`);
    } else {
      addResult(results, skill, 'document-contract', 'passed', 'Required skill document contract satisfied');
    }
  }
}

function selectPython({
  env = process.env,
  platform = process.platform,
  runner = spawnSync
} = {}) {
  if (env.PYTHON) {
    return env.PYTHON;
  }

  const candidates = platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python', 'python3'];
  for (const candidate of candidates) {
    const probe = runner(candidate, ['--version'], {
      stdio: 'ignore',
      windowsHide: platform === 'win32'
    });
    if (!probe.error && probe.status === 0) {
      return candidate;
    }
  }

  return 'python';
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
  validateDependencyReferences(lockfile.skills, results);
  runDocumentContractChecks(options.skillsDir, results);
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

module.exports = {
  main,
  parseArgs,
  parseFrontmatter,
  findLocalReferences,
  validateDependencyReferences,
  runBehavioralChecks,
  runDocumentContractChecks,
  selectPython
};
