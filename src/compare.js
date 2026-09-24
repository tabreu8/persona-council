/**
 * Before and after, for a re-walk.
 *
 * The question after a fix is narrow: did the walkers get further, and did the
 * problem go away? So this compares what can be compared mechanically --
 * outcome, step count, and friction by its stable `id` -- and leaves how a
 * walker felt about the new version to the audit.
 *
 * Friction without an id falls back to its exact issue text, which only
 * matches when the auditor wrote the same sentence twice. That is deliberately
 * strict: a fuzzy match would report a blocker as fixed because it was
 * reworded.
 */
function frictionKey(item) {
  return item.id || `issue:${String(item.issue || item).trim().toLowerCase()}`;
}

function frictionMap(record) {
  const map = new Map();
  for (const item of record.synthesis?.friction || []) map.set(frictionKey(item), item);
  return map;
}

export function compareJourneys(before, after) {
  for (const [label, record] of [['before', before], ['after', after]]) {
    if (record.kind !== 'journey') {
      throw new Error(`${label} run "${record.id || record.question}" is not a walkthrough (kind: ${record.kind || 'evaluative'})`);
    }
  }

  const personas = [...new Set([...(before.journeys || []), ...(after.journeys || [])].map((j) => j.persona))];
  const walkers = personas.map((persona) => {
    const b = (before.journeys || []).find((j) => j.persona === persona);
    const a = (after.journeys || []).find((j) => j.persona === persona);
    return {
      persona,
      before: b ? { outcome: b.outcome || null, steps: (b.steps || []).length } : null,
      after: a ? { outcome: a.outcome || null, steps: (a.steps || []).length } : null,
    };
  });

  const was = frictionMap(before);
  const now = frictionMap(after);
  const fixed = [...was].filter(([key]) => !now.has(key)).map(([, item]) => item);
  const remaining = [...now].filter(([key]) => was.has(key)).map(([key, item]) => ({ ...item, before: was.get(key) }));
  const added = [...now].filter(([key]) => !was.has(key)).map(([, item]) => item);

  return {
    sameGoal: String(before.question || '').trim() === String(after.question || '').trim(),
    walkers,
    fixed,
    remaining,
    added,
  };
}
