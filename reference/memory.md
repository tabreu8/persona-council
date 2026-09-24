# Memory: two stores, and why they must not mix

A council gets used two very different ways, and treating them the same ruins
both.

**Thinking out loud.** "Bounce this off a few people." "What would the room say?"
Exploratory, frequent, usually abandoned. Nobody ever comes back and records what
happened, because nothing happened - it was a riff.

**Deciding something.** "We are choosing between these two." Infrequent, high
stakes, and the whole point is that it gets acted on and later judged.

If both land in one pile, the pile is useless within a month: the three calls
that mattered are buried under forty riffs nobody will reread, and a teammate
looking for why something was decided cannot find it.

So there are two stores.

| | `scratch/` | `decisions/` |
|---|---|---|
| Default | **yes** | opt in |
| Kept | last 20, 14 days | forever |
| Gitignored | yes | **no** - meant to be committed |
| Cost of a mistake | none, it evaporates | it is the record |

Scratch is the default because promoting a run costs one command, and cleaning a
polluted journal costs an afternoon.

## Choosing the store

Use `decision` when the user says any of: we're deciding, this is the call, write
this up, I need to justify this to someone, or when the run is about something
they cannot cheaply reverse. Use `scratch` for everything else.

**You will sometimes get this wrong, and that is fine in one direction only.**
Recording a brainstorm as a decision pollutes the record permanently. Leaving a
real decision in scratch costs nothing but a `promote` when someone notices. So
when genuinely unsure, choose scratch and say:

> Kept this as a scratch run. Say the word and I'll record it as a decision -
> that's what keeps it for the team to read back.

## Promoting mid-flight

A brainstorm becomes a decision the moment the user starts acting on it. Watch
for "ok let's do that", "I'm going to take this to the team", "write that up".
When you see it, offer to promote - do not silently upgrade, because the record
is theirs, not yours.

```
npx persona-council promote <scratch-run-id>
```

## When nothing exists yet

A plugin install copies the skills but never runs `init`, so on a fresh project
there may be no config and no directories at all. That is fine - assume the
defaults, and create the directory before writing to it (`mkdir -p`). Do not
refuse to record something because the folder is missing.

If the user is going to use this more than once, mention it once:

> Worth running `npx persona-council init` - it writes the config and gives you
> the CLI for memos and the decision record.

## What a decision record holds

Written by the panel run, at `<decisionsPath>/<id>/decision.json`:

```json
{
  "id": "2026-08-19-usage-based-pricing",
  "kind": "evaluative",
  "recordedAt": "2026-08-19T10:15:00Z",
  "question": "<verbatim>",
  "topology": "roundtable",
  "framing": "steelman",
  "roster": "pricing-council",
  "rounds": 2,
  "personas": [{ "id": "sales-lead", "source": "local", "version": 1 }],
  "verdicts": [
    { "persona": "sales-lead", "verdict": "oppose", "confidence": "high",
      "concerns": [{ "blocking": true, "text": "..." }],
      "changeMyMind": "...", "summary": "..." }
  ],
  "synthesis": {
    "decision": "...", "consensus": [],
    "factualDisputes": [{ "dispute": "...", "settledBy": "..." }],
    "valueDisputes": [{ "dispute": "...", "tradeoff": "..." }],
    "blindSpots": [], "actionPlan": [{ "step": "...", "closes": "..." }],
    "confidenceWarning": null
  },
  "revisitWhen": "the billing replay lands",
  "cost": { "subAgents": 7 }
}
```

`kind` is `evaluative`, `generative`, `reactions` (see
`contribution-contracts.md`) or `journey` (see `journey-contract.md`). It
decides the record's shape - `verdicts` for evaluative runs, `contributions`
for generative, `reactions` for reactive, `journeys` for walkthroughs - and how
the memo renders it. Recording a brainstorm as evaluative files every idea as
an "endorse" and flags a room that was never disagreeing as suspicious
unanimity.

`revisitWhen` is optional: a plain-language note for whoever rereads the memo
about what would reopen the question.

Never hand-write the memo. Write the JSON and render it:

```
npx persona-council memo <id>            # markdown
npx persona-council memo <id> --html --out memo.html
```

## Improving a persona

Nothing here edits a persona on its own, and nothing scores one. When a run
shows a persona is off - too agreeable, too harsh, missing a concern its real
counterpart would raise - that is the user's call to make, through
`persona-create`:

> sales-lead waved through every pricing change this month. Want me to tighten
> its mandate?

Offer once, with the specific evidence from the run, and let them decide. A
persona that silently drifts is worse than a stale one, because nobody knows
what they are asking any more.

## Prior decisions and the anchoring trap

When a new question resembles a decided one, you may tell the **user** and cite
the memo. Do not put prior verdicts into the seats' payload by default: personas
shown their own past positions defend them instead of re-judging.

If the user explicitly wants continuity, include the prior position and label it
plainly as open to revision.
