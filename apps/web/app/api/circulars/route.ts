import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, circular_number, issued_date, intermediary_category, version
       FROM circulars ORDER BY issued_date DESC NULLS LAST`
    );
    return NextResponse.json({ circulars: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch circulars. Is the DB migrated and running?" },
      { status: 500 }
    );
  }
}

// TODO: POST endpoint to register a newly ingested circular. Not written yet
// because it depends on how ingestion ends up being triggered (CLI vs. UI
// upload) — decide that before building this out.
