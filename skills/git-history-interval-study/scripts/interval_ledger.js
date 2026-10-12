#!/usr/bin/env node
/**
 * interval_ledger.js
 *
 * Lightweight, zero-external-dependency script to slice git history into
 * structured intervals based on tags, file pattern creations, or explicit ranges,
 * outputting interval-ledger.json and evolution-digest.md.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function git(args, options = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
  } catch (err) {
    if (options.ignoreError) return '';
    throw err;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    strategy: 'auto',
    pattern: '',
    range: '',
    tags: false,
    outDir: '.scratch',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pattern' && args[i + 1]) {
      options.pattern = args[++i];
      options.strategy = 'pattern';
    } else if (arg === '--range' && args[i + 1]) {
      options.range = args[++i];
      options.strategy = 'range';
    } else if (arg === '--tags') {
      options.tags = true;
      options.strategy = 'tags';
    } else if (arg === '--out' && args[i + 1]) {
      options.outDir = args[++i];
    }
  }

  return options;
}

function getBoundaryCommits(options) {
  const boundaries = [];

  if (options.strategy === 'pattern' && options.pattern) {
    // Find commits introducing the pattern
    const out = git(['log', '--diff-filter=A', '--topo-order', '--reverse', '--format=%H|%as|%s', '--', options.pattern], { ignoreError: true });
    if (out) {
      const lines = out.split('\n').filter(Boolean);
      for (const line of lines) {
        const [sha, date, subject] = line.split('|');
        boundaries.push({ sha, date, subject, trigger: options.pattern });
      }
    }
  } else if (options.strategy === 'tags') {
    const out = git(['tag', '--sort=creatordate'], { ignoreError: true });
    if (out) {
      const tags = out.split('\n').filter(Boolean);
      for (const tag of tags) {
        const sha = git(['rev-parse', `${tag}^{commit}`]);
        const date = git(['log', '-1', '--format=%as', sha]);
        boundaries.push({ sha, date, subject: `Tag: ${tag}`, trigger: tag });
      }
    }
  } else if (options.strategy === 'range' && options.range) {
    const [revA, revB] = options.range.split('..');
    const shaA = git(['rev-parse', revA]);
    const shaB = git(['rev-parse', revB || 'HEAD']);
    const dateA = git(['log', '-1', '--format=%as', shaA]);
    const dateB = git(['log', '-1', '--format=%as', shaB]);
    boundaries.push({ sha: shaA, date: dateA, subject: `Range Start: ${revA}`, trigger: revA });
    boundaries.push({ sha: shaB, date: dateB, subject: `Range End: ${revB || 'HEAD'}`, trigger: revB || 'HEAD' });
  }

  // If auto or no boundaries found, fallback to first commit and HEAD
  if (boundaries.length < 2) {
    const firstCommit = git(['rev-list', '--max-parents=0', 'HEAD']).split('\n')[0];
    const headCommit = git(['rev-parse', 'HEAD']);
    if (!boundaries.some(b => b.sha === firstCommit)) {
      boundaries.unshift({
        sha: firstCommit,
        date: git(['log', '-1', '--format=%as', firstCommit]),
        subject: 'Initial Commit',
        trigger: 'root',
      });
    }
    if (!boundaries.some(b => b.sha === headCommit)) {
      boundaries.push({
        sha: headCommit,
        date: git(['log', '-1', '--format=%as', headCommit]),
        subject: 'HEAD',
        trigger: 'HEAD',
      });
    }
  }

  return boundaries;
}

function analyzeInterval(prev, curr, index) {
  const range = `${prev.sha}..${curr.sha}`;

  // Commits in interval
  const logRaw = git(['log', '--topo-order', '--reverse', '--format=%h|%an|%as|%s', range], { ignoreError: true });
  const commits = logRaw
    ? logRaw.split('\n').filter(Boolean).map(line => {
        const [shortSha, author, date, subject] = line.split('|');
        let type = 'other';
        const match = subject.match(/^([a-zA-Z]+)(\([^\)]+\))?:\s*(.*)$/);
        if (match) type = match[1].toLowerCase();
        return { shortSha, author, date, subject, type };
      })
    : [];

  // Shortstat
  const shortstat = git(['diff', '--shortstat', prev.sha, curr.sha], { ignoreError: true });
  let filesChanged = 0, linesAdded = 0, linesDeleted = 0;
  if (shortstat) {
    const fMatch = shortstat.match(/(\d+)\s+file/);
    const aMatch = shortstat.match(/(\d+)\s+insertion/);
    const dMatch = shortstat.match(/(\d+)\s+deletion/);
    if (fMatch) filesChanged = parseInt(fMatch[1], 10);
    if (aMatch) linesAdded = parseInt(aMatch[1], 10);
    if (dMatch) linesDeleted = parseInt(dMatch[1], 10);
  }

  // Name-status with rename detection
  const nameStatusRaw = git(['diff', '--name-status', '-M', prev.sha, curr.sha], { ignoreError: true });
  const fileStatuses = nameStatusRaw
    ? nameStatusRaw.split('\n').filter(Boolean).map(l => {
        const parts = l.split(/\t+/);
        return { status: parts[0], path: parts[1], extra: parts[2] };
      })
    : [];

  // Subsystem churn aggregation
  const subsystemChurn = {};
  for (const item of fileStatuses) {
    const prefix = item.path.split('/')[0] || 'root';
    subsystemChurn[prefix] = (subsystemChurn[prefix] || 0) + 1;
  }

  // Conventional commit distribution
  const commitTypes = {};
  for (const c of commits) {
    commitTypes[c.type] = (commitTypes[c.type] || 0) + 1;
  }

  const churn = linesAdded + linesDeleted;
  const isConverging = churn < 100 && (commitTypes['feat'] || 0) === 0;

  return {
    intervalId: `I${index + 1}`,
    fromSha: prev.sha,
    toSha: curr.sha,
    fromTrigger: prev.trigger,
    toTrigger: curr.trigger,
    commitCount: commits.length,
    commits,
    metrics: { filesChanged, linesAdded, linesDeleted, churn },
    commitTypes,
    subsystemFileModifications: subsystemChurn,
    convergenceStatus: isConverging ? 'converged' : 'evolving',
  };
}

function generateMarkdownDigest(intervals, options) {
  let md = `# Repository History Evolution Digest\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Strategy**: ${options.strategy}\n`;
  md += `**Interval Count**: ${intervals.length}\n\n`;

  md += `## 1. Evolution Timeline & Interval Overview\n\n`;
  md += `| Interval | Range / Trigger | Commits | Files Changed | Churn (+/-) | Convergence Status |\n`;
  md += `| --- | --- | --- | --- | --- | --- |\n`;

  for (const inv of intervals) {
    md += `| ${inv.intervalId} | \`${inv.fromTrigger}\` -> \`${inv.toTrigger}\` | ${inv.commitCount} | ${inv.metrics.filesChanged} | +${inv.metrics.linesAdded} / -${inv.metrics.linesDeleted} | **${inv.convergenceStatus}** |\n`;
  }
  md += `\n---\n\n`;

  md += `## 2. Detailed Interval Analysis\n\n`;
  for (const inv of intervals) {
    md += `### Interval ${inv.intervalId}: \`${inv.fromTrigger}\` -> \`${inv.toTrigger}\`\n\n`;
    md += `- **Boundaries**: \`${inv.fromSha.substring(0, 8)}\`.. \`${inv.toSha.substring(0, 8)}\`\n`;
    md += `- **Commit Types**: ${Object.entries(inv.commitTypes).map(([k, v]) => `${k} (${v})`).join(', ') || 'none'}\n`;
    md += `- **Active Subsystems**: ${Object.entries(inv.subsystemFileModifications).map(([k, v]) => `\`${k}/\` (${v} files)`).join(', ') || 'none'}\n\n`;

    md += `#### Key Commits\n`;
    if (inv.commits.length === 0) {
      md += `*No commits directly in this revision interval.*\n\n`;
    } else {
      for (const c of inv.commits.slice(0, 10)) {
        md += `- \`${c.shortSha}\` (${c.date}): ${c.subject}\n`;
      }
      if (inv.commits.length > 10) {
        md += `- *(and ${inv.commits.length - 10} more commits)*\n`;
      }
      md += `\n`;
    }
  }

  md += `## 3. Feed for Downstream Skills (ADR Distillation)\n\n`;
  md += `The intervals above surfaced structural component changes. Potential architectural candidates:\n\n`;
  for (const inv of intervals) {
    const featsAndRefactors = inv.commits.filter(c => c.type === 'feat' || c.type === 'refactor');
    if (featsAndRefactors.length > 0) {
      md += `### From ${inv.intervalId} (\`${inv.fromTrigger}\` -> \`${inv.toTrigger}\`):\n`;
      for (const item of featsAndRefactors) {
        md += `- **Candidate Decision**: \`${item.subject}\` (Commit: \`${item.shortSha}\`)\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

function main() {
  const options = parseArgs();
  const boundaries = getBoundaryCommits(options);

  if (boundaries.length < 2) {
    console.error('Need at least 2 boundary commits to study history intervals.');
    process.exit(1);
  }

  const intervals = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    intervals.push(analyzeInterval(boundaries[i], boundaries[i + 1], i));
  }

  const outDir = path.resolve(process.cwd(), options.outDir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const ledgerPath = path.join(outDir, 'interval-ledger.json');
  fs.writeFileSync(ledgerPath, JSON.stringify({ intervals }, null, 2), 'utf8');

  const digestPath = path.join(outDir, 'evolution-digest.md');
  fs.writeFileSync(digestPath, generateMarkdownDigest(intervals, options), 'utf8');

  console.log(`[git-history-interval-study] Successfully processed ${intervals.length} intervals.`);
  console.log(`  -> Ledger: ${ledgerPath}`);
  console.log(`  -> Digest: ${digestPath}`);
}

main();
