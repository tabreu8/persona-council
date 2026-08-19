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
