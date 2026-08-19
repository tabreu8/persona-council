import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parsePersona, validatePersona } from './persona.js';

/** Resolve a source to an absolute directory on disk, or null if it has none. */
export function sourceDir(root, source, config) {
  if (source.type === 'local') return path.resolve(root, source.path);
  if (source.type === 'git') {
    const cache = path.resolve(root, config.cacheDir || '.claude/.persona-cache');
    return path.join(cache, source.id, source.subpath || '');
  }
  return null; // mcp sources live behind the agent's tools, not the filesystem
}

export function readPersonaFile(file) {
  const id = path.basename(file, '.md');
  const persona = parsePersona(fs.readFileSync(file, 'utf8'), { id });
  persona.file = file;
  return persona;
}

export function listSourcePersonas(root, source, config) {
  const dir = sourceDir(root, source, config);
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .sort()
    .map((name) => {
      const persona = readPersonaFile(path.join(dir, name));
      persona.source = source.id;
      return persona;
    });
}

/**
 * All personas the CLI can see, first-source-wins on duplicate ids.
 * `mcp` sources are reported separately: only the agent can read them.
 */
export function listPersonas(root, config) {
  const personas = [];
  const seen = new Set();
  const deferred = [];

  for (const source of config.sources) {
    if (source.type === 'mcp') {
      deferred.push(source);
      continue;
    }
    for (const persona of listSourcePersonas(root, source, config)) {
      if (seen.has(persona.id)) continue;
      seen.add(persona.id);
      personas.push(persona);
    }
  }

  return { personas, deferredSources: deferred };
}

export function findPersona(root, config, id) {
  const { personas } = listPersonas(root, config);
  return personas.find((persona) => persona.id === id) || null;
}

export function writeTarget(root, config) {
  const source = config.sources.find((s) => s.id === config.writeTo) ||
    config.sources.find((s) => s.type === 'local' && s.writable);
  if (!source) throw new Error('no writable local source configured (check config.writeTo)');
  const dir = sourceDir(root, source, config);
  if (!dir) throw new Error(`source "${source.id}" has no filesystem location to write to`);
  return { source, dir };
}

/** Shallow-clone or refresh a git source into the cache directory. */
export function syncGitSource(root, source, config) {
  const cache = path.resolve(root, config.cacheDir || '.claude/.persona-cache');
  const target = path.join(cache, source.id);
  fs.mkdirSync(cache, { recursive: true });
  const run = (args, cwd) => execFileSync('git', args, { cwd, stdio: 'pipe' }).toString().trim();

  if (fs.existsSync(path.join(target, '.git'))) {
    run(['fetch', '--depth', '1', 'origin', source.ref || 'HEAD'], target);
    run(['reset', '--hard', 'FETCH_HEAD'], target);
    return { action: 'updated', path: target };
  }

  const args = ['clone', '--depth', '1'];
  if (source.ref) args.push('--branch', source.ref);
  args.push(source.url, target);
  run(args, cache);
  return { action: 'cloned', path: target };
}

export function auditPersonas(root, config) {
  const { personas, deferredSources } = listPersonas(root, config);
  const report = personas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    role: persona.role,
    source: persona.source,
    file: persona.file,
    ...validatePersona(persona),
  }));
  return { report, deferredSources };
}
