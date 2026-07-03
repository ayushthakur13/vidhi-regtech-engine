import { NextResponse } from "next/server";
import { Pool } from "pg";

// One shared pool per server instance. Fine for a hackathon scaffold;
// revisit connection handling before this touches real traffic.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const intermediaryCategory = searchParams.get("intermediary_category");

  try {
    const query = intermediaryCategory
      ? `SELECT o.*, c.clause_ref, c.text AS clause_text
         FROM obligations o
         JOIN clauses c ON c.id = o.clause_id
         WHERE o.intermediary_category = $1
         ORDER BY o.created_at DESC`
      : `SELECT o.*, c.clause_ref, c.text AS clause_text
         FROM obligations o
         JOIN clauses c ON c.id = o.clause_id
         ORDER BY o.created_at DESC
         LIMIT 100`;

    const { rows } = await pool.query(
      query,
      intermediaryCategory ? [intermediaryCategory] : []
    );

    return NextResponse.json({ obligations: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch obligations. Is the DB migrated and running?" },
      { status: 500 }
    );
  }
}
