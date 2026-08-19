import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDir = path.join(root, 'reference');
const skillsDir = path.join(root, 'skills');
const syncScript = path.join(root, 'scripts', 'sync-skill-references.mjs');

/**
 * Third install path: the Agent Skills open standard (`npx skills add
 * owner/repo`, vercel-labs/skills) clones this repo and copies each
 * skills/<name>/ directory in isolation -- nothing outside it, no shared
 * reference/ directory. Confirmed by actually running the installer against
 * this repo: it landed six SKILL.md files and nothing else, leaving every
 * cited reference doc missing. skills/<name>/references/*.md is what that
 * path reads instead. These are derived files -- reference/*.md is still the
 * only place a human edits -- so what matters here is that they are never
 * allowed to drift from their source, exactly like the README test-count
 * check catches drift elsewhere in this repo.
 */
test('sync-skill-references reports no drift (run `node scripts/sync-skill-references.mjs` if this fails)', () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, [syncScript, '--check'], { stdio: 'pipe' });
  }, (error) => {
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    throw new Error(`skill references are stale:\n${output}`);
  });
});

test('every skill/references file is byte-identical to its reference/ source', () => {
  const referenceFiles = fs.readdirSync(referenceDir).filter((f) => f.endsWith('.md'));
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());

  let checked = 0;
  for (const skill of skills) {
    const refsDir = path.join(skillsDir, skill.name, 'references');
    if (!fs.existsSync(refsDir)) continue;
    for (const file of fs.readdirSync(refsDir)) {
      assert.ok(referenceFiles.includes(file), `${skill.name}/references/${file} has no matching reference/${file}`);
      const derived = fs.readFileSync(path.join(refsDir, file), 'utf8');
      const canonical = fs.readFileSync(path.join(referenceDir, file), 'utf8');
      assert.equal(derived, canonical, `${skill.name}/references/${file} has drifted from reference/${file}`);
      checked += 1;
    }
  }
  assert.ok(checked > 15, 'expected a substantial number of derived reference files to exist and be checked');
});

test('every reference file a skill cites in its prose is present in its own references/ folder', () => {
  const referenceFiles = fs.readdirSync(referenceDir).filter((f) => f.endsWith('.md'));
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());

  for (const skill of skills) {
    const skillMdPath = path.join(skillsDir, skill.name, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;
    const text = fs.readFileSync(skillMdPath, 'utf8');
    const cited = referenceFiles.filter((name) => text.includes(name));
    if (cited.length === 0) continue;

    const refsDir = path.join(skillsDir, skill.name, 'references');
    const present = fs.existsSync(refsDir) ? fs.readdirSync(refsDir) : [];
    for (const name of cited) {
      assert.ok(present.includes(name), `${skill.name} cites ${name} but skills/${skill.name}/references/${name} is missing`);
    }
  }
});

test('every skill has the three-way fallback note naming all three install paths', () => {
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  for (const skill of skills) {
    const skillMdPath = path.join(skillsDir, skill.name, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;
    const text = fs.readFileSync(skillMdPath, 'utf8');
    const citesAnyReference = fs.readdirSync(referenceDir)
      .filter((f) => f.endsWith('.md'))
      .some((name) => text.includes(name));
    if (!citesAnyReference) continue;

    assert.match(text, /persona-council\/<file>/, `${skill.name} should name the npm install path`);
    assert.match(text, /CLAUDE_PLUGIN_ROOT/, `${skill.name} should name the plugin install path`);
    assert.match(text, /references\/<file>/, `${skill.name} should name the skill-local path (npx skills add)`);
  }
});
