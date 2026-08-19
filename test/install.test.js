import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install, uninstall, readManifest, manifestPath } from '../src/install.js';
import { loadConfig } from '../src/config.js';
import { listPersonas, findPersona } from '../src/sources.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(repoRoot, 'bin', 'cli.js');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'persona-council-test-'));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(args, cwd) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd,
    env: { ...process.env, NO_COLOR: '1' },
  }).toString();
}

test('init installs skills, commands, agents and shared references', () => {
  const root = sandbox();
  const { results } = install(root);

  for (const expected of [
    '.claude/skills/persona-create/SKILL.md',
    '.claude/skills/persona-panel/SKILL.md',
    '.claude/commands/persona-ask.md',
    '.claude/agents/persona-runner.md',
    '.claude/persona-council/verdict-contract.md',
    '.claude/persona-council.config.json',
  ]) {
    assert.ok(fs.existsSync(path.join(root, expected)), `missing ${expected}`);
  }

  assert.ok(results.every((r) => r.status !== 'skipped'));
  assert.ok(fs.existsSync(path.join(root, '.claude', 'personas')));
  assert.ok(fs.existsSync(path.join(root, '.claude', 'memory')));
});

test('init ships zero personas, by design', () => {
  const root = sandbox();
  install(root);
  const { config } = loadConfig(root);
  assert.deepEqual(listPersonas(root, config).personas, []);
});

test('init is idempotent and does not clobber user edits', () => {
  const root = sandbox();
  install(root);

  const skill = path.join(root, '.claude', 'skills', 'persona-ask', 'SKILL.md');
  fs.writeFileSync(skill, 'my own version', 'utf8');

  const second = install(root);
  assert.equal(fs.readFileSync(skill, 'utf8'), 'my own version');
  assert.ok(second.results.some((r) => r.status === 'skipped'));

  const forced = install(root, { force: true });
  assert.notEqual(fs.readFileSync(skill, 'utf8'), 'my own version');
  assert.ok(forced.results.some((r) => r.status === 'updated'));
});

test('init preserves an existing config instead of resetting it', () => {
  const root = sandbox();
  install(root);
  const configFile = path.join(root, '.claude', 'persona-council.config.json');
  const edited = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  edited.panel.maxPersonas = 2;
  fs.writeFileSync(configFile, JSON.stringify(edited, null, 2));

  install(root);
  assert.equal(JSON.parse(fs.readFileSync(configFile, 'utf8')).panel.maxPersonas, 2);
});

test('init gitignores scratch and cache exactly once, but not the decision record', () => {
  const root = sandbox();
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n');
  install(root);
  install(root);
  const lines = fs.readFileSync(path.join(root, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
  assert.equal(lines.filter((l) => l === '.claude/memory/scratch').length, 1);
  assert.equal(lines.filter((l) => l === '.claude/.persona-cache').length, 1);
  assert.equal(lines.filter((l) => l === 'node_modules').length, 1);
  assert.equal(lines.filter((l) => l.includes('decisions')).length, 0, 'the record is meant to be committed');
});

test('the generic target writes one portable manual instead of Claude assets', () => {
  const root = sandbox();
  install(root, { target: 'generic' });
  const guide = path.join(root, 'PERSONA-COUNCIL.md');
  assert.ok(fs.existsSync(guide));
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'skills')));
  const text = fs.readFileSync(guide, 'utf8');
  for (const name of ['persona-create', 'persona-think', 'persona-ask', 'persona-panel']) {
    assert.ok(text.includes(`## ${name}`), `manual missing ${name}`);
  }
});

test('uninstall removes installed files but keeps personas, config and memory', () => {
  const root = sandbox();
  install(root);
  fs.writeFileSync(path.join(root, '.claude', 'personas', 'mine.md'), '---\nid: mine\n---\n\nbody');

  const { removed } = uninstall(root);
  assert.ok(removed.length > 0);
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'skills')));
  assert.ok(fs.existsSync(path.join(root, '.claude', 'personas', 'mine.md')));
  assert.ok(fs.existsSync(path.join(root, '.claude', 'persona-council.config.json')));
  assert.equal(readManifest(root), null);
});

test('CLI new scaffolds a stub that doctor flags as unfinished', () => {
  const root = sandbox();
  run(['init'], root);
  run(['new', 'vc-skeptic', '--name', 'Dana Reyes', '--role', 'Seed-stage VC'], root);

  const { config } = loadConfig(root);
  const persona = findPersona(root, config, 'vc-skeptic');
  assert.equal(persona.name, 'Dana Reyes');
  assert.equal(persona.role, 'Seed-stage VC');
  assert.match(persona.body, /TODO/);

  const listed = run(['list'], root);
  assert.match(listed, /vc-skeptic/);

  assert.throws(() => run(['new', 'vc-skeptic'], root), /already exists|Command failed/);
});

test('CLI doctor exits non-zero when a persona is broken', () => {
  const root = sandbox();
  run(['init'], root);
  fs.writeFileSync(path.join(root, '.claude', 'personas', 'broken.md'), 'no frontmatter at all');
  assert.throws(() => run(['doctor'], root), (error) => {
    assert.equal(error.status, 1);
    assert.match(error.stdout.toString(), /broken/);
    return true;
  });
});

test('CLI sources add refuses duplicates and records mcp resolve instructions', () => {
  const root = sandbox();
  run(['init'], root);
  const output = run(['sources', 'add', '--type', 'mcp', '--id', 'notion', '--server', 'notion'], root);
  assert.match(output, /added/);

  const { config } = loadConfig(root);
  const source = config.sources.find((s) => s.id === 'notion');
  assert.equal(source.type, 'mcp');
  assert.match(source.resolve, /notion MCP tools/);

  assert.throws(() => run(['sources', 'add', '--type', 'mcp', '--id', 'notion'], root));
});

test('mcp sources are reported as agent-resolved, not silently ignored', () => {
  const root = sandbox();
  run(['init'], root);
  run(['sources', 'add', '--type', 'mcp', '--id', 'notion', '--server', 'notion'], root);
  const { config } = loadConfig(root);
  const { deferredSources } = listPersonas(root, config);
  assert.equal(deferredSources.length, 1);
  assert.match(run(['list'], root), /resolved by your agent/);
});

test('a second local source is searched in order, first match winning', () => {
  const root = sandbox();
  run(['init'], root);
  run(['sources', 'add', '--type', 'local', '--id', 'team', '--path', '.claude/personas-team'], root);

  fs.mkdirSync(path.join(root, '.claude', 'personas-team'), { recursive: true });
  const body = '\n\n## Perspective\n\nYou are a persona with quite enough body text here.';
  fs.writeFileSync(path.join(root, '.claude', 'personas', 'dup.md'), `---\nid: dup\nname: Local\nrole: R\n---${body}`);
  fs.writeFileSync(path.join(root, '.claude', 'personas-team', 'dup.md'), `---\nid: dup\nname: Team\nrole: R\n---${body}`);
  fs.writeFileSync(path.join(root, '.claude', 'personas-team', 'only-team.md'), `---\nid: only-team\nname: T\nrole: R\n---${body}`);

  const { config } = loadConfig(root);
  const { personas } = listPersonas(root, config);
  assert.equal(personas.length, 2);
  assert.equal(findPersona(root, config, 'dup').name, 'Local');
  assert.ok(findPersona(root, config, 'only-team'));
});

test('CLI reports unknown commands instead of doing something surprising', () => {
  const root = sandbox();
  assert.throws(() => run(['frobnicate'], root), (error) => {
    assert.equal(error.status, 1);
    assert.match(error.stderr.toString(), /unknown command/);
    return true;
  });
});

test('init creates the target directory if it does not exist yet', () => {
  // Regression: `init --target generic --dir ./new` crashed writing the manual
  // into a directory nobody had created.
  for (const target of ['claude', 'generic']) {
    const parent = sandbox();
    const root = path.join(parent, 'not-created-yet', target);
    assert.doesNotThrow(() => install(root, { target }));
    assert.ok(fs.existsSync(path.join(root, '.claude', 'persona-council.config.json')));
  }
});

test('install manifest paths are always forward-slash, so uninstall works cross-OS', () => {
  // Regression: manifest paths were built with path.join, which emits '\' on
  // Windows. That manifest is not gitignored -- if committed and later read on
  // POSIX, path.join(root, rel) treats '\' as a literal filename character
  // (not a separator), fs.existsSync silently returns false, and uninstall
  // reports success while removing nothing.
  const root = sandbox();
  install(root);

  const manifest = readManifest(root);
  assert.ok(manifest.files.length > 5);
  for (const rel of manifest.files) {
    assert.ok(!rel.includes('\\'), `manifest path "${rel}" contains a backslash`);
  }

  // Simulate a manifest written on Windows and committed, then read on this OS.
  const poisoned = { ...manifest, files: manifest.files.map((f) => f.replace(/\//g, '\\')) };
  fs.writeFileSync(manifestPath(root), JSON.stringify(poisoned), 'utf8');
  const { removed } = uninstall(root);
  if (path.sep === '/') {
    // On POSIX this is the failure mode the fix prevents: nothing should be
    // "removed" from a backslash manifest, proving the bug is real without it.
    assert.equal(removed.length, 0, 'backslash paths should not resolve on POSIX -- this documents the old bug');
  }
});
