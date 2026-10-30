#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { scanCuratedSkills } = require('./mine-history');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'docs', 'design', 'skill-loadouts', 'initial-loadout-manifest.json');
const CATALOG_PATH = path.join(ROOT, 'catalog', 'skills.lock.json');

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readJson(filePath, label) {
  assert(fs.existsSync(filePath), `${label} not found: ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function equal(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  assert(actualJson === expectedJson, `${label} mismatch: expected ${expectedJson}, got ${actualJson}`);
}

function byName(entries, label) {
  const map = new Map();
  for (const entry of entries) {
    assert(entry && typeof entry.name === 'string', `${label} contains a record without a name`);
    assert(!map.has(entry.name), `${label} contains duplicate skill: ${entry.name}`);
    map.set(entry.name, entry);
  }
  return map;
}

function taxonomyFrom(record) {
  return {
    group: record.group,
    loadouts: record.loadouts || [],
    required_dependencies: record.required_dependencies || record.dependencies || [],
    optional_dependencies: record.optional_dependencies || []
  };
}

function validate() {
  const manifest = readJson(MANIFEST_PATH, 'Loadout manifest');
  const catalog = readJson(CATALOG_PATH, 'Catalog');
  assert(manifest.schema_version === 1, 'Manifest schema_version must be 1');
  assert(Array.isArray(manifest.skills), 'Manifest skills must be an array');
  assert(Array.isArray(catalog.skills), 'Catalog skills must be an array');

  const manifestByName = byName(manifest.skills, 'Manifest');
  const packaged = scanCuratedSkills();
  const packagedByName = byName(packaged, 'Packaged frontmatter');
  const catalogByName = byName(catalog.skills, 'Catalog');
  equal([...manifestByName.keys()].sort(), [...packagedByName.keys()].sort(), 'Manifest skill coverage');
  equal([...manifestByName.keys()].sort(), [...catalogByName.keys()].sort(), 'Catalog skill coverage');

  for (const name of [...manifestByName.keys()].sort()) {
    const manifestRecord = manifestByName.get(name);
    const packagedRecord = packagedByName.get(name);
    const catalogRecord = catalogByName.get(name);
    equal(taxonomyFrom(packagedRecord), taxonomyFrom(manifestRecord), `${name} frontmatter taxonomy`);
    equal(taxonomyFrom(catalogRecord), taxonomyFrom(manifestRecord), `${name} catalog taxonomy`);
    equal(catalogRecord, packagedRecord, `${name} catalog ownership`);
  }

  process.stdout.write(
    `Loadout manifest valid: ${manifest.skills.length} skills, ` +
    `${manifest.groups.length} groups, ${manifest.loadouts.length} loadouts.\n`
  );
}

try {
  validate();
} catch (error) {
  process.stderr.write(`Loadout manifest validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
