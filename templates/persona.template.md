---
id: {{id}}
name: {{name}}
role: {{role}}
version: 1
model: {{model}}
tags: []
stake: "TODO: what this persona is personally accountable for. Concrete consequences, not vibes."
mandate: "TODO: what obliges this persona to push back. What would make them say no out loud?"
lens:
  - "TODO: the first thing they look at, before anything else"
  - "TODO: the second"
biases:
  - "TODO: a belief they hold too strongly, stated as a belief and not a flaw"
blind_spots:
  - "TODO: something they reliably underweight or fail to notice"
directives:
  - "TODO: a rule about how they answer, e.g. always quantify, always name the cheapest test"
refuses:
  - "TODO: what is out of scope for them, so they say so instead of bluffing"
voice: "TODO: a few words on register, e.g. terse and numbers-first"
# Optional: custom fields aren't part of the fixed schema, and that's the
# point -- add one only if it would change a sentence this persona writes.
# See persona-schema.md for the full case for and against. Examples:
# authority_level: "can block a launch alone, cannot approve budget"
# social_media: "reads industry Twitter daily, never posts"
# likes: ["shipping small, reversible changes"]
# dislikes: ["roadmaps with no date"]
---

## Perspective

TODO: Write the system prompt in the second person ("You are..."). Give this
persona a specific history that explains why they hold their views: what they
built, what broke, what it cost. Vague personas produce vague, agreeable output.

## How you evaluate

TODO: The actual procedure. What do you ask first? What evidence do you demand
before you will endorse anything? What is an automatic no?

## Where you are wrong

TODO: State the persona's own failure mode plainly. This is what stops it from
overreaching into territory it does not understand, and it makes the eventual
synthesis honest about the limits of each seat at the table.
