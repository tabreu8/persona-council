<p align="center">
  <img src="https://raw.githubusercontent.com/tabreu8/persona-council/main/assets/banner.jpeg" alt="Persona Council — five personas (data, ideas, feedback, design, community) contributing to a shared council table" width="720">
</p>

<h1 align="center">persona-council</h1>

<p align="center">
  <em>Your agent already tells you what you want to hear.<br>
  This gives it a room full of people who won't — and lets them use the thing, not just judge it.</em>
</p>

<p align="center">
  <code>/plugin marketplace add tabreu8/persona-council</code> — Claude Code<br>
  <code>npx persona-council init</code> — any project, full CLI<br>
  <code>npx skills add tabreu8/persona-council</code> — Cursor, Cline, others
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

## You tune the personas. Nothing else does.

When a run shows a persona is off — it waved everything through, or objected to
things its real counterpart never would — you say so, and `persona-create`
adjusts the field responsible, starting from the verdict or walk step that
showed it:

> **you:** sales-lead agreed with every pricing change this month. Make it harder to convince.

There is no scoring loop, no track record, and no automatic re-weighting. A
persona only changes when you ask, so you always know what you're asking.

---

## Two kinds of memory, deliberately kept apart

Most of what you run is thinking out loud. Some of it is deciding. Treating
those the same ruins both: the three calls that mattered get buried under forty
riffs nobody will reread.

| | `scratch/` | `decisions/` |
|---|---|---|
| Default | **yes** | you say so |
| Kept | last 20, 14 days | forever |
| Gitignored | yes | **no** — meant to be committed |

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

### Custom fields — nothing is standard by design

The fixed schema (`stake`, `mandate`, `lens`, `biases`...) covers what almost
every persona needs. It cannot cover what makes *this one* distinct — that was
never going to be a fixed list's job. Add any field you want:

```yaml
likes: ["shipping small, reversible changes", "a rep who says the price out loud"]
dislikes: ["roadmaps with no date", "'let's take this offline'"]
social_media: "Reads industry Twitter daily, never posts. Screenshots bad takes into the team channel."
authority_level: "Can block a launch alone. Cannot approve budget without the VP."
```

It round-trips like any other field, shows up in `list` (`+2 custom`), and
`doctor` nudges you if one looks like a typo of a standard field rather than a
deliberate custom one. Same bar as everywhere else in this schema:
`favorite_snack: chips` is decoration and gets ignored the moment it matters;
`authority_level: can block a launch alone` changes what the persona will say
no to on its own, and a chairman weighing verdicts should know it.

---

## Five tools, one door

`/council` routes to the right one. You never have to remember the rest.

| | Sees your chat | Spawns | Good for |
|---|---|---|---|
| **`persona-create`** | yes | — | Authoring a persona worth asking |
| **`persona-think`** | **yes** | — | A fast gut-check on live work |
| **`persona-ask`** | no | 1 | A second opinion you can lean on |
| **`persona-panel`** | no | N + chairman | A decision weighed from several angles |
| **`persona-walkthrough`** | no | 1 per walker | Watching a persona actually use the product |

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

### Not everything is a verdict

A council that can only judge is half a tool. Plenty of persona work is about
things that **don't exist yet** — campaign angles, product bets, names — or about
how something **lands** with people who aren't evaluating it at all.

Ask a persona to "endorse" a brainstorm and you get nonsense: fake verdicts,
`confidence: low` on an idea, and the ideas themselves filed under *concerns*.
So runs come in four kinds, and the kind is recorded:

| Kind | The room is asked to | You get back |
|---|---|---|
| **evaluative** | judge something that exists | verdicts, dissent, blocking concerns |
| **generative** | produce options from its lens | ideas with provenance, clustered |
| **reactions** | respond as people, not judges | behaviour — what they'd actually do next |
| **journey** | use the real product toward a goal | a think-aloud log per step, audited |

Get the kind wrong and the output is nonsense: a brainstorm filed as verdicts
reports every idea as an "endorse" and a room that was never disagreeing as
suspicious unanimity.

### Ask the room the right question

A **framing** is what the room is asked to do; a **topology** is how the seats
are wired. Framings get picked from how you phrase things — you never choose one
by name.

| You say | Framing | What the room is asked |
|---|---|---|
| "give me angles" | **ideate** | What would you try? Give me what only *your* seat thinks of |
| "how would they react" | **react** | You just saw this. What do you actually do next? |
| "what am I missing" | **pre-mortem** | It's six months on and this failed. What happened? |
| "tell me why I'm wrong" | **steelman** | The strongest honest case against your position |
| "is this ready" | **gate** | Pass/fail against a written standard, verbatim |
| "A or B?" | **options** | Ranked — plus what would flip second choice to first |
| "break this" | **red team** | Attack, repair, then attack the repair |
| "have them argue" | **debate** | Roundtable until something gives |
| "have them try it" | **walkthrough** | Here's the product. Get this done, and think aloud |

Two of these are worth calling out. The **pre-mortem** is the most underused —
putting seats *after* the failure surfaces concrete mechanisms instead of vague
risk. And **react** is the one people don't expect: the persona isn't consulting,
it's a person who just encountered the thing, so the output is behaviour.
*"I'd forward it to my finance lead and not follow up"* is a result;
*"I'd find that interesting"* is worthless. Indifference is a finding — a panel
where every segment is intrigued is a panel of flattering fictions.

A generative run is synthesized completely differently: no consensus (nobody was
disagreeing), no vote-counting. It clusters ideas, then names **the ones only one
seat's lens could have produced** — the analogue of preserved dissent, and the
entire return on convening a room instead of asking once.

---

## Don't ask them. Watch them.

Every framing above still asks a persona what it *thinks*. The cheapest lie in
product work is "the onboarding looks clean" — said by someone who never tried
to onboard.

> **you:** have the first-time admin try to invite a teammate, starting from the
> marketing site

`persona-walkthrough` hands the persona a **goal, never a route**, and the real
product — through whatever the session can drive: a browser, a shell, an API.
It works toward the goal as that person would, and logs every step:

```markdown
4. **Did:** clicked "Workspace" in the sidebar
   **Expected:** a list of the people in my workspace
   **Saw:** "Plan: Team · 8 seats · Next invoice Oct 1"
   **Thought:** This is billing? I wanted people. Maybe it's under my avatar.
   **Felt:** confused
```

Then the orchestrating agent — who has seen the product from the outside —
**audits the journey**: did they finish, and did they *think* they finished;
friction ranked blocker → polish, each tied to the step that proves it and
re-checked before the product gets blamed; where what they expected diverged
from what they saw; what worked and must survive a redesign; and everything
past the first blocker that nobody reached.

Two walkers with different traits are where it earns its keep. A step that
stops the time-poor buyer but not the careful admin is a finding about your
product's assumptions. A step that stops both is a blocker.

The walker only uses what a real user has — no reading the source to get past a
confusing screen — and it stops at anything irreversible: it goes up to the
payment form, says whether it would pay and why, and doesn't.

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
the disputes split factual-from-values, blind spots, action plan and
revisit-when — or, for a walkthrough, every step of every journey and the
friction ranked worst-first. Paste it into Notion, or have your agent
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
flaws planted in them**, across pricing, marketing, hiring and engineering —
plus `invite-flow`, a tiny web app with planted usability problems for a
walker to find:

```console
$ npx persona-council eval list
$ npx persona-council eval score --case pricing-change \
    --response panel.md --baseline single-pass.md

pricing-change (pricing)
  caught 6/6 planted flaws  (weighted 100%)
  baseline 0/6  +100pp
```

Run your baseline in a clean session, run your roster in another, score both.

The default scorer is keyword-based and says so — it over-credits name-dropping
and under-credits a good argument in unexpected words. For a real grade, a
fresh sub-agent that never saw the run follows the grading brief and returns a
judgment per flaw, each with a quote as evidence:

```console
$ npx persona-council eval rubric pricing-change      # the brief for the grader
$ npx persona-council eval score --case pricing-change \
    --response panel.md --judged grades.json

  caught 5/6 planted flaws  (weighted 89%)  by keyword
  caught 4/6 planted flaws  (weighted 78%)  by grader
    no-rollback: keyword says caught, grader says not - name-drop?
```

The disagreements are the lines worth reading by hand.

The real use is on **your** personas: add a case from your own domain where you
already know the problems, and find out whether your roster catches them. A flaw
no roster of yours has ever caught is the most valuable thing in that directory.

---

## Install

**Claude Code plugin** — the native path, the same repo is its own marketplace:

```
/plugin marketplace add tabreu8/persona-council
/plugin install persona-council@persona-council
```

**npm** — for other projects, scripting, CI, or the full CLI (`doctor`,
`memo`, `compare`, `eval score`) outside a plugin context. Writes into
`.claude/`:

```bash
npx persona-council init                     # this project
npx persona-council init --global            # ~/.claude
npx persona-council init --target generic    # one portable PERSONA-COUNCIL.md
```

Re-running `init` never clobbers a file you've edited unless you pass `--force`.

**Any Agent Skills-compatible agent** — Cursor, Cline, and others besides Claude
Code, via [Vercel's open standard](https://github.com/vercel-labs/skills):

```bash
npx skills add tabreu8/persona-council
```

Installs just the six skills — no CLI, no memory journal, no `doctor`. Each one
carries its own `references/` copy of the docs it cites, and the docs those cite
(derived from the same
source the other two installs share, kept in sync by a test — see
`scripts/sync-skill-references.mjs`), so it works standalone with nothing else
from this repo. Reach for the plugin or npm install first if you want the full
command surface; this one exists for agents that only speak the Skills standard.

```
init          Install skills, commands, agents, references
list          Every persona across every configured source
new <id>      Scaffold one to fill in
doctor        Config, install, memory, soft personas, stale evidence
roster        list | add | remove  (walkthrough rosters carry --goal and --at)
decisions     list | show <id>
memo <id>     Re-render a decision as markdown or a rich page
compare <a> <b>  Before/after for a re-walk: outcomes, steps, friction by id
promote <id>  Move a scratch run onto the record
prune         Drop stale scratch runs — decisions are never touched
sources       list | add | sync
eval          list | rubric | score
uninstall     Removes what it installed; keeps what you wrote
```

**No personas ship with this package.** Deliberately. A persona you didn't write
is a viewpoint you can't tune. `/persona-create` builds your first in about
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
| Opinions are cheap; **behaviour isn't** | `persona-walkthrough` makes a persona use the product, and a walker cannot read the source to get past a screen no real user could. |

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
| **Product ideas** | the customer who churned last month · the engineer who has to build it · the exec who has to fund it |
| **Marketing** | a competitor's head of marketing · a journalist who has been pitched this exact claim before · the buyer who already doesn't believe you |
| **Pricing** | sales · finance · the person who answers the phone after the invoice goes out |
| **Hiring** | the person who would report to them · the peer who'd cover their gaps |
| **Writing** | a reader in a hurry · the person you quoted · someone who thinks the premise is wrong |
| **Engineering** | the SRE who carries the pager · the staff engineer who maintains it in two years · security |

The best seat in any room is usually the one that loses something if you turn out
to be right.

Same seats, different questions: *evaluate* the pricing proposal, *ideate*
campaign angles for it, then *react* to the landing page as the buyer. One
roster, three kinds of run.

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

**A walker is not a user.** It surfaces where the product assumes knowledge its
persona doesn't have — a real usability session still finds things no lens
will. Treat a walkthrough as the cheap pass before the expensive one.

**It costs real tokens.** A five-seat roundtable is sixteen-plus sub-agent runs.
Every panel announces its roster, framing, mode and spawn count *before*
dispatching, so you can say "just two of them".

---

## Under the hood

Zero runtime dependencies. 89 tests, `node --test`, no framework — including a
guard that every field the docs tell an agent to record actually reaches the
memo, because "recorded and silently dropped" has been the most common bug here.

Personas are **data, not sub-agents** — a deliberate departure from the obvious
design. Writing them into `.claude/agents/` would make Claude Code auto-delegate
to them on unrelated work, so a "brand skeptic" starts reviewing your database
migrations. Instead they live in their own directory in a portable format, and
the skills inject them into generic runners.

```
skills/       create · think · ask · panel · walkthrough · council
agents/       persona-runner (read-only) · persona-walker (no file access) · persona-chairman
reference/    the shared docs the skills cite at runtime — dispatch.md is the procedure all three dispatching skills share
evals/        artifacts with planted flaws, and the answer keys
src/ bin/     installer, persona resolver, memory store, memo renderer
```

`reference/independence.md` is the most opinionated file in the repo, and
`reference/dispatch.md` the most load-bearing. Read those two if you read any.

---

MIT. Issues and sharper personas both welcome.
