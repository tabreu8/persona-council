/**
 * Deterministic memo rendering.
 *
 * The agent produces a structured decision record; these functions turn it into
 * the readable artifacts. Rendering here rather than asking a model to
 * hand-author markup means every memo comes out identical in shape, and the
 * agent only has to get the data right.
 */

const VERDICT_LABELS = {
  endorse: 'Endorse',
  'endorse-with-conditions': 'Endorse with conditions',
  oppose: 'Oppose',
  'insufficient-information': 'Insufficient information',
};

const VERDICT_TONE = {
  endorse: 'yes',
  'endorse-with-conditions': 'maybe',
  oppose: 'no',
  'insufficient-information': 'unknown',
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function label(verdict) {
  return VERDICT_LABELS[verdict] || verdict || '—';
}

export function isUnanimous(record) {
  const verdicts = (record.verdicts || []).map((v) => v.verdict).filter(Boolean);
  return verdicts.length > 1 && new Set(verdicts).size === 1;
}

export function renderMemoMarkdown(record) {
  const s = record.synthesis || {};
  const lines = [];
  const title = record.question || 'Panel run';

  lines.push(`# ${title}`, '');
  const meta = [
    record.recordedAt ? `**Date:** ${record.recordedAt.slice(0, 10)}` : null,
    record.topology ? `**Mode:** ${record.topology}` : null,
    record.framing ? `**Framing:** ${record.framing}` : null,
    record.roster ? `**Roster:** ${record.roster}` : null,
    record.mode === 'scratch' ? '**Scratch run** — not of record' : null,
  ].filter(Boolean);
  if (meta.length) lines.push(meta.join(' · '), '');

  if (s.decision) lines.push('## Decision', '', s.decision, '');

  if ((record.verdicts || []).length) {
    lines.push('## Panel', '', '| Seat | Verdict | Confidence | Position |', '|---|---|---|---|');
    for (const v of record.verdicts) {
      lines.push(`| ${v.persona || ''} | ${label(v.verdict)} | ${v.confidence || '—'} | ${(v.summary || '').replace(/\|/g, '\\|')} |`);
    }
    lines.push('');
  }

  if ((s.consensus || []).length) lines.push('## Where they agree', '', ...s.consensus.map((c) => `- ${c}`), '');

  const factual = s.factualDisputes || [];
  const values = s.valueDisputes || [];
  if (factual.length || values.length) {
    lines.push('## Where they disagree', '');
    for (const d of factual) {
      lines.push(`**Factual** — ${d.dispute || d}`, d.settledBy ? `→ settled by: ${d.settledBy}` : '', '');
    }
    for (const d of values) {
      lines.push(`**Values** — ${d.dispute || d}`, d.tradeoff ? `→ your call: ${d.tradeoff}` : '', '');
    }
  }

  if ((s.blindSpots || []).length) lines.push('## Blind spots', '', ...s.blindSpots.map((b) => `- ${b}`), '');

  if ((s.actionPlan || []).length) {
    lines.push('## Action plan', '');
    s.actionPlan.forEach((step, i) => {
      const text = step.step || step;
      const closes = step.closes ? ` — closes: ${step.closes}` : '';
      lines.push(`${i + 1}. ${text}${closes}`);
    });
    lines.push('');
  }

  if (record.revisitWhen) lines.push('## Revisit when', '', record.revisitWhen, '');

  const warning = s.confidenceWarning || (isUnanimous(record)
    ? 'Every seat agreed. That may say more about the roster than the proposal.'
    : null);
  if (warning) lines.push('## Confidence warning', '', warning, '');

  if (record.outcome) {
    const o = record.outcome;
    lines.push('## Outcome', '', `**What happened:** ${o.choseSummary || o.chose || '—'}`, '');
    if (o.result) lines.push(`**Result:** ${o.result}${o.resultSummary ? ` — ${o.resultSummary}` : ''}`, '');
    const realized = (o.concerns || []).filter((c) => c.realized);
    if (realized.length) {
      lines.push('**Concerns that materialized:**', '');
      for (const c of realized) lines.push(`- ${c.persona}: ${c.concern}${c.note ? ` (${c.note})` : ''}`);
      lines.push('');
    }
  }

  return `${lines.filter((l) => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

const STYLE = `
:root {
  color-scheme: light dark;
  --bg: #fbfaf9; --surface: #ffffff; --line: #e6e2dd; --ink: #1f1d1b;
  --muted: #6b655e; --accent: #7c5cff;
  --yes: #17795e; --yes-bg: #e4f4ee;
  --maybe: #96650a; --maybe-bg: #fbf0da;
  --no: #b4281e; --no-bg: #fbe6e4;
  --unknown: #5a5550; --unknown-bg: #eeebe7;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #17161a; --surface: #201e24; --line: #35323a; --ink: #f2efec;
    --muted: #a9a29b; --accent: #a894ff;
    --yes: #6cd3ac; --yes-bg: #143229;
    --maybe: #e5b563; --maybe-bg: #35280f;
    --no: #ff8f84; --no-bg: #3a1d1a;
    --unknown: #a9a29b; --unknown-bg: #2a282e;
  }
}
:root[data-theme="dark"] {
  --bg: #17161a; --surface: #201e24; --line: #35323a; --ink: #f2efec;
  --muted: #a9a29b; --accent: #a894ff;
  --yes: #6cd3ac; --yes-bg: #143229;
  --maybe: #e5b563; --maybe-bg: #35280f;
  --no: #ff8f84; --no-bg: #3a1d1a;
  --unknown: #a9a29b; --unknown-bg: #2a282e;
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 3rem 1.5rem 5rem; background: var(--bg); color: var(--ink);
  font: 16px/1.65 ui-sans-serif, -apple-system, "Segoe UI", Inter, system-ui, sans-serif;
}
.wrap { max-width: 52rem; margin: 0 auto; }
.eyebrow { font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin: 0 0 .6rem; }
h1 { font-size: clamp(1.6rem, 4vw, 2.3rem); line-height: 1.2; margin: 0 0 .8rem; letter-spacing: -.02em; }
.meta { color: var(--muted); font-size: .875rem; margin: 0 0 2.5rem; }
.meta span + span::before { content: "·"; margin: 0 .5rem; }
h2 { font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
     margin: 2.75rem 0 .9rem; font-weight: 650; }
.decision { background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--accent);
            border-radius: 10px; padding: 1.25rem 1.4rem; font-size: 1.1rem; line-height: 1.5; }
.scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; min-width: 34rem; }
th { text-align: left; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase;
     color: var(--muted); font-weight: 650; padding: 0 .8rem .6rem 0; border-bottom: 1px solid var(--line); }
td { padding: .85rem .8rem .85rem 0; border-bottom: 1px solid var(--line); vertical-align: top; }
td:last-child, th:last-child { padding-right: 0; }
.seat { font-weight: 600; white-space: nowrap; }
.chip { display: inline-block; padding: .18rem .55rem; border-radius: 999px; font-size: .76rem;
        font-weight: 600; white-space: nowrap; }
.chip.yes { color: var(--yes); background: var(--yes-bg); }
.chip.maybe { color: var(--maybe); background: var(--maybe-bg); }
.chip.no { color: var(--no); background: var(--no-bg); }
.chip.unknown { color: var(--unknown); background: var(--unknown-bg); }
.dispute { border-left: 2px solid var(--line); padding: .1rem 0 .1rem 1rem; margin: 0 0 1.2rem; }
.dispute .kind { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 650; }
.dispute .resolve { color: var(--muted); font-size: .9rem; margin-top: .35rem; }
ul, ol { padding-left: 1.2rem; margin: 0; }
li { margin-bottom: .55rem; }
li .closes { color: var(--muted); font-size: .875rem; }
.warn { background: var(--maybe-bg); color: var(--maybe); border-radius: 10px; padding: 1rem 1.2rem;
        font-size: .92rem; line-height: 1.5; }
.warn strong { display: block; margin-bottom: .25rem; }
.outcome { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 1.2rem 1.4rem; }
footer { margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--line);
         color: var(--muted); font-size: .8rem; }
@media print { body { padding: 0; } .decision, .outcome { break-inside: avoid; } }
`;

export function renderMemoHtml(record, { title } = {}) {
  const s = record.synthesis || {};
  const heading = title || record.question || 'Panel run';
  const parts = [];

  parts.push(`<title>${esc(heading.slice(0, 90))}</title>`, `<style>${STYLE}</style>`, '<div class="wrap">');
  parts.push(`<p class="eyebrow">${record.mode === 'scratch' ? 'Scratch run — not of record' : 'Decision memo'}</p>`);
  parts.push(`<h1>${esc(heading)}</h1>`);

  const meta = [
    record.recordedAt ? `<span>${esc(record.recordedAt.slice(0, 10))}</span>` : '',
    record.topology ? `<span>${esc(record.topology)}</span>` : '',
    record.framing ? `<span>${esc(record.framing)}</span>` : '',
    record.roster ? `<span>roster: ${esc(record.roster)}</span>` : '',
    record.cost?.subAgents ? `<span>${record.cost.subAgents} agents</span>` : '',
  ].join('');
  if (meta) parts.push(`<p class="meta">${meta}</p>`);

  if (s.decision) parts.push('<h2>Decision</h2>', `<div class="decision">${esc(s.decision)}</div>`);

  if ((record.verdicts || []).length) {
    const rows = record.verdicts.map((v) => `<tr>
      <td class="seat">${esc(v.persona)}</td>
      <td><span class="chip ${VERDICT_TONE[v.verdict] || 'unknown'}">${esc(label(v.verdict))}</span></td>
      <td>${esc(v.confidence || '—')}</td>
      <td>${esc(v.summary || '')}</td>
    </tr>`).join('');
    parts.push('<h2>Panel</h2>',
      `<div class="scroll"><table><thead><tr><th>Seat</th><th>Verdict</th><th>Confidence</th><th>Position</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  if ((s.consensus || []).length) {
    parts.push('<h2>Where they agree</h2>', `<ul>${s.consensus.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`);
  }

  const disputes = [
    ...(s.factualDisputes || []).map((d) => ({ kind: 'Factual', text: d.dispute || d, resolve: d.settledBy ? `Settled by: ${d.settledBy}` : '' })),
    ...(s.valueDisputes || []).map((d) => ({ kind: 'Values', text: d.dispute || d, resolve: d.tradeoff ? `Your call: ${d.tradeoff}` : '' })),
  ];
  if (disputes.length) {
    parts.push('<h2>Where they disagree</h2>', disputes.map((d) => `<div class="dispute">
      <div class="kind">${esc(d.kind)}</div>
      <div>${esc(d.text)}</div>
      ${d.resolve ? `<div class="resolve">${esc(d.resolve)}</div>` : ''}
    </div>`).join(''));
  }

  if ((s.blindSpots || []).length) {
    parts.push('<h2>Blind spots</h2>', `<ul>${s.blindSpots.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`);
  }

  if ((s.actionPlan || []).length) {
    const items = s.actionPlan.map((step) => {
      const text = esc(step.step || step);
      return `<li>${text}${step.closes ? ` <span class="closes">— closes: ${esc(step.closes)}</span>` : ''}</li>`;
    }).join('');
    parts.push('<h2>Action plan</h2>', `<ol>${items}</ol>`);
  }

  if (record.revisitWhen) parts.push('<h2>Revisit when</h2>', `<p>${esc(record.revisitWhen)}</p>`);

  const warning = s.confidenceWarning || (isUnanimous(record)
    ? 'Every seat agreed. That may say more about the roster than about the proposal.'
    : null);
  if (warning) {
    parts.push('<h2>Confidence</h2>', `<div class="warn"><strong>Read this before acting</strong>${esc(warning)}</div>`);
  }

  if (record.outcome) {
    const o = record.outcome;
    const realized = (o.concerns || []).filter((c) => c.realized);
    parts.push('<h2>Outcome</h2>', `<div class="outcome">
      <p><strong>What happened:</strong> ${esc(o.choseSummary || o.chose || '—')}</p>
      ${o.result ? `<p><strong>Result:</strong> ${esc(o.result)}${o.resultSummary ? ` — ${esc(o.resultSummary)}` : ''}</p>` : ''}
      ${realized.length ? `<p><strong>Concerns that materialized:</strong></p><ul>${realized.map((c) => `<li>${esc(c.persona)}: ${esc(c.concern)}</li>`).join('')}</ul>` : ''}
    </div>`);
  }

  const seats = (record.personas || record.verdicts || []).map((p) => p.id || p.persona).filter(Boolean);
  parts.push(`<footer>Produced by persona-council${seats.length ? ` · seats: ${esc(seats.join(', '))}` : ''}${record.id ? ` · ${esc(record.id)}` : ''}<br>
    Personas are lenses, not experts. They surface considerations; they do not supply facts.</footer>`);
  parts.push('</div>');

  return `${parts.join('\n')}\n`;
}
