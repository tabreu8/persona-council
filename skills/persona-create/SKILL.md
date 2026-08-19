---
name: persona-create
description: Author a reusable persona (a named viewpoint with its own stake, biases and blind spots) and save it to the configured persona source. Use when the user asks to create, define, build, edit or improve a persona, an expert reviewer, a council seat, or "someone who thinks like X". Also use when another persona-* skill needs a persona that does not exist yet.
---

# persona-create

> **Shared references.** This skill cites files like `resolving-personas.md`.
> They live at `.claude/persona-council/<file>` when installed with
> `npx persona-council init`, or at `${CLAUDE_PLUGIN_ROOT}/reference/<file>`
> when installed as a plugin. Try the first path, fall back to the second.

Turn a rough idea ("a skeptical VC", "our security lead") into a persona file
sharp enough that its opinions are worth reading.

The quality of every other persona-* skill is capped by the quality of what you
write here. A bland persona produces bland agreement.

## Procedure

### 1. Locate the write target

Read `.claude/persona-council.config.json` and find the source named by
`writeTo` (default: `.claude/personas`, id `local`). See
`.claude/persona-council/resolving-personas.md`.

If `writeTo` names an `mcp` source (a Notion workspace, say), the persona is
authored there using that server's tools, following the source's `resolve`
instruction in reverse. Confirm the destination with the user before writing to
anything remote - writing into someone's Notion is not undoable from here.

### 2. Offer to ground it in evidence

**Do this before interviewing.** An invented persona surfaces considerations; a
persona built from real material surfaces *your* considerations, in the words
your customers, reviewers or competitors actually use. The quality gap is larger
than any amount of prompt tuning.

Two routes, both in `.claude/persona-council/grounding.md`:

- **Material the user has** - "build it from support-tickets-q2.csv", "from
  Maria's last 50 PR comments", "read docs/competitors/". Read it, pull real
  recurring objections and real vocabulary, keep quotes for the ones you use.
- **Research you run yourself** - when they have no file to hand you, offer:

  > I can build this from what's public - their pricing page, changelog, recent
  > talks, and the one-star reviews. A few minutes. Want me to?

  Propose the specific sources and get a yes before fetching anything. Then use
  whatever you have: web search, the repo, MCP servers, issue trackers.

Record what it was built from in `evidence` and `grounded_at`. Never invent a
quote: paraphrase freely, fabricate nothing. A made-up quote is believed
precisely because it looks specific.

If the user declines both, say plainly that the persona will be an archetype
rather than a portrait, and carry on.

### 3. Interview, but briefly

You need enough to write something specific. Ask for what you cannot infer, in
one round, not one question at a time:

- What decisions will this persona be asked to weigh in on?
- What should it care about more than the rest of the room?
- What is it accountable for? What happens to *it* when the decision goes wrong?
- Where is it reliably wrong? What does it overweight?
- Is there a real person or archetype it should sound like?

If the user's request already answers most of these ("a skeptical seed-stage VC
who has been burned by pre-revenue AI companies"), draft first and ask them to
correct it. A concrete draft to react to beats an interview.

### 4. Write the file

Follow `.claude/persona-council/persona-schema.md` exactly. Non-negotiables:

- **`stake`** - a concrete consequence this persona personally absorbs. Not
  "cares about quality", but "your team takes every angry renewal call this
  produces", or "you approved the last campaign that got quoted back at us in a
  bad review", or "you signed off on the release that took checkout down for
  four hours". Whatever domain the persona sits in, it must be able to lose.
- **`mandate`** - the written obligation to disagree, and the conditions for an
  outright no. Without this the persona will endorse whatever it is shown.
- **`blind_spots`** - real ones, that cost the persona something. This is what
  lets a panel weigh its opinion instead of just stacking it.
- A body written in the second person, with a specific history that explains
  the views. Give it scars.

Never write politeness or balance directives. "Be constructive", "consider both
sides", "be balanced" - each of these measurably flattens a persona into the
house voice, which is exactly what the user already has.

Filename is `<id>.md` where `id` is the slug in the frontmatter.

### 5. Validate before writing

Check: `id` is a slug and matches the filename; `name` and `role` are present;
the body is substantive; `stake` and `mandate` are non-empty and specific.

If a file with that id already exists, show the diff you propose and ask before
overwriting. Personas accumulate tuning; silently replacing one loses it.

### 6. Show and smoke-test

Print a compact summary - id, name, role, stake, mandate, top two blind spots -
and the path written. Then offer the smoke test:

> Want me to try it? I'll ask `<id>` one question you already know the answer to,
> so you can check whether it argues the way you intended.

If the user accepts, run `persona-ask` with a question that should provoke
disagreement, not agreement. A persona that endorses everything on its first
outing is broken, and the fastest way to find out is to hand it something it
should hate.

## Editing an existing persona

Same procedure, but read the current file first and preserve what the user has
tuned. Bump `version`. State what you changed and why in one line. Do not
rewrite a persona wholesale when asked to adjust one field.

## Common request shapes

- "Create a persona for X" - full procedure.
- "Make the VC harsher" - targeted edit to `mandate` and `directives`.
- "Build me a panel for X" - whether X is infra changes, launch messaging,
  roadmap cuts or a hiring loop, create the seats one at a time, each with a
  distinct lens, then suggest a roster. Deliberately give them conflicting
  stakes; a roster that agrees by construction tells you nothing.

## This is not an engineering tool

Personas are just as useful for messaging, pricing, roadmap, hiring and writing
decisions as for technical ones - arguably more so, since there is no test suite
to settle a positioning argument. Do not default to engineering archetypes.
Build the room the *decision* needs: for a launch that might be a competitor's
head of marketing, a journalist who has heard this claim before, and the buyer
who already does not believe you.
