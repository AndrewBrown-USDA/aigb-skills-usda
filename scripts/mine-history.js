#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const curatedSkills = [
  {
    name: 'plan-first',
    source_repo: 'aigb-skills',
    source_path: 'skills/plan-first/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'Highest-frequency planning workflow in the existing history briefing.'
  },
  {
    name: 'agent-onboarding',
    source_repo: 'aigb-skills',
    source_path: 'skills/agent-onboarding/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'Repeatedly used for repo grounding and local workflow setup.'
  },
  {
    name: 'wave-orchestration',
    source_repo: 'aigb-skills',
    source_path: 'skills/wave-orchestration/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'Core workflow for decomposing and coordinating larger task waves.'
  },
  {
    name: 'plan-wave',
    source_repo: 'aigb-skills',
    source_path: 'skills/plan-wave/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'Frequently paired with planning/wave execution and task decomposition.'
  },
  {
    name: 'code-review-2axis',
    author: 'Matt Pocock',
    license: 'MIT',
    source_repo: 'mattpocock-skills',
    source_path: 'skills/engineering/code-review/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'High-frequency review workflow derived from Matt Pocock\'s code-review skill.'
  },
  {
    name: 'copilot-history-briefing',
    source_repo: 'aigb-skills',
    source_path: 'skills/copilot-history-briefing/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'Supports the history-led research workflow that informed this catalog.'
  },
  {
    name: 'tdd',
    source_repo: 'aigb-skills',
    source_path: 'skills/tdd/SKILL.md',
    selection_status: 'direct-history',
    publishability: 'publishable',
    rationale: 'Test-driven development support that the existing history already uses.'
  },
  {
    name: 'install-skills',
    source_repo: 'aigb-skills',
    source_path: 'skills/install-skills/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Supports the install/sync workflow that the public catalog is meant to expose.'
  },
  {
    name: 'reviewer-architecture',
    source_repo: 'aigb-skills',
    source_path: 'skills/reviewer-architecture/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Adjacent review support for code changes and structure-focused feedback.'
  },
  {
    name: 'reviewer-correctness',
    source_repo: 'aigb-skills',
    source_path: 'skills/reviewer-correctness/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Adjacent review support for bug-fix verification and correctness checks.'
  },
  {
    name: 'skill-research',
    source_repo: 'aigb-skills',
    source_path: 'skills/skill-research/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Useful for research-heavy tasks that feed planning and catalog decisions.'
  },
  {
    name: 'doc-consistency',
    source_repo: 'aigb-skills',
    source_path: 'skills/doc-consistency/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: "Keeps docs and examples aligned with the repo's established conventions."
  },
  {
    name: 'verbosity-cleaner',
    source_repo: 'aigb-skills',
    source_path: 'skills/verbosity-cleaner/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Helpful for keeping generated outputs and handoffs concise.'
  },
  {
    name: 'github-actions-ci',
    source_repo: 'aigb-skills',
    source_path: 'skills/github-actions-ci/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Supports future CI validation for install and sync workflows.'
  },
  {
    name: 'worker-validation',
    source_repo: 'aigb-skills',
    source_path: 'skills/worker-validation/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Useful for verifying that workflow changes actually behave as intended.'
  },
  {
    name: 'deep-investigative-research',
    source_repo: 'aigb-skills',
    source_path: 'skills/deep-investigative-research/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Provides thorough, multi-source research support for complex decisions.'
  },
  {
    name: 'makefile-development-workflow',
    source_repo: 'aigb-skills',
    source_path: 'skills/makefile-development-workflow/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Useful when adding small reproducible command surfaces to the repo.'
  },
  {
    name: 'json-processing-with-jq',
    source_repo: 'aigb-skills',
    source_path: 'skills/json-processing-with-jq/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Helpful for working with the lockfile and other machine-readable outputs.'
  },
  {
    name: 'grilling',
    author: 'Matt Pocock',
    license: 'MIT',
    source_repo: 'mattpocock-skills',
    source_path: 'skills/productivity/grilling/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Referenced by plan-wave for decision interviewing.'
  },
  {
    name: 'performance-benchmarking',
    source_repo: 'aigb-skills',
    source_path: 'skills/performance-benchmarking/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Useful for future install/sync performance checks and comparisons.'
  },
  {
    name: 'dr-lexus',
    source_repo: 'aigb-skills',
    source_path: 'skills/dr-lexus/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Support workflow for diagnostic review and error triage.'
  },
  {
    name: 'rubber-ducking',
    source_repo: 'aigb-skills',
    source_path: 'skills/rubber-ducking/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Support workflow for interactive debugging and reasoning.'
  },
  {
    name: 'web-source-bundler',
    source_repo: 'aigb-skills',
    source_path: 'skills/web-source-bundler/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Captures web sources into deterministic Markdown reference bundles with checksums.'
  },
  {
    name: 'apply-fed-oss-license',
    source_repo: 'aigb-skills',
    source_path: 'skills/apply-fed-oss-license/SKILL.md',
    selection_status: 'dependency-support',
    publishability: 'publishable',
    rationale: 'Audit and update repositories to Code.mil federal open-source licensing model with 17 U.S.C. § 105 disclaimers.'
  }
];

const REPO_ROOT = path.resolve(__dirname, '..');

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

function resolveSkillVersion(sourceRepo, sourcePath) {
  try {
    const sourceRoot = resolveSourceRoot(sourceRepo);
    let fullPath = path.resolve(sourceRoot, sourcePath);

    // Fallback if source root isn't present: check local skills/ folder in repo
    if (!fs.existsSync(fullPath)) {
      const localSkillCandidate = path.resolve(REPO_ROOT, 'skills', path.basename(path.dirname(sourcePath)), 'SKILL.md');
      if (fs.existsSync(localSkillCandidate)) {
        fullPath = localSkillCandidate;
      } else {
        return {
          status: 'missing',
          value: null
        };
      }
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      return {
        status: 'missing',
        value: null
      };
    }

    const frontmatter = frontmatterMatch[1];
    const versionMatch = frontmatter.match(/^version:\s*["']?([^"'\r\n]+)["']?/m);
    if (versionMatch && versionMatch[1].trim().length > 0) {
      return {
        status: 'resolved',
        value: versionMatch[1].trim()
      };
    }

    return {
      status: 'missing',
      value: null
    };
  } catch (err) {
    return {
      status: 'missing',
      value: null
    };
  }
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
    'Generates the curated skills lockfile from the current history-backed seed scope.'
  ].join('\n') + '\n');
}

function buildLockfile() {
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
    skills: curatedSkills.map((skill) => ({
      ...skill,
      version: resolveSkillVersion(skill.source_repo, skill.source_path)
    }))
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

main();
