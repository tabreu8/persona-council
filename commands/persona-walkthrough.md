---
description: Have a persona actually use the product toward a goal, think aloud, and get the journey audited
argument-hint: <persona-id[,persona-id...]> <goal> [--at url|command] [--budget N]
---

Use the `persona-walkthrough` skill.

$ARGUMENTS

The first token names the persona, or several separated by commas. Everything
else is the goal, in plain words, except `--at` (the entry point: a URL, a
command, an app) and `--budget` (maximum actions per walker, default 25). Hand
the walker the goal, never the route. Confirm the stop points and agent count
before dispatching, then audit every log yourself.
