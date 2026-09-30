#!/usr/bin/env node

const { main } = require('../src/cli');

process.exitCode = main(process.argv.slice(2));

