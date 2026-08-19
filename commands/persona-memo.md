---
description: Render a past decision as a markdown memo or a rich shareable page
argument-hint: <decision-id> [--html]
allowed-tools: Bash(npx persona-council memo:*), Bash(npx persona-council decisions:*), Read
---

Render a decision memo.

$ARGUMENTS

Run `npx persona-council memo <id>`, adding `--html --out <path>` if a rich page
was asked for. The renderer is deterministic — never hand-write the memo, and
never edit the rendered output to say something the record does not.

If no id was given, run `npx persona-council decisions list` and ask which one.
If the user wants to share the page, offer to publish the rendered HTML as an
artifact.
