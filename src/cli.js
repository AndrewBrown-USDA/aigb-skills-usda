'use strict';

const path = require('node:path');
const { main: syncMain, printHelp: printSyncHelp } = require('../scripts/sync-skills');

function printHelp() {
  process.stdout.write([
    'skills',
    '',
    'Usage:',
    '  skills --help',
    '  skills sync [options]',
    '  skills install [options]',
    '',
    'Overview:',
    '  Public CLI for the USDA skills repository.',
    '  Synchronizes or installs curated skills from catalog/skills.lock.json.',
    '',
    'Commands:',
    '  sync [options]     Sync skills into a target directory (default: ./skills)',
    '  install [options]  Alias for sync to install skills into a target directory',
    '  --help, -h         Show this help message',
    '',
    'Sync & Install Options:',
    '  --mode <copy|symlink>   Materialization mode (default: copy)',
    '  --lockfile <path>       Path to catalog/skills.lock.json',
    '  --target <path>         Destination directory (default: ./skills)',
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

  if (subcommand === 'sync' || subcommand === 'install') {
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

