# Architecture

```
SEBI master circular (PDF)
        |
        v
[packages/ingestion]  -- clause-level chunking, preserves paragraph numbering
        |
        v
   clauses table (Postgres)
        |
        v
[packages/extraction] -- grounded LLM extraction (Groq/Llama 3.3)
        |                 every obligation cites clause_id
        v
   obligations table
        |
        +--------------------------------+
        v                                v
[apps/web]                     [packages/diff-engine]
compliance tracker             detects changes when a new
(evidence mapping,             circular version supersedes
gap alerts)                    an old one
```

## Design principle

The extraction step is deliberately constrained: the model extracts and cites,
it does not compose. If a clause doesn't contain an explicit obligation, the
correct output is an empty array, not a plausible-sounding guess. This is the
same "don't let the LLM generate numbers/facts directly" principle used in
Sarathi, applied to legal text instead of financial figures — the risk of a
hallucinated obligation is arguably worse here, since it's regulatory advice,
so the grounding constraint matters more, not less.

## Open design questions (not yet decided)

- **Clause matching across amendments.** clause_ref alone won't survive
  renumbering. Needs an embedding-similarity fallback in the diff engine.
- **Human review loop.** Every extracted obligation should probably require a
  sign-off step before it's marked "active" and shown to an intermediary.
  Not modeled in the schema yet (`status` field exists but there's no review
  workflow around it).
- **Multi-tenancy.** `organizations` table exists but there's no auth layer
  connecting a logged-in user to an org yet.

Don't treat this file as settled — it's a snapshot of current thinking, not a
spec. Update it as decisions get made.
