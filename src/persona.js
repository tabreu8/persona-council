import { parseFrontmatter, stringifyFrontmatter } from './frontmatter.js';

/** Fields every persona must carry before it is allowed on a panel. */
export const REQUIRED_FIELDS = ['id', 'name', 'role'];

/**
 * Fields that are technically optional but whose absence produces bland,
 * agreeable personas -- the failure mode that makes a council worthless.
 */
export const RECOMMENDED_FIELDS = ['stake', 'mandate', 'lens', 'biases', 'blind_spots'];

export const FIELD_ORDER = [
  'id',
  'name',
  'role',
  'version',
  'model',
  'tags',
  'stake',
  'mandate',
  'lens',
  'biases',
  'blind_spots',
  'directives',
  'refuses',
  'voice',
  'source',
];

/**
 * Bookkeeping keys the loaders attach that are never persona content.
 * `source` is deliberately not here -- it is already a documented schema
 * field in FIELD_ORDER, so it is excluded from custom fields that way.
 */
const RESERVED_KEYS = new Set(['body', 'hasFrontmatter', 'file']);

/**
 * Anything in frontmatter outside the fixed schema. The fixed fields cover
 * what almost every persona needs; they can never cover what makes *this*
 * one distinct -- likes, dislikes, how they use social media, their
 * authority level in the org. Those round-trip through parse/serialize like
 * any other field already; this just names and surfaces them so the rest of
 * the tool (doctor, list, the schema docs) can treat them as first-class
 * instead of accidental.
 */
export function customFields(persona) {
  if (!persona || typeof persona !== 'object') return {};
  const known = new Set(FIELD_ORDER);
  const out = {};
  for (const [key, value] of Object.entries(persona)) {
    if (known.has(key) || RESERVED_KEYS.has(key)) continue;
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
}

function levenshtein(a, b) {
  const rows = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = a[i - 1] === b[j - 1]
        ? rows[i - 1][j - 1]
        : 1 + Math.min(rows[i - 1][j], rows[i][j - 1], rows[i - 1][j - 1]);
    }
  }
  return rows[a.length][b.length];
}

/**
 * A custom field close enough to a standard one to plausibly be a typo
 * ("biasses" for "biases") rather than a deliberate custom trait ("likes").
 * Short keys are exempted -- edit distance is a poor signal below 3 chars.
 */
function possibleTypo(key) {
  if (key.length < 3) return null;
  let best = null;
  for (const field of FIELD_ORDER) {
    const dist = levenshtein(key, field);
    if (dist > 0 && dist <= 2 && (!best || dist < best.dist)) best = { field, dist };
  }
  return best?.field ?? null;
}

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parsePersona(text, { id } = {}) {
  const { data, body, hasFrontmatter } = parseFrontmatter(text);
  return {
    ...data,
    id: data.id || id || '',
    body,
    hasFrontmatter,
  };
}

/** A scaffolded persona is full of TODO markers; those must not pass as done. */
function hasPlaceholder(value) {
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  return typeof value === 'string' && /\bTODO\b/i.test(value);
}

/**
 * @returns {{ok: boolean, errors: string[], warnings: string[]}}
 */
export function validatePersona(persona) {
  const errors = [];
  const warnings = [];

  if (!persona || typeof persona !== 'object') {
    return { ok: false, errors: ['persona is not an object'], warnings };
  }

  if (!persona.hasFrontmatter) {
    errors.push('missing YAML frontmatter block');
  }

  for (const field of REQUIRED_FIELDS) {
    const value = persona[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (persona.id && slugify(persona.id) !== persona.id) {
    errors.push(`id must be a slug (got "${persona.id}", expected "${slugify(persona.id)}")`);
  }

  if (!persona.body || persona.body.trim().length < 40) {
    errors.push('body (the persona system prompt) is missing or too short to be useful');
  }

  const placeholders = FIELD_ORDER.filter((field) => hasPlaceholder(persona[field]));
  if (hasPlaceholder(persona.body)) placeholders.push('body');
  if (placeholders.length > 0) {
    warnings.push(`unfilled template placeholders in: ${placeholders.join(', ')}`);
  }

  for (const field of RECOMMENDED_FIELDS) {
    const value = persona[field];
    const empty = value === undefined || value === null || String(value).trim() === '' ||
      (Array.isArray(value) && value.length === 0);
    if (empty) warnings.push(`no ${field}: persona will tend toward generic agreement`);
  }

  for (const key of Object.keys(customFields(persona))) {
    const near = possibleTypo(key);
    if (near) warnings.push(`custom field "${key}" is close to the standard field "${near}" - typo, or intentional?`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function serializePersona(persona) {
  const data = {};
  for (const key of FIELD_ORDER) {
    if (persona[key] !== undefined && persona[key] !== null) data[key] = persona[key];
  }
  for (const [key, value] of Object.entries(persona)) {
    if (key === 'body' || key === 'hasFrontmatter') continue;
    if (!(key in data) && value !== undefined && value !== null) data[key] = value;
  }
  return stringifyFrontmatter(data, persona.body);
}
