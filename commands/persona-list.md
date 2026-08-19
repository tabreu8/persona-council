---
description: List available personas and check their quality
argument-hint: [--check]
allowed-tools: Bash(npx persona-council list:*), Bash(npx persona-council doctor:*), Glob, Read
---

List the personas available from the configured sources.

$ARGUMENTS

Run `npx persona-council list`. If the CLI is unavailable, read
`.claude/persona-council.config.json` and glob the local source directories
yourself.

For each persona show id, name, role and source. Flag any missing `stake` or
`mandate` — those personas will tend to agree with whatever they are shown, and
note which are grounded in evidence versus invented.

Also show saved rosters (`npx persona-council roster list`), since those are how
a group gets convened in one word.

If `--check` was passed, run `npx persona-council doctor` and
`npx persona-council calibration`, and report both — including any persona
flagged as never dissenting or as raising concerns that never materialize.
