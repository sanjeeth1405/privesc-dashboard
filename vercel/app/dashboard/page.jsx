'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/Shell'

export default function DashboardPage() {
  const router   = useRouter()
  const chartRef = useRef(null)
  const chartObj = useRef(null)

  const [sCrit,      setSCrit]      = useState('—')
  const [sHigh,      setSHigh]      = useState('—')
  const [sRules,     setSRules]     = useState('—')
  const [sEps,       setSEps]       = useState('—')
  const [alertCount, setAlertCount] = useState('loading…')
  const [rulesCount, setRulesCount] = useState('')
  const [legend,     setLegend]     = useState([])
  const [alertsHtml, setAlertsHtml] = useState(
    '<tr><td colspan="7" class="empty"><div class="empty-icon">◎</div>Loading…</td></tr>')
  const [rulesHtml,  setRulesHtml]  = useState(
    '<div style="color:var(--text2);font-size:.8rem">Loading…</div>')

  function initChart() {
    if (!window.Chart || !chartRef.current || chartObj.current) return
    chartObj.current = new window.Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Critical','High','Medium','Low'],
        datasets: [{ data: [0,0,0,0],
          backgroundColor: ['rgba(255,85,85,.8)','rgba(255,184,108,.8)','rgba(241,250,140,.7)','rgba(80,250,123,.7)'],
          borderColor: ['#ff5555','#ffb86c','#f1fa8c','#50fa7b'], borderWidth: 1 }],
      },
      options: { responsive: true, cutout: '70%', plugins: { legend: { display: false } } },
    })
  }

  function updateChart(c) {
    if (!chartObj.current) return
    chartObj.current.data.datasets[0].data = [c.CRITICAL||0,c.HIGH||0,c.MEDIUM||0,c.LOW||0]
    chartObj.current.update('none')
    const colors = ['var(--red)','var(--orange)','var(--yellow)','var(--green)']
    const labels = ['Critical','High','Medium','Low']
    const vals   = [c.CRITICAL||0,c.HIGH||0,c.MEDIUM||0,c.LOW||0]
    setLegend(labels.map((l, i) => ({ label: l, color: colors[i], val: vals[i] })))
  }

  async function updateStats() {
    try {
      const r = await fetch('/api/alerts/stats?hours=24')
      if (r.status === 401) { router.push('/login'); return }
      const d = await r.json()
      const t = d.totals || {}
      setSCrit(t.critical ?? 0)
      setSHigh(t.high ?? 0)
      setSRules(d.topRules?.length ?? 0)
      setSEps('—')
      updateChart({ CRITICAL: t.critical, HIGH: t.high, MEDIUM: t.medium, LOW: t.low })
    } catch(e) {}
  }

  async function loadAlerts() {
    try {
      const r = await fetch('/api/alerts/list?hours=24&limit=50')
      if (r.status === 401) { router.push('/login'); return }
      const d = await r.json()
      const alerts = d.alerts || []
      setAlertCount(`${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`)
      if (!alerts.length) {
        setAlertsHtml('<tr><td colspan="7" class="empty"><div class="empty-icon">✓</div>NO ALERTS DETECTED</td></tr>')
        return
      }
      setAlertsHtml(alerts.map(a => `
        <tr onclick="window.__openModal('${a.id}')">
          <td class="mono dim">${a.created_at ? new Date(a.created_at).toLocaleTimeString() : '—'}</td>
          <td><span class="badge badge-${a.severity}">${a.severity}</span></td>
          <td class="mono" style="color:var(--purple)">${a.rule_id}</td>
          <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.description}</td>
          <td class="mono">${a.comm || '—'}</td>
          <td class="mono dim">${a.pid || '—'}</td>
          <td class="mono dim">${a.uid ?? '—'}</td>
        </tr>`).join(''))
    } catch(e) {}
  }

  async function loadRules() {
    try {
      const r = await fetch('/api/rules')
      if (r.status === 401) return
      const d = await r.json()
      const rules = d.rules || []
      setRulesCount(`${rules.length} active`)
      setRulesHtml(rules.map(r => `
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:10px 12px">
          <div style="font-family:'Share Tech Mono',monospace;font-size:.68rem;color:var(--purple);margin-bottom:4px">${r.rule_id}</div>
          <div style="font-weight:600;font-size:.85rem">${r.name}</div>
          <div style="margin-top:6px"><span class="badge badge-${r.severity}">${r.severity}</span></div>
        </div>`).join(''))
    } catch(e) {}
  }

  useEffect(() => {
    const load = () => { initChart(); updateStats(); loadAlerts(); loadRules() }
    if (!window.Chart) {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
      s.onload = load
      document.head.appendChild(s)
    } else { load() }
    const t = setInterval(() => { updateStats(); loadAlerts() }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <Shell>
      {/* Page header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1rem', color:'var(--accent)', letterSpacing:'2px' }}>// SECURITY DASHBOARD</div>
          <div style={{ color:'var(--text2)', fontSize:'.82rem', marginTop:'3px' }}>Real-time privilege escalation monitoring</div>
        </div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.7rem', color:'var(--text2)' }}>AUTO-REFRESH 5s</div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="stat-card red">
          <div className="stat-label">Critical Alerts</div>
          <div className="stat-value">{sCrit}</div>
          <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:'6px' }}>Last 24h</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">High Alerts</div>
          <div className="stat-value">{sHigh}</div>
          <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:'6px' }}>Last 24h</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Rules Triggered</div>
          <div className="stat-value">{sRules}</div>
          <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:'6px' }}>Session</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Events / sec</div>
          <div className="stat-value">{sEps}</div>
          <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:'6px' }}>Live</div>
        </div>
      </div>

      {/* Alerts table + doughnut chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'1rem', marginBottom:'1rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Alerts</span>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.7rem', color:'var(--text2)' }}>{alertCount}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Time</th><th>Severity</th><th>Rule</th>
                <th>Description</th><th>Process</th><th>PID</th><th>UID</th>
              </tr></thead>
              <tbody dangerouslySetInnerHTML={{ __html: alertsHtml }} />
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">By Severity</span></div>
          <div style={{ padding:'1.25rem' }}>
            <canvas ref={chartRef} height="200" />
            <div style={{ marginTop:'1rem', display:'flex', flexDirection:'column', gap:'6px' }}>
              {legend.map(l => (
                <div key={l.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:"'Share Tech Mono',monospace", fontSize:'.7rem' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:l.color, display:'inline-block' }} />
                    {l.label}
                  </span>
                  <span style={{ color:l.color }}>{l.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detection rules grid */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Detection Rules</span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.7rem', color:'var(--text2)' }}>{rulesCount}</span>
        </div>
        <div style={{ padding:'1rem 1.5rem', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' }}
             dangerouslySetInnerHTML={{ __html: rulesHtml }} />
      </div>
    </Shell>
  )
}
