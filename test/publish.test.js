import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

test('the three version numbers cannot drift apart', () => {
  const pkg = read('package.json');
  const plugin = read('.claude-plugin/plugin.json');
  const marketplace = read('.claude-plugin/marketplace.json');
  assert.equal(plugin.version, pkg.version, 'plugin.json version differs from package.json');
  assert.equal(marketplace.metadata.version, pkg.version, 'marketplace metadata version differs');
  assert.equal(marketplace.plugins[0].version, pkg.version, 'marketplace plugin entry version differs');
});

test('the README test count matches the suite', () => {
  // The README states a test count as a fact; a fact that drifts is worse than
  // no fact. This test forces the sentence to move with the suite.
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const claimed = readme.match(/(\d+) tests/);
  assert.ok(claimed, 'README should state the test count');
  // Count test() calls across the suite files rather than running node --test
  // recursively from inside itself.
  let actual = 0;
  for (const file of fs.readdirSync(path.join(root, 'test'))) {
    const source = fs.readFileSync(path.join(root, 'test', file), 'utf8');
    const topLevel = (source.match(/^test\(/gm) || []).length;
    const inLoop = (source.match(/^  test\(/gm) || []).length;
    // The FULL_RECORDS generator runs its one indented test() once per kind.
    const kinds = source.includes('Object.entries(FULL_RECORDS)') ? 3 : 1;
    actual += topLevel + inLoop * kinds;
  }
  assert.equal(Number(claimed[1]), actual,
    `README claims ${claimed[1]} tests, suite defines ${actual} - update the README`);
});

test('every published directory in package.json files exists', () => {
  const pkg = read('package.json');
  for (const entry of pkg.files) {
    assert.ok(fs.existsSync(path.join(root, entry)), `package.json files lists "${entry}" which does not exist`);
  }
});

test('nothing published leaks a local path or identity', () => {
  const pkg = read('package.json');
  const forbidden = /\/tmp\/claude|scratchpad|\/home\/user\//;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|md|json)$/.test(entry.name)) {
        assert.ok(!forbidden.test(fs.readFileSync(full, 'utf8')), `${full} leaks a local path`);
      }
    }
  };
  for (const entry of pkg.files) {
    const full = path.join(root, entry);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) walk(full);
  }
});
