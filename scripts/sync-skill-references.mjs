#!/usr/bin/env node
/**
 * Derives skills/<name>/references/*.md from the canonical reference/*.md.
 *
 * The npm and plugin installers copy the whole reference/ directory to one
 * shared location (.claude/persona-council/ or ${CLAUDE_PLUGIN_ROOT}/reference/)
 * and every skill cites it from there. A third install path -- the Agent
 * Skills open standard used by `npx skills add owner/repo` (vercel-labs/skills)
 * -- clones the repo and copies only each skills/<name>/ directory in
 * isolation. Nothing outside it. So under that path, a shared top-level
 * reference/ directory is invisible; the standard's answer is a references/
 * subfolder inside the skill's own directory, which the installer does copy.
 *
 * Hand-duplicating file content into six places would drift the moment one
 * copy got edited and the others didn't. This script is the alternative:
 * reference/ stays the single canonical source, and this derives each
 * skill's copy from it mechanically. Re-run after editing reference/*.md or
 * changing what a skill cites; the accompanying test fails on drift so a
 * missed re-run is caught rather than silently shipped stale.
 *
 * Usage: node scripts/sync-skill-references.mjs [--check]
 *   --check   exit 1 if anything is out of date, without writing (for CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDir = path.join(root, 'reference');
const skillsDir = path.join(root, 'skills');
const check = process.argv.includes('--check');

function referenceFiles() {
  return fs.readdirSync(referenceDir).filter((f) => f.endsWith('.md'));
}

/** A reference file is "cited" if its bare filename appears anywhere in the skill's prose. */
function citedReferences(skillMdPath, candidates) {
  const text = fs.readFileSync(skillMdPath, 'utf8');
  return candidates.filter((name) => text.includes(name));
}

function main() {
  const candidates = referenceFiles();
  const skills = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(skillsDir, name, 'SKILL.md')));

  let stale = [];

  for (const skill of skills) {
    const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');
    const cited = citedReferences(skillMdPath, candidates);
    const targetDir = path.join(skillsDir, skill, 'references');
    const existing = fs.existsSync(targetDir)
      ? fs.readdirSync(targetDir).filter((f) => f.endsWith('.md'))
      : [];

    for (const name of cited) {
      const src = path.join(referenceDir, name);
      const dest = path.join(targetDir, name);
      const wanted = fs.readFileSync(src, 'utf8');
      const have = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
      if (have !== wanted) {
        stale.push(`${skill}/references/${name} (out of date or missing)`);
        if (!check) {
          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(dest, wanted, 'utf8');
        }
      }
    }

    // Remove anything present that is no longer cited -- an orphan is stale
    // by definition, and shipping one teaches an agent to trust a doc that
    // isn't actually kept current for this skill.
    for (const name of existing) {
      if (!cited.includes(name)) {
        stale.push(`${skill}/references/${name} (orphaned, no longer cited)`);
        if (!check) fs.rmSync(path.join(targetDir, name));
      }
    }
  }

  if (stale.length === 0) {
    console.log(check ? 'skill references are in sync' : 'skill references already up to date');
    return;
  }

  if (check) {
    console.error('skill references are out of date:');
    for (const item of stale) console.error(`  ${item}`);
    console.error('\nRun: node scripts/sync-skill-references.mjs');
    process.exitCode = 1;
  } else {
    console.log(`synced ${stale.length} file(s):`);
    for (const item of stale) console.log(`  ${item}`);
  }
}

main();
