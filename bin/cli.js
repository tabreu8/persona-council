#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { loadConfig, saveConfig, validateConfig, mcpSourceTemplate, defaultConfig } from '../src/config.js';
import { listPersonas, auditPersonas, syncGitSource, writeTarget, sourceDir } from '../src/sources.js';
import { install, uninstall, readManifest, readPackageVersion, personaDir } from '../src/install.js';
import { scaffoldPersona } from '../src/template.js';
import { slugify } from '../src/persona.js';

const COLORS = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (COLORS ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = {
  bold: paint(1),
  dim: paint(2),
  red: paint(31),
  green: paint(32),
  yellow: paint(33),
  cyan: paint(36),
};

const HELP = `${c.bold('persona-council')} ${c.dim(`v${readPackageVersion()}`)}
Persona thinking, isolated persona querying, and multi-persona debate for coding agents.

${c.bold('Usage')}
  npx persona-council <command> [options]

${c.bold('Commands')}
  init                 Install the skills, commands and agents into a project
  list                 List every persona the configured sources expose
  new <id>             Scaffold a persona file for you to fill in
  doctor               Validate config and personas, report what is weak
  sources list         Show configured persona sources
  sources add          Add a source (--type local|git|mcp)
  sources sync         Refresh cached git sources
  uninstall            Remove installed files (personas and memory are kept)

${c.bold('Options')}
  --dir <path>         Project directory (default: cwd)
  --global             Install into ~/.claude instead of the project
  --target <name>      claude (default) or generic, for non-Claude agents
  --force              Overwrite files that differ from the shipped versions
  --json               Machine-readable output where supported
  -h, --help           Show this help
  -v, --version        Show version

${c.bold('Examples')}
  npx persona-council init
  npx persona-council new vc-skeptic --name "Dana Reyes" --role "Seed-stage VC"
  npx persona-council sources add --type mcp --id notion --server notion
  npx persona-council doctor
`;

function resolveRoot(values) {
  if (values.global) return os.homedir();
  return path.resolve(values.dir || process.cwd());
}

function statusIcon(status) {
  if (status === 'created') return c.green('+');
  if (status === 'updated') return c.cyan('~');
  if (status === 'skipped') return c.yellow('!');
  return c.dim('=');
}

function cmdInit(values) {
  const root = resolveRoot(values);
  const target = values.target || 'claude';
  if (!['claude', 'generic'].includes(target)) {
    console.error(c.red(`unknown --target "${target}" (expected claude or generic)`));
    process.exitCode = 1;
    return;
  }

  const { results, config } = install(root, { force: values.force, target });
  const created = results.filter((r) => r.status === 'created').length;
  const updated = results.filter((r) => r.status === 'updated').length;
  const skipped = results.filter((r) => r.status === 'skipped');

  console.log(`${c.bold('persona-council')} installed into ${c.cyan(root)} ${c.dim(`(target: ${target})`)}\n`);
  for (const result of results) {
    if (result.status === 'unchanged') continue;
    console.log(`  ${statusIcon(result.status)} ${result.path}`);
  }
  console.log(`\n  ${created} created, ${updated} updated, ${skipped.length} left alone`);

  if (skipped.length > 0) {
    console.log(c.yellow(`\n  ${skipped.length} file(s) already exist with different content and were not touched.`));
    console.log(c.dim('  Re-run with --force to overwrite them.'));
  }

  const dir = path.relative(root, personaDir(root, config)) || '.';
  console.log(`\n${c.bold('Next')}`);
  console.log('  1. No personas ship with this package by design. Create your first:');
  console.log(`     ${c.cyan('npx persona-council new vc-skeptic')}  ${c.dim('or ask your agent: "create a skeptical VC persona"')}`);
  console.log(`  2. Personas live in ${c.cyan(dir)}. Point elsewhere with ${c.cyan('persona-council sources add')}.`);
  console.log(`  3. In your agent, try ${c.cyan('/persona-ask')}, ${c.cyan('/persona-think')} or ${c.cyan('/persona-panel')}.`);
}

function cmdList(values) {
  const root = resolveRoot(values);
  const { config } = loadConfig(root);
  const { personas, deferredSources } = listPersonas(root, config);

  if (values.json) {
    console.log(JSON.stringify({
      personas: personas.map(({ body, ...rest }) => rest),
      deferredSources: deferredSources.map((s) => s.id),
    }, null, 2));
    return;
  }

  if (personas.length === 0) {
    console.log(c.yellow('No personas found.'));
    const searched = config.sources.filter((s) => s.type !== 'mcp').map((s) => s.path || s.url).join(', ');
    console.log(c.dim(`  Searched: ${searched || 'nothing'}`));
    console.log(`  Create one with ${c.cyan('npx persona-council new <id>')}.`);
  } else {
    const width = Math.max(...personas.map((p) => p.id.length));
    for (const persona of personas) {
      const role = persona.role ? c.dim(` - ${persona.role}`) : '';
      console.log(`  ${c.bold(persona.id.padEnd(width))}  ${persona.name || ''}${role} ${c.dim(`[${persona.source}]`)}`);
    }
    console.log(c.dim(`\n  ${personas.length} persona(s)`));
  }

  for (const source of deferredSources) {
    console.log(c.dim(`\n  Source "${source.id}" (${source.type}) is resolved by your agent at runtime, not by this CLI.`));
  }
}

function cmdNew(positionals, values) {
  const root = resolveRoot(values);
  const { config } = loadConfig(root);
  const id = slugify(positionals[1] || values.name || '');
  if (!id) {
    console.error(c.red('usage: persona-council new <id> [--name "Full Name"] [--role "Role"]'));
    process.exitCode = 1;
    return;
  }

  const { dir, source } = writeTarget(root, config);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.md`);
  if (fs.existsSync(file) && !values.force) {
    console.error(c.red(`${path.relative(root, file)} already exists (use --force to overwrite)`));
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(file, scaffoldPersona({ id, name: values.name, role: values.role }), 'utf8');
  console.log(`${c.green('+')} ${path.relative(root, file)} ${c.dim(`[${source.id}]`)}`);
  console.log(c.dim('\n  The file is a stub with TODO markers. Fill in stake and mandate first -'));
  console.log(c.dim('  a persona without them will agree with whatever it is shown.'));
  console.log(`  Or let your agent write it: ${c.cyan(`/persona-create ${id}`)}`);
}

function cmdDoctor(values) {
  const root = resolveRoot(values);
  const { config, exists } = loadConfig(root);
  let problems = 0;

  console.log(c.bold('config'));
  if (!exists) {
    console.log(`  ${c.yellow('!')} no config found; using defaults. Run ${c.cyan('persona-council init')}.`);
  } else {
    console.log(`  ${c.green('ok')} .claude/persona-council.config.json`);
  }
  for (const error of validateConfig(config)) {
    console.log(`  ${c.red('x')} ${error}`);
    problems += 1;
  }

  console.log(`\n${c.bold('install')}`);
  const manifest = readManifest(root);
  if (!manifest) {
    console.log(`  ${c.yellow('!')} nothing installed here yet`);
  } else {
    const missing = manifest.files.filter((rel) => !fs.existsSync(path.join(root, rel)));
    console.log(`  ${c.green('ok')} ${manifest.files.length} file(s), version ${manifest.version}, target ${manifest.target}`);
    if (missing.length) {
      console.log(`  ${c.red('x')} ${missing.length} installed file(s) are missing - re-run init`);
      problems += 1;
    }
    if (manifest.version !== readPackageVersion()) {
      console.log(`  ${c.yellow('!')} installed ${manifest.version}, CLI is ${readPackageVersion()} - re-run init --force`);
    }
  }

  console.log(`\n${c.bold('sources')}`);
  for (const source of config.sources) {
    const dir = sourceDir(root, source, config);
    if (source.type === 'mcp') {
      console.log(`  ${c.dim('-')} ${source.id} (mcp/${source.server}) resolved by the agent`);
    } else if (dir && fs.existsSync(dir)) {
      console.log(`  ${c.green('ok')} ${source.id} (${source.type}) ${c.dim(path.relative(root, dir) || '.')}`);
    } else {
      console.log(`  ${c.yellow('!')} ${source.id} (${source.type}) not present${source.type === 'git' ? ' - run sources sync' : ''}`);
    }
  }

  console.log(`\n${c.bold('personas')}`);
  const { report } = auditPersonas(root, config);
  if (report.length === 0) {
    console.log(`  ${c.yellow('!')} none yet - ${c.cyan('persona-council new <id>')}`);
  }
  for (const entry of report) {
    if (!entry.ok) {
      console.log(`  ${c.red('x')} ${entry.id}`);
      for (const error of entry.errors) console.log(`      ${c.red(error)}`);
      problems += 1;
    } else if (entry.warnings.length) {
      console.log(`  ${c.yellow('!')} ${entry.id}`);
      for (const warning of entry.warnings) console.log(`      ${c.yellow(warning)}`);
    } else {
      console.log(`  ${c.green('ok')} ${entry.id}`);
    }
  }

  console.log(problems === 0 ? `\n${c.green('No blocking problems.')}` : `\n${c.red(`${problems} problem(s) need attention.`)}`);
  if (problems > 0) process.exitCode = 1;
}

function cmdSources(positionals, values) {
  const root = resolveRoot(values);
  const sub = positionals[1] || 'list';
  const { config, exists } = loadConfig(root);

  if (sub === 'list') {
    if (values.json) {
      console.log(JSON.stringify(config.sources, null, 2));
      return;
    }
    for (const source of config.sources) {
      const where = source.path || source.url || source.server || '';
      const flags = [source.writable ? 'writable' : 'read-only', source.id === config.writeTo ? 'default write target' : null]
        .filter(Boolean)
        .join(', ');
      console.log(`  ${c.bold(source.id)} ${c.dim(`(${source.type})`)} ${where} ${c.dim(`[${flags}]`)}`);
      if (source.description) console.log(`      ${c.dim(source.description)}`);
    }
    return;
  }

  if (sub === 'add') {
    const type = values.type;
    const id = values.id || (type === 'git' ? slugify(path.basename(String(values.url || ''), '.git')) : values.server);
    if (!type || !id) {
      console.error(c.red('usage: persona-council sources add --type local|git|mcp --id <id> [--path|--url|--server]'));
      process.exitCode = 1;
      return;
    }
    if (config.sources.some((s) => s.id === id)) {
      console.error(c.red(`source "${id}" already exists`));
      process.exitCode = 1;
      return;
    }

    let source;
    if (type === 'local') source = { id, type, path: values.path || `.claude/personas-${id}`, writable: true };
    else if (type === 'git') source = { id, type, url: values.url, ref: values.ref, subpath: values.subpath, writable: false };
    else if (type === 'mcp') source = mcpSourceTemplate(id, { server: values.server || id, hint: values.hint || '' });
    else {
      console.error(c.red(`unknown --type "${type}"`));
      process.exitCode = 1;
      return;
    }

    const next = exists ? config : defaultConfig();
    next.sources.push(source);
    if (values.default) next.writeTo = id;
    const errors = validateConfig(next);
    if (errors.length) {
      console.error(c.red('refusing to write an invalid config:'));
      for (const error of errors) console.error(`  ${error}`);
      process.exitCode = 1;
      return;
    }
    saveConfig(root, next);
    console.log(`${c.green('+')} source "${id}" (${type}) added`);
    if (type === 'mcp') {
      console.log(c.dim('\n  MCP sources are read by your agent, not this CLI. Check that the'));
      console.log(c.dim(`  ${source.server} MCP server is connected, then edit the "resolve"`));
      console.log(c.dim('  instruction in the config so it names your actual page or database.'));
    }
    if (type === 'git') console.log(c.dim('  Run `persona-council sources sync` to fetch it.'));
    return;
  }

  if (sub === 'sync') {
    const gitSources = config.sources.filter((s) => s.type === 'git');
    if (gitSources.length === 0) {
      console.log(c.dim('  no git sources configured'));
      return;
    }
    for (const source of gitSources) {
      try {
        const result = syncGitSource(root, source, config);
        console.log(`  ${c.green('ok')} ${source.id} ${result.action} -> ${path.relative(root, result.path)}`);
      } catch (error) {
        console.log(`  ${c.red('x')} ${source.id}: ${error.message.split('\n')[0]}`);
        process.exitCode = 1;
      }
    }
    return;
  }

  console.error(c.red(`unknown sources subcommand "${sub}"`));
  process.exitCode = 1;
}

function cmdUninstall(values) {
  const root = resolveRoot(values);
  const { removed, manifest } = uninstall(root);
  if (!manifest) {
    console.log(c.yellow('nothing to uninstall here (no install manifest found)'));
    return;
  }
  for (const rel of removed) console.log(`  ${c.red('-')} ${rel}`);
  console.log(`\n  ${removed.length} file(s) removed.`);
  console.log(c.dim('  Your personas, config and panel memory were left in place.'));
}

function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        dir: { type: 'string' },
        global: { type: 'boolean' },
        target: { type: 'string' },
        force: { type: 'boolean' },
        json: { type: 'boolean' },
        name: { type: 'string' },
        role: { type: 'string' },
        type: { type: 'string' },
        id: { type: 'string' },
        path: { type: 'string' },
        url: { type: 'string' },
        ref: { type: 'string' },
        subpath: { type: 'string' },
        server: { type: 'string' },
        hint: { type: 'string' },
        default: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (error) {
    console.error(c.red(error.message));
    process.exitCode = 1;
    return;
  }

  const { values, positionals } = parsed;
  if (values.version) return void console.log(readPackageVersion());
  const command = positionals[0];
  if (values.help || !command || command === 'help') return void console.log(HELP);

  try {
    switch (command) {
      case 'init': return cmdInit(values);
      case 'list': return cmdList(values);
      case 'new': return cmdNew(positionals, values);
      case 'doctor': return cmdDoctor(values);
      case 'sources': return cmdSources(positionals, values);
      case 'uninstall': return cmdUninstall(values);
      default:
        console.error(c.red(`unknown command "${command}"`));
        console.error(c.dim('run `persona-council --help`'));
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(c.red(error.message));
    process.exitCode = 1;
  }
}

main(process.argv.slice(2));
