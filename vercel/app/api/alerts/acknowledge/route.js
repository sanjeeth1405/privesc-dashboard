import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { alertId } = await req.json()
    if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })
    await sql`UPDATE alerts SET acknowledged=true, acknowledged_by=${session.username} WHERE id=${alertId} AND org_id=${session.orgId}`
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
