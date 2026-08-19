---
name: persona-ask
description: Query one saved persona in an isolated sub-agent that sees only a clean, neutral payload, so its verdict is not anchored to the current conversation. Use when the user wants an unbiased or independent read, a second opinion, a sanity check, or a review of a document or diff by a specific persona. Supports attaching files to the persona's clean context.
---

# persona-ask

> **Shared references.** This skill cites files like `resolving-personas.md`. Try, in
> order: `.claude/persona-council/<file>` (installed with `npx persona-council
> init`), `${CLAUDE_PLUGIN_ROOT}/reference/<file>` (Claude Code plugin install),
> then `references/<file>` in this skill's own directory (installed with
> `npx skills add` or any other Agent Skills-compatible installer).

Run one persona in a fresh sub-agent that has never seen this conversation, and
bring back a structured verdict.

## What isolation does and does not guarantee

A sub-agent starts empty. It sees exactly the prompt you write and nothing else -
no message history, no prior reasoning, no user preferences expressed earlier.

So the *only* way bias reaches it is through you. If you write "evaluate this
strong campaign the user is excited about", you have handed over the
conclusion. The isolation is real; the neutrality is your discipline. Treat the
payload rules below as hard requirements, not style guidance.

## Procedure

### 1. Resolve the persona

Per `.claude/persona-council/resolving-personas.md`. On a miss, list what exists
and offer `persona-create`. Do not improvise a persona to fill the gap.

### 2. Build the brief

Follow `.claude/persona-council/briefing.md`. A seat can only judge what it was
handed, and an `insufficient-information` verdict usually means the brief was
thin rather than the question unanswerable. If a critical fact is missing and
cheap to get, get it or ask for it before spending the sub-agent.

The payload itself contains, and contains only:

- **The question, verbatim.** The user's words. Not your paraphrase, which is
  where framing creeps in.
- **The artifact**, if there is one - the diff, document, plan, or code. Inline
  it or give an absolute path the sub-agent can read.
- **Attachments** the user named (`--file`, "look at X too"). Pass paths; let
  the sub-agent read them itself.
- **Bare factual context** the persona needs to judge at all: what the system is,
  who the users are, hard constraints. Facts only.

It must not contain: your opinion, the user's apparent preference, praise or
criticism of the artifact, what you expect the persona to say, what any other
persona said, or how urgently a yes is needed.

Read `.claude/persona-council/independence.md` if you are unsure whether a line
is context or contamination. The test: would this sentence still be in the
payload if the user were hoping for the opposite answer?

### 3. Dispatch

Spawn one sub-agent with a prompt in this shape:

```
You are answering as a specific persona. Adopt it completely.

<full contents of the persona file, frontmatter and body>

--- 

Question:
<verbatim question>

Artifact / attachments:
<inline content, or file paths to read>

Context:
<facts only>

---

Respond using exactly this contract:
<contents of .claude/persona-council/verdict-contract.md>

You are the only persona answering. Do not hedge toward a middle position, and
do not soften a conclusion you actually hold. If you lack what you need to
judge, return insufficient-information and say precisely what is missing.
```

Give the sub-agent read access to the repo when the question involves code.

### 4. Report

Present the verdict as a card - the persona's name and role, then the contract
sections unedited. Do not summarize away the concerns, and do not append your own
rebuttal inside the card. If you disagree with the persona, say so *after* the
card, clearly marked as your own view.

```markdown
> **Priya Raman** - Head of Customer Success
> ---
> **Verdict:** oppose (confidence: high)
> **Top concerns**
> 1. [blocking] ...
> **Would change my mind:** ...
> **In one line:** ...
```

Then, in one sentence, name what the persona *structurally could not see* from
its clean context - that is the honest cost of isolation, and the user should
weigh the verdict knowing it.

## Attachments

`--file path/to/doc.md` and repeats of it are supported, but plain language
works the same way ("ask Priya about this, and show her the draft email"). Resolve
globs yourself; hand over concrete paths. If a path does not exist, say so
before dispatching rather than letting the sub-agent flounder.

## Framing

A single seat can be asked for more than a review. From
`.claude/persona-council/framings.md`: a pre-mortem ("it's six months on and this
failed - what happened?") or a steelman ("make the strongest case against this")
from one well-chosen persona is often worth more than a five-seat review.

If the framing is generative (`ideate`) or reactive (`react`), hand the seat the
matching contract from `contribution-contracts.md` instead of the verdict
contract. Asking one persona to "endorse" ideas it is being asked to invent
produces the same nonsense it does across a whole panel.

Pick the framing from the user's intent and name it in your reply.

## Cost note

One sub-agent per call - the second rung of the ladder in `panel-topologies.md`,
and the right answer to most questions. If the user asks for several personas, do
not loop this skill: use `persona-panel --mode fanout`, which dispatches
concurrently and synthesizes properly.

## Memory

A single ask is a scratch run by default and usually needs no record at all.
Write one only if the user is deciding something on the strength of it, in which
case follow `memory.md` and record it as a decision so it can carry an outcome.
