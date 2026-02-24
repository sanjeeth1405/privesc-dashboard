'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/Shell'

export default function AlertsPage() {
  const router = useRouter()
  const [allAlerts, setAllAlerts] = useState([])
  const [sevFilter,  setSevFilter]  = useState('all')
  const [timeFilter, setTimeFilter] = useState('24')
  const [sCrit,  setSCrit]  = useState(0)
  const [sHigh,  setSHigh]  = useState(0)
  const [sMed,   setSMed]   = useState(0)
  const [sTotal, setSTotal] = useState(0)
  const [tableCount, setTableCount] = useState('')
  const [tbody, setTbody] = useState(
    '<tr><td colspan="10" class="empty"><div class="empty-icon">◎</div>Loading…</td></tr>')

  async function refreshAlerts(hours, sev) {
    const h = hours || timeFilter
    try {
      const r = await fetch(`/api/alerts/list?hours=${h}&limit=1000`)
      if (r.status === 401) { router.push('/login'); return }
      const d = await r.json()
      const alerts = d.alerts || []
      setAllAlerts(alerts)
      applyFilters(alerts, sev !== undefined ? sev : sevFilter)
    } catch(e) { console.error(e) }
  }

  function applyFilters(alerts, sev) {
    const filtered = sev === 'all' ? alerts : alerts.filter(a => a.severity === sev)
    const c = { CRITICAL:0, HIGH:0, MEDIUM:0 }
    alerts.forEach(a => { if (c[a.severity] !== undefined) c[a.severity]++ })
    setSCrit(c.CRITICAL); setSHigh(c.HIGH); setSMed(c.MEDIUM); setSTotal(alerts.length)
    renderTable(filtered)
  }

  function renderTable(alerts) {
    setTableCount(`${alerts.length} record${alerts.length !== 1 ? 's' : ''}`)
    if (!alerts.length) {
      setTbody('<tr><td colspan="10" class="empty"><div class="empty-icon">✓</div>NO ALERTS FOUND</td></tr>')
      return
    }
    setTbody(alerts.map(a => `
      <tr onclick="window.__openModal('${a.id}')">
        <td class="mono dim" style="white-space:nowrap">${a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
        <td><span class="badge badge-${a.severity}">${a.severity}</span></td>
        <td class="mono" style="color:var(--purple)">${a.rule_id}</td>
        <td style="white-space:nowrap">${a.rule_name}</td>
        <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.description}</td>
        <td class="mono">${a.comm || '—'}</td>
        <td class="mono dim">${a.pid || '—'}</td>
        <td class="mono dim">${a.uid ?? '—'}${a.new_uid != null && a.new_uid !== a.uid ? ` → <span style="color:var(--red)">${a.new_uid}</span>` : ''}</td>
        <td class="mono dim">${a.syscall || '—'}</td>
        <td>${a.acknowledged
          ? `<span style="color:var(--green);font-family:'Share Tech Mono',monospace;font-size:.68rem">✓ ACK</span>`
          : `<button class="btn btn-secondary" style="padding:3px 8px;font-size:.62rem"
               onclick="event.stopPropagation();fetch('/api/alerts/acknowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alertId:'${a.id}'})}).then(()=>location.reload())">ACK</button>`
        }</td>
      </tr>`).join(''))
  }

  function onSevChange(e) {
    setSevFilter(e.target.value)
    applyFilters(allAlerts, e.target.value)
  }

  function onTimeChange(e) {
    setTimeFilter(e.target.value)
    refreshAlerts(e.target.value, sevFilter)
  }

  useEffect(() => {
    refreshAlerts()
    window.__onAck = () => refreshAlerts()
  }, [])

  return (
    <Shell>
      {/* Page header + filters */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1rem', color:'var(--accent)', letterSpacing:'2px' }}>// ALERT MANAGEMENT</div>
          <div style={{ color:'var(--text2)', fontSize:'.82rem', marginTop:'3px' }}>Every detected privilege escalation attempt</div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <select value={sevFilter} onChange={onSevChange}>
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={timeFilter} onChange={onTimeChange}>
            <option value="1">Last Hour</option>
            <option value="6">Last 6h</option>
            <option value="24">Last 24h</option>
            <option value="168">Last Week</option>
            <option value="720">Last Month</option>
          </select>
          <button className="btn btn-primary" onClick={() => refreshAlerts()}>↻ Refresh</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1.25rem' }}>
        <div className="stat-card red"    style={{ padding:'.9rem 1.25rem' }}><div className="stat-label">Critical</div><div className="stat-value">{sCrit}</div></div>
        <div className="stat-card orange" style={{ padding:'.9rem 1.25rem' }}><div className="stat-label">High</div><div className="stat-value">{sHigh}</div></div>
        <div className="stat-card yellow" style={{ padding:'.9rem 1.25rem' }}><div className="stat-label">Medium</div><div className="stat-value">{sMed}</div></div>
        <div className="stat-card green"  style={{ padding:'.9rem 1.25rem' }}><div className="stat-label">Total</div><div className="stat-value">{sTotal}</div></div>
      </div>

      {/* Full alerts table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Alert Log</span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.7rem', color:'var(--text2)' }}>{tableCount}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Timestamp</th><th>Severity</th><th>Rule ID</th><th>Rule Name</th>
              <th>Description</th><th>Process</th><th>PID</th><th>UID → New</th>
              <th>Syscall</th><th>Status</th>
            </tr></thead>
            <tbody dangerouslySetInnerHTML={{ __html: tbody }} />
          </table>
        </div>
      </div>
    </Shell>
  )
}
