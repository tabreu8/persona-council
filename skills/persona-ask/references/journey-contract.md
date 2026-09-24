# Journeys: a persona uses the thing, and thinks aloud

Every other contract in this directory asks a persona what it *thinks* about
something. This one asks it to *do* something - sign up, find the pricing,
export a report, install the CLI - and to say what goes through its head at
every step while it does.

It is the think-aloud usability session, with the persona as the participant
and you as the researcher behind the glass. The persona walks; you audit.

Why this is worth a separate kind of run: opinions about a product are cheap
and flattering. Behaviour is not. "The onboarding looks clean" is a review.
"Step 4: I clicked *Workspace* because I thought that was where my projects
were. It was billing. I went back and tried the avatar menu" is a finding, and
it names the exact screen to fix.

| `kind` | The persona is asked to | Contract |
|---|---|---|
| `journey` | pursue a goal in the real product, logging every step | **walk log**, below |


---

## The mission

The walker gets a **goal**, never a route.

- **Goal, in the persona's words.** "You want to see what this costs for a team
  of eight." Not "click Pricing, then toggle annual". A walker handed the steps
  is testing whether it can follow instructions, not whether the product can be
  used.
- **Entry point.** Where a real person would start: a URL, a landing page, an
  empty terminal with the package name, an App Store listing.
- **How to drive it.** Whatever action tools the environment actually has: a
  browser tool, Playwright, a shell for a CLI, curl for an API. Name it.
- **Test credentials and sandbox**, if the goal needs an account. Never the
  user's real account unless they explicitly handed it over for this.
- **Stop points.** Anything irreversible or outward-facing - paying, sending an
  email or invite to a real address, deleting data, publishing - is a stop
  point. The walker goes up to it, logs what it would do next and why, and
  does not cross it.
- **A step budget.** Default 25 actions. Real people give up; so should the
  walker. Running out of budget is a result, not a failure of the run.

What the mission must **not** contain: where the tricky part is, what the team
is worried about, what previous walkers did, or any hint of the route. Same
rule as `independence.md`: would this sentence still be here if you were hoping
the journey went badly?

## Fidelity: only what the persona could know

The walker is the same model that can read the source code. A real user cannot.

- **Use only the surfaces a user has.** The UI, the docs a user would find, the
  `--help` output, error messages. Never the repo source, the database, the
  network tab, or an internal admin page - unless the persona is someone who
  genuinely would (a developer evaluating an SDK reads the source; a finance
  lead does not).
- **Know what the persona knows.** A persona whose `blind_spots` include "has
  never used a terminal" does not type `ls` to orient itself. Jargon the persona
  would not recognise stays unrecognised, and the log says so.
- **Act at the persona's patience.** A time-poor exec skims and bails. A
  meticulous admin reads the settings page. The `lens`, `biases` and `stake`
  decide what gets read and what gets skipped.

A walker that succeeds by using knowledge the persona would not have has told
you nothing. The audit checks for this.

---

## The walk log contract

The walker returns exactly this.

```markdown
### Goal
<the goal, restated in the persona's own words - what they think they're doing>

### Log
1. **Did:** <the concrete action: clicked "Start free", typed `npx foo init`>
   **Expected:** <what the persona thought would happen, written before looking>
   **Saw:** <what actually appeared - quote the words on screen or in the terminal>
   **Thought:** <the unfiltered thinking-aloud, in voice>
   **Felt:** confident | unsure | confused | frustrated | stuck | pleased
2. ...

### Outcome
completed | completed-with-help | gave-up | blocked | stopped-at-stop-point | out-of-budget
<one or two lines: where they ended up, and whether they believe they got what they came for>

### Where I almost quit
<the step number and what nearly made them leave - or "nowhere", honestly>

### What I'd tell a colleague
<one sentence, in voice, unpolished>
```

Rules:

- **Log every action, including the wrong ones.** Backtracks, misclicks and
  dead ends are the most valuable lines in the log. A log with no wrong turns
  is either a great product or a walker that cheated - the audit will ask which.
- **`Saw` is evidence, not summary.** Quote the actual button label, heading,
  error text or command output. Screenshots, if the tools take them, go in by
  path. An audit can only verify what was quoted.
- **`Expected` is written before `Saw`.** The gap between them is the finding.
  An expectation reconstructed after the fact is always right and always useless.
- **Think in character, not as a reviewer.** "The CTA hierarchy is weak" is a
  designer's review. "Which of these two buttons is the free one?" is a person.
- **Never fix, work around, or report bugs as a tester.** The persona does not
  know it is being studied. If something is broken, it reacts the way the
  persona would - retries, gives up, goes to a competitor.
- **Stop points are logged, not crossed.** "Step 14: at the card form. I'd pay
  here if the annual price matched the one on the pricing page - it doesn't,
  so I'd close the tab" is a complete and useful ending.

---

## The audit

The walker never audits its own journey. You do - the orchestrating agent,
who has seen the product from the outside and can check the log against it.

The audit is not a summary of the log. It is a judgement of the journey's
quality, grounded in specific steps.

1. **Verify before you blame the product.** For each friction point, check what
   you cheaply can: reopen the screen, rerun the command, read the error. Sort
   each into *product* (the thing really is confusing or broken), *persona*
   (this walker misread something most of its segment would not), or
   *fidelity* (the walker used knowledge the persona would not have - which
   means the success, not the struggle, is the unreliable part).
2. **Completion, honestly.** Did they reach the goal? How many steps against
   the shortest path you can find? Did they *believe* they succeeded - and were
   they right? A persona that thinks it exported the report but exported the
   wrong one is the worst outcome in the table and the easiest to miss.
3. **Friction, ranked.** Each point: a short stable `id`
   (`members-under-billing`), the step, what happened, severity, the evidence
   (the quoted `Saw`), and the smallest fix. The id is what lets a re-walk say
   whether the problem is still there, so reuse it when the same problem shows
   up again.

   | Severity | Means |
   |---|---|
   | `blocker` | the persona could not continue, or gave up here |
   | `major` | continued, but only by luck, backtracking, or guessing |
   | `minor` | a stumble, recovered in a step or two |
   | `polish` | noticed, cost nothing, worth fixing when nearby |

4. **Expectation gaps.** Where `Expected` and `Saw` diverged. These are often
   bigger than the friction list: a product that works but not how its users
   predict will keep generating support tickets.
5. **What worked.** Steps where the persona was confident and right. These are
   what a redesign must not break.
6. **What nobody reached.** Parts of the journey no walker got to, because they
   quit or were stopped first. Nothing past the first blocker has been tested.
7. **Setup notes.** Anything about the test itself that shaped a step: a
   browser driver that showed something a user could not see, a page that
   would not load, a fixture limitation. It keeps a harness problem from being
   read as a product finding, and it must be written down, not just noticed.
8. **Fix first.** The shortest list of changes that would most improve
   completion, each tied to the friction it closes, and how to check it helped
   (usually: re-walk with the same persona and goal).

**With several walkers**, the comparison is the payoff. Where did journeys
diverge, and which persona trait explains it? A step that stops the time-poor
exec but not the admin is a finding about the product's assumptions. A step
that stops everyone is a blocker, full stop. Never average journeys into a
satisfaction score - "two completed in under ten steps, one gave up at the
plan picker" is usable; "mostly positive" is not.

---

## Recording a journey

Journey runs are almost always scratch. Record one as a decision only when it
gates something - "we don't ship the new onboarding until a first-time admin
can finish it" - so that a later re-walk can be compared against it.

```json
{
  "kind": "journey",
  "framing": "walkthrough",
  "question": "<the goal, verbatim>",
  "product": "<what was walked: URL, package, build>",
  "recordedAt": "2026-09-24T10:15:00Z",
  "journeys": [
    {
      "persona": "first-time-admin",
      "goal": "<in the persona's words>",
      "outcome": "gave-up",
      "outcomeSummary": "...",
      "steps": [
        { "n": 1, "action": "...", "expected": "...", "saw": "...",
          "thought": "...", "felt": "unsure" }
      ],
      "almostQuit": "...",
      "toAColleague": "..."
    }
  ],
  "synthesis": {
    "summary": "...",
    "completion": "...",
    "friction": [
      { "id": "members-under-billing", "persona": "first-time-admin", "step": 4, "issue": "...",
        "severity": "blocker", "cause": "product", "evidence": "...", "fix": "..." }
    ],
    "expectationGaps": ["..."],
    "worked": ["..."],
    "divergence": "...",
    "nobodyReached": ["..."],
    "setupNotes": ["<anything about the test setup that shaped a step - a driver quirk, a fixture limitation>"],
    "recommended": [{ "step": "...", "because": "..." }]
  },
  "cost": { "subAgents": 1 }
}
```

Render it like any other run: `npx persona-council memo <id> --html`. After a
fix, `npx persona-council compare <before> <after>` shows which friction ids
went away, which remain, and which are new.
