# persona-council

Give your coding agent a council: named personas with their own stakes and
blind spots, queried in isolation and made to argue with each other.

```bash
npx persona-council init
```

Then, in your agent:

```
/persona-create   a staff SRE who has carried the pager for eight years
/persona-think    sre-oncall  is this migration plan sane?
/persona-ask      sre-oncall  review this rollout plan  --file docs/rollout.md
/persona-panel    --personas="sre-oncall,product-lead,vc-skeptic" --mode=roundtable --prompt="Ship on Friday?"
```

## Why

Asking a model "what do you think?" gets you the house voice. Asking it "what
would a skeptical VC think?" gets you the house voice wearing a hat. The
difference between those two and something genuinely useful comes down to three
things this package is built around:

- **A persona needs something to lose.** Every persona carries a `stake` (what
  it is personally accountable for) and a `mandate` (what obliges it to say no).
  Adjective-soup personas — "thorough, detail-oriented" — agree with everything.
- **A second opinion has to be uncontaminated.** `persona-ask` runs a persona in
  a sub-agent that has never seen your conversation, with a payload that is
  forbidden from carrying your framing.
- **Agreement is the failure mode, not the goal.** Five personas on one model
  converge unless you fight it. The chairman synthesis treats unanimity as
  something to flag, keeps minority positions with attribution, and hunts for
  what the whole roster structurally cannot see.

## Install

**As an npm package** — works with any agent that reads `.claude/`:

```bash
npx persona-council init            # into the current project
npx persona-council init --global   # into ~/.claude
npx persona-council init --target generic   # one portable PERSONA-COUNCIL.md instead
```

Re-running is safe: files you have edited are left alone unless you pass
`--force`.

**As a Claude Code plugin:**

```
/plugin marketplace add tabreu8/persona-council
/plugin install persona-council@persona-council
```

Both install the same skills, commands, sub-agents and reference docs.

**No personas ship with this package.** A persona you did not write is a
viewpoint you cannot calibrate against, and generic bundled ones would mostly
teach the tool to produce generic advice. Write your first one in about two
minutes with `/persona-create`.

## The four capabilities

| | Sees your conversation | Spawns | Use it for |
|---|---|---|---|
| `persona-create` | yes | no | Authoring and editing personas |
| `persona-think` | **yes** | no | A fast in-context perspective check |
| `persona-ask` | no | 1 sub-agent | A second opinion you can actually trust |
| `persona-panel` | no | N + chairman | A decision weighed from several angles |

`persona-think` is the fast, contaminated one — the persona sees everything
you have discussed, including what you seem to want to hear. That is fine for a
quick gut-check on live work and wrong for anything you intend to rely on. The
skill says so out loud rather than pretending otherwise.

### Panel topologies

- **`fanout`** — every persona answers the same clean question independently,
  in parallel. Nobody sees anybody. Use it when you want honest disagreement.
- **`chain`** — visionary → auditor → executor. Each seat receives the artifact
  and the previous verdict, and hardens it. Deep, but anchored to whoever went
  first; the output says so.
- **`roundtable`** — an independent first round, then an **anonymized** digest
  circulated back so seats respond to arguments rather than to job titles, until
  no new arguments appear or `maxRounds` is hit. A dissenter seat is injected if
  everyone agrees too early.

Every panel ends with a chairman synthesis: decision, consensus-vs-dissent
table, factual disputes (with the test that settles each) separated from value
disputes (escalated, never adjudicated), blind spots, and an action plan.

Runs are persisted to `.claude/memory/` as both JSON and a readable transcript.

## Personas

A persona is a plain markdown file with YAML frontmatter — readable by the CLI,
by sub-agents, and by a human with no tooling at all.

```markdown
---
id: sre-oncall
name: Marta Okafor
role: Staff SRE, eight years carrying the pager for a payments platform
stake: "You are on call for this. Every shortcut here becomes your 3am page."
mandate: "Refuse anything with no rollback path or unbounded blast radius — say so first."
lens:
  - "What breaks, how loudly, and who finds out first"
  - "How we undo it under pressure at 3am"
biases:
  - "Believes almost every outage traces back to a change nobody could reverse quickly"
blind_spots:
  - "Undervalues speed-to-market; will trade six weeks for a marginal reliability gain"
---

## Perspective

You are Marta Okafor...
```

Full field reference: [`reference/persona-schema.md`](reference/persona-schema.md).
`npx persona-council doctor` will tell you which of your personas are too soft
to be worth asking.

## Persona sources

Personas do not have to live in your repo. Sources are declared in
`.claude/persona-council.config.json` and searched in order — first match wins.

```jsonc
{
  "sources": [
    { "id": "local", "type": "local", "path": ".claude/personas", "writable": true },
    { "id": "shared", "type": "git", "url": "git@github.com:acme/personas.git", "subpath": "personas" },
    { "id": "notion", "type": "mcp", "server": "notion", "resolve": "Find the persona in the 'Personas' database..." }
  ],
  "writeTo": "local"
}
```

- **`local`** — a directory of markdown files.
- **`git`** — a shared team repo, shallow-cloned into a cache by
  `npx persona-council sources sync`.
- **`mcp`** — anywhere your agent can reach with MCP tools: a Notion database, a
  wiki, an internal service. The CLI has no MCP client, so it does not pretend
  to; the `resolve` field is an instruction your *agent* follows at runtime,
  after which it normalizes the result into the persona schema and caches it.

```bash
npx persona-council sources add --type mcp --id notion --server notion
```

Then edit the generated `resolve` instruction so it names your actual database.

## CLI

```
npx persona-council init          Install skills, commands, agents, references
npx persona-council list          List personas across all configured sources
npx persona-council new <id>      Scaffold a persona file to fill in
npx persona-council doctor        Validate config, install and persona quality
npx persona-council sources ...   list | add | sync
npx persona-council uninstall     Remove installed files; keeps your personas
```

Flags: `--dir`, `--global`, `--target`, `--force`, `--json`.

## What this does not guarantee

A sub-agent starts with an empty context, so isolation from your conversation
is real. Neutrality is not automatic: the only channel into that clean context
is the payload the orchestrating agent writes, so the skills spend real effort
constraining it (verbatim question, artifact, facts only — no framing, no
adjectives, no hint of the hoped-for answer). Treat that as discipline enforced
by instructions, not as a sandbox.

Personas are also the same base model underneath. They decorrelate opinions;
they do not create independent knowledge. A panel is a tool for surfacing
considerations you had not weighed, not a source of new facts.

## Development

```bash
npm test        # node:test, no dependencies
```

The package has zero runtime dependencies.

## License

MIT
