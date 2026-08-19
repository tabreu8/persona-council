<h1 align="center">persona-council</h1>

<p align="center">
  <em>Your agent already tells you what you want to hear.<br>
  This gives it a room full of people who won't — and a record of who was right.</em>
</p>

<p align="center">
  <code>npx persona-council init</code>
</p>

---

## What it actually looks like

You ask your agent something you already have an opinion about. Normally it
agrees with you. Instead:

> **you:** get sales, finance and the customer advocate in a room on whether we
> move to usage-based pricing next quarter — and make them actually argue,
> don't just poll them

Three personas answer independently. None sees your conversation. None sees the
others. Then they get each other's arguments back — stripped of names, so they
argue with the reasoning instead of deferring to the job title — and a chairman
writes this up:

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
**Factual** — how many accounts actually pay more? → settled by: replay last
quarter's real usage against the proposed rate card. Half a day with the billing
export, and it ends the argument.
**Values** — revenue predictability against expansion upside. Your call: sales
owns one of those numbers, finance owns the other.

## Blind spots
No seat raised support load. A bill people can't predict generates a ticket every
month, and nobody in this room answers those tickets.

## Confidence warning
None — two seats disagreed on substance and the third refused to guess.
```

*(Illustrative — your personas, your question, your disagreements.)*

Nothing above is special syntax. Ask in your own words; the skill picks the
roster, names the framing, and tells you what it's about to spend before it
spawns anything.

---

## The part that makes it a practice

One panel is a nice afternoon. What makes this worth installing is the loop:

```
   decide  ──►  memo  ──►  it happens  ──►  retro  ──►  track records
      ▲                                                      │
      └──────────────  weights the next panel  ◄──────────────┘
```

Four months later:

> **you:** the pricing change went fine in the end — only two accounts pushed back

The retro walks you through the concerns each seat raised and asks which ones
actually came true. Then:

```console
$ npx persona-council calibration
  sales-lead         seated  4  dissent  75%  concerns realized   0%
      raises concerns that rarely materialize - may be crying wolf
  customer-advocate  seated  4  dissent  25%  concerns realized  80%
  yes-man            seated  3  dissent   0%  concerns realized   —
      never dissented in 3+ panels - likely too agreeable to be worth a seat
```

Now the chairman can weight by track record instead of by confidence, and you
can see which of your personas is earning its seat. **Nobody trusts an advisor
with no track record** — this is how one gets built.

Two rules keep it honest: the chairman may cite track records but **the seats
never see them** (a seat told it was right last time gets overconfident), and a
persona is **never auto-edited** from its record — the pattern gets surfaced,
you decide.

The most valuable output of the whole loop is the blind spot that keeps
recurring. When support load is the miss in three retros running, that isn't a
bad persona — it's a missing seat, and the skill says so.

---

## Two kinds of memory, deliberately kept apart

Most of what you run is thinking out loud. Some of it is deciding. Treating
those the same ruins both: brainstorms have no outcome, so they sit forever as
open decisions, and a track record computed across idle riffs is noise.

| | `scratch/` | `decisions/` |
|---|---|---|
| Default | **yes** | you say so |
| Kept | last 20, 14 days | forever |
| Gitignored | yes | **no** — meant to be committed |
| Can carry an outcome | no | yes |
| Feeds track records | **never** | yes |

Scratch is the default because promoting a run costs one command and cleaning a
polluted journal costs an afternoon. When a riff turns real mid-conversation,
the skill offers to promote it rather than silently upgrading — the record is
yours, not the agent's.

---

## Personas built from evidence, not vibes

An invented persona surfaces considerations. One built from real material
surfaces *your* considerations, in the words your customers actually use.

```
"build the churned-customer persona from support-tickets-q2.csv"
"make a reviewer persona out of Maria's last 50 PR comments"
"build me their head of product"   → offers to research it: pricing page,
                                     changelog, recent talks, one-star reviews
```

The second route matters as much as the first: when you have no file to hand
over, the agent proposes what it would go and read, waits for your yes, then
builds from what it finds. Sources are recorded in the persona itself —

```yaml
evidence:
  - "support-tickets-q2.csv (412 tickets, Apr–Jun 2026)"
  - "G2 reviews, 1–3 star, retrieved 2026-08-19"
grounded_at: 2026-08-19
```

— because six months on nobody remembers which personas were built from data and
which were invented over coffee, and those deserve very different trust.

Quotes are never fabricated. A made-up quote gets believed precisely because it
looks specific.

---

## Five tools, one door

`/council` routes to the right one. You never have to remember the rest.

| | Sees your chat | Spawns | Good for |
|---|---|---|---|
| **`persona-create`** | yes | — | Authoring a persona worth asking |
| **`persona-think`** | **yes** | — | A fast gut-check on live work |
| **`persona-ask`** | no | 1 | A second opinion you can lean on |
| **`persona-panel`** | no | N + chairman | A decision weighed from several angles |
| **`persona-retro`** | — | — | Closing the loop on what happened |

`persona-think` is the **contaminated** one, and the skill says so out loud. The
persona sees everything you've discussed, including what you're hoping to hear.

### Climb the ladder deliberately

The skills recommend the cheapest rung that answers the question, and say what
the next one up would add. Most questions are answered at `ask`.

| Rung | Spend | What you get |
|---|---|---|
| `think` | free | One viewpoint, contaminated |
| `ask` | 1 agent | One clean verdict |
| `fanout` | N + 1 | Independent verdicts, synthesized |
| `chain` | N + 1 | A hardened artifact, anchored to seat one |
| `roundtable` | N × rounds + 1 | An argued-out decision, positions that moved |

### Ask the room the right question

A **framing** is what the room is asked to do; a **topology** is how the seats
are wired. Framings get picked from how you phrase things — you never choose one
by name.

| You say | Framing | What the room is asked |
|---|---|---|
| "what am I missing" | **pre-mortem** | It's six months on and this failed. What happened? |
| "tell me why I'm wrong" | **steelman** | The strongest honest case against your position |
| "is this ready" | **gate** | Pass/fail against a written standard, verbatim |
| "A or B?" | **options** | Ranked — plus what would flip second choice to first |
| "break this" | **red team** | Attack, repair, then attack the repair |
| "have them argue" | **debate** | Roundtable until something gives |

The pre-mortem is the most underused of these. Putting seats *after* the failure
surfaces concrete mechanisms instead of vague risk.

---

## Rosters: turn a habit into a rule

```console
$ npx persona-council roster add launch-review \
    --personas="brand-skeptic,customer-advocate,legal-lead" --framing gate
```

Then: *"run it past launch-review"*. One word, same seats, every time — which is
the difference between a tool one person plays with and a process a team shares.
If you keep convening the same three by hand, the skill offers to save them.

---

## Memos that circulate

Chat scroll evaporates. A panel writes structured JSON, and the CLI renders it —
deterministically, never hand-authored by a model:

```console
$ npx persona-council memo 2026-08-19-usage-based-pricing            # markdown
$ npx persona-council memo 2026-08-19-usage-based-pricing --html     # rich page
```

The HTML is self-contained, theme-aware and printable: decision, verdict chips,
the disputes split factual-from-values, blind spots, action plan, revisit-when,
and the outcome once a retro lands. Paste it into Notion, or have your agent
publish it as a shareable artifact.

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
  ]
}
```

The CLI has **no MCP client and doesn't pretend to**. For `mcp` sources,
`resolve` is an instruction your *agent* follows at runtime, after which it
normalizes what it found into the persona schema and caches it as a plain file.
If the server isn't connected it says so by name, instead of inventing a persona.

---

## Does it actually work?

Don't take the README's word for it. The package ships artifacts with **known
flaws planted in them**, across pricing, marketing, hiring and engineering:

```console
$ npx persona-council eval list
$ npx persona-council eval score --case pricing-change \
    --response panel.md --baseline single-pass.md

pricing-change (pricing)
  caught 6/6 planted flaws  (weighted 100%)
  baseline 0/6  +100pp
```

Recording an outcome is a conversation, not a command — tell your agent what
happened and `/persona-retro` walks the concerns with you.

Run your baseline in a clean session, run your roster in another, score both.
The scorer is keyword-based and says so — it over-credits name-dropping and
under-credits a good argument in unexpected words. Use it as a smoke test and
read the misses.

The real use is on **your** personas: add a case from your own domain where you
already know the problems, and find out whether your roster catches them. A flaw
no roster of yours has ever caught is the most valuable thing in that directory.

---

## Install

**npm** — writes into `.claude/`:

```bash
npx persona-council init                     # this project
npx persona-council init --global            # ~/.claude
npx persona-council init --target generic    # one portable PERSONA-COUNCIL.md
```

**Claude Code plugin** — the same repo is its own marketplace:

```
/plugin marketplace add tabreu8/persona-council
/plugin install persona-council@persona-council
```

Re-running `init` never clobbers a file you've edited unless you pass `--force`.

```
init          Install skills, commands, agents, references
list          Every persona across every configured source
new <id>      Scaffold one to fill in
doctor        Config, install, memory, and which personas are too soft
roster        list | add | remove
decisions     list | show <id>
memo <id>     Re-render a decision as markdown or a rich page
calibration   Persona track records, from decisions with outcomes
promote <id>  Move a scratch run onto the record
prune         Drop stale scratch runs — decisions are never touched
sources       list | add | sync
eval          list | score
uninstall     Removes what it installed; keeps what you wrote
```

**No personas ship with this package.** Deliberately. A persona you didn't write
is a viewpoint you can't calibrate. `/persona-create` builds your first in about
two minutes, and `doctor` tells you which of yours are too soft to bother asking.

---

## The thesis

**Five personas that agree are worse than one honest answer.** They launder a
single opinion as a consensus and hand you confidence you didn't earn.

Every persona here is the same model underneath. Left alone they converge —
politely, plausibly, uselessly. The whole design is counter-pressure:

| The pressure | Where it lives |
|---|---|
| A persona needs **something to lose** | Every persona carries a `stake` and a `mandate`: the written obligation to say no, and the conditions for it. |
| A second opinion must be **uncontaminated** | `persona-ask` runs in a sub-agent that has never seen your chat, behind payload rules that forbid your framing. |
| Round two is about **arguments, not authority** | Roundtable digests are anonymized. A seat that knows which position came from "the security expert" defers to it. |
| Unanimity is a **finding, not a result** | The chairman must flag it, may not average verdicts into "broadly positive", and may not drop the lone objector. |
| Opinions must eventually **meet reality** | Retros mark which concerns actually materialized. A persona whose warnings never land gets flagged. |

And one rule pointed at the tool itself: **no politeness directives.** No skill
here ever tells a persona to be constructive, balanced or considerate. Those are
the most efficient way known to flatten a persona back into the house voice you
were trying to escape.

---

## Different rooms

Nothing in here knows what a deploy is. A council weighs decisions nobody can
settle with a test — which makes it worth *more* outside engineering, not less.
Code has a compiler to tell you that you were wrong. Positioning doesn't.

| Deciding | A room worth convening |
|---|---|
| **Product** | the customer who churned last month · the engineer who has to build it · the exec who has to fund it |
| **Marketing** | a competitor's head of marketing · a journalist who has been pitched this exact claim before · the buyer who already doesn't believe you |
| **Pricing** | sales · finance · the person who answers the phone after the invoice goes out |
| **Hiring** | the person who would report to them · the peer who'd cover their gaps |
| **Writing** | a reader in a hurry · the person you quoted · someone who thinks the premise is wrong |
| **Engineering** | the SRE who carries the pager · the staff engineer who maintains it in two years · security |

The best seat in any room is usually the one that loses something if you turn out
to be right.

---

## What this does *not* give you

**Isolation is real. Neutrality is discipline.** A sub-agent genuinely starts
empty. But the one channel into that clean context is the payload the
orchestrating agent writes, so the skills spend real effort constraining it —
verbatim question, the artifact, facts only. That's instructions doing the work,
not a sandbox. The orchestrator is the leak, and it's told so in as many words.

**Personas decorrelate opinions. They don't create knowledge.** Priya Raman is
not a real head of customer success. She's a lens that makes the model surface
the renewal-desk consequences it had quietly deprioritized. A panel finds what
you failed to weigh — not facts nobody in the room has.

**Calibration needs patience.** Track records mean nothing until several
decisions have outcomes. The first month it's an empty table; that's honest, and
`doctor` will tell you how many decisions are still awaiting a retro.

**It costs real tokens.** A five-seat roundtable is sixteen-plus sub-agent runs.
Every panel announces its roster, framing, mode and spawn count *before*
dispatching, so you can say "just two of them".

---

## Under the hood

Zero runtime dependencies. 56 tests, `node --test`, no framework.

Personas are **data, not sub-agents** — a deliberate departure from the obvious
design. Writing them into `.claude/agents/` would make Claude Code auto-delegate
to them on unrelated work, so a "brand skeptic" starts reviewing your database
migrations. Instead they live in their own directory in a portable format, and
the skills inject them into generic runners.

```
skills/       create · think · ask · panel · retro · council
agents/       persona-runner (read-only) · persona-chairman
reference/    the shared docs the skills cite at runtime
evals/        artifacts with planted flaws, and the answer keys
src/ bin/     installer, persona resolver, memory store, memo renderer
```

`reference/independence.md` is the most opinionated file in the repo, and
`reference/memory.md` the most load-bearing. Read those two if you read any.

---

MIT. Issues and sharper personas both welcome.
