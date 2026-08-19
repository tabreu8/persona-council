# Resolving a persona

Every persona-* skill starts here. Personas are data, not subagents: they live
in configurable sources and are injected into whatever context needs them.

## 1. Read the config

Read `.claude/persona-council.config.json`. If it is missing, assume the
defaults: one local source at `.claude/personas`, writes go there.

```json
{
  "sources": [
    { "id": "local", "type": "local", "path": ".claude/personas", "writable": true }
  ],
  "writeTo": "local",
  "cacheDir": ".claude/.persona-cache"
}
```

Sources are tried **in order**. The first source holding a matching id wins.

## 2. Resolve by source type

**`local`** - read `<path>/<id>.md`. Use Glob/Read, not a shell `find`.

**`git`** - read `<cacheDir>/<source.id>/<subpath>/<id>.md`. If the cache
directory does not exist, tell the user to run `npx persona-council sources sync`
rather than cloning it yourself.

**`mcp`** - this source has no filesystem presence. Follow the source's
`resolve` instruction verbatim, using the named MCP server's tools (for example
a Notion workspace). Then:

1. Normalize what you fetched into the persona schema. A Notion page will not
   have frontmatter; map its properties and headings onto `name`, `role`,
   `stake`, `mandate`, `lens`, `biases`, `blind_spots`, and the body.
2. Cache the normalized file at `<cacheDir>/<source.id>/<id>.md` so the rest of
   the run (and any sub-agents) can read it as a plain file.
3. If several remote entries match, list them and ask which one. Never guess -
   silently picking the wrong persona produces confident advice from the wrong
   worldview, which is the worst possible failure here.
4. If the MCP server is not connected, say so plainly and name the server. Do
   not fall back to inventing the persona.

## 3. Handle a miss

If no source has the id:

1. List the ids that *are* available, and note any that are close.
2. Offer to create it: "`vc-skeptic` doesn't exist yet. Want me to build it with
   persona-create, or did you mean `vc-analyst`?"
3. Stop and wait. Do not improvise a persona from its id - a persona the user
   never authored, giving advice under a name they trust, is a trap.

The one exception: if the user explicitly asks for an ad-hoc persona that they
do not want saved ("just think like a cranky DBA for a second"), you may
construct one in the moment. Say clearly that it is ad-hoc and unsaved.

## 4. Check it before you use it

Before injecting a persona anywhere, confirm it has `id`, `name`, `role` and a
real body. If `stake` and `mandate` are missing, use it but warn once: those
two fields are what stop a persona from agreeing with everything it is shown.
