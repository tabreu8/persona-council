import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../src/install.js';
import { loadConfig, defaultConfig, migrateConfig, validateConfig } from '../src/config.js';
import {
  writeDecision, readDecision, listDecisions, writeOutcome, makeDecisionId,
  listScratch, pruneScratch, promoteScratch, calibration, memoryStats, scratchDir,
} from '../src/memory.js';
import { renderMemoMarkdown, renderMemoHtml, isUnanimous } from '../src/render.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(repoRoot, 'bin', 'cli.js');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'persona-memory-test-'));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  install(dir);
  return dir;
}

function run(args, cwd) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd, env: { ...process.env, NO_COLOR: '1' },
  }).toString();
}

function panelRecord(overrides = {}) {
  return {
    recordedAt: '2026-08-19T10:15:00Z',
    question: 'Move to usage-based pricing next quarter?',
    topology: 'roundtable',
    personas: [{ id: 'sales-lead' }, { id: 'finance-lead' }, { id: 'customer-advocate' }],
    verdicts: [
      { persona: 'sales-lead', verdict: 'oppose', confidence: 'high', summary: 'Reps sell predictability.' },
      { persona: 'finance-lead', verdict: 'endorse-with-conditions', confidence: 'medium', summary: 'Upside is real.' },
      { persona: 'customer-advocate', verdict: 'oppose', confidence: 'high', summary: 'Nobody asked the accounts.' },
    ],
    synthesis: { decision: 'Do not switch next quarter.', blindSpots: ['Nobody costed support load.'] },
    ...overrides,
  };
}

test('scratch and decisions are separate stores', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  assert.notEqual(config.memory.scratchPath, config.memory.decisionsPath);
  assert.ok(fs.existsSync(path.resolve(root, config.memory.scratchPath)));
  assert.ok(fs.existsSync(path.resolve(root, config.memory.decisionsPath)));
  assert.equal(config.memory.defaultMode, 'scratch');
});

test('only scratch is gitignored; the decision record is meant to be committed', () => {
  const root = sandbox();
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(gitignore, /\.claude\/memory\/scratch/);
  assert.ok(!gitignore.includes('.claude/memory/decisions'));
});

test('a decision round-trips and gets a dated, slugged id', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  const { id } = writeDecision(root, config, panelRecord());
  assert.equal(id, '2026-08-19-move-to-usage-based-pricing-next');

  const read = readDecision(root, config, id);
  assert.equal(read.question, panelRecord().question);
  assert.equal(read.mode, 'decision');
  assert.equal(read.outcome, null);
});

test('two decisions on one day and topic do not collide', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  const first = writeDecision(root, config, panelRecord());
  const second = writeDecision(root, config, panelRecord());
  assert.notEqual(first.id, second.id);
  assert.equal(listDecisions(root, config).length, 2);
});

test('outcomes attach to a decision and reject unknown result values', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  const { id } = writeDecision(root, config, panelRecord());

  writeOutcome(root, config, id, {
    chose: 'not-shipped', result: 'good',
    concerns: [{ persona: 'sales-lead', concern: 'Renewal renegotiation', realized: true }],
  });
  assert.equal(readDecision(root, config, id).outcome.result, 'good');

  assert.throws(() => writeOutcome(root, config, id, { result: 'excellent' }), /must be one of/);
  assert.throws(() => writeOutcome(root, config, 'nope', {}), /no decision/);
});

test('scratch prunes by count and age; decisions never do', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  config.memory.scratchRetain = 2;
  const dir = scratchDir(root, config);

  for (const n of [1, 2, 3, 4]) {
    fs.writeFileSync(path.join(dir, `run-${n}.json`), JSON.stringify({ question: `q${n}` }));
    fs.writeFileSync(path.join(dir, `run-${n}.md`), '# memo');
  }
  writeDecision(root, config, panelRecord());

  const removed = pruneScratch(root, config);
  assert.equal(removed.length, 2);
  assert.equal(listScratch(root, config).length, 2);
  assert.equal(listDecisions(root, config).length, 1, 'pruning must never touch the record');
  assert.equal(fs.readdirSync(dir).filter((f) => f.endsWith('.md')).length, 2, 'memos go with their run');

  const old = path.join(dir, 'ancient.json');
  fs.writeFileSync(old, JSON.stringify({ question: 'old' }));
  const longAgo = Date.now() - 40 * 86400000;
  fs.utimesSync(old, longAgo / 1000, longAgo / 1000);
  assert.ok(pruneScratch(root, config).includes('ancient'));
});

test('a brainstorm can be promoted when it turns real', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  fs.writeFileSync(
    path.join(scratchDir(root, config), 'run-1.json'),
    JSON.stringify(panelRecord({ mode: 'scratch' })),
  );

  const { id } = promoteScratch(root, config, 'run-1');
  assert.equal(readDecision(root, config, id).promotedFrom, 'run-1');
  assert.equal(listScratch(root, config).length, 0, 'promoted runs leave scratch');
  assert.throws(() => promoteScratch(root, config, 'run-1'), /no scratch run/);
});

test('calibration counts only decisions, never scratch', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  fs.writeFileSync(path.join(scratchDir(root, config), 'brainstorm.json'), JSON.stringify(panelRecord()));

  assert.deepEqual(calibration(root, config), [], 'a brainstorm has no outcome, so it proves nothing');

  const { id } = writeDecision(root, config, panelRecord());
  writeOutcome(root, config, id, {
    result: 'good',
    concerns: [
      { persona: 'sales-lead', concern: 'renegotiation', realized: true },
      { persona: 'finance-lead', concern: 'forecasting', realized: false },
    ],
  });

  const rows = calibration(root, config);
  const sales = rows.find((r) => r.persona === 'sales-lead');
  const finance = rows.find((r) => r.persona === 'finance-lead');
  assert.equal(sales.hitRate, 1);
  assert.equal(finance.hitRate, 0);
  assert.equal(finance.dissented, 1, 'finance was the lone endorser');
  assert.equal(sales.dissented, 0);
});

test('a persona that never dissents gets flagged', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  for (let i = 0; i < 3; i += 1) {
    writeDecision(root, config, panelRecord({
      question: `decision number ${i}`,
      verdicts: [
        { persona: 'yes-man', verdict: 'endorse' },
        { persona: 'skeptic', verdict: 'endorse' },
        { persona: 'wildcard', verdict: 'oppose' },
      ],
    }));
  }
  const rows = calibration(root, config);
  assert.match(rows.find((r) => r.persona === 'yes-man').flags[0], /never dissented/);
  assert.deepEqual(rows.find((r) => r.persona === 'wildcard').flags, []);
});

test('memoryStats reports what still needs a retro', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  const { id } = writeDecision(root, config, panelRecord());
  writeDecision(root, config, panelRecord({ question: 'something else entirely' }));
  writeOutcome(root, config, id, { result: 'mixed' });

  const stats = memoryStats(root, config);
  assert.equal(stats.decisions, 2);
  assert.equal(stats.withOutcome, 1);
  assert.equal(stats.awaitingRetro.length, 1);
});

test('unanimity is detected so the memo can flag it', () => {
  assert.equal(isUnanimous({ verdicts: [{ verdict: 'endorse' }, { verdict: 'endorse' }] }), true);
  assert.equal(isUnanimous({ verdicts: [{ verdict: 'endorse' }, { verdict: 'oppose' }] }), false);
  assert.equal(isUnanimous({ verdicts: [{ verdict: 'endorse' }] }), false, 'one seat is not a consensus');
});

test('memos render deterministically in both formats', () => {
  const record = { ...panelRecord(), id: 'x', synthesis: {
    decision: 'Do not switch next quarter.',
    factualDisputes: [{ dispute: 'How many pay more?', settledBy: 'Replay last quarter usage.' }],
    valueDisputes: [{ dispute: 'Predictability vs upside.', tradeoff: 'Sales owns one number.' }],
    blindSpots: ['Nobody costed support load.'],
    actionPlan: [{ step: 'Run the billing replay.', closes: 'the factual dispute' }],
  } };

  const md = renderMemoMarkdown(record);
  assert.match(md, /## Decision/);
  assert.match(md, /settled by: Replay last quarter usage\./);
  assert.equal(md, renderMemoMarkdown(record), 'same input, same bytes');

  const html = renderMemoHtml(record);
  assert.match(html, /<title>/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /data-theme="dark"/);
  assert.match(html, /overflow-x: auto/);
  assert.ok(!/<script/i.test(html), 'memos never carry script');
});

test('memo rendering escapes hostile content from persona output', () => {
  const html = renderMemoHtml({
    question: '<img src=x onerror=alert(1)>',
    verdicts: [{ persona: '</td><script>alert(1)</script>', verdict: 'oppose', summary: '"quoted"' }],
    synthesis: { decision: 'x' },
  });
  // The text may still contain the word "onerror"; what matters is that it can
  // never become a tag or an attribute.
  assert.ok(!/<script/i.test(html));
  assert.ok(!/<img/i.test(html));
  assert.ok(!/<\/td>/.test(html.split('<tbody>')[1].split('</tbody>')[0].replace(/<\/td>/g, '')));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&quot;quoted&quot;/);
});

test('a scratch memo says so on its face', () => {
  const record = { ...panelRecord(), mode: 'scratch' };
  assert.match(renderMemoMarkdown(record), /Scratch run/);
  assert.match(renderMemoHtml(record), /not of record/);
});

test('config v1 migrates without losing the old memory location', () => {
  const migrated = migrateConfig({
    version: 1,
    sources: [{ id: 'local', type: 'local', path: '.claude/personas', writable: true }],
    writeTo: 'local',
    memory: { path: '.claude/memory', retain: 50 },
  });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.memory.scratchPath, '.claude/memory/scratch');
  assert.equal(migrated.memory.decisionsPath, '.claude/memory/decisions');
  assert.equal(migrated.memory.scratchRetain, 50);
  assert.deepEqual(validateConfig({ ...defaultConfig(), ...migrated }), []);
});

test('config rejects a memory setup where brainstorms would pollute the record', () => {
  const config = defaultConfig();
  config.memory.decisionsPath = config.memory.scratchPath;
  assert.ok(validateConfig(config).some((e) => e.includes('must differ')));

  const badMode = defaultConfig();
  badMode.memory.defaultMode = 'permanent';
  assert.ok(validateConfig(badMode).some((e) => e.includes('defaultMode')));
});

test('rosters are validated before they are written', () => {
  const config = defaultConfig();
  config.rosters = { 'launch-review': { personas: [] } };
  assert.ok(validateConfig(config).some((e) => e.includes('non-empty personas')));

  config.rosters = { 'launch-review': { personas: ['a'], mode: 'freeforall' } };
  assert.ok(validateConfig(config).some((e) => e.includes('unknown mode')));
});

test('CLI roster add warns about seats that do not exist yet', () => {
  const root = sandbox();
  const output = run(['roster', 'add', 'pricing-council', '--personas=sales-lead,finance-lead', '--mode', 'roundtable'], root);
  assert.match(output, /pricing-council/);
  assert.match(output, /2 seat\(s\) do not exist yet/);
  assert.match(run(['roster', 'list'], root), /roundtable/);

  run(['roster', 'remove', 'pricing-council'], root);
  assert.match(run(['roster', 'list'], root), /no rosters yet/);
});

test('CLI surfaces decisions, memos and calibration', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  const { id } = writeDecision(root, config, panelRecord());

  assert.match(run(['decisions', 'list'], root), /open/);
  assert.match(run(['decisions', 'show', id], root), /## Decision/);

  run(['memo', id, '--html', '--out', 'memo.html'], root);
  const html = fs.readFileSync(path.join(root, 'memo.html'), 'utf8');
  assert.match(html, /usage-based pricing/);

  writeOutcome(root, config, id, { result: 'good', concerns: [{ persona: 'sales-lead', concern: 'c', realized: true }] });
  assert.match(run(['decisions', 'list'], root), /closed/);
  assert.match(run(['calibration'], root), /sales-lead/);
  assert.match(run(['memo', id], root), /## Outcome/);
});

test('CLI prune leaves the record alone', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  writeDecision(root, config, panelRecord());
  fs.writeFileSync(path.join(scratchDir(root, config), 'run-1.json'), '{}');

  const output = run(['prune', '--dir', root], root);
  assert.match(output, /Decisions on record are never pruned/);
  assert.equal(listDecisions(root, config).length, 1);
});

test('makeDecisionId keeps ids short and readable', () => {
  const id = makeDecisionId('2026-08-19T10:15:00Z', 'Should we completely rewrite the billing system from scratch this year?');
  assert.match(id, /^2026-08-19-/);
  assert.ok(id.split('-').length <= 9);
});

test('eval cases all carry a well-formed answer key', async () => {
  const { listCases } = await import('../src/eval.js');
  const cases = listCases();
  assert.ok(cases.length >= 4);
  assert.ok(new Set(cases.map((c) => c.domain)).size >= 4, 'cases must span domains, not just engineering');

  for (const spec of cases) {
    assert.ok(fs.existsSync(spec.artifact), `${spec.case} has no artifact`);
    assert.ok(spec.flaws.length >= 4, `${spec.case} needs enough flaws to discriminate`);
    for (const flaw of spec.flaws) {
      assert.ok(flaw.id && flaw.description, `${spec.case}: flaw missing id or description`);
      assert.ok(['major', 'moderate', 'minor'].includes(flaw.severity), `${spec.case}/${flaw.id}: bad severity`);
      assert.ok(flaw.keywords.length > 0, `${spec.case}/${flaw.id}: no keywords to match on`);
    }
  }
});

test('the scorer separates a thorough response from an agreeable one', async () => {
  const { loadCase, scoreResponse, compare } = await import('../src/eval.js');
  const spec = loadCase('pricing-change');

  const thorough = scoreResponse(
    'No grandfathering for existing customers. The sample of 30 accounts is not representative. ' +
    'Nobody counted which accounts pay more. 14 days notice is too short. No rollback. Support tickets will spike.',
    spec,
  );
  const agreeable = scoreResponse('Looks reasonable, aligns cost with value.', spec);

  assert.equal(thorough.recall, 1);
  assert.equal(agreeable.caught, 0);
  assert.equal(compare(thorough, agreeable).recallDelta, 1);
  assert.equal(agreeable.missed.length, spec.flaws.length);
});

test('weighted recall counts major flaws for more than minor ones', async () => {
  const { loadCase, scoreResponse } = await import('../src/eval.js');
  const spec = loadCase('launch-plan');
  const minorOnly = scoreResponse('The only risk considered is a competitor, which is shallow.', spec);
  const majorOnly = scoreResponse('"No mistakes" is an indefensible accuracy claim, and the logos need permission.', spec);
  assert.ok(majorOnly.weightedRecall > minorOnly.weightedRecall);
  assert.ok(majorOnly.caught >= 2);
});

test('memos carry every concern a seat raised — the retro reads these', () => {
  // Regression: the memo once rendered only the one-line summaries, which left
  // persona-retro unable to mark concerns realized from the command it names.
  const record = {
    ...panelRecord(),
    verdicts: [{
      persona: 'finance-lead',
      verdict: 'endorse-with-conditions',
      confidence: 'medium',
      concerns: [
        { blocking: true, text: 'Sample of 30 accounts is not representative.' },
        { blocking: false, text: 'No calculator on the pricing page.' },
      ],
      changeMyMind: 'Replay four quarters and show the per-account spread.',
      summary: 'Upside real, forecast is not.',
    }],
  };

  const md = renderMemoMarkdown(record);
  assert.match(md, /## What each seat raised/);
  assert.match(md, /Sample of 30 accounts is not representative\./);
  assert.match(md, /\*\*blocking\*\* — Sample of 30/);
  assert.ok(!/\*\*blocking\*\* — No calculator/.test(md), 'non-blocking concerns are not marked blocking');
  assert.match(md, /Would change my mind:.*per-account spread/);

  const html = renderMemoHtml(record);
  assert.match(html, /What each seat raised/);
  assert.match(html, /Sample of 30 accounts is not representative\./);
  assert.match(html, /class="blocking"/);
  assert.match(html, /per-account spread/);
});

test('a memo with no concerns recorded omits the section rather than showing an empty one', () => {
  const record = { ...panelRecord(), verdicts: [{ persona: 'a', verdict: 'endorse', summary: 'fine' }] };
  assert.ok(!renderMemoMarkdown(record).includes('What each seat raised'));
  assert.ok(!renderMemoHtml(record).includes('What each seat raised'));
});

test('the generic target ships the reference docs its manual cites', async () => {
  // Regression: the manual referred to nine documents that target never installed.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'persona-generic-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  install(root, { target: 'generic' });

  const manual = fs.readFileSync(path.join(root, 'PERSONA-COUNCIL.md'), 'utf8');
  const cited = [...new Set([...manual.matchAll(/persona-council\/([a-z-]+\.md)/g)].map((m) => m[1]))];
  assert.ok(cited.length >= 5, 'the manual should cite the shared references');

  for (const file of cited) {
    assert.ok(
      fs.existsSync(path.join(root, '.claude', 'persona-council', file)),
      `manual cites ${file} but the generic target does not install it`,
    );
  }
});

test('the generic manual nests each skill under its own name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'persona-generic-h-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  install(root, { target: 'generic' });

  const manual = fs.readFileSync(path.join(root, 'PERSONA-COUNCIL.md'), 'utf8');
  const h2 = [...manual.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.ok(h2.includes('persona-panel'), 'skill names are the h2 level');
  assert.ok(!h2.includes('Procedure'), 'a skill section must not sit beside the skill name');
  assert.match(manual, /^### Procedure$/m);
});
