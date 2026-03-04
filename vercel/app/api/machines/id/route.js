// app/api/machines/[id]/route.js
// DELETE /api/machines/:id  — permanently remove a machine

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function DELETE(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Machine ID is required.' }, { status: 400 });
  }

  try {
    // Check it exists first
    const rows = await sql`SELECT id, name FROM machines WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Machine not found.' }, { status: 404 });
    }

    const machineName = rows[0].name;

    // Delete it
    await sql`DELETE FROM machines WHERE id = ${id}`;

    console.log(`Machine deleted: ${machineName} (id=${id})`);

    return NextResponse.json({ success: true, deleted: machineName });

  } catch (err) {
    console.error('DELETE /api/machines/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete machine.' }, { status: 500 });
  }
}
