#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');

function parseSimpleYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yamlStr = match[1];
  const lines = yamlStr.split(/\r?\n/);
  const result = {};

  let currentKey = null;
  let currentObj = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;

    // Check nested 2-space indentation
    if (rawLine.startsWith('  ') && currentKey && currentObj) {
      const nestedMatch = rawLine.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (nestedMatch) {
        let val = nestedMatch[2].trim();
        val = val.replace(/^['"](.*)['"]$/, '$1');
        currentObj[nestedMatch[1]] = val;
      }
      continue;
    }

    const topMatch = rawLine.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (topMatch) {
      const key = topMatch[1];
      let val = topMatch[2].trim();

      if (val === '') {
        currentKey = key;
        currentObj = {};
        result[key] = currentObj;
      } else {
        currentKey = null;
        currentObj = null;
        val = val.replace(/^['"](.*)['"]$/, '$1');
        result[key] = val;
      }
    }
  }

  return result;
}

function scanCuratedSkills(skillsDir = SKILLS_DIR) {
  if (!fs.existsSync(skillsDir)) {
    throw new Error(`Skills directory not found: ${skillsDir}`);
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillName = entry.name;
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    const content = fs.readFileSync(skillPath, 'utf8');
    const fm = parseSimpleYamlFrontmatter(content) || {};

    const name = fm.name || skillName;
    const metadata = fm.metadata || {};
    const sourceRepo = metadata.source_repo || 'aigb-skills';
    const sourcePath = metadata.source_path || `skills/${skillName}/SKILL.md`;
    const sourceRef = metadata.upstream_ref || metadata.source_ref;
    const upstreamName = metadata.upstream_name;
    const upstreamRepo = metadata.upstream_repo || metadata.upstream;
    const author = metadata.author;
    const license = fm.license;
    const versionVal = metadata.version ? String(metadata.version).trim() : null;
    const version = {
      status: versionVal ? 'resolved' : 'missing',
      value: versionVal
    };

    const entryObj = {
      name,
      ...(author ? { author } : {}),
      ...(license ? { license } : {}),
      source_repo: sourceRepo,
      source_path: sourcePath,
      source_url: canonicalSourceUrl(sourceRepo),
      ...(upstreamName ? { upstream_name: upstreamName } : {}),
      ...(sourceRepo === 'aigb-skills' && sourceRef ? { upstream_ref: sourceRef } : {}),
      ...(sourceRepo === 'aigb-skills' && upstreamRepo ? { upstream_repo: upstreamRepo } : {}),
      version
    };

    skills.push(entryObj);
  }

  function canonicalSourceUrl(sourceRepo) {
    const sourceUrls = {
      'aigb-skills': 'https://github.com/AndrewBrown-USDA/aigb-skills.git'
    };
    return sourceUrls[sourceRepo] || `https://github.com/${sourceRepo}.git`;
  }

  // Consistent ordering by skill name
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') {
      options.output = argv[i + 1];
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }
  return options;
}

function printHelp() {
  process.stdout.write([
    'Usage: node scripts/mine-history.js --output catalog/skills.lock.json',
    '',
    'Generates the curated skills lockfile from skills/*/SKILL.md frontmatter.'
  ].join('\n') + '\n');
}

function buildLockfile(skillsDir = SKILLS_DIR) {
  const skills = scanCuratedSkills(skillsDir);
  return {
    schema_version: 1,
    generated_by: 'scripts/mine-history.js',
    generated_from: {
      repo: 'aigb-skills-usda',
      evidence: [
        'planning/EXECUTION_PLAN_1.md',
        'planning/STATE_1.md'
      ],
      note: 'Uses the history evidence already established in the orchestration context; does not re-mine the full history store.'
    },
    skills
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const lockfile = buildLockfile();
  const json = JSON.stringify(lockfile, null, 2) + '\n';

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
    return;
  }

  process.stdout.write(json);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseSimpleYamlFrontmatter,
  scanCuratedSkills,
  buildLockfile,
  parseArgs
};
