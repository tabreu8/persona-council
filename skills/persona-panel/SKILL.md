---
name: persona-panel
description: Convene several personas on one question - to judge it (fanout, chained red-team, or roundtable debate with a chairman synthesis), to brainstorm it (each seat contributes ideas only its lens produces), or to react to it (market research - how would customers, buyers, or segments respond). Use when the user wants a panel, council, debate, focus group, pre-mortem, red team, multiple perspectives, group brainstorm, idea generation from several viewpoints, or to test how something lands with different audiences.
---

# persona-panel

> **Shared references.** This skill cites files like `dispatch.md`. Try, in
> order: `.claude/persona-council/<file>` (installed with `npx persona-council
> init`), `${CLAUDE_PLUGIN_ROOT}/reference/<file>` (Claude Code plugin install),
> then `references/<file>` in this skill's own directory (installed with
> `npx skills add` or any other Agent Skills-compatible installer).

Convene a group of personas on one question and report what they actually
disagree about.

Follow `dispatch.md` for resolving, briefing, confirming, dispatching, keeping
and presenting. Read `framings.md` and `panel-topologies.md` before you pick.
What is specific to a panel:

## 1. Parse the request

Plain language is the normal case; flags are the precise one. Never ask the
user to restate a request as flags.

```
"what would sales, finance and the customer advocate say about usage pricing?"
"run it past launch-review"                       -> named roster
"what could go wrong here?"                       -> premortem framing
"have them actually argue it out"                 -> roundtable
/persona-panel --personas="sales-lead,finance-lead" --mode=fanout --framing=gate
```

**Rosters.** A named roster (`launch-review`) is read from `config.rosters` and
carries seats, often a mode and framing. `npx persona-council roster list`
shows them. A roster with `framing: walkthrough` belongs to
`persona-walkthrough`, not here. If the user keeps convening the same seats by
hand, offer once to save them as a roster.

**Framing and kind.** The framing decides the run's kind, and the kind decides
the contract each seat gets and how the chairman synthesizes:

| Kind | When | Contract |
|---|---|---|
| `evaluative` | something exists and the room judges it | `verdict-contract.md` |
| `generative` | nothing exists yet and the room produces (`ideate`) | `contribution-contracts.md` |
| `reactions` | the room encounters it as people, not judges (`react`) | `contribution-contracts.md` |

The most common misroute is running a generative request as `review`. Ideas,
angles, names or approaches are `ideate`, however much the request sounds like
a question about quality. Name the framing you picked.

**Roster proposal.** If no personas are named, propose seats and say why each is
there. Pick conflicting stakes on purpose - a roster that agrees by
construction is an expensive echo.

## 2. Check the roster size

Refuse more than `panel.maxPersonas` seats and say why: past roughly seven,
verdicts correlate and synthesis degrades faster than coverage improves. If a
single `persona-ask` would answer this, say so and let the user choose.

## 3. Run the topology

Every seat gets the same brief (`dispatch.md`, plus the standard verbatim if
the framing is `gate`) and the contract its kind calls for. Then follow
`panel-topologies.md` exactly for `fanout`, `chain` or `roundtable`. Dispatch
seats to `persona-runner`. Announce round transitions in a roundtable so long
runs stay legible.

## 4. Chairman synthesis

Spawn `persona-chairman` with every seat's output and no other context.

**On an evaluative run**, two rules the chairman must not break:

- **Unanimity gets flagged, never celebrated.** If every seat agreed, the report
  says so and asks whether that reflects the proposal or the roster.
- **Minority positions survive with attribution.** One correct objection is the
  whole reason to run a panel; it is never averaged away.

**On a generative or reactive run**, follow the synthesis in
`contribution-contracts.md` instead. Nobody was disagreeing, so do not look for
consensus: cluster, attribute, and name the ideas only one seat's lens could
have produced. Never rank ideas by how many seats liked them.

## 5. Keep and present

Brainstorms and reaction runs are almost always scratch. On an evaluative run
kept as a decision, a `revisitWhen` note tells whoever rereads the memo what
would reopen the question.

Lead with the decision and the dissent table, then blind spots and the action
plan. Keep individual verdicts brief; the full text is in the memo.

## Referring back

If the user asks about a previous panel, read the decisions store. Cite prior
decisions **to the user**, never into the seats' brief: personas shown their
own past positions defend them instead of re-judging.
