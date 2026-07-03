/**
 * Ingestion: PDF -> clause-level chunks.
 *
 * STATUS: stub. The regex below is a starting guess at SEBI's numbering
 * conventions ("4.2", "4.2.1", "Clause 4.2(a)") — it has NOT been validated
 * against a real master circular. Before you trust this, run it against the
 * actual SEBI stockbroker master circular PDF and manually check that every
 * clause_ref lines up with the real document structure. SEBI circulars are
 * not perfectly consistent in numbering across documents, so expect to
 * iterate on this regex.
 *
 * Usage:
 *   npm run chunk -- --file path/to/circular.pdf
 */

import fs from "node:fs";
import path from "node:path";

// Matches things like "4.2", "4.2.1", "18.3(a)" at the start of a line.
// TODO: validate against real SEBI circular text; adjust as needed.
const CLAUSE_HEADER_RE = /^(\d{1,3}(?:\.\d{1,3}){0,3}(?:\([a-z]\))?)\s+(.*)/;

interface Clause {
  clauseRef: string;
  text: string;
}

function chunkByClause(rawText: string): Clause[] {
  const lines = rawText.split("\n");
  const clauses: Clause[] = [];
  let current: Clause | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(CLAUSE_HEADER_RE);
    if (match) {
      if (current) clauses.push(current);
      current = { clauseRef: match[1], text: match[2] };
    } else if (current) {
      current.text += " " + trimmed;
    }
  }
  if (current) clauses.push(current);

  return clauses;
}

async function main() {
  const fileArgIdx = process.argv.indexOf("--file");
  const filePath = fileArgIdx !== -1 ? process.argv[fileArgIdx + 1] : null;

  if (!filePath) {
    console.error("Usage: npm run chunk -- --file path/to/circular.pdf");
    process.exit(1);
  }

  // TODO: swap in real PDF text extraction (pdf-parse) once a sample
  // circular is available to test against. Left unwired deliberately —
  // don't assume this "just works" without checking output quality.
  const absPath = path.resolve(filePath);
  console.log(`[stub] Would extract text from ${absPath} and chunk by clause.`);
  console.log("[stub] Wire up pdf-parse here, then run chunkByClause() on the result.");

  // Example of what downstream code expects, using placeholder text:
  const sample = chunkByClause(
    "4.1 Every stockbroker shall maintain records for a period of five years.\n" +
    "4.2 Every stockbroker shall submit a compliance certificate annually."
  );
  console.log(JSON.stringify(sample, null, 2));
}

main();
