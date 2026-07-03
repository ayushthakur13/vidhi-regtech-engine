/**
 * Diff engine: compare obligations extracted from a new circular version
 * against the previous version's obligations, and record what changed.
 *
 * STATUS: stub. The matching strategy below (clause_ref equality) is the
 * naive first pass. It will break the moment SEBI renumbers clauses in an
 * amendment, which happens. A more robust version would match on semantic
 * similarity (embedding distance) between obligation_summary text, not just
 * clause_ref — that's the real v1 task here, not yet done.
 *
 * Usage:
 *   npm run diff -- --old-circular-id <uuid> --new-circular-id <uuid>
 */

import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

interface ObligationRow {
  id: string;
  clause_id: string;
  clause_ref: string;
  obligation_summary: string;
}

async function getObligations(circularId: string): Promise<ObligationRow[]> {
  const { rows } = await pool.query(
    `SELECT o.id, o.clause_id, c.clause_ref, o.obligation_summary
     FROM obligations o
     JOIN clauses c ON c.id = o.clause_id
     WHERE o.circular_id = $1`,
    [circularId]
  );
  return rows;
}

async function main() {
  const oldIdx = process.argv.indexOf("--old-circular-id");
  const newIdx = process.argv.indexOf("--new-circular-id");
  const oldId = oldIdx !== -1 ? process.argv[oldIdx + 1] : null;
  const newId = newIdx !== -1 ? process.argv[newIdx + 1] : null;

  if (!oldId || !newId) {
    console.error(
      "Usage: npm run diff -- --old-circular-id <uuid> --new-circular-id <uuid>"
    );
    process.exit(1);
  }

  const [oldObs, newObs] = await Promise.all([
    getObligations(oldId),
    getObligations(newId),
  ]);

  // Naive clause_ref-keyed matching. TODO: replace with embedding similarity
  // match so renumbered clauses still get matched correctly.
  const oldByRef = new Map(oldObs.map((o) => [o.clause_ref, o]));
  const newByRef = new Map(newObs.map((o) => [o.clause_ref, o]));

  const added = [...newByRef.keys()].filter((ref) => !oldByRef.has(ref));
  const removed = [...oldByRef.keys()].filter((ref) => !newByRef.has(ref));
  const potentiallyAmended = [...newByRef.keys()].filter((ref) => {
    const oldOb = oldByRef.get(ref);
    const newOb = newByRef.get(ref);
    return oldOb && newOb && oldOb.obligation_summary !== newOb.obligation_summary;
  });

  console.log(`New obligations (added clauses): ${added.length}`);
  console.log(`Removed obligations (repealed clauses): ${removed.length}`);
  console.log(`Same clause_ref, different text (needs human review): ${potentiallyAmended.length}`);

  // TODO: write results into obligation_versions table instead of just
  // printing them. Left out of the stub so you actually look at the output
  // before deciding how to store it.

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
