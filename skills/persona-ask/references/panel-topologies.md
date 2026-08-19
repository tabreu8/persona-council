# Panel topologies

Three ways to run a group of personas. They are not interchangeable; each buys
a different thing and pays for it differently.

| Mode | Buys you | Costs | Use when |
|---|---|---|---|
| `fanout` | Independent, uncorrelated judgments | N sub-agents, one round | You want honest disagreement on a decision |
| `chain` | Depth - each seat builds on the last | N sub-agents, serial latency | You want a proposal hardened, red-teamed, then made concrete |
| `roundtable` | Engagement - seats respond to each other | N x rounds sub-agents | The disagreement itself is the thing you need to understand |

Announce the mode, the seats, and the sub-agent count **before** dispatching.
A panel is expensive; the user should get to say "just two of them" first.

## The cost ladder

Recommend the cheapest rung that actually answers the question, and say why you
did not go cheaper or dearer.

| Rung | Spend | What you get |
|---|---|---|
| `persona-think` | free | One viewpoint, contaminated by the conversation |
| `persona-ask` | 1 agent | One clean, uncontaminated verdict |
| panel `fanout` | N + 1 | Independent verdicts, synthesized |
| panel `chain` | N + 1 | A hardened artifact, anchored to seat one |
| panel `roundtable` | N x rounds + 1 | An argued-out decision with positions that moved |

Climbing a rung should be a decision, not a default. Most questions are answered
at `ask`.

---

## fanout

1. Build one neutral payload (see `independence.md`).
2. Dispatch all seats **in a single message** so they run concurrently. Each
   sub-agent gets: the persona file contents, the payload, the verdict contract.
3. No seat sees another's output. Do not tell any seat who else is on the panel.
4. Collect verdicts and hand them to the chairman.

## chain

1. Order matters and is the user's call. A sane default is
   generative -> adversarial -> practical (visionary, then auditor, then executor).
2. Seat 1 gets the payload only.
3. Every later seat gets: the original payload, plus the **artifact** produced so
   far and the previous seat's structured verdict. Not the whole transcript -
   passing raw transcripts compounds anchoring and burns context.
4. Each seat must state plainly what it changed and what it left alone.
5. Report the anchoring caveat in the output: later seats reacted to earlier
   framing and did not judge the proposal independently.

## roundtable

The expensive one. Sub-agents cannot talk to each other, so you relay.

**Round 1** - run a `fanout`. This is the independent baseline.

**Digest** - compress the round into anonymized positions:

```
Position A: <claim>. Reasoning: <two lines>. Blocking concern: <...>
Position B: ...
```

Anonymize by default (`panel.anonymizeRoundTable`). Seats that know which is the
"security expert" defer to it on security; seats reading unlabeled arguments
judge the argument. Anonymity is what makes the second round worth paying for.

**Round 2..N** - each seat gets the digest and is asked: which position is
strongest and why, where were you wrong, what do you still hold, what would
settle it. Seats may change their verdict; changing is a success, not a defeat.

**Convergence check** after each round. Stop early when either:
- no seat introduced an argument that was not already in the digest, or
- `panel.maxRounds` is reached (default 3).

Say which one ended it. "Stopped after round 2: no new arguments" is a result.

**Dissenter seat** - when `panel.requireDissenter` is true and every seat agrees
after round 1, add one adversarial seat before round 2 whose only brief is to
build the strongest available case against the emerging consensus. Label it in
the output as an injected dissenter, not a real council member.

**Chairman** - after the final round, produce the verdict (see below).

---

## Chairman synthesis

The chairman is the last sub-agent, and it sees every verdict but not the main
conversation. It outputs:

1. **Decision** - one line, with the confidence the evidence actually supports.
2. **Consensus vs dissent table** - seat, verdict, confidence, one-line position.
3. **Where they agree** - and whether that agreement is load-bearing or shallow.
4. **Where they disagree** - split into factual disputes (name the test that
   settles each) and value disputes (escalate to the user; do not adjudicate).
5. **Blind spots** - what no seat raised. This needs an explicit pass: what does
   this roster of personas structurally fail to see?
6. **Action plan** - concrete next steps, each tagged with the concern it closes.
7. **Confidence warning** - if all seats agreed, say so and say why that might
   be a property of the roster rather than of the proposal.

The chairman may not add opinions of its own beyond identifying blind spots, and
may not resolve a value dispute on the user's behalf.

## Weighting by track record

When `panel.citeCalibration` is on and decisions carry outcomes, run
`npx persona-council calibration` and give the results **to the chairman only**.

It may use them to weight - "sales-lead has opposed all four pricing decisions
and none of its concerns materialized, so this objection is discounted" - and it
must say so out loud when it does. Silent weighting is just the chairman having
opinions.

The seats never see track records. A seat told it was wrong last time gets
defensive; told it was right, overconfident. Either way you have traded the
independence you paid for. See `memory.md`.
