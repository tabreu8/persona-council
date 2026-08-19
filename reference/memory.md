# Memory: two stores, and why they must not mix

A council gets used two very different ways, and treating them the same ruins
both.

**Thinking out loud.** "Bounce this off a few people." "What would the room say?"
Exploratory, frequent, usually abandoned. Nobody ever comes back and records what
happened, because nothing happened - it was a riff.

**Deciding something.** "We are choosing between these two." Infrequent, high
stakes, and the whole point is that it gets acted on and later judged.

If both land in one pile, the pile is useless within a month. Brainstorms have no
outcome, so they sit as permanently open decisions; and any track record computed
across them is noise, because you cannot be right or wrong about a riff.

So there are two stores.

| | `scratch/` | `decisions/` |
|---|---|---|
| Default | **yes** | opt in |
| Kept | last 20, 14 days | forever |
| Gitignored | yes | **no** - meant to be committed |
| Can carry an outcome | no | yes |
| Feeds persona track records | **never** | yes |
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
> that's what makes it eligible for a retro later.

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
> the CLI for memos, retros and track records.

## What a decision record holds

Written by the panel run, at `<decisionsPath>/<id>/decision.json`:

```json
{
  "id": "2026-08-19-usage-based-pricing",
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

`revisitWhen` is the field people skip and then regret. A decision without a
trigger to revisit it is a decision nobody ever revisits.

Never hand-write the memo. Write the JSON and render it:

```
npx persona-council memo <id>            # markdown
npx persona-council memo <id> --html --out memo.html
```

## Outcomes, and the only honest calibration signal

An outcome is recorded by `persona-retro`, at `<id>/outcome.json`:

```json
{
  "recordedAt": "2026-11-02T09:00:00Z",
  "chose": "shipped-modified",
  "choseSummary": "Opt-in tier, migrated 12 accounts on renewal.",
  "result": "good",
  "resultSummary": "Expansion revenue up 9%, no churn spike.",
  "concerns": [
    { "persona": "sales-lead", "concern": "Renewals become renegotiations",
      "realized": false, "note": "Only 2 of 12 pushed back." }
  ],
  "blindSpotsHit": ["Support load did rise - 40 extra tickets in month one."],
  "notes": "..."
}
```

The `concerns[].realized` flags are the whole game. Everything else is context.
A persona that raises concerns which keep coming true has earned weight; one
whose warnings never materialize is crying wolf, and the panel should be told.

## How track records get used, and how they must not

`npx persona-council calibration` computes, per persona: how often it was seated,
how often it dissented from the panel, and what share of its concerns actually
materialized. `doctor` surfaces the flags.

Two rules:

1. **The chairman may cite track records. The seats may not see them.** Telling a
   seat "you were wrong last time" makes it defensive, and telling it "you were
   right last time" makes it overconfident. Independence is the point; weighting
   happens once, at synthesis.
2. **Never auto-edit a persona from its track record.** Surface the pattern and
   propose a change - "sales-lead has opposed all four pricing decisions and none
   of its concerns landed; want me to loosen its mandate?" - then let the user
   decide. A persona that silently drifts is worse than a stale one, because
   nobody knows what they are asking any more.

## Prior decisions and the anchoring trap

When a new question resembles a decided one, you may tell the **user** and cite
the memo. Do not put prior verdicts into the seats' payload by default: personas
shown their own past positions defend them instead of re-judging.

If the user explicitly wants continuity, include the prior position and label it
plainly as open to revision.
