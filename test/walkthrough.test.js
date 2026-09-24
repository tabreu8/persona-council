import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../src/install.js';
import { loadConfig, validateConfig, defaultConfig } from '../src/config.js';
import { writeDecision, scratchDir } from '../src/memory.js';
import { compareJourneys } from '../src/compare.js';
import { loadCase, scoreResponse, rubric, scoreJudged, disagreements } from '../src/eval.js';
import { parseFrontmatter } from '../src/frontmatter.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(repoRoot, 'bin', 'cli.js');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'persona-walk-test-'));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  install(dir);
  return dir;
}

function run(args, cwd) {
  return execFileSync(process.execPath, [cli, ...args], { cwd, env: { ...process.env, NO_COLOR: '1' } }).toString();
}

function journey(overrides = {}) {
  return {
    kind: 'journey',
    framing: 'walkthrough',
    question: 'Invite a teammate',
    journeys: [{ persona: 'first-time-admin', outcome: 'gave-up', steps: [{}, {}, {}, {}] }],
    synthesis: {
      friction: [
        { id: 'members-under-billing', severity: 'blocker', issue: 'People live under billing' },
        { id: 'owner-default', severity: 'major', issue: 'Role defaults to Owner' },
      ],
    },
    ...overrides,
  };
}

test('compare sorts friction into fixed, remaining and new by id', () => {
  const after = journey({
    journeys: [{ persona: 'first-time-admin', outcome: 'completed', steps: [{}, {}] }],
    synthesis: {
      friction: [
        { id: 'owner-default', severity: 'major', issue: 'Still defaults to Owner, reworded' },
        { id: 'seat-charge', severity: 'major', issue: 'Inviting charges a seat' },
      ],
    },
  });
  const result = compareJourneys(journey(), after);

  assert.equal(result.sameGoal, true);
  assert.deepEqual(result.fixed.map((f) => f.id), ['members-under-billing']);
  assert.deepEqual(result.remaining.map((f) => f.id), ['owner-default'], 'matched by id even though reworded');
  assert.deepEqual(result.added.map((f) => f.id), ['seat-charge']);
  assert.deepEqual(result.walkers[0].before, { outcome: 'gave-up', steps: 4 });
  assert.deepEqual(result.walkers[0].after, { outcome: 'completed', steps: 2 });
});

test('friction without an id only matches on identical wording', () => {
  const before = journey({ synthesis: { friction: [{ severity: 'minor', issue: 'Jargon on the form' }] } });
  const same = journey({ synthesis: { friction: [{ severity: 'minor', issue: 'jargon on the form ' }] } });
  const reworded = journey({ synthesis: { friction: [{ severity: 'minor', issue: 'The form uses jargon' }] } });
  assert.equal(compareJourneys(before, same).remaining.length, 1, 'identical wording matches');
  const r = compareJourneys(before, reworded);
  assert.equal(r.fixed.length, 1);
  assert.equal(r.added.length, 1, 'reworded without an id is reported as fixed plus new, never guessed');
});

test('compare refuses to compare a walkthrough with a panel', () => {
  assert.throws(() => compareJourneys(journey(), { kind: 'evaluative', question: 'x' }), /not a walkthrough/);
});

test('CLI compare reads runs from either store', () => {
  const root = sandbox();
  const { config } = loadConfig(root);
  const { id } = writeDecision(root, config, { ...journey(), recordedAt: '2026-09-24T10:00:00Z' });
  fs.writeFileSync(path.join(scratchDir(root, config), 'rewalk.json'), JSON.stringify(journey({ synthesis: { friction: [] } })));

  const output = run(['compare', id, 'rewalk'], root);
  assert.match(output, /fixed\s+blocker members-under-billing/);
  assert.match(output, /fixed\s+major owner-default/);
  assert.throws(() => run(['compare', id], root), /usage/);
});

test('the walkthrough eval case is a product to walk, not a document', () => {
  const spec = loadCase('invite-flow');
  assert.equal(spec.kind, 'journey');
  // Compare path segments, not a slash-separated string: Windows paths use '\'.
  assert.deepEqual(spec.artifact.split(path.sep).slice(-2), ['invite-flow', 'index.html']);
  assert.ok(fs.existsSync(spec.artifact));
  assert.ok(spec.goal && spec.stopPoints.length, 'a walkthrough case needs a goal and stop points');

  // Every page the app links to must exist, or walkers get lost for the wrong reason.
  const dir = path.dirname(spec.artifact);
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const [, href] of html.matchAll(/href="([a-z-]+\.(?:html|css))"/g)) {
      assert.ok(fs.existsSync(path.join(dir, href)), `${file} links to missing ${href}`);
    }
  }
});

test('the walkthrough case gives nothing away where the auditor can see it', () => {
  const spec = loadCase('invite-flow');
  for (const flaw of spec.flaws) {
    assert.ok(!spec.description.toLowerCase().includes(flaw.id.split('-')[0]), `description hints at ${flaw.id}`);
    assert.ok(!spec.goal.toLowerCase().includes('billing') && !spec.goal.toLowerCase().includes('seat'), 'the goal must not leak the route');
  }
});

test('the grading brief carries the answer key but not the keywords', () => {
  const spec = loadCase('invite-flow');
  const brief = rubric(spec);
  for (const flaw of spec.flaws) {
    assert.ok(brief.includes(flaw.id));
    assert.ok(brief.includes(flaw.description));
  }
  assert.ok(!brief.includes('"keywords"'), 'the grader judges the argument, not word matches');
});

test('judged scoring is strict about what it accepts', () => {
  const spec = loadCase('invite-flow');
  const all = (caught) => spec.flaws.map((f) => ({ id: f.id, caught, evidence: caught ? 'quote' : '' }));

  assert.equal(scoreJudged(all(true), spec).recall, 1);
  assert.equal(scoreJudged(all(false), spec).recall, 0);
  assert.throws(() => scoreJudged(all(true).slice(1), spec), /no judgment for/);
  assert.throws(() => scoreJudged([...all(false), { id: 'made-up', caught: false }], spec), /unknown flaw/);
  assert.throws(() => scoreJudged(all(true).map((j) => ({ ...j, evidence: '' })), spec), /no evidence/);
});

test('disagreements name the flaws where keyword and grader part ways', () => {
  const spec = loadCase('invite-flow');
  const keyword = scoreResponse('The role picker defaults to Owner.', spec);
  const judged = scoreJudged(spec.flaws.map((f) => ({
    id: f.id,
    caught: f.id === 'members-under-billing',
    evidence: f.id === 'members-under-billing' ? 'people are filed with the invoices' : '',
  })), spec);
  const ids = disagreements(keyword, judged).map((d) => d.id).sort();
  assert.deepEqual(ids, ['default-role-owner', 'members-under-billing']);
});

test('a walkthrough roster runs its walkers independently', () => {
  const config = defaultConfig();
  config.rosters = { onboarding: { personas: ['a', 'b'], framing: 'walkthrough', goal: 'invite someone', at: 'https://x.test' } };
  assert.deepEqual(validateConfig(config), []);

  config.rosters.onboarding.mode = 'chain';
  assert.match(validateConfig(config).join('\n'), /walkthrough.*fanout/);

  config.rosters = { review: { personas: ['a'], goal: 'invite someone' } };
  assert.match(validateConfig(config).join('\n'), /not a walkthrough/);
});

test('CLI roster add records a walkthrough goal and entry point', () => {
  const root = sandbox();
  run(['roster', 'add', 'onboarding', '--personas=a,b', '--framing', 'walkthrough', '--goal', 'invite Sam', '--at', 'https://x.test'], root);
  const listed = run(['roster', 'list'], root);
  assert.match(listed, /goal: invite Sam/);
  assert.match(listed, /start: https:\/\/x\.test/);
});

test('the walker cannot read, search or edit files', () => {
  // Fidelity is enforced, not just requested: a walker that can open the
  // source gets past a confusing screen no real user could.
  const { data } = parseFrontmatter(fs.readFileSync(path.join(repoRoot, 'agents', 'persona-walker.md'), 'utf8'));
  const denied = String(data.disallowedTools).split(',').map((t) => t.trim());
  for (const tool of ['Read', 'Grep', 'Glob', 'Edit', 'Write']) assert.ok(denied.includes(tool), `walker can use ${tool}`);
  assert.equal(data.tools, undefined, 'an allowlist would strip the browser tools a walker needs');
});
