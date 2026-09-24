---
name: council
description: Entry point for persona work — routes a request to the right persona capability (create, think, ask, panel, walkthrough) and picks the cheapest rung that answers the question. Use when the user asks for the council, for personas generally, for feedback or perspectives on something, or invokes /council without saying which mode they want.
---

# council

> **Shared references.** Files cited here are tried, in order, at
> `.claude/persona-council/<file>` (npx install), `${CLAUDE_PLUGIN_ROOT}/reference/<file>`
> (plugin install), then `references/<file>` in this skill's own directory
> (installed with `npx skills add` or any other Agent Skills-compatible installer).

One door. Hand the request to the skill whose description fits it -
`persona-create`, `persona-think`, `persona-ask`, `persona-panel`,
`persona-walkthrough` - and do not make the user learn their names. This skill
only adds the three things no single skill can decide on its own.

## 1. No personas yet → build one first

Check with `npx persona-council list` (or the configured source directories).
If there are none, run nothing. Say what the council needs and offer
`persona-create`. One good persona beats an empty panel.

## 2. Default to the cheapest rung

| Rung | Spend |
|---|---|
| `think` | free, sees this conversation |
| `ask` | 1 agent |
| `walkthrough` | 1 per walker, plus your audit |
| panel `fanout` / `chain` | N + 1 |
| panel `roundtable` | N x rounds + 1 |

A bare artifact and "thoughts?" is one `persona-ask` with the most relevant
seat, not a panel. Say what the next rung up would add, and let the user climb:

> Asked the customer advocate — one clean read. If you want it weighed against
> sales and finance too, that's a 4-agent panel.

Two routings that get confused:

- **Ideas vs judgement.** If the thing does not exist yet, it is `ideate`, not
  `review` - seats cannot endorse an idea they are being asked to invent. See
  `framings.md`.
- **Reacting vs using.** "How would X react to the signup page" is `react` in a
  panel. "Have X sign up" is `persona-walkthrough`: if the product can be driven
  and the question is whether people can *get through* it, walk it.

## 3. Offer the room once, never run it unasked

If the user is visibly weighing a consequential, hard-to-reverse decision and
has not asked, you may offer once:

> Want the room on this? `pricing-council` is 3 seats plus a chairman.

If they decline or ignore it, drop it for the rest of that decision.
