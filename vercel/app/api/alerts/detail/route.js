import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const [alert] = await sql`SELECT * FROM alerts WHERE id=${id} AND org_id=${session.orgId}`
    if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(alert)
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
