#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { loadConfig, saveConfig, validateConfig, mcpSourceTemplate, defaultConfig } from '../src/config.js';
import {
  listDecisions, readDecision, listScratch, pruneScratch, promoteScratch,
  calibration, memoryStats,
} from '../src/memory.js';
import { renderMemoMarkdown, renderMemoHtml } from '../src/render.js';
import { listCases, loadCase, scoreResponse, compare } from '../src/eval.js';
import { listPersonas, auditPersonas, syncGitSource, writeTarget, sourceDir } from '../src/sources.js';
import { install, uninstall, readManifest, readPackageVersion, personaDir } from '../src/install.js';
import { scaffoldPersona } from '../src/template.js';
import { slugify, customFields } from '../src/persona.js';

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
  roster list|add      Named rosters, so "run it past launch-review" is one word
  decisions list       Decisions on record, and which still await a retro
  decisions show <id>  One decision, its verdicts and its outcome
  memo <id>            Re-render a decision as markdown or a rich HTML page
  calibration          Persona track records, from decisions that have outcomes
  prune                Drop stale scratch runs (decisions are never touched)
  eval list|score      Score a panel against artifacts with known planted flaws
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
  npx persona-council roster add pricing-council --personas="sales-lead,finance-lead"
  npx persona-council memo 2026-08-19-usage-pricing --html --out memo.html
  npx persona-council calibration
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
  console.log('  1. No personas ship with this package by design. Create your first —');
  console.log(`     and ground it in something real: ${c.dim('"build a churned-customer persona from support-q2.csv"')}`);
  console.log(`     ${c.cyan('/persona-create')}  ${c.dim('or')}  ${c.cyan('npx persona-council new vc-skeptic')}`);
  console.log(`  2. Personas live in ${c.cyan(dir)}. Point elsewhere with ${c.cyan('persona-council sources add')}.`);
  console.log(`  3. In your agent, ${c.cyan('/council')} routes to the right thing. Or name it:`);
  console.log(`     ${c.cyan('/persona-ask')} ${c.dim('·')} ${c.cyan('/persona-think')} ${c.dim('·')} ${c.cyan('/persona-panel')} ${c.dim('·')} ${c.cyan('/persona-retro')}`);
  console.log(`\n  ${c.dim('Runs are scratch by default and evaporate. Say when you are actually')}`);
  console.log(`  ${c.dim('deciding — that is what puts one on record and lets it earn a retro.')}`);
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
      const customCount = Object.keys(customFields(persona)).length;
      const custom = customCount ? c.dim(` +${customCount} custom`) : '';
      console.log(`  ${c.bold(persona.id.padEnd(width))}  ${persona.name || ''}${role}${custom} ${c.dim(`[${persona.source}]`)}`);
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

  console.log(`\n${c.bold('memory')}`);
  const stats = memoryStats(root, config);
  console.log(`  ${c.dim('-')} ${stats.scratch} scratch run(s), pruned automatically`);
  console.log(`  ${c.dim('-')} ${stats.decisions} decision(s) on record, ${stats.withOutcome} with an outcome`);
  if (stats.awaitingRetro.length > 0) {
    console.log(`  ${c.yellow('!')} ${stats.awaitingRetro.length} decision(s) awaiting a retro - track records stay blunt until they land`);
  }

  console.log(`\n${c.bold('personas')}`);
  const { report } = auditPersonas(root, config);
  const tracks = new Map(calibration(root, config).map((row) => [row.persona, row]));
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
    for (const flag of tracks.get(entry.id)?.flags || []) console.log(`      ${c.yellow(flag)}`);
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

function cmdRoster(positionals, values) {
  const root = resolveRoot(values);
  const sub = positionals[1] || 'list';
  const { config, exists } = loadConfig(root);
  const rosters = config.rosters || {};

  if (sub === 'list') {
    if (values.json) return void console.log(JSON.stringify(rosters, null, 2));
    const names = Object.keys(rosters);
    if (names.length === 0) {
      console.log(c.dim('  no rosters yet'));
      console.log(`  ${c.cyan('persona-council roster add launch-review --personas="a,b,c"')}`);
      return;
    }
    for (const name of names) {
      const roster = rosters[name];
      console.log(`  ${c.bold(name)} ${c.dim(`(${roster.mode || 'fanout'}${roster.framing ? `/${roster.framing}` : ''})`)}`);
      console.log(`      ${roster.personas.join(', ')}`);
      if (roster.description) console.log(`      ${c.dim(roster.description)}`);
    }
    return;
  }

  if (sub === 'add') {
    const name = positionals[2];
    const personas = String(values.personas || '').split(',').map((p) => p.trim()).filter(Boolean);
    if (!name || personas.length === 0) {
      console.error(c.red('usage: persona-council roster add <name> --personas="a,b,c" [--mode fanout] [--framing gate]'));
      process.exitCode = 1;
      return;
    }
    const next = exists ? config : defaultConfig();
    next.rosters = { ...next.rosters, [name]: {
      personas,
      mode: values.mode || undefined,
      framing: values.framing || undefined,
      description: values.description || undefined,
    } };
    const errors = validateConfig(next);
    if (errors.length) {
      console.error(c.red('refusing to write an invalid config:'));
      for (const error of errors) console.error(`  ${error}`);
      process.exitCode = 1;
      return;
    }
    saveConfig(root, next);
    console.log(`${c.green('+')} roster "${name}": ${personas.join(', ')}`);

    const { personas: known } = listPersonas(root, next);
    const missing = personas.filter((id) => !known.some((p) => p.id === id));
    if (missing.length) {
      console.log(c.yellow(`\n  ${missing.length} seat(s) do not exist yet: ${missing.join(', ')}`));
      console.log(c.dim('  The roster is saved; create them before running it.'));
    }
    return;
  }

  if (sub === 'remove') {
    const name = positionals[2];
    if (!name || !rosters[name]) {
      console.error(c.red(`unknown roster "${name || ''}"`));
      process.exitCode = 1;
      return;
    }
    const next = { ...config, rosters: { ...rosters } };
    delete next.rosters[name];
    saveConfig(root, next);
    console.log(`${c.red('-')} roster "${name}" removed`);
    return;
  }

  console.error(c.red(`unknown roster subcommand "${sub}"`));
  process.exitCode = 1;
}

function cmdDecisions(positionals, values) {
  const root = resolveRoot(values);
  const sub = positionals[1] || 'list';
  const { config } = loadConfig(root);

  if (sub === 'list') {
    const decisions = listDecisions(root, config);
    if (values.json) return void console.log(JSON.stringify(decisions, null, 2));
    if (decisions.length === 0) {
      console.log(c.dim('  nothing on record yet'));
      console.log(c.dim('  Panels default to scratch; ask to record one as a decision when it matters.'));
      return;
    }
    for (const decision of decisions) {
      const mark = decision.outcome ? c.green('closed') : c.yellow('open  ');
      console.log(`  ${mark} ${c.bold(decision.id)}`);
      console.log(`         ${c.dim((decision.synthesis?.decision || decision.question || '').slice(0, 76))}`);
    }
    const open = decisions.filter((d) => !d.outcome).length;
    console.log(c.dim(`\n  ${decisions.length} decision(s), ${open} awaiting a retro`));
    return;
  }

  if (sub === 'show') {
    const decision = readDecision(root, config, positionals[2] || '');
    if (!decision) {
      console.error(c.red(`no decision "${positionals[2] || ''}" on record`));
      process.exitCode = 1;
      return;
    }
    console.log(values.json ? JSON.stringify(decision, null, 2) : renderMemoMarkdown(decision));
    return;
  }

  console.error(c.red(`unknown decisions subcommand "${sub}"`));
  process.exitCode = 1;
}

function cmdMemo(positionals, values) {
  const root = resolveRoot(values);
  const { config } = loadConfig(root);
  const id = positionals[1];
  if (!id) {
    console.error(c.red('usage: persona-council memo <decision-id> [--html] [--out path]'));
    process.exitCode = 1;
    return;
  }

  let record = readDecision(root, config, id);
  if (!record) {
    const scratch = listScratch(root, config).find((run) => run.id === id);
    record = scratch?.record ? { ...scratch.record, mode: 'scratch' } : null;
  }
  if (!record) {
    console.error(c.red(`no decision or scratch run "${id}"`));
    process.exitCode = 1;
    return;
  }

  const output = values.html ? renderMemoHtml(record) : renderMemoMarkdown(record);
  if (!values.out) return void console.log(output);
  fs.mkdirSync(path.dirname(path.resolve(root, values.out)), { recursive: true });
  fs.writeFileSync(path.resolve(root, values.out), output, 'utf8');
  console.log(`${c.green('+')} ${values.out}`);
}

function cmdCalibration(values) {
  const root = resolveRoot(values);
  const { config } = loadConfig(root);
  const rows = calibration(root, config);
  if (values.json) return void console.log(JSON.stringify(rows, null, 2));

  const stats = memoryStats(root, config);
  if (rows.length === 0) {
    console.log(c.dim('  no decisions on record yet, so no track records to compute'));
    console.log(c.dim('  Scratch runs deliberately do not count: a brainstorm has no outcome.'));
    return;
  }

  const width = Math.max(...rows.map((r) => r.persona.length));
  for (const row of rows) {
    const hit = row.hitRate === null ? c.dim('  —  ') : `${String(Math.round(row.hitRate * 100)).padStart(3)}%`;
    console.log(`  ${c.bold(row.persona.padEnd(width))}  seated ${String(row.seated).padStart(2)}  dissent ${String(Math.round(row.dissentRate * 100)).padStart(3)}%  concerns realized ${hit}`);
    for (const flag of row.flags) console.log(`      ${c.yellow(flag)}`);
  }
  console.log(c.dim(`\n  ${stats.decisions} decision(s), ${stats.withOutcome} with a recorded outcome`));
  if (stats.awaitingRetro.length) {
    console.log(c.dim(`  Track records only sharpen once outcomes land: ${stats.awaitingRetro.length} awaiting a retro.`));
  }
}

function cmdPrune(values) {
  const root = resolveRoot(values);
  const { config } = loadConfig(root);
  const removed = pruneScratch(root, config);
  console.log(removed.length === 0
    ? c.dim('  nothing to prune')
    : `  ${removed.length} scratch run(s) dropped: ${removed.join(', ')}`);
  console.log(c.dim('  Decisions on record are never pruned.'));
}

function cmdPromote(positionals, values) {
  const root = resolveRoot(values);
  const { config } = loadConfig(root);
  const runId = positionals[1];
  if (!runId) {
    console.error(c.red('usage: persona-council promote <scratch-run-id>'));
    process.exitCode = 1;
    return;
  }
  const { id } = promoteScratch(root, config, runId);
  console.log(`${c.green('+')} promoted to decision ${c.bold(id)}`);
  console.log(c.dim('  It can now carry an outcome and feed persona track records.'));
}

function cmdEval(positionals, values) {
  const sub = positionals[1] || 'list';

  if (sub === 'list') {
    const cases = listCases();
    if (values.json) return void console.log(JSON.stringify(cases, null, 2));
    for (const spec of cases) {
      console.log(`  ${c.bold(spec.case.padEnd(16))} ${c.dim(spec.domain.padEnd(12))} ${spec.flaws.length} planted flaws`);
      console.log(`      ${c.dim(spec.description)}`);
      console.log(`      ${c.dim(spec.artifact)}`);
    }
    console.log(c.dim('\n  Run a panel on the artifact, save its output, then score it.'));
    console.log(c.dim('  Do not let the agent read the .flaws.json file - that is the answer key.'));
    return;
  }

  if (sub === 'score') {
    const spec = loadCase(values.case || positionals[2] || '');
    if (!spec) {
      console.error(c.red(`unknown case "${values.case || positionals[2] || ''}" - try: persona-council eval list`));
      process.exitCode = 1;
      return;
    }
    const responsePath = values.response || positionals[3];
    if (!responsePath) {
      console.error(c.red('usage: persona-council eval score --case <name> --response <file> [--baseline <file>]'));
      process.exitCode = 1;
      return;
    }

    const score = scoreResponse(fs.readFileSync(responsePath, 'utf8'), spec);
    const baseline = values.baseline
      ? scoreResponse(fs.readFileSync(values.baseline, 'utf8'), spec)
      : null;
    const delta = compare(score, baseline);

    if (values.json) return void console.log(JSON.stringify({ score, baseline, delta }, null, 2));

    console.log(`${c.bold(spec.case)} ${c.dim(`(${spec.domain})`)}`);
    console.log(`  caught ${c.bold(`${score.caught}/${score.total}`)} planted flaws  ${c.dim(`(weighted ${Math.round(score.weightedRecall * 100)}%)`)}`);
    if (baseline) {
      const sign = delta.recallDelta >= 0 ? '+' : '';
      const paint = delta.recallDelta >= 0 ? c.green : c.red;
      console.log(`  baseline ${baseline.caught}/${baseline.total}  ${paint(`${sign}${Math.round(delta.recallDelta * 100)}pp`)}`);
      if (delta.onlyBaseline.length) {
        console.log(c.yellow(`  the baseline caught things the panel missed: ${delta.onlyBaseline.join(', ')}`));
      }
    }
    if (score.missed.length) {
      console.log(`\n  ${c.yellow('missed')}`);
      for (const miss of score.missed) console.log(`    ${miss.severity.padEnd(8)} ${miss.id} - ${miss.description}`);
    }
    console.log(c.dim('\n  Keyword matching over-credits name-dropping and under-credits'));
    console.log(c.dim('  a good argument in different words. Read the misses by hand.'));
    return;
  }

  console.error(c.red(`unknown eval subcommand "${sub}"`));
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
        personas: { type: 'string' },
        mode: { type: 'string' },
        framing: { type: 'string' },
        description: { type: 'string' },
        html: { type: 'boolean' },
        out: { type: 'string' },
        case: { type: 'string' },
        response: { type: 'string' },
        baseline: { type: 'string' },
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
      case 'roster':
      case 'rosters': return cmdRoster(positionals, values);
      case 'decisions': return cmdDecisions(positionals, values);
      case 'memo': return cmdMemo(positionals, values);
      case 'calibration': return cmdCalibration(values);
      case 'prune': return cmdPrune(values);
      case 'promote': return cmdPromote(positionals, values);
      case 'eval': return cmdEval(positionals, values);
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
