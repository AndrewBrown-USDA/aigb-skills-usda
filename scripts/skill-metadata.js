'use strict';

const CANONICAL_REPOSITORIES = Object.freeze({
  'aigb-skills': 'https://github.com/AndrewBrown-USDA/aigb-skills.git'
});

function deriveSourceUrl(sourceRepo) {
  return CANONICAL_REPOSITORIES[sourceRepo] || null;
}

function splitList(value) {
  return typeof value === 'string'
    ? value.split(',').map((token) => token.trim().replace(/^['"]|['"]$/g, ''))
    : value;
}

function normalizeMetadata(input = {}) {
  const metadata = { ...input };
  const sourceRepo = metadata.source_repo;
  const sourcePath = metadata.source_path;
  const canonicalUrl = deriveSourceUrl(sourceRepo);
  const sourceUrl = canonicalUrl || metadata.source_url || null;
  const upstreamRepo = metadata.upstream_repo || metadata.upstream || null;
  const upstreamRef = metadata.upstream_ref || metadata.source_ref || null;
  const list = (value) => typeof value === 'string'
    ? [...new Set(splitList(value))]
    : value;
  const upstreamPath = metadata.upstream_path || null;
  const version = metadata.version && typeof metadata.version === 'object' && 'value' in metadata.version
    ? metadata.version.value
    : metadata.version;

  return {
    source_repo: sourceRepo || null,
    source_path: sourcePath || null,
    source_url: sourceUrl,
    upstream_repo: upstreamRepo,
    upstream_ref: upstreamRef,
    ...(upstreamPath ? { upstream_path: upstreamPath } : {}),
    ...(metadata.group !== undefined ? { group: typeof metadata.group === 'string' ? metadata.group.trim() : metadata.group } : {}),
    ...(metadata.loadout !== undefined ? { loadout: typeof metadata.loadout === 'string' ? metadata.loadout.trim() : metadata.loadout } : {}),
    ...(metadata.loadouts !== undefined ? { loadouts: list(metadata.loadouts) } : {}),
    ...(metadata.dependencies !== undefined ? { dependencies: list(metadata.dependencies) } : {}),
    ...(metadata.optional_dependencies !== undefined ? { optional_dependencies: list(metadata.optional_dependencies) } : {}),
    ...(metadata.upstream_name ? { upstream_name: metadata.upstream_name } : {}),
    ...(metadata.author ? { author: metadata.author } : {}),
    ...(metadata.authors ? { authors: metadata.authors } : {}),
    ...(metadata.inspired_by !== undefined
      ? { inspired_by: typeof metadata.inspired_by === 'string' ? metadata.inspired_by.trim() : metadata.inspired_by }
      : {}),
    ...(version !== undefined ? { version } : {})
  };
}

function validateMetadata(input) {
  const metadata = normalizeMetadata(input);
  const errors = [];
  const legacyMissingVersion = input.version === null || (
    input.version &&
    typeof input.version === 'object' &&
    input.version.status === 'missing' &&
    input.version.value === null
  );
  const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const field of ['source_repo', 'source_path']) {
    if (!metadata[field]) errors.push(`${field} is required`);
  }
  if (metadata.source_url !== null && !/^https?:\/\/\S+$/.test(metadata.source_url)) {
    errors.push('source_url must be an absolute URL');
  }
  const expectedUrl = deriveSourceUrl(metadata.source_repo);
  if (expectedUrl && input.source_url && input.source_url !== expectedUrl) {
    errors.push('source_url does not match source_repo');
  }
  for (const field of ['group', 'loadout']) {
    if (metadata[field] !== undefined && (typeof metadata[field] !== 'string' || !identifier.test(metadata[field]))) {
      errors.push(`${field} must be a lowercase kebab-case identifier`);
    }
  }
  if (metadata.loadouts !== undefined && (!Array.isArray(metadata.loadouts) ||
      metadata.loadouts.some((token) => typeof token !== 'string' || !identifier.test(token)))) {
    errors.push('loadouts contains an invalid identifier or empty token');
  }
  for (const field of ['dependencies', 'optional_dependencies']) {
    const tokens = splitList(input[field]);
    if (metadata[field] !== undefined && (!Array.isArray(metadata[field]) ||
      metadata[field].some((token) => typeof token !== 'string' || !identifier.test(token)))) {
      errors.push(`${field} contains an invalid identifier or empty token`);
    }
    if (Array.isArray(tokens) && new Set(tokens).size !== tokens.length) {
      errors.push(`${field} contains duplicate dependencies`);
    }
  }
  if (metadata.version !== undefined && !(metadata.version === null && legacyMissingVersion) &&
      (!['string', 'number'].includes(typeof metadata.version) ||
       (typeof metadata.version === 'string' && metadata.version.trim() === ''))) {
    errors.push('version must be a non-empty scalar');
  }
  if (metadata.inspired_by !== undefined &&
      (typeof metadata.inspired_by !== 'string' || metadata.inspired_by === '')) {
    errors.push('inspired_by must be a non-empty scalar string');
  }
  if (input.upstream_repo !== undefined && input.upstream !== undefined &&
      String(input.upstream_repo).trim() !== String(input.upstream).trim()) {
    errors.push('upstream_repo conflicts with legacy upstream');
  }
  if (input.upstream_ref !== undefined && input.source_ref !== undefined &&
      String(input.upstream_ref).trim() !== String(input.source_ref).trim()) {
    errors.push('upstream_ref conflicts with legacy source_ref');
  }
  if (Array.isArray(metadata.dependencies) && Array.isArray(metadata.optional_dependencies)) {
    const overlap = metadata.dependencies.filter((name) => metadata.optional_dependencies.includes(name));
    if (overlap.length) errors.push(`dependencies overlap optional_dependencies: ${overlap.join(', ')}`);
  }
  const skillName = input.name;
  if (skillName) {
    for (const field of ['dependencies', 'optional_dependencies']) {
      if (Array.isArray(metadata[field]) && metadata[field].includes(skillName)) {
        errors.push(`${field} cannot reference the skill itself`);
      }
    }
  }
  return { valid: errors.length === 0, errors, metadata };
}

module.exports = { CANONICAL_REPOSITORIES, deriveSourceUrl, normalizeMetadata, validateMetadata };
