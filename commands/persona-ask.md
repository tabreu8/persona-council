---
description: Ask one persona in an isolated sub-agent that never sees this conversation
argument-hint: <persona-id> <question> [--file path]
---

Use the `persona-ask` skill.

$ARGUMENTS

The first token is the persona id. Everything else is the question, except
`--file` flags, which are attachments to pass into the sub-agent's clean
context. Build a neutral payload: the question verbatim, the artifact, and facts
only. Nothing about what anyone hopes the answer will be.
