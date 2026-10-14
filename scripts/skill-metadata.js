'use strict';

const CANONICAL_REPOSITORIES = Object.freeze({
  'aigb-skills': 'https://github.com/AndrewBrown-USDA/aigb-skills.git'
});

function deriveSourceUrl(sourceRepo) {
  return CANONICAL_REPOSITORIES[sourceRepo] || null;
}

function normalizeMetadata(input = {}) {
  const metadata = { ...input };
  const sourceRepo = metadata.source_repo;
  const sourcePath = metadata.source_path;
  const canonicalUrl = deriveSourceUrl(sourceRepo);
  const sourceUrl = canonicalUrl || metadata.source_url || null;
  const upstreamRepo = metadata.upstream_repo || metadata.upstream || null;
  const upstreamRef = metadata.upstream_ref || metadata.source_ref || null;

  return {
    source_repo: sourceRepo || null,
    source_path: sourcePath || null,
    source_url: sourceUrl,
    upstream_repo: upstreamRepo,
    upstream_ref: upstreamRef,
    ...(metadata.upstream_name ? { upstream_name: metadata.upstream_name } : {}),
    ...(metadata.version !== undefined ? { version: metadata.version } : {})
  };
}

function validateMetadata(input) {
  const metadata = normalizeMetadata(input);
  const errors = [];
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
  return { valid: errors.length === 0, errors, metadata };
}

module.exports = { CANONICAL_REPOSITORIES, deriveSourceUrl, normalizeMetadata, validateMetadata };
