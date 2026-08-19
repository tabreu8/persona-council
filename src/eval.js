import fs from 'node:fs';
import path from 'node:path';
import { packageRoot } from './install.js';

/**
 * A deliberately crude scorer.
 *
 * Each planted flaw carries keywords; a response "catches" it if any keyword
 * appears. That over-credits a response that name-drops a term without making
 * the argument, and under-credits one that makes the argument in different
 * words. It is still worth having: it is deterministic, it is honest about
 * which flaws were planted, and it turns "the panel felt thorough" into a
 * number you can watch move when you change a persona.
 *
 * Treat it as a smoke test, not a benchmark. Read the misses by hand.
 */
export const SEVERITY_WEIGHT = { major: 3, moderate: 2, minor: 1 };

export function evalsDir() {
  return path.join(packageRoot, 'evals', 'cases');
}

export function listCases(dir = evalsDir()) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.flaws.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')))
    .map((spec) => ({ ...spec, artifact: path.join(dir, `${spec.case}.md`) }))
    .sort((a, b) => a.case.localeCompare(b.case));
}

export function loadCase(name, dir = evalsDir()) {
  const file = path.join(dir, `${name}.flaws.json`);
  if (!fs.existsSync(file)) return null;
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { ...spec, artifact: path.join(dir, `${spec.case}.md`) };
}

export function scoreResponse(text, spec) {
  const haystack = String(text || '').toLowerCase();
  const results = spec.flaws.map((flaw) => ({
    id: flaw.id,
    severity: flaw.severity,
    description: flaw.description,
    caught: flaw.keywords.some((keyword) => haystack.includes(keyword.toLowerCase())),
    matched: flaw.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())),
  }));

  const weight = (list) => list.reduce((sum, f) => sum + (SEVERITY_WEIGHT[f.severity] || 1), 0);
  const caught = results.filter((r) => r.caught);

  return {
    case: spec.case,
    domain: spec.domain,
    total: results.length,
    caught: caught.length,
    recall: results.length ? caught.length / results.length : 0,
    weightedRecall: weight(results) ? weight(caught) / weight(results) : 0,
    missed: results.filter((r) => !r.caught),
    results,
  };
}

export function compare(candidate, baseline) {
  if (!baseline) return null;
  return {
    recallDelta: candidate.recall - baseline.recall,
    weightedDelta: candidate.weightedRecall - baseline.weightedRecall,
    onlyCandidate: candidate.results.filter((r) => r.caught && !baseline.results.find((b) => b.id === r.id)?.caught).map((r) => r.id),
    onlyBaseline: baseline.results.filter((r) => r.caught && !candidate.results.find((cc) => cc.id === r.id)?.caught).map((r) => r.id),
  };
}
