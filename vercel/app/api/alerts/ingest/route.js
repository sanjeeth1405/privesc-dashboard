import { NextResponse } from 'next/server'
import crypto from 'crypto'
import sql from '@/lib/db'

export async function POST(req) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey)
      return NextResponse.json({ error: 'API key required' }, { status: 401 })

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
    const [keyRecord] = await sql`SELECT org_id, machine_name FROM api_keys WHERE key_hash = ${keyHash}`
    if (!keyRecord)
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    await sql`UPDATE api_keys SET last_seen = NOW() WHERE key_hash = ${keyHash}`

    const body   = await req.json()
    const alerts = Array.isArray(body) ? body : [body]
    if (alerts.length === 0)
      return NextResponse.json({ success: true, inserted: 0 })

    let inserted = 0
    for (const a of alerts) {
      await sql`
        INSERT INTO alerts (org_id, machine_name, alert_id, rule_id, rule_name, severity,
          confidence, description, pid, ppid, uid, new_uid, comm, parent_comm,
          syscall, filename, raw_timestamp)
        VALUES (${keyRecord.org_id}, ${keyRecord.machine_name}, ${a.alert_id||null},
          ${a.rule_id}, ${a.rule_name}, ${a.severity}, ${a.confidence||null},
          ${a.description}, ${a.pid||null}, ${a.ppid||null}, ${a.uid??null},
          ${a.new_uid??null}, ${a.comm||null}, ${a.parent_comm||null},
          ${a.syscall||null}, ${a.filename||null}, ${a.timestamp||null})
        ON CONFLICT DO NOTHING`
      inserted++
    }
    return NextResponse.json({ success: true, inserted })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 })
  }
}
