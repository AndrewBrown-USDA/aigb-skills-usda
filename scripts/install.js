#!/usr/bin/env node
'use strict';

const { main } = require('./sync-skills');

process.exitCode = main(process.argv.slice(2));
