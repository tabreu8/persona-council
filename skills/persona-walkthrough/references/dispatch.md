# Dispatch: the steps every sub-agent run shares

`persona-ask`, `persona-panel` and `persona-walkthrough` do different things,
but they send personas out and bring results back the same way. This is that
shared procedure. Each skill says what it does differently at each step;
everything else happens exactly as written here.

## 1. Resolve every persona first

Per `resolving-personas.md`. On a miss, stop before spawning anything: name the
missing persona, list close matches, and offer `persona-create`.

Never improvise a persona to fill a gap. An invented seat is the generic house
voice with a name on it, and a run with a seat missing silently drops a
viewpoint the user asked for.

## 2. Build the brief

Follow `briefing.md`: a sub-agent can only work with what it was handed, and a
thin brief comes back as `insufficient-information` or a walker lost for the
wrong reasons. If a critical fact is missing and cheap to get, get it or ask
the user for it before spending anything.

The brief contains, and contains only:

- **The question or goal, verbatim** - the user's words, not your paraphrase.
- **The artifact** - inline, or as an absolute path the sub-agent can read.
- **Attachments** the user named. Pass paths; let the sub-agent read them.
- **Bare facts** the persona needs and cannot look up. Facts only.

It must never contain your opinion, the user's apparent preference, praise or
criticism of the artifact, what you expect back, what another persona said,
deadline pressure, or sunk cost. When unsure about a line, read
`independence.md` and apply its test: would this sentence still be here if the
user were hoping for the opposite answer?

You are the only way bias reaches a sub-agent. It starts empty; the brief is
the whole of what it knows.

## 3. Say what you are about to spend

One line: personas, framing, topology, agent count, and where the result will
be kept. If it is more than one agent, wait for a yes.

> Pre-mortem with sales-lead, finance-lead, customer-advocate. Fanout, 3 agents
> plus a chairman. Scratch run. Go?

Recommend the cheapest rung that answers the question (`panel-topologies.md`),
and say what the next one up would add. Climbing is a decision, not a default.

## 4. Dispatch

Every sub-agent prompt has the same four parts, in this order:

```
<one line: who you are and what you are doing - "You are answering as a
specific persona. Adopt it completely." or the equivalent for the skill>

<full contents of the persona file, frontmatter and body>

---

<the brief: question or goal, artifact, attachments, facts>

---

Respond using exactly this contract:
<the contract for this kind of run - verdict-contract.md,
contribution-contracts.md, or journey-contract.md>
```

- Sub-agents that do not depend on each other go out **in a single message**, so
  they run concurrently and none can anchor on another.
- Use the agent the skill names (`persona-runner`, `persona-walker`,
  `persona-chairman`). If the harness does not have it, a general-purpose
  sub-agent with the same prompt and that agent's rules works.
- Never tell a sub-agent who else is in the room, and never show it a persona's
  past positions.

## 5. Keep the result

Per `memory.md`. **Scratch by default.** Use the decision store only when the
user is actually deciding - "we're choosing", "write this up", or a choice that
is expensive to reverse. When unsure, choose scratch and say it can be promoted.

Get the timestamp with `date -u +%Y-%m-%dT%H:%M:%SZ`; never invent one.

- **scratch** → `<memory.scratchPath>/run-<timestamp>-<slug>.json`
- **decision** → `<memory.decisionsPath>/<id>/decision.json`, id from the date
  and a short slug

Always record `kind`: it decides how the memo renders the run. Never hand-write
a memo; write the JSON and render it:

```bash
npx persona-council memo <id>                          # markdown
npx persona-council memo <id> --html --out memo.html   # rich page
npx persona-council prune                              # tidy scratch
```

## 6. Present

Lead with what the user came for; each skill says what that is. Then:

- Say what went into the brief, so the user can tell "the persona disagreed
  with me" from "the persona had half the picture".
- Close with one line on what this run structurally could not see.
- If a result makes a persona look miscalibrated - it agreed with everything,
  or objected to things its real counterpart would not - say so once, with the
  evidence, and offer to adjust it through `persona-create`. Never edit a
  persona on your own.

When `output.artifact` is `ask` and the run is of record, offer the rich page:

> Want this as a shareable page? `persona-council memo <id> --html` renders it.

`always`: produce it without asking. `never`: do not offer.

## When something goes wrong

- **A sub-agent errors or returns nothing**: name it, work with the rest, and
  say the run was incomplete. Never drop a seat silently.
- **Everything comes back `insufficient-information`**: that is the finding, and
  usually means the brief was thin. Report what they said was missing and offer
  to re-run once it exists.
- **The user aborts mid-run**: keep what completed, marked partial, in scratch.
