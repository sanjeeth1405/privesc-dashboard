import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { generateOTP, sendOTP } from '@/lib/sms'

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    if (!username || !password)
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })

    const [user] = await sql`
      SELECT u.id, u.org_id, u.password_hash, u.email, o.name as org_name
      FROM users u JOIN organizations o ON o.id = u.org_id
      WHERE u.username = ${username}`
    if (!user)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    // Invalidate old OTPs
    await sql`UPDATE otp_codes SET used = true WHERE user_id = ${user.id} AND used = false`

    const otp       = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await sql`INSERT INTO otp_codes (user_id, code, expires_at) VALUES (${user.id}, ${otp}, ${expiresAt})`

    // Send OTP via Gmail
    const result = await sendOTP(user.email, otp)
    if (!result.success) console.error('Email failed:', result.error)

    // Mask email for display
    const [name, domain] = user.email.split('@')
    const masked = name.slice(0, 2) + '*****@' + domain

    return NextResponse.json({
      success: true,
      userId: user.id,
      maskedEmail: masked,
      orgName: user.org_name,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
