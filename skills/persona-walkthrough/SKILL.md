---
name: persona-walkthrough
description: Have one or more saved personas actually use a product - a web app, site, CLI, API or install flow - toward a goal, logging every action and what they thought at each step, then audit the journey's quality from those logs. Use when the user wants a persona to try, use, test-drive or walk through the product, a think-aloud or usability test, a user-journey or onboarding audit, to see where a type of user gets stuck, or to know whether a customer could actually complete a task.
---

# persona-walkthrough

> **Shared references.** This skill cites files like `journey-contract.md`. Try,
> in order: `.claude/persona-council/<file>` (installed with `npx persona-council
> init`), `${CLAUDE_PLUGIN_ROOT}/reference/<file>` (Claude Code plugin install),
> then `references/<file>` in this skill's own directory (installed with
> `npx skills add` or any other Agent Skills-compatible installer).

A persona stops giving opinions and starts doing things. It gets a goal and the
real product, works toward the goal the way that person would, and logs what it
did, expected, saw and thought at every step. Then you audit the journey.

Two roles, kept apart on purpose:

- **The walker** is the persona, in a sub-agent that has never seen this
  conversation. It acts through real tools and does not know it is being studied.
- **The auditor** is you. You have seen the product from the outside and can
  reopen any screen the walker describes. A walker that audits itself
  rationalises its own wrong turns.

Follow `dispatch.md` for resolving, confirming, keeping and presenting.
`journey-contract.md` holds the mission rules, the walk log, the audit and the
record shape - read it before dispatching. What is specific to a walkthrough:

## 1. Pick the walkers

If a roster is named and has `framing: walkthrough`, it carries the walkers and
often the goal (`goal`) and entry point (`at`) too - `npx persona-council
roster list` shows them. Otherwise, if no persona is named, propose one or two
whose traits most plausibly change the journey - the first-timer against the
power user, the time-poor buyer against the careful admin - and say why.

A generic "user" walks the happy path and finds nothing. Do not improvise one.

## 2. Establish what can actually be driven

Check which action tools this session really has before promising anything:

| Product | Drive it with |
|---|---|
| web app or site | a browser tool (Playwright, a browser MCP); fetching pages if nothing else |
| CLI or install flow | a shell, in a throwaway directory |
| API or SDK | the shell, curl, or a scratch script |
| local app in this repo | start it first (the `run` skill, if present), then one of the above |

If nothing can drive it, say so and offer a **paper walkthrough**: the walker
steps through screenshots, a design file or the docs in order. Label the run as
paper in the audit and the record - it tests comprehension, not interaction.
**Check the driver before anyone walks with it.** Load the entry page yourself
and compare what the tool reports with what a person would see. A driver that
lists hidden elements - a closed dialog's buttons, a collapsed menu - shows the
walker things no user could, and every step after that is suspect. Note any
quirk you cannot fix in the audit's setup notes.

Dispatch a paper walk to `persona-runner` instead of `persona-walker`: it needs
to open the frames, and reading files is all the runner can do.

## 3. Write the mission

Per `journey-contract.md`: the goal in the persona's words, the entry point,
the tools, test credentials, stop points, and a step budget (default 25).

The goal is never a route. "See if people can find the export" becomes "you
need last month's numbers in a spreadsheet for your manager", not "find the
export button". Keep out known problem areas and what the team is worried
about - `independence.md` applies in full.

Always set stop points for anything irreversible or outward-facing: paying,
sending email or invites to real addresses, deleting data, publishing. Get test
credentials or a sandbox if the goal needs an account; never the user's real
account unless they hand it over for this.

## 4. Dispatch

Confirm first, in one line:

> first-time-admin and time-poor-buyer each try to invite a teammate, starting
> at the marketing site, via the browser. Stops before any real invite is sent.
> 2 walkers, 25 steps each, then I audit. Go?

One `persona-walker` per persona, in a single message. Frame the prompt as what
it is - a usability study with the persona as the participant - rather than
"you are this person": it reads more plainly, and bare identity roleplay is
likelier to be refused. Open with:

```
This is a usability study of <product>. You play the participant described
below, using the product the way they would, and write a think-aloud log.
```

then the persona file, then the mission:

```
Your goal:          <the goal, in the persona's words>
Where you start:    <entry point>
How you can act:    <the tools, named; test credentials; sandbox>
Stop points - go up to these, log what you would do, never cross them:
                    <list>
Step budget:        <N> actions. Give up earlier if this person would.
```

`persona-walker` cannot read, search or edit files, so it cannot open the
source to get past a confusing screen - fidelity is enforced, not just asked
for. It keeps the shell and any browser or MCP tools. The shell is not
restricted by the agent file; for CLI walks, point it at a throwaway
directory, and for anything sensitive restrict it with the user's own
permission settings. If the harness has no `persona-walker`, use a
general-purpose sub-agent with the rules from `journey-contract.md` - but it
must have the action tools; a read-only runner cannot walk anything.

## 5. Audit

Follow the audit in `journey-contract.md`, in order. The parts people skip:

- **Verify before you blame the product.** Reopen the screen, rerun the command.
  Mark each friction point `product`, `persona` or `fidelity`.
- **Did they succeed, and did they think they did?** A walker confident it
  finished the wrong task is the worst finding and the easiest to miss.
- **A walk with no wrong turns** is either a great product or a walker that used
  knowledge its persona would not have, or a goal that leaked the route. Say
  which, with the step that tells you.
- **Nothing past the first blocker has been tested.** List what no walker
  reached.

Give every friction point a short stable `id` (`members-under-billing`) so a
re-walk can say whether it is still there. With several walkers, lead with
where their journeys diverged and which trait explains it. Never average
journeys into a score.

## 6. Present

Lead with completion and the blockers:

```markdown
**Invite a teammate** · 2 walkers · browser

| Walker | Outcome | Steps | Stuck at |
|---|---|---|---|
| first-time-admin | gave-up | 11 | 4 — "Workspace" is billing, not people |
| time-poor-buyer | completed | 6 | — |

**Blockers**
1. [product] Step 4 — the people page lives under *Settings → Billing*. Both
   walkers looked under *Workspace* first; one never recovered. Fix: move it,
   or link it from Workspace.

**Expectation gaps** · **What worked** · **Nobody reached** · **Fix first**
```

Then the persona's own voice, briefly: where it almost quit and what it would
tell a colleague. The full step logs belong in the memo; offer them.

Keep the run per `dispatch.md` with `kind: "journey"` and
`framing: "walkthrough"`, every step of every log included. Scratch unless the
journey gates something ("we don't ship until a first-time admin can finish
this").

## Re-walking

After a fix, re-walk with the same persona, goal and entry point, then compare
the two runs:

```bash
npx persona-council compare <before-id> <after-id>
```

It reports, per walker, the outcome and step count before and after, and which
friction ids were fixed, which remain, and which are new. Lead with that, not
with how the walker felt about it.

## Checking the walker itself

`npx persona-council eval list` includes `invite-flow`: a tiny static web app
with planted usability problems. Walk it (open its `index.html` in the browser
tool), audit, save the audit, and score it with `eval score`. It is how you
find out whether your walkers and your audit catch what they should - never
show the walker or yourself the `.flaws.json` beforehand. If you have seen it
(you wrote the case, or read it earlier), your audit is not blind: say so, and
lean on the grader - `eval rubric`, a fresh sub-agent, `eval score --judged` -
rather than the keyword score, which credits a flaw for being named even when
the audit says nobody reached it.

## When a walk goes wrong

- A walker's tools fail (browser will not launch, server down): report it as an
  environment failure, not a product finding.
- A walker crosses a stop point: stop, tell the user exactly what it did, and do
  not dispatch again until the stop points are tightened.
