# Framings

Nobody wakes up wanting a "chained topology". They want to know what they are
missing before they commit.

A framing is what the room is *asked to do*. A topology is how the seats are
wired. They are independent: pick the framing from the user's intent, then the
topology that serves it.

Framings come in three kinds, and the kind decides which output contract the
seats are given. Getting this wrong is not cosmetic: a brainstorm run under an
evaluative contract files ideas under "concerns", reports a room that was never
disagreeing as suspicious unanimity, and banks a false "endorse" against every
seat's track record.

**Evaluative** — something exists; the room judges it. Contract:
`verdict-contract.md`.

| Framing | The question put to the room | Default topology |
|---|---|---|
| `review` | "What do you make of this?" | fanout |
| `premortem` | "It's six months later and this failed. Why?" | fanout |
| `steelman` | "Make the strongest case *against* my position." | fanout |
| `gate` | "Does this pass, against a standard?" | fanout |
| `options` | "Which of these should we pick, and why not the others?" | fanout |
| `redteam` | "Break this, then make it survivable." | chain |
| `debate` | "Argue it out until something gives." | roundtable |

**Generative** — nothing exists yet; the room produces. Contract:
`contribution-contracts.md`.

| Framing | The question put to the room | Default topology |
|---|---|---|
| `ideate` | "What would you try? Give me what only your seat would think of." | fanout |

**Reactive** — the room is not consulting, it is encountering. Contract:
`contribution-contracts.md`.

| Framing | The question put to the room | Default topology |
|---|---|---|
| `react` | "You just saw this. What do you actually do next?" | fanout |

Say which framing you used. "I ran this as a pre-mortem" tells the user far more
about what they are reading than "I ran a fanout panel".

---

## review
The default. Seats evaluate the artifact against their own lens and return the
verdict contract.

## premortem
The single highest-yield framing, and the most underused. Put the seats *after*
the failure, not before it - the psychology is different and it surfaces
concrete failure modes instead of vague risk.

> It is six months from now. This decision was made, and it went badly enough
> that we are holding a review. From your seat: what happened? Be specific about
> the sequence.

Then the chairman clusters causes and asks which are cheap to prevent now.
Verdicts are less useful here; the *causes* are the output.

## steelman
For when the user has already decided and wants to stress-test, not be affirmed.
Every seat is asked for the strongest honest case against the user's position -
and told plainly that "actually it's fine" is not an acceptable answer unless
they genuinely cannot construct one, in which case they say so.

Guard against the obvious failure: a steelman that is a straw man. Each seat must
state the strongest version, the one a competent opponent would actually make.

## gate
Pass/fail against a written standard - a launch checklist, a definition of done,
a compliance bar. The standard goes into the payload verbatim; without it, seats
invent their own bar and the result is meaningless.

Output is per-seat pass/fail with the specific clause that failed. The chairman
returns a single gate verdict and the shortest path to passing.

Pairs naturally with a named roster: `launch-review`, `security-gate`.

## options
Two or more concrete alternatives, judged as a set. Each seat ranks them and -
this is the part that matters - says what would have to be true for its
*second* choice to become its first.

Do not let seats invent a new option unless asked; that is a different question.

## redteam
Chained. Seat one attacks without mercy. Seat two repairs what it can. Seat three
attacks the repair. The output is a hardened artifact plus the list of attacks
that still land.

## debate
Roundtable. For when the disagreement itself is the thing you need to understand,
usually because two people on the team already disagree and want it mapped.

---

## ideate

For brainstorms: campaign angles, product bets, names, approaches, objections to
pre-empt, research questions worth asking.

Every seat is asked for ideas **its lens specifically produces**, and to say for
each one what about its seat produced it. An idea that could have come from any
seat is filler; the whole return on running a room is the idea only one lens
reaches.

Fanout, always. Seats that see each other's ideas anchor on them immediately and
the set collapses toward the first thing proposed.

The synthesis clusters rather than ranks. Do not count votes — nobody was
voting, and in a generative run the best idea is very often the one a single seat
could see. See `contribution-contracts.md`.

## react

For market research and positioning tests. The persona is not evaluating: it is
a person who just encountered the thing, and the output is **behaviour**, not
opinion.

"I'd find that interesting" is worthless. "I'd forward it to my finance lead and
not follow up" is a result. Indifference is the most common honest reaction and
the most useful one, so the contract makes room for it — a panel where every
segment is intrigued is a panel of flattering fictions.

Never average reactions into a sentiment. Report the split as behaviour.

---

## Choosing without being asked

Map intent to framing from how the user talks:

- "give me ideas" / "brainstorm" / "what angles" / "what should we call it" → `ideate`
- "how would X react" / "would this land" / "what would customers think" → `react`
- "what could go wrong" / "what am I missing" → `premortem`
- "poke holes" / "tell me why I'm wrong" → `steelman`
- "is this ready" / "does this pass" → `gate`
- "should we do A or B" → `options`
- "break this" / "harden this" → `redteam`
- "have them argue" / "get them to hash it out" → `debate`
- anything else → `review`

Name the framing in the confirmation line so the user can redirect before you
spend anything.

The most common misroute is running a generative request as `review`. If the
user is asking for something that does not exist yet — ideas, names, angles,
approaches — it is `ideate`, no matter how much the request sounds like a
question about quality.
