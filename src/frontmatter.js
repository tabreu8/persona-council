/**
 * Minimal YAML-frontmatter reader/writer.
 *
 * Deliberately not a full YAML implementation: persona files only need scalars,
 * inline arrays (`[a, b]`) and block arrays (`- a`). Anything more exotic is
 * rejected loudly by the validator rather than silently half-parsed.
 */

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).replace(/\\"/g, '"');
    }
  }
  return trimmed;
}

function coerce(value) {
  const raw = value.trim();
  if (raw === '') return '';
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null' || raw === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((item) => coerce(item));
  }
  return stripQuotes(raw);
}

export function parseFrontmatter(text) {
  const source = String(text ?? '').replace(/^﻿/, '');
  const match = source.match(FENCE);
  if (!match) return { data: {}, body: source.trim(), hasFrontmatter: false };

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let currentKey = null;

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const blockItem = line.match(/^\s+-\s+(.*)$/);
    if (blockItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(coerce(blockItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!pair) continue;

    const [, key, rest] = pair;
    currentKey = key;
    data[key] = rest.trim() === '' ? [] : coerce(rest);
  }

  return { data, body: source.slice(match[0].length).trim(), hasFrontmatter: true };
}

function formatScalar(value) {
  if (typeof value !== 'string') return String(value);
  const needsQuotes = /^[\s]|[\s]$|[:#\[\]{}]|^-|^$/.test(value);
  return needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
}

export function stringifyFrontmatter(data, body) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
        continue;
      }
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${formatScalar(item)}`);
      continue;
    }
    lines.push(`${key}: ${formatScalar(value)}`);
  }
  lines.push('---', '');
  return `${lines.join('\n')}\n${String(body ?? '').trim()}\n`;
}
