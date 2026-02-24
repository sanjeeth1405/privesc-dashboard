import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'
import sql from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const machines = await sql`SELECT id, machine_name, key_prefix, last_seen, created_at FROM api_keys WHERE org_id=${session.orgId} ORDER BY created_at ASC`
    return NextResponse.json({ machines })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { machineName } = await req.json()
    if (!machineName) return NextResponse.json({ error: 'machineName required' }, { status: 400 })

    const rawKey  = `pk_${crypto.randomBytes(24).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const prefix  = rawKey.slice(0, 10)
    await sql`INSERT INTO api_keys (org_id, key_hash, key_prefix, machine_name) VALUES (${session.orgId}, ${keyHash}, ${prefix}, ${machineName})`
    return NextResponse.json({ success: true, apiKey: rawKey, machineName, message: 'Copy this key — shown once only.' })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
