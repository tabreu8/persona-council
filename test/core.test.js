import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, stringifyFrontmatter } from '../src/frontmatter.js';
import { parsePersona, validatePersona, serializePersona, slugify, customFields } from '../src/persona.js';
import { defaultConfig, validateConfig, mergeConfig, mcpSourceTemplate } from '../src/config.js';

const GOOD_PERSONA = `---
id: sre-oncall
name: Marta Okafor
role: Staff SRE
version: 1
tags: [reliability, operations]
stake: "You carry the pager for this."
mandate: "Refuse anything with no rollback path."
lens:
  - "What breaks and how loudly"
  - "How we undo it at 3am"
biases:
  - "Believes outages trace to irreversible changes"
blind_spots:
  - "Undervalues speed to market"
---

## Perspective

You are Marta Okafor, and you have carried the pager for eight years.
`;

test('frontmatter parses scalars, inline arrays and block arrays', () => {
  const { data, body, hasFrontmatter } = parseFrontmatter(GOOD_PERSONA);
  assert.equal(hasFrontmatter, true);
  assert.equal(data.id, 'sre-oncall');
  assert.equal(data.version, 1);
  assert.deepEqual(data.tags, ['reliability', 'operations']);
  assert.equal(data.lens.length, 2);
  assert.equal(data.stake, 'You carry the pager for this.');
  assert.match(body, /^## Perspective/);
});

test('frontmatter round-trips without losing fields', () => {
  const { data, body } = parseFrontmatter(GOOD_PERSONA);
  const reparsed = parseFrontmatter(stringifyFrontmatter(data, body));
  assert.deepEqual(reparsed.data, data);
  assert.equal(reparsed.body, body);
});

test('a document with no frontmatter is reported, not guessed at', () => {
  const { data, body, hasFrontmatter } = parseFrontmatter('just a body');
  assert.equal(hasFrontmatter, false);
  assert.deepEqual(data, {});
  assert.equal(body, 'just a body');
});

test('a complete persona validates clean', () => {
  const result = validatePersona(parsePersona(GOOD_PERSONA));
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.deepEqual(result.warnings, []);
});

test('missing required fields are errors', () => {
  const result = validatePersona(parsePersona('---\nname: X\n---\n\nbody'));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('role')));
  assert.ok(result.errors.some((e) => e.includes('id')));
});

test('a persona without stake or mandate is valid but warned about', () => {
  const thin = `---\nid: thin\nname: A\nrole: B\n---\n\n${'x'.repeat(60)}`;
  const result = validatePersona(parsePersona(thin));
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((w) => w.includes('stake')));
  assert.ok(result.warnings.some((w) => w.includes('mandate')));
});

test('a non-slug id is rejected with the slug it should have been', () => {
  const bad = `---\nid: Not A Slug\nname: A\nrole: B\n---\n\n${'x'.repeat(60)}`;
  const result = validatePersona(parsePersona(bad));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('not-a-slug')));
});

test('serializePersona keeps schema field order', () => {
  const persona = parsePersona(GOOD_PERSONA);
  const keys = [...serializePersona(persona).matchAll(/^([a-z_]+):/gm)].map((m) => m[1]);
  assert.deepEqual(keys.slice(0, 3), ['id', 'name', 'role']);
});

test('slugify handles punctuation, spacing and case', () => {
  assert.equal(slugify('Skeptical VC (seed stage)'), 'skeptical-vc-seed-stage');
  assert.equal(slugify('  Trailing--dashes  '), 'trailing-dashes');
});

test('the default config is valid', () => {
  assert.deepEqual(validateConfig(defaultConfig()), []);
});

test('config validation catches bad sources and unwritable write targets', () => {
  const config = defaultConfig();
  config.sources.push({ id: 'x', type: 'nope' });
  config.sources.push({ id: 'local', type: 'local', path: 'a' });
  assert.ok(validateConfig(config).some((e) => e.includes('unknown type')));
  assert.ok(validateConfig(config).some((e) => e.includes('duplicate source id')));

  const readOnly = defaultConfig();
  readOnly.sources[0].writable = false;
  assert.ok(validateConfig(readOnly).some((e) => e.includes('writable: false')));

  const missingTarget = defaultConfig();
  missingTarget.writeTo = 'nowhere';
  assert.ok(validateConfig(missingTarget).some((e) => e.includes('unknown source')));
});

test('an mcp source is only valid with a resolve instruction for the agent', () => {
  const config = defaultConfig();
  config.sources.push({ id: 'notion', type: 'mcp', server: 'notion' });
  assert.ok(validateConfig(config).some((e) => e.includes('resolve instruction')));

  const withTemplate = defaultConfig();
  withTemplate.sources.push(mcpSourceTemplate('notion'));
  assert.deepEqual(validateConfig(withTemplate), []);
});

test('mergeConfig deep-merges known sections and never empties sources', () => {
  const merged = mergeConfig(defaultConfig(), { panel: { maxPersonas: 2 }, sources: [] });
  assert.equal(merged.panel.maxPersonas, 2);
  assert.equal(merged.panel.maxRounds, defaultConfig().panel.maxRounds);
  assert.equal(merged.sources.length, 1);
});

test('an unfilled scaffold is flagged rather than reported as finished', () => {
  const stub = `---
id: stub
name: TODO: full name
role: TODO: role
stake: "TODO: what they are accountable for"
mandate: "TODO: what makes them push back"
lens: [TODO]
biases: [TODO]
blind_spots: [TODO]
---

## Perspective

TODO: write the system prompt in the second person, at some length.
`;
  const result = validatePersona(parsePersona(stub));
  assert.ok(result.warnings.some((w) => w.includes('unfilled template placeholders')));
  assert.ok(result.warnings.some((w) => w.includes('body')));
});

test('customFields returns only keys outside the fixed schema', () => {
  const persona = parsePersona(`---
id: sre-oncall
name: Marta
role: Staff SRE
likes: ["reversible changes"]
authority_level: "can block a launch alone"
---

${'x'.repeat(60)}`);
  assert.deepEqual(customFields(persona), {
    likes: ['reversible changes'],
    authority_level: 'can block a launch alone',
  });
});

test('customFields excludes reserved bookkeeping keys attached by the loaders', () => {
  const loaded = { id: 'x', name: 'A', role: 'B', body: 'text', hasFrontmatter: true,
    file: '/some/path.md', source: 'local', likes: ['pizza'] };
  assert.deepEqual(customFields(loaded), { likes: ['pizza'] });
});

test('a persona with custom fields validates clean and the fields round-trip through serialize', () => {
  const raw = `---
id: sre-oncall
name: Marta Okafor
role: Staff SRE
stake: "You carry the pager."
mandate: "Refuse anything with no rollback."
lens: ["What breaks"]
biases: ["Distrusts unreviewed changes"]
blind_spots: ["Undervalues speed"]
likes: ["small diffs"]
authority_level: "can block a launch alone"
---

${'x'.repeat(60)}`;
  const persona = parsePersona(raw);
  const result = validatePersona(persona);
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(customFields(persona), { likes: ['small diffs'], authority_level: 'can block a launch alone' });

  const reparsed = parsePersona(serializePersona(persona));
  assert.deepEqual(customFields(reparsed), customFields(persona));
});

test('doctor-facing warning flags a custom field that looks like a typo of a standard one', () => {
  const persona = parsePersona(`---
id: x
name: A
role: B
stake: "s"
mandate: "m"
lens: ["l"]
biases: ["b"]
blind_spots: ["bs"]
biasses: ["typo of biases"]
---

${'x'.repeat(60)}`);
  const result = validatePersona(persona);
  assert.ok(result.warnings.some((w) => w.includes('"biasses"') && w.includes('"biases"')));
});

test('legitimate custom fields never get flagged as typos', () => {
  const persona = parsePersona(`---
id: x
name: A
role: B
stake: "s"
mandate: "m"
lens: ["l"]
biases: ["b"]
blind_spots: ["bs"]
likes: ["a"]
dislikes: ["b"]
authority_level: "can block a launch alone"
social_media: "reads industry twitter"
escalation_habit: "pages the lead directly"
---

${'x'.repeat(60)}`);
  const result = validatePersona(persona);
  assert.deepEqual(result.warnings, []);
});

test('short custom field keys are exempt from typo detection', () => {
  const persona = parsePersona(`---
id: x
name: A
role: B
stake: "s"
mandate: "m"
lens: ["l"]
biases: ["b"]
blind_spots: ["bs"]
im: "informal nickname"
---

${'x'.repeat(60)}`);
  assert.deepEqual(customFields(persona), { im: 'informal nickname' });
  assert.deepEqual(validatePersona(persona).warnings, []);
});
