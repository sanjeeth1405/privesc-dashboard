// vercel/app/api/machines/[id]/route.js
// DELETE /api/machines/:id
// Deletes the row from api_keys — removes the machine AND its key_hash in one operation

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function DELETE(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Machine ID is required.' }, { status: 400 });
  }

  try {
    // Check it exists — use id::text comparison to avoid uuid cast errors
    const rows = await sql`
      SELECT id, machine_name FROM api_keys WHERE id::text = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Machine not found.' }, { status: 404 });
    }

    const machineName = rows[0].machine_name;

    // Delete the entire row — removes machine_name, key_hash, key_prefix all at once
    await sql`DELETE FROM api_keys WHERE id::text = ${id}`;

    console.log(`[api_keys] Deleted machine: ${machineName} (id=${id})`);

    return NextResponse.json({
      success: true,
      deleted: machineName,
      message: `Machine "${machineName}" and its API key have been permanently deleted.`,
    });

  } catch (err) {
    console.error('DELETE /api/machines/[id] error:', err);
    // Return actual error message so we can debug from browser
    return NextResponse.json({ error: err.message || 'Failed to delete machine.' }, { status: 500 });
  }
}
