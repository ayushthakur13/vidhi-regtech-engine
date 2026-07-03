# Vidhi Build Plan — SEBI TechSprint 2026 (RegTech Track)

**Status as of this doc:** Round 1 idea submission done (deadline was July 12, 2026). Repo scaffold exists (`vidhi-regtech-engine`) but ingestion, extraction, diff, and tracker are all stubs, not real. This plan is about making them real, in order, with a working end-to-end demo at the end of every phase.

**Rule for the whole plan:** no phase is "done" until something *runs*. Not "the code is written," not "it should work," it has to actually execute against real data and produce a real result you looked at with your own eyes. Ugly and working beats clean and imaginary.

---

## Ground truth

- **Target document:** Master Circular No. `SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/90`, dated **June 17, 2025**. Published at sebi.gov.in under legal/master-circulars. This supersedes the prior Master Circular for Stock Brokers dated August 9, 2024, and folds in every directive issued up to June 10, 2025.
- **Why this document is genuinely useful, not just "the suggested one":** it rescinds specific numbered directions (119–130) from the prior appendix. That's a real, built-in test case for your diff engine's "was this repealed" logic. Don't invent a synthetic amendment example later, use this real pair.
- **Event timeline:** Global Fintech Fest / TechSprint event is **September 9–11, 2026**, Jio World Centre, Mumbai. Round 1 deadline was July 12, 2026. **Round 2 (prototype + demo) deadline is not publicly announced yet as of this doc.** Do not plan against a date that doesn't exist, plan against your own runway and assume you might get as little as 2 weeks notice.
- **Scope decision:** do not attempt to extract the whole ~200-page circular. Pick ONE chapter, KYC / recordkeeping obligations is recommended, it's clause-dense, has clear deadlines and frequencies, and is genuinely interesting to a compliance-officer judge. Go deep on one chapter instead of shallow across the whole document.

---

## Phase 1 — Ingestion has to be real (Days 1–4)

**Goal:** stop pretending the chunking regex works. Find out if it actually works.

**Tasks:**
- [ ] Download the real PDF from sebi.gov.in (legal/master-circulars/jun-2025/master-circular-for-stock-brokers)
- [ ] Isolate the KYC/recordkeeping chapter (or whichever chapter you pick)
- [ ] Wire `pdf-parse` into `packages/ingestion/src/chunk.ts` (currently unwired by design, per the code comment)
- [ ] Run the chunking regex against the real text. It will break. That's expected, not a failure.
- [ ] Fix the regex/logic until clause_ref + text pairs actually line up with the document's real numbering
- [ ] Load the results into the real Postgres `clauses` table via `docker compose up` + `db/schema.sql`

**Outcome:** a script that takes the real PDF and leaves you with real, correct rows in a real database. Not mocked. Not "should work."

**Reality check:** if you skip this phase and go straight to extraction using fake/sample text, you will find out your chunking is broken at the worst possible time, during Round 2 prep with no runway left.

---

## Phase 2 — Extraction has to be real (Days 5–8)

**Goal:** find out how good your obligation extraction actually is, with numbers, not vibes.

**Tasks:**
- [ ] Run the real chunked clauses from Phase 1 through `extract.ts` against the live Groq API (temperature 0, JSON mode, already wired)
- [ ] Build a tiny manual eval spreadsheet: clause_ref | extracted obligation | correct? (y/n) | subject correct? (y/n) | anything invented? (y/n)
- [ ] Manually check every single obligation the model produced against the source clause yourself
- [ ] Calculate a rough precision number (% of obligations that were accurate and grounded)
- [ ] If precision is low, that's your signal to build the applicability-context injection (default_subject from the circular's own applicability section) before moving on

**Outcome:** a real `obligations` table with real extracted data, plus a documented, honest precision number.

**Reality check:** this precision number is your best asset for the Round 2 pitch. "We measured 82% precision on the KYC chapter, here's our error analysis" destroys "we built an AI system" in front of any judge who's seen more than one hackathon demo. Don't skip the measurement step to save time, the measurement IS the deliverable here.

---

## Phase 3 — The hard problems have to be real (Days 9–12)

**Goal:** cross-referencing and version diffing, the two things that actually separate this from a toy RAG demo, need to work on real data.

**Tasks:**
- [ ] Build the `clause_references` table + regex/NER pass to detect "in continuation of Circular X," "as per Regulation Y" patterns in the real clauses
- [ ] Build the diff engine's keyword classifier ("rescinds," "is substituted," "stands deleted/repealed," "is amended to read as") — deterministic, no LLM needed for this pass
- [ ] Test the diff engine against the REAL Aug 2024 vs June 2025 circular pair, specifically the rescinded items 119–130
- [ ] Do NOT build the embedding-similarity fallback for renumbered clauses yet — that's a real v2 problem, not needed for a Round 2 demo

**Outcome:** you can point at two real circular versions and your system correctly labels obligations as new / modified / cancelled, using the real rescission language as proof, not a made-up example.

**Reality check:** this is the phase most teams skip entirely and just show a chatbot instead. If you get through this phase for real, you are already ahead of most of the field on technical substance.

---

## Phase 4 — The tracker has to be clickable (Days 13–16)

**Goal:** a judge needs to open a URL and click through something, not read JSON in a terminal.

**Tasks:**
- [ ] Build a real obligations table view in `apps/web` (list, filter by intermediary category, show clause citation)
- [ ] Add a basic evidence-mapping input (text field is fine, no file upload needed yet)
- [ ] Build the gap-alert view: obligations with zero linked evidence, surfaced clearly
- [ ] Resist the urge to make it pretty. Function first, styling later if time allows.

**Outcome:** a URL you can open in a browser and click through live in front of a jury.

---

## Phase 5 — The trust layer has to be real (Days 17–19)

**Goal:** prove the system knows when it doesn't know, which is your actual differentiator.

**Tasks:**
- [ ] Wire up the `status` field (draft / needs_review / active) that already exists in the schema but isn't used yet
- [ ] Route low-confidence extractions and unresolved cross-references into a visible review queue in the UI, instead of silently marking them active
- [ ] Deliberately include at least one genuinely ambiguous clause in your demo dataset and confirm the system correctly flags it instead of guessing

**Outcome:** a demo moment where the system says "I'm not sure, a human needs to check this" instead of confidently hallucinating. This is your single best pitch line: "here's a system that knows its own limits," not "here's a black box."

---

## Phase 6 — Demo and submission polish (Days 20–22, buffer included)

**Goal:** the video and the writeup have to match what the code actually does. No gap between claim and proof.

**Tasks:**
- [ ] Record the full demo: real PDF in → chunking → extraction with visible citations → diff catching the real rescission → gap alert firing → ambiguous clause routed to review
- [ ] Update the Round 2 writeup with the concrete scenario (your chosen chapter) and the real precision number from Phase 2
- [ ] Update the GitHub README so it no longer says "stub" next to things that are now real
- [ ] Final pass: does every claim in the writeup have a corresponding thing that actually happens in the video? If not, fix the writeup, don't fake the video.

**Outcome:** a submission where every sentence is backed by something that actually runs.

---

## Timeline summary

| Phase | Days | What becomes real |
|---|---|---|
| 1 | 1–4 | Ingestion (PDF → clauses in DB) |
| 2 | 5–8 | Extraction (clauses → obligations, with measured precision) |
| 3 | 9–12 | Cross-referencing + diff engine (on real circular pair) |
| 4 | 13–16 | Compliance tracker UI (clickable, not just API) |
| 5 | 17–19 | Human-review / confidence gating |
| 6 | 20–22 | Demo video + submission polish |

Total: ~3 weeks of consistent work. Round 2's actual deadline isn't public yet, so this is built against your own runway, not theirs. Adjust dates once SEBI announces the real one, don't wait for the announcement to start.

---
