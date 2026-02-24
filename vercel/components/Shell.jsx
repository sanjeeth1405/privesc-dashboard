'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Shell({ children }) {
  const path   = usePathname()
  const router = useRouter()
  const [footerTime,   setFooterTime]   = useState('')
  const [footerStatus, setFooterStatus] = useState('ONLINE')
  const [headerStatus, setHeaderStatus] = useState('MONITORING')
  const [dotOnline,    setDotOnline]    = useState(true)
  const [modal,        setModal]        = useState(null)

  // Footer clock — same as base.html setInterval
  useEffect(() => {
    const t = setInterval(() => {
      setFooterTime(new Date().toUTCString().slice(0, -4) + 'UTC')
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Expose openModal / ackAlert / showToast globally so inline onclick handlers work
  useEffect(() => {
    window.__openModal = async (id) => {
      try {
        const r = await fetch(`/api/alerts/detail?id=${id}`)
        if (r.status === 401) { router.push('/login'); return }
        const a = await r.json()
        setModal(a)
      } catch (e) { console.error(e) }
    }
    window.__closeModal = () => setModal(null)
    window.__ackAlert   = async (id) => {
      await fetch('/api/alerts/acknowledge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id }),
      })
      setModal(null)
      window.__onAck?.()
    }
    window.__showToast = (alert) => {
      const container = document.getElementById('toast-container')
      if (!container) return
      const sev = (alert.severity || 'LOW').toLowerCase()
      const el  = document.createElement('div')
      el.className = `toast ${sev}`
      el.innerHTML = `
        <div class="toast-header">
          <span class="toast-rule">[${alert.rule_id || ''}] ${alert.rule_name || ''}</span>
          <span class="toast-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="toast-desc">${alert.description || ''}</div>
        <div class="toast-meta">PID ${alert.pid} &nbsp;·&nbsp; ${alert.comm} &nbsp;·&nbsp; UID ${alert.uid}</div>`
      container.appendChild(el)
      setTimeout(() => el.remove(), 8000)
    }
  }, [router])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function mr(k, v) {
    return (
      <div className="detail-row" key={k}>
        <span className="detail-key">{k}</span>
        <span className="detail-val">{v ?? '—'}</span>
      </div>
    )
  }

  return (
    <>
      {/* ── Header — exact match to base.html ── */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-shield">🛡</div>
              PRIVESC&nbsp;<span style={{ color: 'var(--text2)' }}>DETECTOR</span>
            </div>
            <nav className="nav">
              <Link href="/dashboard"  className={`nav-link${path === '/dashboard'  ? ' active' : ''}`}>Dashboard</Link>
              <Link href="/alerts"     className={`nav-link${path === '/alerts'     ? ' active' : ''}`}>Alerts</Link>
              <Link href="/statistics" className={`nav-link${path === '/statistics' ? ' active' : ''}`}>Stats</Link>
              <Link href="/settings"   className={`nav-link${path === '/settings'   ? ' active' : ''}`}>Settings</Link>
            </nav>
            <div className="header-right">
              <div className="header-status">
                <div className="dot" style={{
                  background: dotOnline ? 'var(--green)' : 'var(--red)',
                  boxShadow:  dotOnline ? '0 0 8px var(--green)' : '0 0 8px var(--red)',
                }} />
                <span>{headerStatus}</span>
              </div>
              <button className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '.65rem' }}
                onClick={logout}>LOGOUT</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        <div className="container">{children}</div>
      </main>

      {/* ── Footer — exact match to base.html ── */}
      <footer className="footer">
        <div className="container">
          PRIVILEGE ESCALATION DETECTOR &nbsp;·&nbsp; STATUS:&nbsp;
          <span>{footerStatus}</span>
          &nbsp;·&nbsp;<span>{footerTime}</span>
        </div>
      </footer>

      {/* ── Toast container ── */}
      <div id="toast-container" />

      {/* ── Alert detail modal — exact match to base.html ── */}
      <div className={`modal-overlay${modal ? ' open' : ''}`} onClick={() => setModal(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">// ALERT DETAIL</span>
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
          </div>
          {modal && (
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <span className={`badge badge-${modal.severity}`}>{modal.severity}</span>
              </div>
              {mr('Alert ID',    modal.alert_id)}
              {mr('Rule',        <><span style={{ color: 'var(--purple)' }}>{modal.rule_id}</span> — {modal.rule_name}</>)}
              {mr('Description', modal.description)}
              {mr('Confidence',  modal.confidence != null ? (modal.confidence * 100).toFixed(0) + '%' : '—')}
              {mr('Time',        modal.created_at ? new Date(modal.created_at).toLocaleString() : '—')}
              <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
              {mr('Process',  modal.comm)}
              {mr('PID',      modal.pid)}
              {mr('PPID',     modal.ppid)}
              {mr('UID',      modal.uid)}
              {mr('New UID',  modal.new_uid ?? '—')}
              {mr('Parent',   modal.parent_comm || '—')}
              {mr('Syscall',  modal.syscall || '—')}
              {mr('Filename', modal.filename || '—')}
              {mr('Machine',  modal.machine_name || '—')}
              {modal.acknowledged && mr("Ack'd by", modal.acknowledged_by)}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: 8 }}>
                {!modal.acknowledged
                  ? <button className="btn btn-primary" onClick={() => window.__ackAlert(modal.id)}>Acknowledge</button>
                  : <span style={{ color: 'var(--green)', fontFamily: "'Share Tech Mono',monospace", fontSize: '.75rem' }}>✓ ACKNOWLEDGED</span>
                }
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
