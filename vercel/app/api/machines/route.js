// vercel/app/api/machines/route.js
// GET  /api/machines  — list all machines from api_keys table
// POST /api/machines  — add new machine + generate API key

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

// ── GET — return all rows from api_keys ───────────────────────
export async function GET() {
  try {
    const machines = await sql`
      SELECT id, machine_name, key_prefix, last_seen, created_at
      FROM api_keys
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ machines });
  } catch (err) {
    console.error('GET /api/machines error:', err);
    return NextResponse.json({ error: 'Failed to fetch machines.' }, { status: 500 });
  }
}

// ── POST — register a new machine, insert into api_keys ───────
export async function POST(request) {
  try {
    const body        = await request.json();
    const machineName = (body.machine_name || '').trim();

    // Validate
    if (!machineName) {
      return NextResponse.json({ error: 'Machine name is required.' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(machineName)) {
      return NextResponse.json(
        { error: 'Only letters, numbers, hyphens and underscores allowed.' },
        { status: 400 }
      );
    }
    if (machineName.length > 50) {
      return NextResponse.json({ error: 'Max 50 characters.' }, { status: 400 });
    }

    // Check duplicate machine name under same org
    const existing = await sql`
      SELECT id FROM api_keys WHERE LOWER(machine_name) = LOWER(${machineName})
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `A machine named "${machineName}" already exists.` },
        { status: 409 }
      );
    }

    // Generate API key  →  pk_<48 random hex chars>
    const array  = new Uint8Array(24);
    crypto.getRandomValues(array);
    const rawHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    const apiKey = `pk_${rawHex}`;

    // Hash the key before storing (SHA-256) — same as your existing key_hash column
    const keyHash  = createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 10);  // e.g. "pk_df732e3" shown in table

    // Get org_id from session/auth — adjust this to match how you get the current user's org
    // If you store org_id in a cookie or JWT, decode it here.
    // For now we read it from the existing row as a fallback.
    const orgRows = await sql`SELECT org_id FROM api_keys LIMIT 1`;
    const orgId   = orgRows.length > 0 ? orgRows[0].org_id : crypto.randomUUID();

    // Insert new row into api_keys
    const result = await sql`
      INSERT INTO api_keys (id, org_id, key_hash, key_prefix, machine_name, last_seen, created_at)
      VALUES (
        gen_random_uuid(),
        ${orgId},
        ${keyHash},
        ${keyPrefix},
        ${machineName},
        NULL,
        NOW()
      )
      RETURNING id, machine_name, key_prefix, created_at
    `;

    const newMachine = result[0];

    return NextResponse.json({
      id:            newMachine.id,
      machine_name:  newMachine.machine_name,
      key_prefix:    newMachine.key_prefix,
      created_at:    newMachine.created_at,
      api_key:       apiKey,   // ← returned ONCE only, never stored in plaintext
    }, { status: 201 });

  } catch (err) {
    console.error('POST /api/machines error:', err);
    return NextResponse.json({ error: 'Failed to create machine.' }, { status: 500 });
  }
}
