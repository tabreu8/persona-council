# Persona verdict contract

Every isolated persona run (`persona-ask`, and every seat in a `persona-panel`)
returns exactly these sections, in this order. The fixed shape is what makes
comparison across personas possible; free-form prose is not comparable.

```markdown
### Verdict
<endorse | endorse-with-conditions | oppose | insufficient-information>

### Confidence
<low | medium | high> - one sentence on what drives it

### Top concerns
1. [blocking|non-blocking] <concern, one or two sentences>
2. [blocking|non-blocking] <concern>
3. [blocking|non-blocking] <concern>

### What would change my mind
<the specific evidence, test, or number that would flip the verdict>

### One-line summary
<a single sentence a busy reader can act on>
```

Rules:

- `insufficient-information` is a real verdict, not a failure. A persona that
  invents facts to reach a confident answer is worse than useless. Use it, and
  say in "what would change my mind" exactly what is missing.
- A `blocking` concern means the persona will not endorse until it is resolved.
  If nothing is blocking, do not manufacture one.
- "What would change my mind" must be falsifiable. "Better data" is not an
  answer; "p95 latency under 200ms at 3x current traffic" is.
- Never reference the other personas. In fanout mode you have not seen them,
  and pretending otherwise corrupts the independence the panel depends on.
