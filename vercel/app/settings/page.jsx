'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/Shell'

export default function SettingsPage() {
  const router = useRouter()
  const [rules,    setRules]    = useState([])
  const [machines, setMachines] = useState([])
  const [newName,  setNewName]  = useState('')
  const [newKey,   setNewKey]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [adding,   setAdding]   = useState(false)

  async function load() {
    try {
      const [rr, mr] = await Promise.all([fetch('/api/rules'), fetch('/api/machines')])
      if (rr.status === 401) { router.push('/login'); return }
      const [rd, md] = await Promise.all([rr.json(), mr.json()])
      setRules(rd.rules || [])
      setMachines(md.machines || [])
    } catch(e) {}
  }

  async function addMachine() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const r = await fetch('/api/machines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineName: newName }),
      })
      const d = await r.json()
      if (d.apiKey) { setNewKey(d.apiKey); setNewName(''); load() }
    } catch(e) {}
    setAdding(false)
  }

  useEffect(() => { load() }, [])

  return (
    <Shell>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'1rem', color:'var(--accent)', letterSpacing:'2px' }}>// SETTINGS</div>
        <div style={{ color:'var(--text2)', fontSize:'.82rem', marginTop:'3px' }}>Manage machines, API keys and detection rules</div>
      </div>

      {/* Machines */}
      <div className="card" style={{ marginBottom:'1rem' }}>
        <div className="card-header">
          <span className="card-title">Registered Machines</span>
          <button className="btn btn-primary" onClick={() => { setShowAdd(s => !s); setNewKey('') }}>
            + Add Machine
          </button>
        </div>

        {showAdd && (
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
            <div style={{ display:'flex', gap:'10px', marginBottom: newKey ? '1rem' : 0 }}>
              <input type="text" placeholder="Machine name (e.g. kali-lab-01)"
                value={newName} onChange={e => setNewName(e.target.value)}
                style={{ flex:1 }} />
              <button className="btn btn-primary" onClick={addMachine} disabled={adding}>
                {adding ? 'Generating…' : 'Generate Key'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setNewKey('') }}>Cancel</button>
            </div>
            {newKey && (
              <div style={{ background:'var(--bg2)', border:'1px solid rgba(0,212,255,.3)', borderRadius:'6px', padding:'1rem' }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.62rem', color:'var(--red)', marginBottom:'8px', letterSpacing:'1px' }}>
                  NEW API KEY — COPY NOW, SHOWN ONCE ONLY
                </div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.8rem', color:'var(--accent)', wordBreak:'break-all', marginBottom:'12px' }}>
                  {newKey}
                </div>
                <pre style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.72rem', color:'var(--green)', lineHeight:1.6 }}>
{`sudo python3 /opt/privilege-escalation-detector/forwarder/forwarder.py --setup
# Enter this API key when prompted`}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Machine Name</th><th>Key Prefix</th><th>Last Seen</th><th>Registered</th>
            </tr></thead>
            <tbody>
              {machines.length === 0 && (
                <tr><td colSpan={4} className="empty"><div className="empty-icon">◎</div>No machines registered yet</td></tr>
              )}
              {machines.map(m => (
                <tr key={m.id} style={{ cursor:'default' }}>
                  <td className="mono" style={{ color:'var(--purple)' }}>{m.machine_name}</td>
                  <td className="mono dim">{m.key_prefix}…</td>
                  <td className="mono dim">{m.last_seen ? new Date(m.last_seen).toLocaleString() : <span style={{ color:'var(--text2)' }}>Never</span>}</td>
                  <td className="mono dim">{new Date(m.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detection Rules */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Detection Rules</span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.7rem', color:'var(--text2)' }}>{rules.length} active</span>
        </div>
        <div style={{ padding:'0 1.5rem' }}>
          {rules.length === 0 && (
            <div className="empty"><div className="empty-icon">◎</div>Loading rules…</div>
          )}
          {rules.map(r => (
            <div key={r.rule_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'.72rem', color:'var(--purple)', minWidth:'90px' }}>{r.rule_id}</span>
                <span style={{ fontWeight:600, fontSize:'.9rem' }}>{r.name}</span>
              </div>
              <span className={`badge badge-${r.severity}`}>{r.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
