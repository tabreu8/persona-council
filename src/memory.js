import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './persona.js';

/**
 * Two stores, deliberately separate.
 *
 * scratch/   thinking out loud. Auto-pruned and gitignored.
 * decisions/ of-record. Kept forever and committed, so a team can read back
 *            why something was decided and who in the room objected.
 */
export function scratchDir(root, config) {
  return path.resolve(root, config.memory.scratchPath);
}

export function decisionsDir(root, config) {
  return path.resolve(root, config.memory.decisionsPath);
}

export function makeDecisionId(timestamp, question) {
  const date = String(timestamp).slice(0, 10);
  const slug = slugify(question).split('-').slice(0, 6).join('-') || 'decision';
  return `${date}-${slug}`;
}

function uniqueId(dir, id) {
  if (!fs.existsSync(path.join(dir, id))) return id;
  let n = 2;
  while (fs.existsSync(path.join(dir, `${id}-${n}`))) n += 1;
  return `${id}-${n}`;
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
}

export function writeDecision(root, config, record) {
  const dir = decisionsDir(root, config);
  fs.mkdirSync(dir, { recursive: true });
  const id = uniqueId(dir, record.id || makeDecisionId(record.recordedAt || '', record.question || ''));
  const target = path.join(dir, id);
  fs.mkdirSync(target, { recursive: true });
  const stored = { ...record, id, mode: 'decision' };
  fs.writeFileSync(path.join(target, 'decision.json'), `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
  return { id, dir: target, record: stored };
}

export function readDecision(root, config, id) {
  const dir = path.join(decisionsDir(root, config), id);
  const record = readJson(path.join(dir, 'decision.json'));
  if (!record) return null;
  return { ...record, id, dir };
}

export function listDecisions(root, config) {
  const dir = decisionsDir(root, config);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readDecision(root, config, entry.name))
    .filter(Boolean)
    .sort((a, b) => String(b.recordedAt || '').localeCompare(String(a.recordedAt || '')));
}

export function listScratch(root, config) {
  const dir = scratchDir(root, config);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const file = path.join(dir, name);
      return { id: path.basename(name, '.json'), file, record: readJson(file), mtime: fs.statSync(file).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

/** Scratch is disposable by construction; keep it from growing without bound. */
export function pruneScratch(root, config, { now = Date.now() } = {}) {
  const runs = listScratch(root, config);
  const maxAgeMs = (config.memory.scratchMaxAgeDays || 0) * 86400000;
  const removed = [];

  runs.forEach((run, index) => {
    const tooMany = config.memory.scratchRetain > 0 && index >= config.memory.scratchRetain;
    const tooOld = maxAgeMs > 0 && now - run.mtime > maxAgeMs;
    if (!tooMany && !tooOld) return;
    for (const ext of ['.json', '.md', '.html']) {
      const file = path.join(scratchDir(root, config), `${run.id}${ext}`);
      if (fs.existsSync(file)) fs.rmSync(file);
    }
    removed.push(run.id);
  });

  return removed;
}

/** A brainstorm that turned real. Moves the run into the of-record store. */
export function promoteScratch(root, config, runId) {
  const file = path.join(scratchDir(root, config), `${runId}.json`);
  const record = readJson(file);
  if (!record) throw new Error(`no scratch run "${runId}"`);
  const written = writeDecision(root, config, {
    ...record,
    id: makeDecisionId(record.recordedAt || new Date(0).toISOString(), record.question || runId),
    promotedFrom: runId,
  });
  for (const ext of ['.json', '.md', '.html']) {
    const from = path.join(scratchDir(root, config), `${runId}${ext}`);
    if (fs.existsSync(from)) fs.rmSync(from);
  }
  return written;
}

/** A run by id, from either store. Decisions win: they are the record. */
export function findRun(root, config, id) {
  const decision = readDecision(root, config, id);
  if (decision) return decision;
  const scratch = listScratch(root, config).find((run) => run.id === id);
  return scratch?.record ? { ...scratch.record, id, mode: 'scratch' } : null;
}

export function memoryStats(root, config) {
  return {
    scratch: listScratch(root, config).length,
    decisions: listDecisions(root, config).length,
  };
}
