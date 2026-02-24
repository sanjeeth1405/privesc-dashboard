import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { signToken, setSessionCookie } from '@/lib/auth'

export async function POST(req) {
  try {
    const { userId, otp } = await req.json()
    if (!userId || !otp)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const [record] = await sql`
      SELECT oc.id, u.org_id, u.username, o.name as org_name
      FROM otp_codes oc
      JOIN users u ON u.id = oc.user_id
      JOIN organizations o ON o.id = u.org_id
      WHERE oc.user_id = ${userId} AND oc.code = ${otp}
        AND oc.used = false AND oc.expires_at > NOW()
      ORDER BY oc.created_at DESC LIMIT 1`

    if (!record)
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })

    await sql`UPDATE otp_codes SET used = true WHERE id = ${record.id}`

    const token = await signToken({ userId, orgId: record.org_id, username: record.username, orgName: record.org_name })
    const response = NextResponse.json({ success: true, orgName: record.org_name })
    setSessionCookie(response, token)
    return response
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
