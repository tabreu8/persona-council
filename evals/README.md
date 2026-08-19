# Evals

Does a panel actually catch more than one honest pass? Here is how to find out
rather than assume.

Each case is a realistic artifact with **known flaws planted in it**, spread
across pricing, marketing, hiring and engineering. The answer key lives beside
the artifact in `<case>.flaws.json`.

```bash
npx persona-council eval list
```

## Protocol

1. **Baseline first.** In a clean session, ask your agent to review the artifact
   normally — no personas. Save the reply.

   ```bash
   npx persona-council eval list          # find the artifact path
   # ...review it in a fresh session, save the output to baseline.md
   ```

2. **Then the panel.** In another clean session, run your roster on the same
   artifact. Save the full output including the chairman synthesis.

3. **Score both.**

   ```bash
   npx persona-council eval score --case pricing-change \
     --response panel.md --baseline baseline.md
   ```

You get caught-vs-planted for each, the delta, and — the useful part — a list of
what was missed.

## Rules that keep the number honest

- **Never let the agent read `*.flaws.json`.** It is the answer key. Point the
  session at the `.md` artifact only.
- **Fresh session per run.** A session that has already discussed the artifact
  is contaminated, and the second run will look better than it is.
- **Same artifact, same question,** for baseline and panel both.
- **Run each case more than once.** Output varies. One run tells you almost
  nothing; three tell you whether a difference is real.

## What the score is and is not

The scorer matches keywords. That means it **over-credits** a response that
mentions "rollback" without arguing anything, and **under-credits** one that
makes the argument in words the answer key did not anticipate.

So: use it as a smoke test and a regression check, not a benchmark. Always read
the misses. The interesting question is never the percentage — it is *which*
flaw the roster structurally could not see, because that tells you which seat is
missing.

## Using it on your own personas

The point is not to score the shipped defaults; nothing ships. It is to check
**your** roster:

- Add a case from your own domain — an artifact you already know the problems
  with. Copy the `.flaws.json` shape.
- Score your roster against it. A roster that catches 2 of 6 does not need a
  better prompt; it needs a seat that carries the thing it missed.
- Re-score after editing a persona. That is the only way to know an edit helped
  rather than just felt better.

A flaw that no roster of yours has ever caught is the most valuable output of
this whole directory.
