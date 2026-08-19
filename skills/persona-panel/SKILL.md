---
name: persona-panel
description: Convene several personas on one question using a fanout, chained red-team, or multi-round roundtable topology, then synthesize a chairman verdict with a consensus-versus-dissent table and blind spots. Use when the user wants a panel, council, debate, focus group, multiple perspectives, red team, or a decision weighed from several angles, and when a single persona is not enough.
---

# persona-panel

> **Shared references.** This skill cites files like `resolving-personas.md`.
> They live at `.claude/persona-council/<file>` when installed with
> `npx persona-council init`, or at `${CLAUDE_PLUGIN_ROOT}/reference/<file>`
> when installed as a plugin. Try the first path, fall back to the second.

Convene a group of personas on one question and report what they actually
disagree about.

Read `.claude/persona-council/panel-topologies.md` before dispatching, and
`.claude/persona-council/independence.md` before writing the payload. Both are
short and both change what you do.

## Procedure

### 1. Parse the request

Accept flags or plain language, equivalently:

```
/persona-panel --personas="vc-skeptic,sre-oncall,product-lead" --mode=fanout --prompt="Should we ship this?"
"get the VC, the SRE and the PM to weigh in on whether we should ship this"
```

Defaults from `.claude/persona-council.config.json`: `panel.defaultMode`
(`fanout`), `panel.maxPersonas` (7), `panel.maxRounds` (3),
`panel.requireDissenter`, `panel.anonymizeRoundTable`.

If no personas are named, propose a roster from what exists and say why each
seat is there. Deliberately pick seats with conflicting stakes - a roster that
agrees by construction produces an expensive echo.

### 2. Validate the roster, then confirm

Resolve every persona first (`.claude/persona-council/resolving-personas.md`).
If any is missing, stop before spawning anything: report which ones, list close
matches, offer `persona-create`. Half a panel is not a panel - the synthesis
would silently omit a viewpoint the user asked for.

Refuse over `panel.maxPersonas` seats and say why: past roughly seven, verdicts
correlate and synthesis quality drops faster than coverage improves.

Then state the plan and the cost before dispatching:

> Panel: vc-skeptic, sre-oncall, product-lead. Mode: fanout. That's 3 parallel
> sub-agents plus a chairman. Go?

Skip the confirmation only if the user has already specified everything
explicitly - but still print the line so the spend is visible.

### 3. Build one payload

One neutral payload, identical for every seat. Same rules as `persona-ask`:
verbatim question, artifact, named attachments, facts only. Nothing about what
you expect, what the user wants, or who else is on the panel.

### 4. Run the topology

Follow `panel-topologies.md` exactly for `fanout`, `chain`, or `roundtable`.

Dispatch concurrent seats **in a single message** so they run in parallel. Every
seat gets: its full persona file, the payload, and the verdict contract from
`.claude/persona-council/verdict-contract.md`.

Announce round transitions in roundtable mode so long runs stay legible.

### 5. Chairman synthesis

Spawn a final sub-agent as chairman with every verdict and no other context. Its
output is specified in `panel-topologies.md`: decision, consensus/dissent table,
agreements, factual vs value disputes, blind spots, action plan, confidence
warning.

Two rules the chairman must not break:

- **Unanimity gets flagged, never celebrated.** If every seat agreed, the report
  says so explicitly and asks whether that reflects the proposal or the roster.
- **Minority positions survive with attribution.** A single correct objection is
  the whole reason to run a panel; it does not get averaged away.

### 6. Persist

Write both a machine record and a readable one to the configured memory path
(default `.claude/memory/`). Get a timestamp with `date -u +%Y%m%dT%H%M%SZ` -
do not invent one.

- `.claude/memory/panel-<timestamp>-<slug>.json`
- `.claude/memory/panel-<timestamp>-<slug>.md` - the transcript people read
- `.claude/memory/latest-panel.json` - a copy of the most recent run

```json
{
  "id": "panel-20260819T101500Z-ship-decision",
  "timestamp": "2026-08-19T10:15:00Z",
  "question": "<verbatim>",
  "mode": "fanout",
  "rounds": 1,
  "personas": [{ "id": "sre-oncall", "source": "local", "version": 1 }],
  "verdicts": [
    { "persona": "sre-oncall", "verdict": "oppose", "confidence": "high",
      "concerns": [{ "blocking": true, "text": "..." }],
      "changeMyMind": "...", "summary": "..." }
  ],
  "synthesis": { "decision": "...", "consensus": [], "dissent": [],
                 "factualDisputes": [], "valueDisputes": [], "blindSpots": [],
                 "actionPlan": [], "unanimityFlag": false },
  "cost": { "subAgents": 4 }
}
```

Trim the memory directory to `memory.retain` entries (default 50), oldest first.
Never delete `latest-panel.json`.

### 7. Present

Lead with the decision and the dissent table - that is what the user came for.
Then blind spots and the action plan. Then the path to the transcript. Keep
individual verdicts collapsed or brief; the full text is in the transcript file.

Close with one line on what the panel could not see, given the roster and the
isolation.

## Referring back

If the user asks about a previous panel, read `.claude/memory/`. Do **not** feed
prior verdicts into a new panel's payload by default - personas that see their
own past positions defend them instead of re-judging. Only include prior results
if the user explicitly asks for continuity, and say clearly in the payload that
they are prior positions open to revision.

## Failure handling

- A seat returns nothing or errors: report which seat, synthesize the rest, and
  state plainly that the roster was incomplete. Never silently drop a seat.
- Every seat returns `insufficient-information`: that is the finding. Report it,
  and list the union of what they said was missing.
- The user aborts mid-panel: persist whatever completed, marked partial.
