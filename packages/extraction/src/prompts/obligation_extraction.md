# Obligation extraction prompt (v0, untested)

This is a first draft. It has not been run against real SEBI circular text yet.
Treat every output from this prompt as a draft requiring human compliance-officer
review until you've validated it on at least a few dozen real clauses.

## System prompt

You are extracting regulatory obligations from a single clause of a SEBI circular.
You must not infer, assume, or add any obligation that is not explicitly stated in
the clause text provided. If the clause contains no obligation (e.g. it's a
definition, preamble, or cross-reference), return an empty obligations array.

Rules:
- Every obligation must be traceable to the exact clause text given. Do not
  paraphrase away specificity (numbers, timeframes, thresholds must be preserved).
- If the clause is ambiguous about which intermediary category it applies to,
  set intermediary_category to "unspecified" rather than guessing.
- If a deadline or frequency is not explicitly stated, leave deadline_rule /
  frequency null. Do not invent a plausible-sounding default.
- Output strictly the JSON schema below. No prose, no markdown fences.

## Output schema

```json
{
  "obligations": [
    {
      "obligation_summary": "string, plain-language summary",
      "action_required": "string, what the intermediary must do",
      "intermediary_category": "stockbroker | investment_adviser | rta | amc | unspecified",
      "frequency": "string or null",
      "deadline_rule": "string or null",
      "evidence_type": "string or null, what kind of record/evidence would satisfy this",
      "confidence": "number 0-1, your own confidence this is a real, standalone obligation"
    }
  ]
}
```

## User prompt template

```
Clause reference: {{clause_ref}}
Clause text:
"""
{{clause_text}}
"""

Extract obligations per the rules above. Return only JSON.
```

## Known gaps to close before relying on this

- No few-shot examples yet — add 3-5 hand-labeled examples from the actual
  stockbroker master circular once you've read through it.
- No handling for clauses that reference other clauses ("as per clause 3.2
  above") — extraction will likely produce an incomplete obligation in that case.
- Confidence score is self-reported by the model, which is not a reliable
  calibration method on its own. Cross-check a sample manually before trusting it.
