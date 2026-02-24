import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const hours = parseInt(searchParams.get('hours') || '24')

    const [totals] = await sql`
      SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE severity='CRITICAL')  AS critical,
        COUNT(*) FILTER (WHERE severity='HIGH')      AS high,
        COUNT(*) FILTER (WHERE severity='MEDIUM')    AS medium,
        COUNT(*) FILTER (WHERE severity='LOW')       AS low,
        COUNT(*) FILTER (WHERE acknowledged=false)   AS unacknowledged
      FROM alerts WHERE org_id=${session.orgId} AND created_at>=NOW()-${hours+' hours'}::interval`

    const machines = await sql`
      SELECT machine_name, COUNT(*) AS count FROM alerts
      WHERE org_id=${session.orgId} AND created_at>=NOW()-${hours+' hours'}::interval
      GROUP BY machine_name ORDER BY count DESC`

    const topRules = await sql`
      SELECT rule_id, rule_name, COUNT(*) AS count FROM alerts
      WHERE org_id=${session.orgId} AND created_at>=NOW()-${hours+' hours'}::interval
      GROUP BY rule_id, rule_name ORDER BY count DESC LIMIT 10`

    const trend = await sql`
      SELECT DATE_TRUNC('hour', created_at) AS hour, COUNT(*) AS count
      FROM alerts WHERE org_id=${session.orgId} AND created_at>=NOW()-${hours+' hours'}::interval
      GROUP BY hour ORDER BY hour ASC`

    return NextResponse.json({ totals, machines, topRules, trend })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
