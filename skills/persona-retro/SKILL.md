---
name: persona-retro
description: Record what actually happened after a decision a panel weighed in on, marking which persona concerns materialized and which did not. Use when the user reports an outcome, says a past decision went well or badly, asks to close the loop on a decision, or wants to know which personas have been reliable. This is what turns persona verdicts into track records.
---

# persona-retro

> **Shared references.** This skill cites files like `memory.md`. They live at
> `.claude/persona-council/<file>` when installed with `npx persona-council init`,
> or at `${CLAUDE_PLUGIN_ROOT}/reference/<file>` when installed as a plugin.

Close the loop. A council nobody ever checks is just a more elaborate way to
have an opinion.

## When this runs

- The user reports how something turned out ("we shipped the opt-in tier and it
  went fine", "that migration was a disaster").
- They ask which personas have been right.
- A decision's `revisitWhen` condition has visibly been met.
- They ask to close out or review past decisions.

You may also **offer** it, once, when the user mentions an outcome for something
you can see on record. Do not nag: one offer per conversation.

## Procedure

### 1. Find the decision

```bash
npx persona-council decisions list
```

Match on the question, not the id. If several could fit, show the candidates with
their dates and decisions and ask which. If none fit, say so - an outcome with no
decision behind it has nothing to calibrate, though you can offer to record the
decision retrospectively and mark it as such.

Only `decisions/` can carry an outcome. If what they are describing was a scratch
run, say so and offer to promote it (`memory.md`), noting that a retro on a
promoted brainstorm is weaker evidence because nobody committed to it at the time.

### 2. Read what the panel actually said

```bash
npx persona-council decisions show <id>
```

You need every seat's concerns, because the retro's job is to mark each one
realized or not. Do not work from the summary; work from the verdicts.

### 3. Ask what happened

Three questions, in one round:

- What did you actually do? (as proposed, modified, or not at all)
- How did it turn out - good, mixed, bad, or too early to say?
- Which of the concerns raised actually materialized?

For the third, **list the concerns and ask them to be marked**, rather than
asking an open question. People do not spontaneously remember what a persona
warned about four months ago, and an unmarked concern is a wasted signal.

> The panel raised four concerns. Which of these actually happened?
> 1. sales-lead — renewals become renegotiations
> 2. finance-lead — expansion revenue is unforecastable
> 3. customer-advocate — the ~40 accounts whose bills rise will churn
> 4. (blind spot) support load from unpredictable invoices

`too-early` is a legitimate result. Record it, keep the decision open, and
suggest when to look again.

### 4. Write the outcome

Write `outcome.json` in the decision's directory, in the shape given in
`memory.md`. Rules:

- **Only mark `realized: true` for things that actually happened**, not things
  that plausibly could have. Generous marking destroys the signal - and the
  signal is the only reason any of this is worth doing.
- Record concerns that materialized *and were not raised by anyone* under
  `blindSpotsHit`. Those are the most valuable line in the whole file: they show
  what the roster structurally cannot see.
- Keep `resultSummary` factual. Numbers if there are any.

### 5. Report what it changed

Show the updated track records:

```bash
npx persona-council calibration
```

Then say what it means in one or two lines - which persona is earning its seat,
which is crying wolf, which blind spot keeps recurring. If a pattern is now
clear, propose a fix and let the user decide:

> `sales-lead` has opposed all four pricing decisions and none of its concerns
> landed. Want me to loosen its mandate, or is that caution doing its job?

**Never edit a persona automatically from its track record.** A persona that
silently drifts is worse than a stale one: nobody knows what they are asking any
more. Propose, then wait.

## Recurring blind spots

If the same blind spot appears in two or more retros, that is a missing seat, not
a bad persona. Say so and offer to build it:

> Support load has now been the blind spot in three decisions. There is no seat
> in these rosters that carries it. Want me to build one?

That is the single most valuable thing this skill produces.
