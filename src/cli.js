'use strict';

const path = require('node:path');
const { main: syncMain } = require('../scripts/sync-skills');
const { main: installMain } = require('../scripts/install');

function printHelp() {
  process.stdout.write([
    'skills',
    '',
    'Usage:',
    '  skills --help',
    '  skills install [options]   (Primary command for users & agents)',
    '  skills sync [options]      (Maintainers only: sync from source repos)',
    '',
    'Overview:',
    '  Public CLI for the USDA skills repository.',
    '',
    'Commands:',
    '  install [options]  Install pre-packaged skills into an agent skills directory',
    '  sync [options]     (Maintainers only) Sync skills from source repos using lockfile',
    '  --help, -h         Show this help message',
    '',
    'Install Options (Primary):',
    '  --target <path>         Target directory (e.g. ~/.agents/skills or ~/.claude/skills)',
    '  --source <path>         Source skills directory (default: ./skills)',
    '  --mode <copy|symlink>   Materialization mode (default: copy)',
    '',
    'Sync Options (Maintainers):',
    '  --target <path>         Target directory (default: ./skills)',
    '  --lockfile <path>       Path to catalog/skills.lock.json',
    '  --mode <copy|symlink>   Materialization mode (default: copy)',
    ''
  ].join('\n') + '\n');
}

function runCli(argv) {
  const args = Array.isArray(argv) ? argv : [];

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return 0;
  }

  const subcommand = args[0];

  if (subcommand === 'install') {
    return installMain(args.slice(1));
  }

  if (subcommand === 'sync') {
    return syncMain(args.slice(1));
  }

  process.stderr.write(`skills: unknown command "${subcommand}". Run \`skills --help\` for available commands.\n`);
  return 1;
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}

module.exports = {
  main: runCli,
  runCli,
  printHelp
};

