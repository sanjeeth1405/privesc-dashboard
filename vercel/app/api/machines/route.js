// vercel/app/api/machines/route.js

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const machines = await sql`
      SELECT id, machine_name, key_prefix, last_seen, created_at
      FROM api_keys ORDER BY created_at ASC
    `;
    return NextResponse.json({ machines });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body        = await request.json();
    const machineName = (body.machine_name || '').trim();

    if (!machineName)
      return NextResponse.json({ error: 'Machine name is required.' }, { status: 400 });
    if (!/^[a-zA-Z0-9\-_]+$/.test(machineName))
      return NextResponse.json({ error: 'Only letters, numbers, hyphens and underscores allowed.' }, { status: 400 });
    if (machineName.length > 50)
      return NextResponse.json({ error: 'Max 50 characters.' }, { status: 400 });

    // Check duplicate
    const existing = await sql`
      SELECT id FROM api_keys WHERE LOWER(machine_name) = LOWER(${machineName})
    `;
    if (existing.length > 0)
      return NextResponse.json({ error: `A machine named "${machineName}" already exists.` }, { status: 409 });

    // Generate API key using Web Crypto API (no imports needed)
    const array  = new Uint8Array(24);
    crypto.getRandomValues(array);
    const rawHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    const apiKey = `pk_${rawHex}`;

    // Hash using Web Crypto (no node:crypto import)
    const msgBuffer  = new TextEncoder().encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    const keyHash    = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const keyPrefix  = apiKey.substring(0, 10);

    // Get org_id from existing row
    const orgRows = await sql`SELECT org_id FROM api_keys LIMIT 1`;
    const orgId   = orgRows.length > 0 ? orgRows[0].org_id : crypto.randomUUID();

    const result = await sql`
      INSERT INTO api_keys (id, org_id, key_hash, key_prefix, machine_name, last_seen, created_at)
      VALUES (gen_random_uuid(), ${orgId}, ${keyHash}, ${keyPrefix}, ${machineName}, NULL, NOW())
      RETURNING id, machine_name, key_prefix, created_at
    `;

    return NextResponse.json({ ...result[0], api_key: apiKey }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id)
      return NextResponse.json({ error: 'Machine ID is required.' }, { status: 400 });

    const rows = await sql`SELECT id, machine_name FROM api_keys WHERE id::text = ${id}`;
    if (rows.length === 0)
      return NextResponse.json({ error: 'Machine not found.' }, { status: 404 });

    await sql`DELETE FROM api_keys WHERE id::text = ${id}`;

    return NextResponse.json({ success: true, deleted: rows[0].machine_name });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
