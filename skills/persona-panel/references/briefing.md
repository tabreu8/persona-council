# The brief: gather before you dispatch

A seat can only judge what it was handed. The most common way a panel wastes
money is dispatching a thin payload and getting back four variations of
"insufficient information" - which is a correct answer to a question that should
never have been asked that way.

So there is a step before dispatch: build the **fact pack**.

## What goes in

1. **The question, verbatim.** The user's words, not your paraphrase.
2. **The artifact.** The plan, doc, diff, or options - inline or by absolute path.
3. **The standard**, if the framing is `gate`. Verbatim.
4. **Facts the seats cannot look up.** Numbers, constraints, dates, who decided
   what already. This is the part you have to go and get.
5. **What is deliberately out of scope**, so seats do not spend their answer
   relitigating a settled question.

## Going and getting it

Before dispatching, ask yourself what a competent person in any of these seats
would immediately want to know, and whether you can find it cheaply:

- Is there a number in the repo, the docs, or a linked tool that settles a
  likely dispute before it starts?
- Has this been decided before? Check `.claude/memory/decisions/` - and cite it
  to the **user**, not to the seats (see `memory.md` on anchoring).
- Is there an obvious missing input the user can supply in one line?

If a critical fact is missing and cheap to obtain, get it or ask for it *before*
spending N sub-agents. One question to the user beats four "insufficient
information" verdicts.

If it is missing and expensive, say so and dispatch anyway, with the gap stated
in the payload: seats should know what they are working without.

## What stays out

Everything in `independence.md` still applies, and the brief is where it is
easiest to slip. Facts, not framing. The test survives verbatim:

> Would this sentence still be in the brief if the user were hoping for the
> opposite answer?

Specifically, none of this belongs in a fact pack: how confident the user is,
how much work has already gone in, what the deadline pressure is, what you think,
or what a previous panel concluded.

Deadline and sunk cost are the two that feel most like facts and do the most
damage. "We've already built most of it" is not context; it is an argument, and
a good seat would tell you it is a fallacy.

## Say what you gathered

When presenting results, list what went into the brief. It is the only way the
user can tell the difference between "the panel disagreed with me" and "the panel
was working from half the picture".
