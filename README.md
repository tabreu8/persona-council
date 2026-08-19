<h1 align="center">persona-council</h1>

<p align="center">
  <em>Your agent already tells you what you want to hear.<br>
  This gives it a room full of people who won't.</em>
</p>

<p align="center">
  <code>npx persona-council init</code>
</p>

---

## What it actually looks like

You ask your agent a question you already have an opinion about. Normally it
agrees with you. Instead:

> **you:** get sales, finance and the customer advocate in a room on whether we
> move to usage-based pricing next quarter — and make them actually argue,
> don't just poll them

Three personas answer independently. None of them sees your conversation. None
of them sees the others. Then they get each other's arguments back — stripped of
names, so they argue with the reasoning instead of deferring to the job title —
and a chairman writes this up:

```markdown
## Decision
Don't switch next quarter. Ship it as an opt-in tier and migrate accounts on
renewal. Confidence: medium — the whole thing hinges on a number nobody has run.

## Panel
| Seat              | Verdict                  | Confidence | Position                                     |
|-------------------|--------------------------|------------|----------------------------------------------|
| sales-lead        | oppose                   | high       | Mid-market reps sell predictability. Usage   |
|                   |                          |            | pricing turns every renewal into a fresh     |
|                   |                          |            | negotiation with a worse opening position.   |
| finance-lead      | endorse-with-conditions  | medium     | Expansion upside is real, but only if we can |
|                   |                          |            | forecast it. Right now we can't.             |
| customer-advocate | insufficient-information | —          | Nobody has asked the ~40 accounts whose bill |
|                   |                          |            | would go up. That's the whole question.      |

## Where they disagree
**Factual** — how many accounts actually pay more under the new model? → settled
by: replay last quarter's real usage against the proposed rate card. Half a day
with the billing export, and it ends the argument.
**Values** — revenue predictability against expansion upside. Your call: sales
owns one of those numbers, finance owns the other, and neither can concede
without giving up something real.

## Blind spots
No seat raised support load. A bill people can't predict generates a ticket every
month, and nobody in this room answers those tickets.

## Confidence warning
None — two seats disagreed on substance and the third refused to guess.
```

*(Illustrative — your personas, your question, your disagreements.)*

Nothing above is special syntax. Ask in your own words and the skill picks the
roster, justifies each seat, and tells you what it's about to spend before it
spawns anything. Flags exist for when you want to pin it down —
`/persona-panel --personas="sales-lead,finance-lead,customer-advocate" --mode=roundtable
--prompt="..."` — and mean exactly the same thing.

The last section is the one that matters. If all three had endorsed it, that box
would say so and ask whether you learned something about the plan or just
something about your roster.

---

## Different rooms

Nothing in here knows what a deploy is. A council is a way of weighing a
decision nobody can settle with a test — which makes it worth *more* outside
engineering, not less. Code has a compiler to tell you that you were wrong.
Positioning doesn't. Neither does a hiring call, or a roadmap cut.

| Deciding | A room worth convening |
|---|---|
| **Product** | the customer who churned last month · the engineer who has to build it · the exec who has to fund it |
| **Marketing** | a competitor's head of marketing · a journalist who has been pitched this exact claim before · the buyer who already doesn't believe you |
| **Pricing / strategy** | sales · finance · the person who answers the phone after the invoice goes out |
| **Hiring** | the person who would report to them · the peer who would have to cover their gaps |
| **Writing** | a reader in a hurry · the person you quoted · someone who thinks the premise is wrong |
| **Engineering** | the SRE who carries the pager · the staff engineer who maintains it in two years · security |

The best seat in any room is usually the one that loses something if you turn
out to be right.

---

## The thesis

**Five personas that agree are worse than one honest answer.** They launder a
single opinion as a consensus and hand you confidence you didn't earn.

Every persona here is the same model underneath. Left alone, they converge —
politely, plausibly, uselessly. So the entire design is counter-pressure against
that one failure:

| The pressure | Where it lives |
|---|---|
| A persona needs **something to lose** | Every persona carries a `stake` — what it is personally accountable for — and a `mandate`: the written obligation to say no, and the conditions for saying it. Adjective soup ("thorough, detail-oriented") describes nobody and agrees with everything. |
| A second opinion must be **uncontaminated** | `persona-ask` runs in a sub-agent that has never seen your chat. The payload rules forbid your framing, your paraphrase, and every adjective describing the thing under review. |
| Round two must be about **arguments, not authority** | Roundtable digests are anonymized by default. A seat that knows which position came from "the security expert" defers to it. A seat reading an unlabeled argument has to actually judge it. |
| Unanimity is a **finding, not a result** | The chairman is forbidden from reporting clean consensus without flagging it, from averaging verdicts into "broadly positive," and from quietly dropping the one seat that objected. |

And one rule pointed at the tool itself: **no politeness directives.** No skill
here ever tells a persona to be constructive, balanced, or considerate. Those
three words are the most efficient way known to flatten a persona back into the
house voice you were trying to escape.

---

## Four tools, and the honest difference between them

| | Sees your chat | Spawns | Good for |
|---|---|---|---|
| **`persona-create`** | yes | — | Authoring a persona sharp enough to be worth asking |
| **`persona-think`** | **yes** | — | A fast gut-check on live work |
| **`persona-ask`** | no | 1 | A second opinion you can actually lean on |
| **`persona-panel`** | no | N + chairman | A decision weighed from several angles |

`persona-think` is the **contaminated** one, and the skill says so out loud
instead of quietly implying otherwise. The persona sees your whole conversation,
including every signal about what you're hoping to hear. That's a fine trade for
a thirty-second perspective check and the wrong tool for anything you'll defend
in a design review.

### Three ways to run a room

- **`fanout`** — everyone answers the same clean question in parallel, blind to
  each other. Maximum independence. This is the default and usually the right one.
- **`chain`** — visionary → auditor → executor. Each seat hardens what the last
  one produced. Deep, but anchored to whoever went first — and the output says so
  rather than pretending the third seat judged freely.
- **`roundtable`** — an independent first round, then anonymized digests
  circulating until nobody has a new argument or `maxRounds` is hit. If everyone
  agrees too early, a dissenter seat is injected whose only brief is to build the
  strongest case against the emerging consensus.

Every run is persisted to `.claude/memory/` as JSON *and* as a transcript a human
will actually read.

---

## A persona is a file, not a framework

Plain markdown with frontmatter. Readable by the CLI, by sub-agents, and by a
person with no tooling at all.

```markdown
---
id: customer-advocate
name: Priya Raman
role: Head of Customer Success, five years fielding the calls after every pricing change
stake: "Your team absorbs every angry renewal call this produces. You will personally be on some of them."
mandate: "Refuse anything nobody has tested on a real customer — and name the accounts it hurts in your first sentence."
lens:
  - "Which specific accounts get worse off, and by how much"
  - "What this looks like to someone who wasn't in the meeting where we decided it"
biases:
  - "Believes almost all churn is a surprise the customer could have been warned about"
blind_spots:
  - "Overweights the loudest twenty accounts; quietly satisfied customers are invisible to you"
---

## Perspective

You are Priya Raman...
```

The `blind_spots` field is not decoration. It is what lets the chairman *weight*
a verdict instead of just stacking it, and what stops a persona bluffing past the
edge of what it actually knows.

> **No personas ship with this package.** Deliberately. A persona you didn't
> write is a viewpoint you can't calibrate, and a bundled set of generic ones
> would mostly teach the tool to produce generic advice. `/persona-create` builds
> your first in about two minutes — and `npx persona-council doctor` will tell
> you which of your personas are too soft to bother asking.

---

## Personas don't have to live in your repo

Sources are declared in config and searched in order — first match wins.

```jsonc
{
  "sources": [
    { "id": "local",  "type": "local", "path": ".claude/personas", "writable": true },
    { "id": "shared", "type": "git",   "url": "git@github.com:acme/personas.git" },
    { "id": "notion", "type": "mcp",   "server": "notion",
      "resolve": "Find the persona in the 'Personas' database..." }
  ],
  "writeTo": "local"
}
```

`local` is a directory. `git` is your team's shared roster, shallow-cloned on
`sources sync`. `mcp` is anywhere your agent can reach with tools — a Notion
database, a wiki, an internal service.

The CLI has **no MCP client and does not pretend to have one.** For `mcp`
sources, `resolve` is an instruction your *agent* follows at runtime, after which
it normalizes what it found into the persona schema and caches it as a plain file
so sub-agents can read it like any other. If the server isn't connected, it says
so by name instead of inventing a persona to fill the gap.

```bash
npx persona-council sources add --type mcp --id notion --server notion
```

---

## Two front doors

**npm** — writes into `.claude/`, works with any agent that reads it:

```bash
npx persona-council init                     # this project
npx persona-council init --global            # ~/.claude
npx persona-council init --target generic    # one portable PERSONA-COUNCIL.md instead
```

**Claude Code plugin** — the same repo is its own marketplace:

```
/plugin marketplace add tabreu8/persona-council
/plugin install persona-council@persona-council
```

Re-running `init` never clobbers a file you've edited unless you pass `--force`.

```
persona-council init          Install skills, commands, agents, references
persona-council list          Every persona across every configured source
persona-council new <id>      Scaffold one to fill in
persona-council doctor        Config, install, and which personas are too soft
persona-council sources ...   list | add | sync
persona-council uninstall     Removes what it installed; keeps what you wrote
```

---

## What this does *not* give you

Worth saying plainly, because most tools in this space imply otherwise.

**Isolation is real. Neutrality is discipline.** A sub-agent genuinely starts
with an empty context — no history, no prior reasoning, nothing. But the one
channel into that clean context is the payload the orchestrating agent writes,
so the skills spend real effort constraining it: verbatim question, the artifact,
facts only. That's instructions doing the work, not a sandbox. The orchestrator
is the leak, and it's told so in as many words.

**Personas decorrelate opinions. They don't create knowledge.** Priya Raman is
not a real head of customer success. She's a lens that makes the model surface
the renewal-desk consequences it had quietly deprioritized. A panel is a tool for finding what you failed to weigh —
not a source of facts nobody in the room has.

**It costs real tokens.** A five-seat roundtable is fifteen-plus sub-agent runs.
Every panel announces its roster, mode and spawn count *before* dispatching, so
you can say "just two of them."

---

## Under the hood

Zero runtime dependencies. 27 tests, `node --test`, no framework.

Personas are **data, not sub-agents** — a deliberate departure from the obvious
design. Writing them into `.claude/agents/` would make Claude Code auto-delegate
to them on unrelated work, so a "brand skeptic" starts reviewing your database
migrations. Instead
they live in their own directory in a portable format, and the skills inject them
into generic runners. Your agent namespace stays clean; your personas stay usable
outside Claude Code.

```
skills/       persona-create · persona-think · persona-ask · persona-panel
agents/       persona-runner (read-only) · persona-chairman
reference/    the shared docs the skills actually cite at runtime
src/ bin/     the installer and persona resolver
```

`reference/independence.md` is the most opinionated file in the repo. Read that
one if you only read one.

---

MIT. Issues and sharper personas both welcome.
