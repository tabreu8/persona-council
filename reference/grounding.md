# Grounding a persona in evidence

An invented persona surfaces considerations. A persona built from real material
surfaces *your* considerations - the objection your actual customers raise, in
the words they use, about the thing you actually sell.

The difference in output quality is larger than any prompt tuning.

## Two ways to ground

### 1. From material the user has

```
"build the churned-customer persona from support-tickets-q2.csv"
"make a reviewer persona out of Maria's last 50 PR comments"
"read docs/competitors/ and build me their head of product"
```

Read the source. Extract, and keep quotes for the ones you use:

- **Recurring objections** - what comes up again and again, in their phrasing
- **Priorities revealed by behaviour** - what they act on, not what they claim
- **Trigger points** - what reliably makes them escalate or walk
- **Vocabulary** - the actual words; a persona that talks like your customers is
  far more recognizable than one that talks like a consultant

Volume is not the goal. Five real quotes beat fifty paraphrased ones.

### 2. From research you run yourself

The user often has no file to hand you. Offer to go and look:

> I can build this from what's public - their pricing page, changelog, the last
> few conference talks, and reviews on G2. Takes a few minutes. Want me to?

**Propose the sources before you fetch anything, and get a yes.** Research is
slow, it spends tokens, and the user may know the source is worthless. Once
approved, use whatever you have: web search and fetch, the repo itself, MCP
servers, issue trackers, docs.

Good targets by persona type:

| Building | Look at |
|---|---|
| A competitor | pricing page, changelog, careers page (what they're building), public talks |
| A customer archetype | support tickets, reviews, churn notes, sales-call summaries, community threads |
| A reviewer or maintainer | their actual review comments, commit messages, design docs |
| A regulator or auditor | the published standard, enforcement actions, guidance notes |
| A journalist or analyst | what they've written before, especially their skeptical pieces |

Grounding a *colleague* persona on that colleague's own writing needs their
agreement. Build the role, not the person, unless the user says the person is
fine with it.

## Recording what it was built from

Grounded personas carry provenance in frontmatter:

```yaml
evidence:
  - "support-tickets-q2.csv (412 tickets, Apr-Jun 2026)"
  - "G2 reviews, 1-3 star, retrieved 2026-08-19"
  - "3 churn interviews in docs/research/"
grounded_at: 2026-08-19
```

This matters more than it looks. Six months on, nobody remembers whether a
persona was built from data or invented over coffee, and those two things
deserve very different amounts of trust.

## Rules

1. **Do not invent quotes.** If you write something in quotation marks, it came
   from the source. Paraphrase is fine; fabricated evidence is not, and it will
   be believed precisely because it looks specific.
2. **Say what you could not find.** "No pricing complaints in the ticket set" is
   a finding, and it should shape the persona rather than be papered over.
3. **Ground the biases, not just the role.** The point is not "here is a customer",
   it is "here is what this customer will not let go of, and here is what they
   never notice".
4. **Note when the evidence is thin.** A persona from eight tickets is a sketch.
   Say so in `evidence` so nobody over-trusts it.
5. **Grounded does not mean neutral.** A persona built from one-star reviews is
   built from angry people. That is often exactly what you want - just name it.

## Refreshing

Sources go stale. When a grounded persona is used against a much newer artifact,
mention its `grounded_at` date and offer to refresh it. Bump `version` when you
do, and say what changed in the persona's view, not just that it was updated.
