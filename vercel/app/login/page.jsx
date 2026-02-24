'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      sessionStorage.setItem('_uid',   d.userId)
      sessionStorage.setItem('_phone', d.maskedEmail)
      sessionStorage.setItem('_org',   d.orgName)
      router.push('/verify')
    } catch { setError('Network error') }
    finally  { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <span style={{ border:'2px solid var(--accent)', borderRadius:'4px', padding:'4px 8px', marginRight:'10px', boxShadow:'0 0 12px rgba(0,212,255,.2)' }}>🛡</span>
          PRIVESC&nbsp;<span style={{ color:'var(--text2)' }}>DETECTOR</span>
        </div>
        <div className="auth-title">// SECURE LOGIN</div>
        <p className="auth-sub">Enter credentials to access your organisation&apos;s security dashboard.</p>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input className="auth-input" placeholder="username" value={username}
              onChange={e => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <div className="auth-error">⚠ {error}</div>}
          <button className="btn btn-primary auth-btn-full" type="submit" disabled={loading}>
            {loading ? 'VERIFYING...' : 'LOGIN — SEND OTP →'}
          </button>
        </form>
        <div className="auth-divider" />
        <p className="auth-foot">No account? <Link href="/register">Register organisation</Link></p>
      </div>
    </div>
  )
}
