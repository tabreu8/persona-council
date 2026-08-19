import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './persona.js';

/**
 * Two stores, deliberately separate.
 *
 * scratch/   thinking out loud. Auto-pruned. Never feeds calibration, because a
 *            brainstorm has no outcome to be measured against.
 * decisions/ of-record. Kept forever, can carry an outcome, and is the only
 *            thing a persona's track record is computed from.
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
  return { ...record, id, dir, outcome: readJson(path.join(dir, 'outcome.json')) };
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

export const OUTCOME_RESULTS = ['good', 'mixed', 'bad', 'too-early'];

export function writeOutcome(root, config, id, outcome) {
  const dir = path.join(decisionsDir(root, config), id);
  if (!fs.existsSync(dir)) throw new Error(`no decision "${id}" on record`);
  if (outcome.result && !OUTCOME_RESULTS.includes(outcome.result)) {
    throw new Error(`outcome.result must be one of ${OUTCOME_RESULTS.join(', ')}`);
  }
  fs.writeFileSync(path.join(dir, 'outcome.json'), `${JSON.stringify(outcome, null, 2)}\n`, 'utf8');
  return path.join(dir, 'outcome.json');
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

function modalVerdict(verdicts) {
  const counts = new Map();
  for (const verdict of verdicts) counts.set(verdict, (counts.get(verdict) || 0) + 1);
  let best = null;
  let bestCount = 0;
  for (const [verdict, count] of counts) {
    if (count > bestCount) {
      best = verdict;
      bestCount = count;
    }
  }
  return { verdict: best, unanimous: bestCount === verdicts.length && verdicts.length > 1 };
}

/**
 * Persona track records, computed only from of-record *evaluative* decisions.
 *
 * The honest signal is `concernsRealized`: a persona raised a concern, and the
 * retro says whether it actually came true. Everything else is context.
 *
 * Generative and reaction runs are excluded, and that exclusion is load-bearing.
 * A brainstorm recorded in the evaluative shape banks an "endorse" for every
 * seat that contributed an idea, which is how a perfectly good persona ends up
 * flagged as "never dissents" for the crime of having ideas.
 */
export function calibration(root, config) {
  const decisions = listDecisions(root, config).filter((d) => (d.kind || 'evaluative') === 'evaluative');
  const stats = new Map();

  const seat = (id) => {
    if (!stats.has(id)) {
      stats.set(id, {
        persona: id,
        seated: 0,
        verdicts: {},
        dissented: 0,
        concernsRaised: 0,
        concernsRealized: 0,
        decisionsWithOutcome: 0,
      });
    }
    return stats.get(id);
  };

  for (const decision of decisions) {
    const verdicts = decision.verdicts || [];
    const { verdict: modal } = modalVerdict(verdicts.map((v) => v.verdict).filter(Boolean));

    for (const entry of verdicts) {
      const row = seat(entry.persona);
      row.seated += 1;
      if (entry.verdict) row.verdicts[entry.verdict] = (row.verdicts[entry.verdict] || 0) + 1;
      if (entry.verdict && modal && entry.verdict !== modal) row.dissented += 1;
      if (decision.outcome) row.decisionsWithOutcome += 1;
    }

    for (const concern of decision.outcome?.concerns || []) {
      const row = seat(concern.persona);
      row.concernsRaised += 1;
      if (concern.realized) row.concernsRealized += 1;
    }
  }

  return [...stats.values()]
    .map((row) => ({
      ...row,
      dissentRate: row.seated ? row.dissented / row.seated : 0,
      hitRate: row.concernsRaised ? row.concernsRealized / row.concernsRaised : null,
      flags: [
        row.seated >= 3 && row.dissented === 0
          ? 'never dissented in 3+ panels - likely too agreeable to be worth a seat'
          : null,
        row.concernsRaised >= 3 && row.concernsRealized / row.concernsRaised <= 0.2
          ? 'raises concerns that rarely materialize - may be crying wolf'
          : null,
      ].filter(Boolean),
    }))
    .sort((a, b) => b.seated - a.seated);
}

export function memoryStats(root, config) {
  const decisions = listDecisions(root, config);
  // Only an evaluative run can be right or wrong, so only those await a retro.
  const evaluative = decisions.filter((d) => (d.kind || 'evaluative') === 'evaluative');
  return {
    scratch: listScratch(root, config).length,
    decisions: decisions.length,
    evaluative: evaluative.length,
    withOutcome: evaluative.filter((d) => d.outcome).length,
    awaitingRetro: evaluative.filter((d) => !d.outcome).map((d) => d.id),
  };
}
