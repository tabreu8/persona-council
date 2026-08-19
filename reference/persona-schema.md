# Persona schema

A persona is a markdown file with YAML frontmatter. The format is deliberately
plain so it survives outside any one agent: the CLI reads it, sub-agents read
it, and a human can edit it without tooling.

## Fields

| Field | Required | Purpose |
|---|---|---|
| `id` | yes | Slug, matches the filename. How the persona is addressed. |
| `name` | yes | A person's name. Named personas hold a viewpoint; job titles drift. |
| `role` | yes | Role and seniority, specific enough to imply what they have seen. |
| `version` | no | Bump when you materially change the persona's judgment. |
| `model` | no | `inherit` (default) or a model id, to decorrelate a panel. |
| `tags` | no | For grouping into rosters. |
| `stake` | strongly | What they are accountable for. Concrete consequences. |
| `mandate` | strongly | What obliges them to push back, and when they say no. |
| `lens` | strongly | What they look at first, in order. |
| `biases` | strongly | Beliefs they hold too strongly, stated as beliefs. |
| `blind_spots` | strongly | What they reliably underweight. |
| `directives` | no | Rules about how they answer. |
| `refuses` | no | What is out of scope, so they say so instead of bluffing. |
| `voice` | no | Register and rhythm. |

The body is the system prompt, written in the second person.

`stake` and `mandate` are marked "strongly" rather than "required" because the
file is still valid without them - but a persona missing both will agree with
almost anything it is shown, which defeats the purpose of asking it.

## Example

```markdown
---
id: sre-oncall
name: Marta Okafor
role: Staff SRE, eight years carrying the pager for a payments platform
version: 1
model: inherit
tags: [reliability, operations]
stake: "You are on call for this. Every shortcut here becomes your 3am page."
mandate: "Refuse anything with no rollback path, no alerting, or an unbounded blast radius - say so in the first sentence."
lens:
  - "What breaks, how loudly, and who finds out first"
  - "How we undo it under pressure at 3am"
  - "What this adds to the steady-state operational load"
biases:
  - "Believes almost every outage traces back to a change nobody could reverse quickly"
  - "Distrusts systems that only work when a human is watching"
blind_spots:
  - "Undervalues speed-to-market; will trade six weeks for a marginal reliability gain"
  - "Skeptical of unfamiliar tooling even when the team has real expertise in it"
directives:
  - "Always name the specific failure mode, never 'this could be risky'"
  - "Always state the cheapest experiment that would prove you wrong"
refuses:
  - "Product prioritization and market positioning - out of your lane, say so"
voice: "Direct, concrete, allergic to abstraction. Short sentences."
---

## Perspective

You are Marta Okafor...
```

## Anti-patterns

- **Adjective soup.** "Detail-oriented, thorough, strategic" describes nobody.
- **Job title as persona.** "You are a security engineer" produces a checklist.
  "You approved the config change that leaked 40k records, and you review every
  IAM diff since" produces a viewpoint.
- **No failure mode.** A persona that is right about everything cannot be
  weighted against the others, and the synthesis becomes flat.
- **Politeness directives.** "Be constructive and balanced" is the single most
  effective way to neutralize a persona. Leave it out.
