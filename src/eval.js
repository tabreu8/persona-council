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

/**
 * Most cases are a document to review, at <case>.md. A walkthrough case is a
 * product to use, so it names its own entry point (a web page, usually).
 */
function withArtifact(spec, dir) {
  return { ...spec, kind: spec.kind || 'evaluative', artifact: path.join(dir, spec.artifact || `${spec.case}.md`) };
}

export function evalsDir() {
  return path.join(packageRoot, 'evals', 'cases');
}

export function listCases(dir = evalsDir()) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.flaws.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')))
    .map((spec) => withArtifact(spec, dir))
    .sort((a, b) => a.case.localeCompare(b.case));
}

export function loadCase(name, dir = evalsDir()) {
  const file = path.join(dir, `${name}.flaws.json`);
  if (!fs.existsSync(file)) return null;
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  return withArtifact(spec, dir);
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

/**
 * The keyword scorer's known failure is that it cannot tell an argument from a
 * name-drop. A grader can: an agent reads the response against the answer key
 * and says, per flaw, whether the problem was actually identified. The CLI has
 * no model to do that itself, so it does the two deterministic halves - write
 * the grading brief, and score what comes back - and the agent does the
 * judging in between.
 *
 * The grader must be a fresh sub-agent that never saw the run it is grading.
 * The brief contains the answer key, so it must never reach the panel or the
 * walker being evaluated.
 */
export function rubric(spec) {
  const flaws = spec.flaws.map((f) => `- \`${f.id}\` (${f.severity}): ${f.description}`).join('\n');
  return `# Grading brief: ${spec.case}

You are grading one response to the ${spec.kind === 'journey' ? 'walkthrough' : 'review'} case "${spec.case}".
${spec.description}

Below are the problems deliberately planted in the ${spec.kind === 'journey' ? 'product' : 'artifact'}.
For each one, decide whether the response identifies it: the same underlying
problem, in any words. Mentioning a related word without making the point does
not count. Finding a different problem nearby does not count.

${flaws}

Return only JSON, one entry per flaw, in this order:

\`\`\`json
[
  { "id": "<flaw id>", "caught": true, "evidence": "<a short verbatim quote from the response that shows it>" },
  { "id": "<flaw id>", "caught": false, "evidence": "" }
]
\`\`\`

"caught": true without a verbatim quote as evidence will be rejected.
`;
}

export function scoreJudged(judgments, spec) {
  if (!Array.isArray(judgments)) throw new Error('judgments must be a JSON array');
  const known = new Map(spec.flaws.map((f) => [f.id, f]));
  const seen = new Set();
  for (const j of judgments) {
    if (!known.has(j.id)) throw new Error(`judgment for unknown flaw "${j.id}"`);
    if (seen.has(j.id)) throw new Error(`flaw "${j.id}" judged twice`);
    if (j.caught === true && !String(j.evidence || '').trim()) {
      throw new Error(`flaw "${j.id}" marked caught with no evidence quoted`);
    }
    seen.add(j.id);
  }
  const missing = spec.flaws.filter((f) => !seen.has(f.id)).map((f) => f.id);
  if (missing.length) throw new Error(`no judgment for: ${missing.join(', ')}`);

  const results = spec.flaws.map((flaw) => {
    const j = judgments.find((x) => x.id === flaw.id);
    return { id: flaw.id, severity: flaw.severity, description: flaw.description, caught: j.caught === true, evidence: j.evidence || '' };
  });
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

/** Where the keyword match and the grader disagree - the lines worth reading by hand. */
export function disagreements(keywordScore, judgedScore) {
  return keywordScore.results
    .map((k) => ({ id: k.id, keyword: k.caught, judge: judgedScore.results.find((j) => j.id === k.id)?.caught ?? false }))
    .filter((d) => d.keyword !== d.judge);
}
