---
description: Author or edit a persona and save it to the configured source
argument-hint: [persona id or description, e.g. "a skeptical seed-stage VC"]
---

Use the `persona-create` skill to author a persona from this request:

$ARGUMENTS

If the request is empty, ask what the persona is for and what it should care
about more than anyone else in the room. If it names an existing persona id,
treat it as an edit: read the current file, change only what was asked, bump
`version`, and say in one line what changed.
