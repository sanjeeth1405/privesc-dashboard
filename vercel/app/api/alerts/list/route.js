import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const hours    = parseInt(searchParams.get('hours') || '24')
    const limit    = parseInt(searchParams.get('limit') || '200')
    const severity = searchParams.get('severity')
    const machine  = searchParams.get('machine')

    let alerts
    if (severity && machine) {
      alerts = await sql`SELECT * FROM alerts WHERE org_id=${session.orgId} AND severity=${severity} AND machine_name=${machine} AND created_at>=NOW()-${hours+' hours'}::interval ORDER BY created_at DESC LIMIT ${limit}`
    } else if (severity) {
      alerts = await sql`SELECT * FROM alerts WHERE org_id=${session.orgId} AND severity=${severity} AND created_at>=NOW()-${hours+' hours'}::interval ORDER BY created_at DESC LIMIT ${limit}`
    } else if (machine) {
      alerts = await sql`SELECT * FROM alerts WHERE org_id=${session.orgId} AND machine_name=${machine} AND created_at>=NOW()-${hours+' hours'}::interval ORDER BY created_at DESC LIMIT ${limit}`
    } else {
      alerts = await sql`SELECT * FROM alerts WHERE org_id=${session.orgId} AND created_at>=NOW()-${hours+' hours'}::interval ORDER BY created_at DESC LIMIT ${limit}`
    }

    return NextResponse.json({ alerts, count: alerts.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
