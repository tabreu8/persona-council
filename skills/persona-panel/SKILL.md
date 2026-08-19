---
name: persona-panel
description: Convene several personas on one question using a fanout, chained red-team, or multi-round roundtable topology, then synthesize a chairman verdict with a consensus-versus-dissent table and blind spots. Use when the user wants a panel, council, debate, focus group, pre-mortem, red team, multiple perspectives, or a decision weighed from several angles, and when a single persona is not enough.
---

# persona-panel

> **Shared references.** This skill cites files like `panel-topologies.md`. They
> live at `.claude/persona-council/<file>` when installed with
> `npx persona-council init`, or at `${CLAUDE_PLUGIN_ROOT}/reference/<file>`
> when installed as a plugin. Try the first path, fall back to the second.

Convene a group of personas on one question and report what they actually
disagree about.

Read before dispatching: `framings.md` (what the room is asked to do),
`panel-topologies.md` (how the seats are wired), `briefing.md` (what they are
handed), `independence.md` (what must not reach them), `memory.md` (where the
result goes). All short, all change what you do.

## Procedure

### 1. Parse the request

Plain language is the normal case; flags are the precise one. Both are valid.

```
"what would sales, finance and the customer advocate say about usage pricing?"
"run it past launch-review"                       -> named roster
"what could go wrong here?"                       -> premortem framing
"have them actually argue it out"                 -> roundtable
/persona-panel --personas="sales-lead,finance-lead" --mode=fanout --framing=gate
```

Never ask the user to restate a request as flags.

**Rosters.** If they name one (`launch-review`, `pricing-council`), read it from
`config.rosters` - it carries seats, and often a mode and framing. List available
rosters with `npx persona-council roster list`. If a roster would fit a group
they keep convening by hand, offer to save it:

> That's the third time you've run these three together. Want me to save it as
> `pricing-council`?

**Framing.** Pick from `framings.md` by intent - "what am I missing" is a
pre-mortem, "tell me why I'm wrong" is a steelman, "is this ready" is a gate.
Name the one you picked; it tells the user more about the output than the
topology does.

**Roster proposal.** If no personas are named, propose seats and say why each is
there. Deliberately pick conflicting stakes - a roster that agrees by
construction is an expensive echo.

### 2. Validate the roster, then confirm the spend

Resolve every persona first (`resolving-personas.md`). If any is missing, stop
before spawning anything: name which, list close matches, offer `persona-create`.
Half a panel is not a panel - the synthesis would silently omit a viewpoint the
user asked for.

Refuse more than `panel.maxPersonas` seats and say why: past roughly seven,
verdicts correlate and synthesis degrades faster than coverage improves.

Check the cost ladder in `panel-topologies.md` and consider whether a single
`persona-ask` would answer this. If it would, say so and let them choose.

Then state the plan before dispatching:

> Pre-mortem with sales-lead, finance-lead, customer-advocate. Fanout, so they
> don't see each other. 3 sub-agents plus a chairman. Recording as a scratch
> run. Go?

### 3. Build the brief

One neutral fact pack, identical for every seat. Follow `briefing.md`: verbatim
question, artifact, the standard if this is a `gate`, facts the seats cannot look
up, and what is out of scope.

Go and get a missing fact if it is cheap - one question to the user beats four
`insufficient-information` verdicts. Never include deadline pressure, sunk cost,
your view, or what a previous panel concluded.

### 4. Run the topology

Follow `panel-topologies.md` exactly for `fanout`, `chain` or `roundtable`.
Dispatch concurrent seats **in a single message** so they run in parallel. Every
seat gets: its full persona file, the brief, the framing instruction, and the
verdict contract from `verdict-contract.md`.

Announce round transitions in roundtable mode so long runs stay legible.

### 5. Chairman synthesis

Spawn a final sub-agent as chairman with every verdict and no other context.

If `panel.citeCalibration` is on and there are decisions with outcomes, run
`npx persona-council calibration` and pass the results **to the chairman only**.
It may weight by track record, and must say out loud when it does. The seats
never see it - see `memory.md`.

Two rules the chairman must not break:

- **Unanimity gets flagged, never celebrated.** If every seat agreed, the report
  says so and asks whether that reflects the proposal or the roster.
- **Minority positions survive with attribution.** One correct objection is the
  whole reason to run a panel; it is never averaged away.

### 6. Persist

Decide the store first - this is the decision people get wrong. Read `memory.md`.

**Default to scratch.** Use `decision` only when the user is actually deciding:
"we're choosing", "this is the call", "write it up", or the choice is expensive
to reverse. When unsure, choose scratch and say it can be promoted.

Get a timestamp with `date -u +%Y-%m-%dT%H:%M:%SZ`; never invent one.

- **scratch** → `<memory.scratchPath>/run-<timestamp>-<slug>.json`
- **decision** → `<memory.decisionsPath>/<id>/decision.json`, id from the date
  and a short slug

Write the JSON in the shape given in `memory.md`, including `revisitWhen` - the
field everyone skips and then regrets. Then render the memo rather than
hand-writing it:

```bash
npx persona-council memo <id>                          # markdown
npx persona-council memo <id> --html --out memo.html   # rich page
```

Prune scratch afterwards: `npx persona-council prune`.

### 7. Present

Lead with the decision and the dissent table - that is what the user came for.
Then blind spots and the action plan. Keep individual verdicts brief; the full
text is in the memo.

Say what went into the brief, so the user can tell "the panel disagreed with me"
from "the panel had half the picture".

Close with one line on what the panel could not see, given this roster.

**Offer the rich page** when `output.artifact` is `ask` and the run was of record:

> Want this as a shareable page? `persona-council memo <id> --html` renders it,
> and I can publish it as an artifact.

If `output.artifact` is `always`, produce it without asking. If `never`, do not
offer. A memo that circulates is worth more than one in a chat scroll - but a
scratch riff does not need a landing page.

## Referring back

If the user asks about a previous panel, read the decisions store. Cite prior
decisions **to the user**, never into the seats' brief: personas shown their own
past positions defend them instead of re-judging.

## Failure handling

- A seat errors or returns nothing: name it, synthesize the rest, and state the
  roster was incomplete. Never silently drop a seat.
- Every seat returns `insufficient-information`: that is the finding, and usually
  it means the brief was thin. Report the union of what they said was missing and
  offer to re-run once it exists.
- The user aborts mid-panel: persist what completed, marked partial, in scratch.
