#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseFrontmatter } = require('./validate-skills');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const PROPOSAL_PATH = path.join(ROOT, 'docs', 'design', 'skill-loadouts', 'initial-loadout-proposal.md');
const IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function duplicates(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

function assertIdentifiers(values, label) {
  for (const value of values) {
    assert(typeof value === 'string' && IDENTIFIER.test(value), `${label} has invalid identifier: ${value}`);
  }
}

function readPackagedSkills() {
  return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
      assert(fs.existsSync(skillPath), `Missing SKILL.md for packaged directory: ${entry.name}`);
      const parsed = parseFrontmatter(fs.readFileSync(skillPath, 'utf8'));
      assert(parsed, `Malformed frontmatter for packaged skill: ${entry.name}`);
      assert(parsed.fields.name === entry.name, `Frontmatter name mismatch for packaged skill: ${entry.name}`);
      return entry.name;
    })
    .sort();
}

function readManifest() {
  assert(fs.existsSync(PROPOSAL_PATH), `Proposal not found: ${PROPOSAL_PATH}`);
  const markdown = fs.readFileSync(PROPOSAL_PATH, 'utf8');
  const match = markdown.match(
    /<!-- BEGIN PROPOSAL MANIFEST -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- END PROPOSAL MANIFEST -->/
  );
  assert(match, 'Proposal must contain the marked JSON manifest');
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`Proposal manifest is not valid JSON: ${error.message}`);
  }
}

function validate() {
  const packaged = readPackagedSkills();
  const packagedSet = new Set(packaged);
  const manifest = readManifest();

  assert(manifest.schema_version === 1, 'Proposal manifest schema_version must be 1');
  assert(Array.isArray(manifest.groups) && manifest.groups.length > 0, 'Proposal must define groups');
  assert(Array.isArray(manifest.loadouts) && manifest.loadouts.length > 0, 'Proposal must define loadouts');
  assert(Array.isArray(manifest.skills), 'Proposal must define skills');

  const groupNames = manifest.groups.map((entry) => entry.name);
  const loadoutNames = manifest.loadouts.map((entry) => entry.name);
  const skillNames = manifest.skills.map((entry) => entry.name);
  assertIdentifiers(groupNames, 'groups');
  assertIdentifiers(loadoutNames, 'loadouts');
  assertIdentifiers(skillNames, 'skills');
  assert(duplicates(groupNames).length === 0, `Duplicate groups: ${duplicates(groupNames).join(', ')}`);
  assert(duplicates(loadoutNames).length === 0, `Duplicate loadouts: ${duplicates(loadoutNames).join(', ')}`);
  assert(duplicates(skillNames).length === 0, `Duplicate skill entries: ${duplicates(skillNames).join(', ')}`);

  const missing = packaged.filter((name) => !skillNames.includes(name));
  const unknown = skillNames.filter((name) => !packagedSet.has(name));
  assert(missing.length === 0, `Proposal omits packaged skills: ${missing.join(', ')}`);
  assert(unknown.length === 0, `Proposal contains unknown skills: ${unknown.join(', ')}`);

  const groupSet = new Set(groupNames);
  const loadoutSet = new Set(loadoutNames);
  const loadoutKinds = new Map(manifest.loadouts.map((entry) => [entry.name, entry.kind]));
  assert(manifest.loadouts.some((entry) => entry.kind === 'broad'), 'Proposal needs at least one broad loadout');
  assert(manifest.loadouts.some((entry) => entry.kind === 'granular'), 'Proposal needs at least one granular loadout');

  const usedLoadouts = new Set();
  for (const skill of manifest.skills) {
    for (const field of ['loadouts', 'required_dependencies', 'optional_dependencies']) {
      assert(Array.isArray(skill[field]), `${skill.name}.${field} must be an array`);
      assertIdentifiers(skill[field], `${skill.name}.${field}`);
      assert(duplicates(skill[field]).length === 0, `${skill.name}.${field} contains duplicates`);
    }
    assert(groupSet.has(skill.group), `${skill.name} references unknown group: ${skill.group}`);
    assert(skill.loadouts.length > 0, `${skill.name} must have at least one loadout`);
    assert(
      skill.loadouts.some((name) => loadoutKinds.get(name) === 'broad'),
      `${skill.name} must belong to a broad loadout`
    );
    assert(
      skill.loadouts.some((name) => loadoutKinds.get(name) === 'granular'),
      `${skill.name} must belong to a granular loadout`
    );
    for (const name of skill.loadouts) {
      assert(loadoutSet.has(name), `${skill.name} references unknown loadout: ${name}`);
      usedLoadouts.add(name);
    }
    for (const name of [...skill.required_dependencies, ...skill.optional_dependencies]) {
      assert(packagedSet.has(name), `${skill.name} references unknown dependency: ${name}`);
      assert(name !== skill.name, `${skill.name} cannot depend on itself`);
    }
    const overlap = skill.required_dependencies.filter((name) => skill.optional_dependencies.includes(name));
    assert(overlap.length === 0, `${skill.name} has required/optional overlap: ${overlap.join(', ')}`);
    assert(typeof skill.evidence === 'string' && skill.evidence.trim(), `${skill.name} needs evidence`);
    assert(typeof skill.rationale === 'string' && skill.rationale.trim(), `${skill.name} needs rationale`);
  }

  const unusedLoadouts = loadoutNames.filter((name) => !usedLoadouts.has(name));
  assert(unusedLoadouts.length === 0, `Loadouts without members: ${unusedLoadouts.join(', ')}`);

  const crossMembers = manifest.skills.filter((skill) => skill.loadouts.length > 1).map((skill) => skill.name);
  assert(crossMembers.length > 0, 'Proposal needs representative cross-membership');
  assert(Array.isArray(manifest.cross_membership_examples) && manifest.cross_membership_examples.length > 0,
    'Proposal must document cross-membership examples');
  for (const example of manifest.cross_membership_examples) {
    assert(packagedSet.has(example.skill), `Cross-membership example has unknown skill: ${example.skill}`);
    const skill = manifest.skills.find((entry) => entry.name === example.skill);
    assert(Array.isArray(example.loadouts) && example.loadouts.length > 1,
      `Cross-membership example for ${example.skill} needs multiple loadouts`);
    assert(example.loadouts.every((name) => skill.loadouts.includes(name)),
      `Cross-membership example for ${example.skill} does not match its memberships`);
  }

  const wave = manifest.skills.find((entry) => entry.name === 'wave-orchestration');
  assert(wave && wave.loadouts.includes('wave-delivery'),
    'wave-orchestration must explicitly belong to wave-delivery');

  assert(Array.isArray(manifest.intentionally_independent_skills),
    'Proposal must list intentionally independent skills');
  assertIdentifiers(manifest.intentionally_independent_skills, 'intentionally_independent_skills');
  assert(duplicates(manifest.intentionally_independent_skills).length === 0,
    'intentionally_independent_skills contains duplicates');
  const expectedIndependent = manifest.skills
    .filter((skill) => skill.required_dependencies.length === 0)
    .map((skill) => skill.name)
    .sort();
  const actualIndependent = [...manifest.intentionally_independent_skills].sort();
  assert(JSON.stringify(actualIndependent) === JSON.stringify(expectedIndependent),
    'Intentionally independent list must exactly match skills without required dependencies');

  process.stdout.write(
    `Loadout proposal valid: ${packaged.length} skills, ${groupNames.length} groups, ` +
    `${manifest.loadouts.filter((entry) => entry.kind === 'broad').length} broad loadouts, ` +
    `${manifest.loadouts.filter((entry) => entry.kind === 'granular').length} granular loadouts.\n`
  );
}

try {
  validate();
} catch (error) {
  process.stderr.write(`Loadout proposal validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
