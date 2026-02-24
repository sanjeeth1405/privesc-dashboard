'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const router = useRouter()
  const [otp,         setOtp]         = useState(['','','','','',''])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [org,         setOrg]         = useState('')
  const [userId,      setUserId]      = useState('')
  const [timer,       setTimer]       = useState(600)
  const [maskedEmail, setMaskedEmail] = useState('')
  const inputs = useRef([])

  useEffect(() => {
    setOrg(sessionStorage.getItem('_org') || '')
    setUserId(sessionStorage.getItem('_uid') || '')
    setMaskedEmail(sessionStorage.getItem('_email') || '')
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  function handleInput(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
    if (!val && i > 0) inputs.current[i - 1]?.focus()
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next  = [...otp]
    text.split('').forEach((c, i) => { next[i] = c })
    setOtp(next)
    inputs.current[Math.min(text.length, 5)]?.focus()
    e.preventDefault()
  }

  async function submit(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) { setError('Enter all 6 digits'); return }
    if (!userId) { router.push('/login'); return }
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: code }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      sessionStorage.clear()
      router.push('/dashboard')
    } catch { setError('Network error') }
    finally  { setLoading(false) }
  }

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <span style={{ border:'2px solid var(--accent)', borderRadius:'4px', padding:'4px 8px', marginRight:'10px' }}>🛡</span>
          PRIVESC&nbsp;<span style={{ color:'var(--text2)' }}>DETECTOR</span>
        </div>
        <div className="auth-title">// OTP VERIFICATION</div>
        {org && (
          <div style={{ display:'inline-block', fontFamily:"'Share Tech Mono',monospace", fontSize:'.68rem', color:'var(--purple)', background:'rgba(189,147,249,.1)', border:'1px solid rgba(189,147,249,.2)', borderRadius:'3px', padding:'3px 10px', marginBottom:'.75rem' }}>
            {org}
          </div>
        )}
        <p className="auth-sub">
          A 6-digit OTP was sent to your email{' '}
          <span style={{ color:'var(--accent)' }}>{maskedEmail || '...'}</span>
        </p>
        <form onSubmit={submit}>
          <div style={{ display:'flex', gap:'10px', justifyContent:'center', margin:'1.5rem 0' }} onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input key={i} ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => e.key === 'Backspace' && !otp[i] && i > 0 && inputs.current[i - 1]?.focus()}
                style={{
                  width:'52px', height:'60px', textAlign:'center',
                  fontSize:'1.5rem', fontFamily:"'Share Tech Mono',monospace",
                  background:'var(--bg3)', border:`2px solid ${d ? 'var(--accent)' : 'var(--bord2)'}`,
                  borderRadius:'6px', color: d ? 'var(--accent)' : 'var(--text)',
                  outline:'none', transition:'border-color .15s',
                }}
              />
            ))}
          </div>
          <div style={{ textAlign:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:'.72rem', color:'var(--text2)', marginBottom:'1rem' }}>
            {timer > 0
              ? <span>Expires in <span style={{ color: timer < 60 ? 'var(--red)' : 'var(--yellow)' }}>{mm}:{ss}</span></span>
              : <span style={{ color:'var(--red)' }}>OTP expired — go back and login again</span>
            }
          </div>
          {error && <div className="auth-error" style={{ marginBottom:'1rem' }}>⚠ {error}</div>}
          <button className="btn btn-primary auth-btn-full" type="submit" disabled={loading || timer === 0}>
            {loading ? 'VERIFYING...' : 'VERIFY & LOGIN →'}
          </button>
        </form>
        <button className="btn btn-secondary auth-btn-full" style={{ marginTop:'.75rem' }}
          onClick={() => router.push('/login')}>← Back to Login</button>
      </div>
    </div>
  )
}
