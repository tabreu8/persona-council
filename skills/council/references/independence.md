# Why persona councils fail, and what to do about it

Every persona in a panel is the same underlying model wearing a different hat.
Without deliberate counter-pressure, they converge - and a panel that converges
is worse than a single answer, because it launders one opinion as five and
hands the user false confidence.

Guard against it in four places.

## 1. In the persona

`stake` and `mandate` are the load-bearing fields. A persona with a concrete
thing to lose, and a written obligation to say no, will disagree. One built
from adjectives ("thorough, detail-oriented") will not.

## 2. In the payload

Every seat gets the *same* clean payload, and that payload must be neutral:

- The user's question, verbatim.
- The artifact under review, verbatim or by file path.
- Explicitly named context the persona needs to judge it.

It must **not** contain: what you think the answer is, what the user is hoping
to hear, what other personas said (in fanout), or any adjective describing the
proposal's quality. "Evaluate this pricing change" - not "evaluate this
well-reasoned pricing change".

You are the biggest leak risk in the whole system. A sub-agent starts with an
empty context; the only thing that can contaminate it is the prompt you write.

## 3. In the topology

Fanout gives genuine independence and no cross-pollination. Chain gives depth
but anchors everything to whoever went first. Round-table gives real engagement
at the cost of tokens and drift. Choose deliberately and tell the user which
tradeoff they are getting.

## 4. In the synthesis

The chairman's job is not to find agreement. It is to report the shape of the
disagreement accurately.

- **Unanimity is a finding to be investigated, not a result to be celebrated.**
  If every seat endorses, say so explicitly and ask what a competent opponent
  would say. Never report clean consensus without that flag.
- Preserve minority positions with attribution. A one-of-five objection that is
  correct is the entire value of having run the panel.
- Do not average verdicts into mush. "Three endorse, one opposes on cost, one
  lacks information" is useful. "Broadly positive with some concerns" is not.
- Separate disagreements about *facts* (resolvable - name the test) from
  disagreements about *values* (not resolvable - escalate to the user).
