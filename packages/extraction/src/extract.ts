/**
 * Extraction: clause text -> grounded obligation records via Groq.
 *
 * STATUS: stub. The Groq call and JSON parsing are wired, but this has not
 * been run against real clauses yet, and there's no retry/repair logic if
 * the model returns malformed JSON (it will, eventually — plan for it).
 *
 * Usage:
 *   npm run extract -- --circular-id <uuid>
 */

import Groq from "groq-sdk";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExtractionResultSchema } from "./schemas/obligation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, "prompts", "obligation_extraction.md"),
  "utf-8"
);

async function extractFromClause(clauseRef: string, clauseText: string) {
  const userPrompt = `Clause reference: ${clauseRef}\nClause text:\n"""\n${clauseText}\n"""\n\nExtract obligations per the rules above. Return only JSON.`;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0, // deterministic extraction, not creative generation
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // TODO: add a repair pass (ask the model to fix its own malformed JSON)
    // instead of just throwing. This WILL happen in production.
    throw new Error(`Failed to parse model output as JSON: ${raw}`);
  }

  const result = ExtractionResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Model output didn't match schema: ${result.error.message}`);
  }

  return result.data.obligations;
}

async function main() {
  const circularIdArgIdx = process.argv.indexOf("--circular-id");
  const circularId = circularIdArgIdx !== -1 ? process.argv[circularIdArgIdx + 1] : null;

  if (!circularId) {
    console.error("Usage: npm run extract -- --circular-id <uuid>");
    process.exit(1);
  }

  const { rows: clauses } = await pool.query(
    "SELECT id, clause_ref, text FROM clauses WHERE circular_id = $1",
    [circularId]
  );

  if (clauses.length === 0) {
    console.error(`No clauses found for circular ${circularId}. Run ingestion first.`);
    process.exit(1);
  }

  console.log(`Extracting obligations from ${clauses.length} clauses...`);

  for (const clause of clauses) {
    const obligations = await extractFromClause(clause.clause_ref, clause.text);

    for (const ob of obligations) {
      await pool.query(
        `INSERT INTO obligations
          (circular_id, clause_id, intermediary_category, obligation_summary,
           action_required, frequency, deadline_rule, evidence_type,
           extracted_by_model, extraction_confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          circularId,
          clause.id,
          ob.intermediary_category,
          ob.obligation_summary,
          ob.action_required,
          ob.frequency,
          ob.deadline_rule,
          ob.evidence_type,
          process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          ob.confidence,
        ]
      );
    }

    console.log(`  clause ${clause.clause_ref}: ${obligations.length} obligation(s)`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
