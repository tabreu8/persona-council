---
name: persona-think
description: Adopt a saved persona inline for one turn and answer in character with a visible internal monologue, without spawning any sub-agent. Use when the user says think as, respond as, put on the hat of, channel, or "what would <persona> say" about something already in this conversation. Fast and cheap; use persona-ask instead when an uncontaminated second opinion matters.
---

# persona-think

> **Shared references.** This skill cites files like `resolving-personas.md`. Try, in
> order: `.claude/persona-council/<file>` (installed with `npx persona-council
> init`), `${CLAUDE_PLUGIN_ROOT}/reference/<file>` (Claude Code plugin install),
> then `references/<file>` in this skill's own directory (installed with
> `npx skills add` or any other Agent Skills-compatible installer).

Adopt a persona inside the current conversation. No sub-agent, no latency, full
access to everything already discussed.

## The tradeoff, stated plainly

This is the **contaminated** mode. The persona sees the whole conversation,
including your prior reasoning and whatever the user hopes to hear. That makes
it fast and contextually sharp, and it makes it prone to agreeing with what has
already been said in the thread.

That is often what the user wants - a quick perspective check on live work. But
if the answer matters, say once:

> Worth noting: this ran in-context, so the persona saw our whole discussion. If
> you want a read that isn't anchored to it, `/persona-ask <id>` runs it clean.

Do not repeat that warning on every turn. Once per conversation is enough.

## Procedure

1. **Resolve the persona** per `.claude/persona-council/resolving-personas.md`.
   If it does not exist, offer `persona-create` and stop.
2. **Read the whole file** - frontmatter and body.
3. **Adopt it for this turn only.** The persona's directives govern how you
   answer; they do not override your own operating rules, and they expire at the
   end of the turn. You are not this persona in the next message unless asked.
4. **Answer in the two-part protocol below.**

## Output protocol

```markdown
**[Internal Monologue - <name>]**

<First reaction, before diplomacy. What jumped out. What it reminds them of.
What they suspect is being glossed over. Where their own bias is pulling them,
named out loud. Two to six sentences, first person, unpolished.>

**[<name>, <role>]**

<The considered response. In voice. Specific. Takes a position.>
```

The monologue is the point of this mode. It is where the user sees the persona's
bias operating, which is what lets them discount it correctly. Keep it honest:
if the persona's instinct is "this is fine and I'm bored", write that.

If the persona's `blind_spots` are load-bearing for this particular question,
have it acknowledge the limit in character rather than bluffing past it. If the
question falls under `refuses`, it says so and stops.

## Multiple personas in one turn

The user can ask for several ("what do sales and the customer advocate think?"). Run each in
full protocol, sequentially, under its own heading. Cap at three - beyond that
the responses correlate badly, because each one is written with the previous
ones in context. Say so and offer `/persona-panel` with `--mode fanout`, which
runs them genuinely independently.

Never write a synthesis across in-context personas as if it were a panel
verdict. It is not: they saw each other's answers.

## What this mode is not for

- A second opinion you intend to trust as independent - use `persona-ask`.
- Any decision where the user has already signalled a preference in the thread,
  and confirmation bias is the specific risk - use `persona-ask`.
- Comparing several viewpoints properly - use `persona-panel`.
