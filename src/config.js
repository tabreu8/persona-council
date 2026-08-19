import fs from 'node:fs';
import path from 'node:path';

export const CONFIG_FILENAME = 'persona-council.config.json';
export const CONFIG_VERSION = 2;

/**
 * Runs land in one of two stores, and the distinction is not cosmetic.
 *
 * `scratch` is for thinking out loud: cheap, auto-pruned, and deliberately
 * excluded from persona track records. A brainstorm is never "decided", so it
 * never earns an outcome -- journaling it would leave an open decision that can
 * never close, and calibration computed over idle riffs is noise.
 *
 * `decision` is of-record: kept forever, eligible for a retro, and the only
 * thing that feeds calibration. Scratch is the default because promoting a run
 * is cheap and un-polluting a journal is not.
 */
export const MEMORY_MODES = ['scratch', 'decision'];

export function defaultConfig() {
  return {
    version: CONFIG_VERSION,
    // Order matters: the first source holding a persona id wins.
    sources: [
      {
        id: 'local',
        type: 'local',
        path: '.claude/personas',
        writable: true,
        description: 'Persona markdown files committed alongside the project.',
      },
    ],
    // Where `persona-create` writes by default. Must name a writable source.
    writeTo: 'local',
    cacheDir: '.claude/.persona-cache',
    memory: {
      defaultMode: 'scratch',
      scratchPath: '.claude/memory/scratch',
      decisionsPath: '.claude/memory/decisions',
      scratchRetain: 20,
      scratchMaxAgeDays: 14,
      writeTranscript: true,
    },
    panel: {
      defaultMode: 'fanout',
      defaultPersonaCount: 3,
      maxPersonas: 7,
      maxRounds: 3,
      requireDissenter: true,
      anonymizeRoundTable: true,
      citeCalibration: true,
    },
    // Named rosters turn a habit into a rule: "run it past launch-review".
    rosters: {},
    output: {
      memo: true,
      artifact: 'ask', // never | ask | always
    },
    defaults: {
      model: 'inherit',
    },
  };
}

export const SOURCE_TYPES = ['local', 'git', 'mcp'];
export const ARTIFACT_MODES = ['never', 'ask', 'always'];

/**
 * `mcp` sources are resolved by the agent at runtime, not by this CLI -- the
 * CLI has no MCP client. The `resolve` string is the instruction the skills
 * hand to the agent, so it must describe exactly how to find and read personas.
 */
export function mcpSourceTemplate(id, { server = id, hint = '' } = {}) {
  return {
    id,
    type: 'mcp',
    server,
    writable: false,
    hint,
    resolve:
      `Use the ${server} MCP tools to locate the persona. Search for a page or ` +
      `database entry whose title matches the persona id or name. Read the full ` +
      `page content, then normalize it into the persona schema (id, name, role, ` +
      `stake, mandate, lens, biases, blind_spots, directives, body). If several ` +
      `pages match, list them and ask the user which to use -- never guess.`,
    description: `Personas stored in ${server}, fetched on demand by the agent.`,
  };
}

export function configPath(root) {
  return path.join(root, '.claude', CONFIG_FILENAME);
}

export function loadConfig(root) {
  const file = configPath(root);
  if (!fs.existsSync(file)) return { config: defaultConfig(), path: file, exists: false };
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
  return { config: mergeConfig(defaultConfig(), migrateConfig(parsed)), path: file, exists: true };
}

/** v1 kept every run in one flat directory with no scratch/decision split. */
export function migrateConfig(config) {
  if (!config || config.version >= CONFIG_VERSION) return config;
  const next = { ...config, version: CONFIG_VERSION };
  const legacy = config.memory || {};
  next.memory = {
    defaultMode: 'scratch',
    scratchPath: legacy.path ? path.join(legacy.path, 'scratch') : '.claude/memory/scratch',
    decisionsPath: legacy.path ? path.join(legacy.path, 'decisions') : '.claude/memory/decisions',
    scratchRetain: legacy.retain ?? 20,
    scratchMaxAgeDays: 14,
    writeTranscript: legacy.writeTranscript ?? true,
  };
  next.rosters = config.rosters || {};
  next.output = config.output || { memo: true, artifact: 'ask' };
  return next;
}

export function mergeConfig(base, override) {
  const merged = { ...base, ...override };
  merged.memory = { ...base.memory, ...(override.memory || {}) };
  merged.panel = { ...base.panel, ...(override.panel || {}) };
  merged.defaults = { ...base.defaults, ...(override.defaults || {}) };
  merged.output = { ...base.output, ...(override.output || {}) };
  merged.rosters = { ...base.rosters, ...(override.rosters || {}) };
  if (!Array.isArray(merged.sources) || merged.sources.length === 0) {
    merged.sources = base.sources;
  }
  return merged;
}

export function saveConfig(root, config) {
  const file = configPath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return file;
}

export function validateConfig(config) {
  const errors = [];
  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    errors.push('config.sources must be a non-empty array');
    return errors;
  }
  const seen = new Set();
  for (const source of config.sources) {
    if (!source.id) errors.push('every source needs an id');
    if (seen.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
    seen.add(source.id);
    if (!SOURCE_TYPES.includes(source.type)) {
      errors.push(`source "${source.id}" has unknown type "${source.type}" (expected ${SOURCE_TYPES.join(', ')})`);
    }
    if (source.type === 'local' && !source.path) errors.push(`local source "${source.id}" needs a path`);
    if (source.type === 'git' && !source.url) errors.push(`git source "${source.id}" needs a url`);
    if (source.type === 'mcp' && !source.resolve) {
      errors.push(`mcp source "${source.id}" needs a resolve instruction for the agent`);
    }
  }
  if (config.writeTo && !seen.has(config.writeTo)) {
    errors.push(`writeTo points at unknown source "${config.writeTo}"`);
  }
  const writeTarget = config.sources.find((s) => s.id === config.writeTo);
  if (writeTarget && !writeTarget.writable) {
    errors.push(`writeTo source "${config.writeTo}" is marked writable: false`);
  }
  if (!MEMORY_MODES.includes(config.memory?.defaultMode)) {
    errors.push(`memory.defaultMode must be one of ${MEMORY_MODES.join(', ')}`);
  }
  if (config.memory?.scratchPath === config.memory?.decisionsPath) {
    errors.push('memory.scratchPath and memory.decisionsPath must differ, or brainstorms pollute the journal');
  }
  if (!ARTIFACT_MODES.includes(config.output?.artifact)) {
    errors.push(`output.artifact must be one of ${ARTIFACT_MODES.join(', ')}`);
  }
  for (const [name, roster] of Object.entries(config.rosters || {})) {
    if (!Array.isArray(roster.personas) || roster.personas.length === 0) {
      errors.push(`roster "${name}" needs a non-empty personas array`);
    }
    if (roster.mode && !['fanout', 'chain', 'roundtable'].includes(roster.mode)) {
      errors.push(`roster "${name}" has unknown mode "${roster.mode}"`);
    }
  }
  return errors;
}
