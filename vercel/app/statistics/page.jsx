'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/Shell'

export default function StatisticsPage() {
  const router   = useRouter()
  const sevRef   = useRef(null)
  const rulesRef = useRef(null)
  const sevBar   = useRef(null)
  const rulesBar = useRef(null)

  const [sEvents, setSEvents] = useState('—')
  const [sAlerts, setSAlerts] = useState('—')
  const [sRules,  setSRules]  = useState('—')
  const [sUptime, setSUptime] = useState('—')
  const [mEps,    setMEps]    = useState('—')
  const [mQueue,  setMQueue]  = useState('—')
  const [mAnom,   setMAnom]   = useState('—')

  const cd = {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks:{ color:'#6e7f9a', font:{ family:'Share Tech Mono', size:10 } }, grid:{ color:'#1a2535' } },
      y: { ticks:{ color:'#6e7f9a', font:{ family:'Share Tech Mono', size:10 } }, grid:{ color:'#1a2535' }, beginAtZero:true },
    },
  }

  function initCharts() {
    if (!window.Chart) return
    if (!sevBar.current && sevRef.current) {
      sevBar.current = new window.Chart(sevRef.current, {
        type: 'bar',
        data: {
          labels: ['Critical','High','Medium','Low'],
          datasets: [{ data: [0,0,0,0],
            backgroundColor: ['rgba(255,85,85,.6)','rgba(255,184,108,.6)','rgba(241,250,140,.5)','rgba(80,250,123,.5)'],
            borderColor: ['#ff5555','#ffb86c','#f1fa8c','#50fa7b'], borderWidth:1, borderRadius:3 }],
        },
        options: { responsive:true, ...cd },
      })
    }
    if (!rulesBar.current && rulesRef.current) {
      rulesBar.current = new window.Chart(rulesRef.current, {
        type: 'bar',
        data: { labels:[], datasets:[{ data:[],
          backgroundColor:'rgba(189,147,249,.5)', borderColor:'#bd93f9', borderWidth:1, borderRadius:3 }] },
        options: { responsive:true, indexAxis:'y', ...cd },
      })
    }
  }

  async function loadStats() {
    try {
      const r = await fetch('/api/alerts/stats?hours=24')
      if (r.status === 401) { router.push('/login'); return }
      const d = await r.json()
      const t = d.totals || {}
      setSAlerts(t.total ?? 0)
      setSRules(d.topRules?.length ?? 0)
      setSEvents('—'); setMEps('—'); setMQueue('—'); setMAnom('—'); setSUptime('—')

      if (sevBar.current) {
        sevBar.current.data.datasets[0].data = [t.critical||0, t.high||0, t.medium||0, t.low||0]
        sevBar.current.update('none')
      }
      if (rulesBar.current && d.topRules) {
        rulesBar.current.data.labels              = d.topRules.map(r => r.rule_id)
        rulesBar.current.data.datasets[0].data    = d.topRules.map(r => r.count)
        rulesBar.current.update('none')
      }
    } catch(e) {}
  }

  useEffect(() => {
    const load = () => { initCharts(); loadStats() }
    if (!window.Chart) {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
      s.onload = load
      document.head.appendChild(s)
    } else { load() }
    const t = setInterval(loadStats, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <Shell>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1rem', color:'var(--accent)', letterSpacing:'2px' }}>// SYSTEM STATISTICS</div>
        <div style={{ color:'var(--text2)', fontSize:'.82rem', marginTop:'3px' }}>Detection engine performance metrics</div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="stat-card">          <div className="stat-label">Events Processed</div><div className="stat-value">{sEvents}</div></div>
        <div className="stat-card orange">   <div className="stat-label">Alerts Generated</div><div className="stat-value">{sAlerts}</div></div>
        <div className="stat-card yellow">   <div className="stat-label">Rules Triggered</div> <div className="stat-value">{sRules}</div></div>
        <div className="stat-card green">    <div className="stat-label">Uptime</div>           <div className="stat-value" style={{ fontSize:'1.3rem' }}>{sUptime}</div></div>
      </div>

      {/* Bar charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Alerts by Severity (24h)</span></div>
          <div style={{ padding:'1.5rem' }}><canvas ref={sevRef} height="200" /></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Top Rules Triggered (24h)</span></div>
          <div style={{ padding:'1.5rem' }}><canvas ref={rulesRef} height="200" /></div>
        </div>
      </div>

      {/* Engine metrics */}
      <div className="card">
        <div className="card-header"><span className="card-title">Engine Metrics</span></div>
        <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.68rem', color:'var(--text2)', letterSpacing:'1px', marginBottom:'6px' }}>EVENTS / SECOND</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1.6rem', color:'var(--accent)' }}>{mEps}</div>
          </div>
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.68rem', color:'var(--text2)', letterSpacing:'1px', marginBottom:'6px' }}>QUEUE SIZE</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1.6rem', color:'var(--text)' }}>{mQueue}</div>
          </div>
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.68rem', color:'var(--text2)', letterSpacing:'1px', marginBottom:'6px' }}>ANOMALIES DETECTED</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1.6rem', color:'var(--purple)' }}>{mAnom}</div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
