import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE = 'privesc_session'

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch { return null }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return await verifyToken(token)
}

export function setSessionCookie(response, token) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
}
