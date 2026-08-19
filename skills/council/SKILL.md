---
name: council
description: Entry point for persona work — routes a request to the right persona capability (create, think, ask, panel, retro) and picks the cheapest rung that answers the question. Use when the user asks for the council, for personas generally, for feedback or perspectives on something, for a brainstorm from several viewpoints, for how an audience or customer would react to something, or invokes /council without saying which mode they want.
---

# council

> **Shared references.** Files cited here live at `.claude/persona-council/<file>`
> (npx install) or `${CLAUDE_PLUGIN_ROOT}/reference/<file>` (plugin install).

One door. Read the request, pick the capability, do not make the user learn five
command names.

## Routing

| They said | Route to | Why |
|---|---|---|
| "make a persona", "define X", "build me a reviewer" | `persona-create` | authoring |
| "what would X say", "think like X" (about live work) | `persona-think` | free, in-context |
| "ask X", "get an unbiased read", "second opinion" | `persona-ask` | one clean verdict |
| "the room", "panel", "council", "several views", "debate" | `persona-panel` | many seats |
| "brainstorm", "give me ideas", "what angles", "what should we call it" | `persona-panel` (`ideate`) | generative, not a judgement |
| "how would X react", "would this land", "what would customers think" | `persona-panel` (`react`) | reactions, not verdicts |
| "it went badly", "we shipped it", "who was right" | `persona-retro` | close the loop |
| "which personas do I have" | `persona-council list` | just answer it |

Ambiguous cases:

- **A bare artifact and "thoughts?"** → `persona-ask` with the single most
  relevant seat, and offer the panel as the next rung up. Do not spend five
  agents on an unprompted "what do you think".
- **They name several people** → panel, but confirm the spend first.
- **No personas exist yet** → do not run anything. Say what the council needs and
  offer `persona-create`. One good persona beats an empty panel.

## Pick the cheapest rung that works

From `panel-topologies.md`:

| Rung | Spend |
|---|---|
| `think` | free, contaminated |
| `ask` | 1 agent |
| `fanout` | N + 1 |
| `chain` | N + 1, anchored |
| `roundtable` | N x rounds + 1 |

Recommend the cheapest rung that answers the question, and say what the next rung
up would add:

> Asked the customer advocate — one clean read. If you want it weighed against
> sales and finance too, that's a 4-agent panel.

Climbing is a decision. Default down, not up.

## Then pick the framing

See `framings.md`. Map intent, do not ask them to choose:

"give me ideas" → `ideate` · "how would they react" → `react` ·
"what am I missing" → `premortem` · "tell me why I'm wrong" → `steelman` ·
"is this ready" → `gate` · "A or B" → `options` · "break this" → `redteam` ·
"have them argue" → `debate` · otherwise → `review`.

**Check the kind before anything else.** If the thing being discussed does not
exist yet, the run is generative and the verdict contract is the wrong tool -
seats cannot endorse an idea they are being asked to invent. Getting this wrong
produces fake verdicts, a false unanimity warning, and polluted track records.

Name the framing you picked in the confirmation line.

## Before you spend anything

State roster, framing, mode and agent count in one line, and wait if it is more
than a single agent:

> Pre-mortem with sales-lead, finance-lead and customer-advocate, fanout —
> 4 agents. Go?

## After

Follow `memory.md`: scratch by default, decision when they are actually deciding.
Offer the memo. Offer the artifact only if the run was of record and the config
allows it.

## Offering the council unprompted

If the user is visibly weighing a consequential, hard-to-reverse decision and has
not asked for a panel, you may offer **once**:

> Want the room on this? `pricing-council` is 3 seats plus a chairman.

Never run one unasked. One offer per decision; if they decline or ignore it, drop
it and do not raise it again.
