import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultConfig, saveConfig, loadConfig } from './config.js';

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MANIFEST_FILENAME = '.persona-council-install.json';

/**
 * Asset directories copied verbatim on install. `reference/` lands in a stable
 * data directory so every skill can cite the same shared docs by one path
 * instead of duplicating them.
 */
const CLAUDE_ASSETS = [
  { from: 'skills', to: path.join('.claude', 'skills') },
  { from: 'commands', to: path.join('.claude', 'commands') },
  { from: 'agents', to: path.join('.claude', 'agents') },
  { from: 'reference', to: path.join('.claude', 'persona-council') },
];

function walk(dir, base = dir) {
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) entries.push(...walk(full, base));
    else entries.push(path.relative(base, full));
  }
  return entries;
}

function copyFile(from, to, { force }) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const exists = fs.existsSync(to);
  if (exists && !force) {
    const same = fs.readFileSync(from, 'utf8') === fs.readFileSync(to, 'utf8');
    return same ? 'unchanged' : 'skipped';
  }
  fs.copyFileSync(from, to);
  return exists ? 'updated' : 'created';
}

export function manifestPath(root) {
  return path.join(root, '.claude', MANIFEST_FILENAME);
}

export function readManifest(root) {
  const file = manifestPath(root);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function install(root, { force = false, target = 'claude' } = {}) {
  const results = [];
  const installed = [];
  const claudeDir = path.join(root, '.claude');

  if (target === 'claude') {
    for (const asset of CLAUDE_ASSETS) {
      const from = path.join(packageRoot, asset.from);
      if (!fs.existsSync(from)) continue;
      for (const rel of walk(from)) {
        const relPath = path.join(asset.to, rel);
        const status = copyFile(path.join(from, rel), path.join(root, relPath), { force });
        results.push({ path: relPath, status });
        if (status !== 'skipped') installed.push(relPath);
      }
    }
  } else {
    // Generic agents get one portable operating manual plus the persona folder.
    const guide = buildGenericGuide();
    const relPath = 'PERSONA-COUNCIL.md';
    const dest = path.join(root, relPath);
    const exists = fs.existsSync(dest);
    if (!exists || force) {
      fs.writeFileSync(dest, guide, 'utf8');
      results.push({ path: relPath, status: exists ? 'updated' : 'created' });
      installed.push(relPath);
    } else {
      results.push({ path: relPath, status: 'skipped' });
    }
  }

  const { config, exists: configExists } = loadConfig(root);
  const effective = configExists ? config : defaultConfig();
  if (!configExists || force) {
    saveConfig(root, effective);
    results.push({ path: path.join('.claude', 'persona-council.config.json'), status: configExists ? 'updated' : 'created' });
  } else {
    results.push({ path: path.join('.claude', 'persona-council.config.json'), status: 'unchanged' });
  }

  for (const dir of [personaDir(root, effective), path.resolve(root, effective.memory.path)]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      results.push({ path: path.relative(root, dir), status: 'created' });
    }
  }

  const gitignore = ensureGitignore(root, effective);
  if (gitignore) results.push(gitignore);

  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(
    manifestPath(root),
    `${JSON.stringify({ version: readPackageVersion(), target, files: installed }, null, 2)}\n`,
    'utf8',
  );

  return { results, config: effective };
}

export function personaDir(root, config) {
  const source = config.sources.find((s) => s.id === config.writeTo) ||
    config.sources.find((s) => s.type === 'local');
  return path.resolve(root, source?.path || '.claude/personas');
}

export function readPackageVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

function ensureGitignore(root, config) {
  const file = path.join(root, '.gitignore');
  const entries = [config.cacheDir, config.memory.path].map((p) => p.replace(/^\.\//, ''));
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const missing = entries.filter((entry) => !existing.split(/\r?\n/).some((line) => line.trim() === entry));
  if (missing.length === 0) return null;
  const block = `${existing.trim() ? `${existing.trimEnd()}\n` : ''}\n# persona-council (generated; panel transcripts and fetched personas)\n${missing.join('\n')}\n`;
  fs.writeFileSync(file, block.replace(/^\n/, ''), 'utf8');
  return { path: '.gitignore', status: existing ? 'updated' : 'created' };
}

export function uninstall(root) {
  const manifest = readManifest(root);
  if (!manifest) return { removed: [], manifest: null };
  const removed = [];
  for (const rel of manifest.files) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      fs.rmSync(full);
      removed.push(rel);
    }
  }
  // Prune directories the install created, but never the user's personas/memory.
  for (const asset of CLAUDE_ASSETS) pruneEmptyDirs(path.join(root, asset.to));
  fs.rmSync(manifestPath(root), { force: true });
  return { removed, manifest };
}

/** Remove a directory tree bottom-up, but only the parts that are empty. */
function pruneEmptyDirs(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false;
  for (const entry of fs.readdirSync(dir)) pruneEmptyDirs(path.join(dir, entry));
  if (fs.readdirSync(dir).length > 0) return false;
  fs.rmdirSync(dir);
  return true;
}

function buildGenericGuide() {
  const parts = [
    '# Persona Council — operating manual\n',
    'This file teaches any coding agent to run persona thinking and debate panels.',
    'Read it before responding to a persona request.\n',
  ];
  const skillsDir = path.join(packageRoot, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const name of fs.readdirSync(skillsDir).sort()) {
      const file = path.join(skillsDir, name, 'SKILL.md');
      if (!fs.existsSync(file)) continue;
      const body = fs.readFileSync(file, 'utf8').replace(/^---[\s\S]*?---\n/, '');
      parts.push(`\n---\n\n## ${name}\n\n${body.trim()}\n`);
    }
  }
  return `${parts.join('\n')}\n`;
}
