/**
 * Bump Chrome extension build number in manifest.json.
 *
 * Chrome `version` only allows 1–4 dot-separated integers (e.g. 1.5.7.3).
 * Human-readable form like 1.5.7(3) goes into `version_name`.
 *
 * Usage:
 *   node scripts/bump-build-version.js
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '..', 'manifest.json');

function parseVersion(version) {
  const parts = String(version || '')
    .split('.')
    .map((part) => Number(part));

  if (parts.length < 1 || parts.length > 4 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Invalid Chrome extension version: ${version}`);
  }

  while (parts.length < 3) parts.push(0);

  const base = parts.slice(0, 3);
  const build = parts.length === 4 ? parts[3] : 0;
  return { base, build };
}

function formatVersionName(base, build) {
  const baseText = base.join('.');
  return build > 0 ? `${baseText}(${build})` : baseText;
}

function bumpManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);
  const { base, build } = parseVersion(manifest.version);
  const nextBuild = build + 1;

  manifest.version = [...base, nextBuild].join('.');
  manifest.version_name = formatVersionName(base, nextBuild);

  // Keep pretty JSON with trailing newline for readable diffs
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Version bumped: ${manifest.version_name} (chrome version ${manifest.version})`);
}

bumpManifest();
