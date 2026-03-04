// app/api/machines/route.js
// GET  /api/machines        — list all machines
// POST /api/machines        — register a new machine

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ── GET — list all registered machines ────────────────────────
export async function GET() {
  try {
    const machines = await sql`
      SELECT id, name, key_prefix, last_seen, registered_at
      FROM machines
      ORDER BY registered_at ASC
    `;
    return NextResponse.json({ machines });
  } catch (err) {
    console.error('GET /api/machines error:', err);
    return NextResponse.json({ error: 'Failed to fetch machines.' }, { status: 500 });
  }
}

// ── POST — add a new machine ───────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();

    // Validate
    if (!name) {
      return NextResponse.json({ error: 'Machine name is required.' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Machine name can only contain letters, numbers, hyphens, and underscores.' },
        { status: 400 }
      );
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Machine name must be 50 characters or fewer.' }, { status: 400 });
    }

    // Check duplicate name
    const existing = await sql`SELECT id FROM machines WHERE LOWER(name) = LOWER(${name})`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `A machine named "${name}" already exists.` },
        { status: 409 }
      );
    }

    // Generate secure API key  →  pk_<48 hex chars>
    const array  = new Uint8Array(24);
    crypto.getRandomValues(array);
    const rawHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    const apiKey = `pk_${rawHex}`;
    const keyPrefix = apiKey.substring(0, 12);   // "pk_a1b2c3d4" shown in table

    const registeredAt = new Date().toISOString();
    const id = crypto.randomUUID();

    // Insert — store the full key (hash it in production with bcrypt/argon2)
    await sql`
      INSERT INTO machines (id, name, api_key, key_prefix, registered_at, last_seen)
      VALUES (${id}, ${name}, ${apiKey}, ${keyPrefix}, ${registeredAt}, NULL)
    `;

    return NextResponse.json({
      id,
      name,
      api_key:       apiKey,      // returned ONCE — not exposed again after this
      key_prefix:    keyPrefix,
      registered_at: registeredAt,
    }, { status: 201 });

  } catch (err) {
    console.error('POST /api/machines error:', err);
    return NextResponse.json({ error: 'Failed to create machine.' }, { status: 500 });
  }
}
