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
real product, and works toward the goal the way that person would, logging what
it did, what it saw, what it expected and what it thought at every step. Then
you, the orchestrator, audit the journey.

Two roles, kept apart on purpose:

- **The walker** is the persona. It runs in a sub-agent that has never seen this
  conversation, acts through real tools, and does not know it is being studied.
- **The auditor** is you. You have seen the product from the outside, you can
  reopen any screen the walker describes, and you judge the journey. A walker
  that audits itself rationalises its own wrong turns.

Read `journey-contract.md` before dispatching. It holds the mission rules, the
walk log contract, the audit, and the record shape.

## Procedure

### 1. Resolve the personas

Per `resolving-personas.md`. On a miss, list what exists and offer
`persona-create`. Do not improvise a walker - a generic "user" walks the happy
path and finds nothing.

If no persona is named, propose one or two whose traits most plausibly change
the journey: the first-timer against the power user, the time-poor buyer
against the careful admin. Say why each.

### 2. Establish what can actually be driven

Check what action tools this session really has before promising anything:

| Product | Drive it with |
|---|---|
| web app or site | a browser tool (Playwright, a browser MCP), or fetching pages if nothing else |
| CLI or install flow | a shell, in a throwaway directory |
| API or SDK | the shell, curl, or a scratch script |
| local app in this repo | start it first (the `run` skill, if present), then one of the above |

If nothing can drive it - no browser, no running instance - say so. Offer a
**paper walkthrough** instead: the walker steps through screenshots, a design
file or the docs in order, and every `Saw` is a static frame. Label the run as
paper in the audit and the record; it tests comprehension, not interaction.

### 3. Write the mission

Per `journey-contract.md`: the goal in the persona's words, the entry point,
the tools, test credentials, stop points, and a step budget (default 25).

The goal is the user's words, translated into the persona's situation - never a
route. If the user said "see if people can find the export", the walker's goal
is "you need last month's numbers in a spreadsheet for your manager", not "find
the export button".

Always set stop points for anything irreversible or outward-facing: payment,
sending email or invites to real addresses, deleting data, publishing. If the
goal needs an account, get test credentials or a sandbox from the user. Never
use their real account unless they explicitly hand it over for this.

Keep out anything that points at the answer: known problem areas, what the team
is worried about, what a previous walker did. `independence.md` applies in full.

### 4. Confirm, then dispatch

State the plan in one line and wait:

> first-time-admin and time-poor-buyer each try to invite a teammate, starting
> at the marketing site, via the browser. Stops before any real invite is sent.
> 2 walkers, 25 steps each, then I audit. Go?

Spawn one `persona-walker` sub-agent per persona - **in a single message**, so
they run concurrently and none sees another's route. Each gets:

```
You are a specific person, using a product for real. Adopt this persona completely.

<full contents of the persona file, frontmatter and body>

---

Your goal:
<the goal, in the persona's words>

Where you start:
<entry point>

How you can act:
<the tools, named, and anything needed to use them - test credentials, sandbox>

Stop points - go up to these, log what you would do, never cross them:
<list>

Step budget: <N> actions. Give up earlier if this person would.

---

Log your journey using exactly this contract:
<the walk log contract from journey-contract.md>
```

If the harness has no `persona-walker` agent, a general-purpose sub-agent with
the same prompt and the rules from `journey-contract.md` works. It must have the
action tools; a read-only runner cannot walk anything.

### 5. Audit

Follow the audit in `journey-contract.md`, in order. The parts people skip:

- **Verify before you blame the product.** Reopen the screen, rerun the command.
  Mark each friction point `product`, `persona` or `fidelity`.
- **Did they succeed, and did they think they did?** A walker confident it
  finished the wrong task is the worst finding and the easiest to miss.
- **Check fidelity.** A walk with no wrong turns is either a great product or a
  walker that used knowledge its persona would not have. Say which, with the
  step that tells you.
- **Nothing past the first blocker has been tested.** List what no walker
  reached.

With several walkers, lead with where their journeys diverged and which persona
trait explains it. Never average journeys into a score.

### 6. Present

Lead with completion and the blockers - that is what the user came for:

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

Then the persona's own voice, briefly: where it almost quit, and what it would
tell a colleague. The full step logs belong in the memo, not the chat - offer
them.

Close with one line on what this roster could not have found: the segments not
walked, and anything past the first blocker.

### 7. Persist

Scratch by default, per `memory.md`. Record it as a decision only when the
journey gates something ("we don't ship until a first-time admin can finish
this"), so a re-walk can be compared against it.

Write `kind: "journey"` and `framing: "walkthrough"`, in the record shape from
`journey-contract.md`, with every step of every log. Get the timestamp with
`date -u +%Y-%m-%dT%H:%M:%SZ`. Then render rather than hand-write:

```bash
npx persona-council memo <id>                          # markdown
npx persona-council memo <id> --html --out journey.html
```

Journey runs never feed track records.

## Re-walking

The natural follow-up to a fix is the same persona, the same goal, the same
entry point. Offer it when the user says they changed something. Compare step
count, outcome, and whether the old blocker still appears - not how the walker
felt about it.

## Failure handling

- A walker's tools fail (browser will not launch, server down): it logs that and
  stops. Report it as an environment failure, not a product finding.
- A walker crosses a stop point: stop, tell the user exactly what it did, and do
  not dispatch again until the stop points are tightened.
- Every walker completes instantly with no wrong turns: suspect fidelity or a
  goal that leaked the route before you report a flawless product.
