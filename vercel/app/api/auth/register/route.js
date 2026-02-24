import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import sql from '@/lib/db'

export async function POST(req) {
  try {
    const { orgName, username, password, email } = await req.json()
    if (!orgName || !username || !password || !email)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const existing = await sql`SELECT id FROM users WHERE username = ${username}`
    if (existing.length > 0)
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

    const [org] = await sql`INSERT INTO organizations (name) VALUES (${orgName}) RETURNING id`
    const passwordHash = await bcrypt.hash(password, 12)
    await sql`INSERT INTO users (org_id, username, password_hash, email)
              VALUES (${org.id}, ${username}, ${passwordHash}, ${email})`

    const rawKey  = `pk_${crypto.randomBytes(24).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    const prefix  = rawKey.slice(0, 10)
    await sql`INSERT INTO api_keys (org_id, key_hash, key_prefix, machine_name)
              VALUES (${org.id}, ${keyHash}, ${prefix}, 'primary')`

    return NextResponse.json({
      success: true, apiKey: rawKey, orgId: org.id,
      message: 'Account created. Copy your API key — shown once only.',
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
