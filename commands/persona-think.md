---
description: Adopt a persona inline for one turn, with a visible internal monologue
argument-hint: <persona-id> [question — defaults to the current topic]
---

Use the `persona-think` skill.

$ARGUMENTS

The first token is the persona id; the rest is the question. If no question is
given, apply the persona to whatever is currently under discussion. Answer in
the two-part protocol: `[Internal Monologue]` then the persona response. Do not
spawn a sub-agent for this.
