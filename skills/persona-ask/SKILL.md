---
name: persona-ask
description: Query one saved persona in an isolated sub-agent that sees only a clean, neutral payload, so its verdict is not anchored to the current conversation. Use when the user wants an unbiased or independent read, a second opinion, a sanity check, or a review of a document or diff by a specific persona. Supports attaching files to the persona's clean context.
---

# persona-ask

> **Shared references.** This skill cites files like `dispatch.md`. Try, in
> order: `.claude/persona-council/<file>` (installed with `npx persona-council
> init`), `${CLAUDE_PLUGIN_ROOT}/reference/<file>` (Claude Code plugin install),
> then `references/<file>` in this skill's own directory (installed with
> `npx skills add` or any other Agent Skills-compatible installer).

Run one persona in a fresh sub-agent that has never seen this conversation, and
bring back a structured verdict. The second rung of the ladder in
`panel-topologies.md`, and the right answer to most questions.

Follow `dispatch.md` for every step. What is specific to a single ask:

## The brief

The sub-agent sees the brief and nothing else, so isolation is real but
neutrality is your discipline. "Evaluate this strong campaign the user is
excited about" hands over the conclusion.

**Attachments.** `--file path/to/doc.md` (repeatable) or plain language ("show
her the draft email too"). Resolve globs yourself and pass concrete paths. If a
path does not exist, say so before dispatching. Give the sub-agent read access
to the repo when the question involves code.

## Framing and contract

Pick the framing from `framings.md` by intent and name it in your reply. One
well-chosen persona running a pre-mortem ("it's six months on and this failed -
what happened?") or a steelman is often worth more than a five-seat review.

- Evaluative framings get `verdict-contract.md`.
- `ideate` and `react` get the matching contract from
  `contribution-contracts.md`. Asking one persona to "endorse" ideas it is being
  asked to invent produces nonsense.

Dispatch to `persona-runner`, and end the prompt with:

```
You are the only persona answering. Do not hedge toward a middle position, and
do not soften a conclusion you actually hold. If you lack what you need to
judge, return insufficient-information and say precisely what is missing.
```

## Present

A card: the persona's name and role, then the contract sections unedited. Do
not summarize away the concerns or add your rebuttal inside the card. If you
disagree, say so *after* it, marked as your own view.

```markdown
> **Priya Raman** - Head of Customer Success
> ---
> **Verdict:** oppose (confidence: high)
> **Top concerns**
> 1. [blocking] ...
> **Would change my mind:** ...
> **In one line:** ...
```

## Cost and memory

One sub-agent. If the user wants several personas, do not loop this skill: use
`persona-panel --mode fanout`, which dispatches concurrently and synthesizes.

A single ask usually needs no record. Write one only if the user is deciding
something on the strength of it.
