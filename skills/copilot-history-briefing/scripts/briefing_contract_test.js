'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.join(__dirname, '..', 'SKILL.md'), 'utf8');
assert.match(skill, /copilot-history-miner/);
assert.match(skill, /Treat the miner artifact as the source of truth/);
assert.match(skill, /Temporal proximity between a session and a commit is not proof/);
assert.match(skill, /# Executive summary/);
assert.match(skill, /# GitHub Copilot Evidence/);
console.log('briefing contract tests passed');
