'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ orgName:'', username:'', password:'', email:'' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [apiKey,  setApiKey]  = useState('')

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setApiKey(d.apiKey)
    } catch { setError('Network error') }
    finally  { setLoading(false) }
  }

  if (apiKey) return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth:'520px' }}>
        <div className="auth-logo">
          <span style={{ border:'2px solid var(--accent)', borderRadius:'4px', padding:'4px 8px', marginRight:'10px' }}>🛡</span>
          PRIVESC&nbsp;<span style={{ color:'var(--text2)' }}>DETECTOR</span>
        </div>
        <div className="auth-title">// ACCOUNT CREATED</div>
        <p className="auth-sub">Your organisation is registered. Copy your API key and run setup on each detector machine.</p>
        <div style={{ background:'var(--bg3)', border:'1px solid rgba(0,212,255,.3)', borderRadius:'6px', padding:'1rem', margin:'1rem 0' }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.62rem', color:'var(--red)', marginBottom:'8px', letterSpacing:'1px' }}>
            API KEY — COPY NOW, SHOWN ONCE ONLY
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.78rem', color:'var(--accent)', wordBreak:'break-all', lineHeight:1.6 }}>
            {apiKey}
          </div>
        </div>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'6px', padding:'1rem' }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.65rem', letterSpacing:'1px', color:'var(--text2)', marginBottom:'8px' }}>
            RUN ON EACH DETECTOR MACHINE:
          </div>
          <pre style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.75rem', color:'var(--green)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{`sudo python3 /opt/privilege-escalation-detector/forwarder/forwarder.py --setup`}</pre>
        </div>
        <Link href="/login" className="btn btn-primary" style={{ marginTop:'1.5rem', display:'flex', justifyContent:'center' }}>
          Proceed to Login →
        </Link>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth:'480px' }}>
        <div className="auth-logo">
          <span style={{ border:'2px solid var(--accent)', borderRadius:'4px', padding:'4px 8px', marginRight:'10px' }}>🛡</span>
          PRIVESC&nbsp;<span style={{ color:'var(--text2)' }}>DETECTOR</span>
        </div>
        <div className="auth-title">// REGISTER ORGANISATION</div>
        <p className="auth-sub">Create your account to receive alerts from your detector machines.</p>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label">Organisation Name</label>
            <input className="auth-input" placeholder="Acme Security Team" value={form.orgName} onChange={update('orgName')} required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input className="auth-input" placeholder="admin" value={form.username} onChange={update('username')} required autoComplete="username" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={update('password')} required autoComplete="new-password" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email (for OTP)</label>
            <input className="auth-input" type="email" placeholder="you@gmail.com" value={form.email} onChange={update('email')} required />
          </div>
          {error && <div className="auth-error">⚠ {error}</div>}
          <button className="btn btn-primary auth-btn-full" type="submit" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
          </button>
        </form>
        <div className="auth-divider" />
        <p className="auth-foot">Already registered? <Link href="/login">Login</Link></p>
      </div>
    </div>
  )
}
