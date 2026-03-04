'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [machines, setMachines]               = useState([]);
  const [rules, setRules]                     = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal]     = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [generatedKey, setGeneratedKey]     = useState('');
  const [addError, setAddError]             = useState('');
  const [addLoading, setAddLoading]         = useState(false);
  const [keyCopied, setKeyCopied]           = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal]         = useState(false);
  const [machineToDelete, setMachineToDelete]         = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput]   = useState('');
  const [deleteError, setDeleteError]                 = useState('');
  const [deleteLoading, setDeleteLoading]             = useState(false);

  useEffect(() => { fetchMachines(); fetchRules(); }, []);

  async function fetchMachines() {
    setLoadingMachines(true);
    try {
      const res  = await fetch('/api/machines');
      const data = await res.json();
      setMachines(data.machines || []);
    } catch { setMachines([]); }
    finally  { setLoadingMachines(false); }
  }

  async function fetchRules() {
    try {
      const res  = await fetch('/api/rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch { setRules([]); }
  }

  // ── Add ───────────────────────────────────────────────────
  function openAddModal() {
    setNewMachineName(''); setGeneratedKey(''); setAddError('');
    setAddLoading(false);  setKeyCopied(false); setShowAddModal(true);
  }
  function closeAddModal() {
    setShowAddModal(false);
    if (generatedKey) fetchMachines();
  }

  async function handleAddMachine() {
    if (generatedKey) { closeAddModal(); return; }
    const name = newMachineName.trim();
    setAddError('');
    if (!name)                              { setAddError('Please enter a machine name.'); return; }
    if (!/^[a-zA-Z0-9\-_]+$/.test(name))  { setAddError('Only letters, numbers, hyphens and underscores allowed.'); return; }
    if (name.length > 50)                  { setAddError('Max 50 characters.'); return; }

    setAddLoading(true);
    try {
      const res  = await fetch('/api/machines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_name: name }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to create machine.'); return; }
      setGeneratedKey(data.api_key);
    } catch { setAddError('Network error. Please try again.'); }
    finally  { setAddLoading(false); }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(generatedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  // ── Delete ────────────────────────────────────────────────
  function openDeleteModal(machine) {
    setMachineToDelete(machine); setDeleteConfirmInput('');
    setDeleteError(''); setDeleteLoading(false); setShowDeleteModal(true);
  }
  function closeDeleteModal() { setShowDeleteModal(false); setMachineToDelete(null); }

  async function handleDeleteMachine() {
    if (!machineToDelete) return;
    setDeleteError(''); setDeleteLoading(true);
    try {
      const res  = await fetch(`/api/machines/${machineToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || 'Failed to delete.'); return; }
      closeDeleteModal();
      fetchMachines();
    } catch { setDeleteError('Network error. Please try again.'); }
    finally  { setDeleteLoading(false); }
  }

  const deleteConfirmMatch = deleteConfirmInput === machineToDelete?.machine_name;

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit', second:'2-digit',
    });
  }

  function severityColor(s) {
    if (s === 'CRITICAL') return S.badgeCritical;
    if (s === 'HIGH')     return S.badgeHigh;
    return S.badgeMedium;
  }

  return (
    <div style={S.page}>

      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>// SETTINGS</h2>
        <p style={S.pageSubtitle}>Manage machines, API keys and detection rules</p>
      </div>

      {/* ── REGISTERED MACHINES ─────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <h3 style={S.sectionTitle}>REGISTERED MACHINES</h3>
          <button style={S.btnAdd} onClick={openAddModal}>+ ADD MACHINE</button>
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{['MACHINE NAME','KEY PREFIX','LAST SEEN','REGISTERED','ACTION'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loadingMachines ? (
                <tr><td colSpan={5} style={S.tdCenter}>Loading...</td></tr>
              ) : machines.length === 0 ? (
                <tr><td colSpan={5} style={S.tdCenter}>No machines registered yet.</td></tr>
              ) : machines.map(m => (
                <tr key={m.id}>
                  <td style={{...S.td,...S.machineName}}>{m.machine_name}</td>
                  <td style={S.td}><code style={S.keyCode}>{m.key_prefix}...</code></td>
                  <td style={S.td}>{m.last_seen ? formatDate(m.last_seen) : <span style={S.never}>Never</span>}</td>
                  <td style={S.td}>{formatDate(m.created_at)}</td>
                  <td style={S.td}>
                    <button
                      style={S.btnDeleteRow}
                      onClick={() => openDeleteModal(m)}
                      onMouseEnter={e => Object.assign(e.currentTarget.style, S.btnDeleteRowHover)}
                      onMouseLeave={e => Object.assign(e.currentTarget.style, S.btnDeleteRow)}
                    >🗑 Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETECTION RULES ─────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <h3 style={S.sectionTitle}>DETECTION RULES</h3>
          <span style={S.rulesCount}>{rules.length} active</span>
        </div>
        {rules.map(rule => (
          <div key={rule.rule_id} style={S.ruleRow}>
            <div style={S.ruleLeft}>
              <span style={S.ruleId}>{rule.rule_id}</span>
              <span style={S.ruleName}>{rule.name}</span>
            </div>
            <span style={{...S.badge,...severityColor(rule.severity)}}>{rule.severity}</span>
          </div>
        ))}
      </div>

      {/* ── SYSTEM INFO ─────────────────────────────── */}
      <div style={S.section}>
        <h3 style={{...S.sectionTitle, marginBottom:'1rem'}}>SYSTEM INFORMATION</h3>
        <div style={S.infoGrid}>
          {[['Version','1.0.0'],['Environment','Production'],['Database','Neon PostgreSQL']].map(([k,v])=>(
            <div key={k} style={S.infoItem}>
              <label style={S.infoLabel}>{k}</label>
              <span style={S.infoValue}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ADD MACHINE MODAL
      ════════════════════════════════════════════════ */}
      {showAddModal && (
        <div style={S.overlay} onClick={e=>{if(e.target===e.currentTarget)closeAddModal();}}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>// ADD MACHINE</h3>
              <button style={S.modalClose} onClick={closeAddModal}>✕</button>
            </div>
            <div style={S.modalBody}>
              <p style={S.modalDesc}>Register a new machine. The API key is shown only once — copy it before closing.</p>
              <div style={S.formGroup}>
                <label style={S.formLabel}>MACHINE NAME</label>
                <input style={S.input} type="text" placeholder="e.g. kali-lab"
                  value={newMachineName} onChange={e=>setNewMachineName(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!generatedKey&&handleAddMachine()}
                  disabled={!!generatedKey} maxLength={50} autoFocus />
                <span style={S.formHint}>Letters, numbers, hyphens and underscores only.</span>
              </div>
              {generatedKey && (
                <div style={S.formGroup}>
                  <label style={S.formLabel}>GENERATED API KEY</label>
                  <div style={S.keyBox}>
                    <code style={S.keyFull}>{generatedKey}</code>
                    <button style={S.btnCopy} onClick={copyKey}>{keyCopied?'✅ Copied!':'📋 Copy'}</button>
                  </div>
                  <span style={S.formHintWarning}>⚠ Copy this key now — it will not be shown again.</span>
                </div>
              )}
              {addError && <div style={S.errorBox}>{addError}</div>}
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnCancel} onClick={closeAddModal}>{generatedKey?'Close':'Cancel'}</button>
              <button style={{...S.btnConfirm,opacity:addLoading?0.5:1}} onClick={handleAddMachine} disabled={addLoading}>
                {addLoading?'Generating...':generatedKey?'Done':'Generate API Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          DELETE MACHINE MODAL
      ════════════════════════════════════════════════ */}
      {showDeleteModal && machineToDelete && (
        <div style={S.overlay} onClick={e=>{if(e.target===e.currentTarget)closeDeleteModal();}}>
          <div style={{...S.modal,...S.modalDanger}}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>// DELETE MACHINE</h3>
              <button style={S.modalClose} onClick={closeDeleteModal}>✕</button>
            </div>
            <div style={S.modalBody}>
              <div style={S.dangerIcon}>⚠</div>
              <p style={{...S.modalDesc,color:'#fca5a5'}}>
                You are about to permanently delete{' '}
                <strong style={{color:'#fff'}}>{machineToDelete.machine_name}</strong>.
              </p>
              <p style={S.modalDesc}>
                This deletes the machine <strong style={{color:'#e2e8f0'}}>and its API key</strong> from the database.
                The forwarder on that machine will immediately stop being able to send alerts.
                This <strong style={{color:'#e2e8f0'}}>cannot be undone</strong>.
              </p>
              <div style={S.formGroup}>
                <label style={S.formLabel}>TYPE THE MACHINE NAME TO CONFIRM</label>
                <input
                  style={{...S.input, borderColor: deleteConfirmInput
                    ? (deleteConfirmMatch ? '#22c55e' : '#ef4444') : '#334155'}}
                  type="text"
                  placeholder={`Type "${machineToDelete.machine_name}" to confirm`}
                  value={deleteConfirmInput}
                  onChange={e=>setDeleteConfirmInput(e.target.value)}
                  autoFocus
                />
              </div>
              {deleteError && <div style={S.errorBox}>{deleteError}</div>}
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnCancel} onClick={closeDeleteModal}>Cancel</button>
              <button
                style={{...S.btnDelete,
                  opacity:(!deleteConfirmMatch||deleteLoading)?0.35:1,
                  cursor:(!deleteConfirmMatch||deleteLoading)?'not-allowed':'pointer'}}
                onClick={handleDeleteMachine}
                disabled={!deleteConfirmMatch||deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : '🗑 Delete Machine & API Key'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const S = {
  page:         { width:'100%', boxSizing:'border-box' },
  pageHeader:   { marginBottom:'2rem' },
  pageTitle:    { fontSize:'1.4rem', fontWeight:700, letterSpacing:'2px', color:'#e2e8f0', margin:'0 0 0.25rem' },
  pageSubtitle: { color:'#64748b', fontSize:'0.875rem', margin:0 },
  section:      { background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem', width:'100%', boxSizing:'border-box' },
  sectionHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' },
  sectionTitle: { fontSize:'0.82rem', fontWeight:700, letterSpacing:'2px', color:'#22d3ee', margin:0 },
  btnAdd:       { background:'transparent', border:'1px solid #22d3ee', color:'#22d3ee', padding:'0.4rem 1rem', borderRadius:'4px', fontSize:'0.78rem', fontWeight:600, letterSpacing:'1px', cursor:'pointer' },
  tableWrap:    { overflowX:'auto', width:'100%' },
  table:        { width:'100%', borderCollapse:'collapse', fontSize:'0.875rem', tableLayout:'fixed' },
  th:           { textAlign:'left', padding:'0.6rem 1rem', color:'#64748b', fontSize:'0.72rem', letterSpacing:'1px', borderBottom:'1px solid #334155', width:'auto' },
  td:           { padding:'0.85rem 1rem', borderBottom:'1px solid #1a2540', color:'#e2e8f0', verticalAlign:'middle' },
  tdCenter:     { textAlign:'center', padding:'2rem', color:'#475569', fontSize:'0.875rem' },
  machineName:  { color:'#22d3ee', fontWeight:600 },
  keyCode:      { background:'rgba(255,255,255,0.06)', padding:'0.2rem 0.5rem', borderRadius:'3px', fontSize:'0.78rem', color:'#94a3b8', fontFamily:'monospace' },
  never:        { color:'#475569', fontStyle:'italic' },
  btnDeleteRow: { background:'transparent', border:'1px solid #ef4444', color:'#ef4444', padding:'0.3rem 0.75rem', borderRadius:'4px', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  btnDeleteRowHover: { background:'#ef4444', border:'1px solid #ef4444', color:'#fff', padding:'0.3rem 0.75rem', borderRadius:'4px', fontSize:'0.76rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  rulesCount:   { fontSize:'0.78rem', color:'#22d3ee', letterSpacing:'1px' },
  ruleRow:      { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid #334155' },
  ruleLeft:     { display:'flex', alignItems:'center', gap:'1rem' },
  ruleId:       { fontSize:'0.78rem', color:'#7c3aed', fontWeight:700, fontFamily:'monospace', minWidth:'70px' },
  ruleName:     { color:'#e2e8f0', fontSize:'0.9rem' },
  badge:        { padding:'0.2rem 0.6rem', borderRadius:'3px', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.5px' },
  badgeCritical:{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)' },
  badgeHigh:    { background:'rgba(249,115,22,0.15)', color:'#fb923c', border:'1px solid rgba(249,115,22,0.3)' },
  badgeMedium:  { background:'rgba(234,179,8,0.15)', color:'#facc15', border:'1px solid rgba(234,179,8,0.3)' },
  infoGrid:     { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem' },
  infoItem:     { display:'flex', flexDirection:'column', gap:'0.25rem' },
  infoLabel:    { fontSize:'0.72rem', color:'#64748b', letterSpacing:'1px' },
  infoValue:    { color:'#e2e8f0', fontSize:'0.9rem' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' },
  modal:        { background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', width:'100%', maxWidth:'480px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' },
  modalDanger:  { borderColor:'rgba(239,68,68,0.4)' },
  modalHeader:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'1px solid #334155' },
  modalTitle:   { margin:0, fontSize:'0.85rem', letterSpacing:'2px', color:'#22d3ee' },
  modalClose:   { background:'none', border:'none', color:'#64748b', fontSize:'1.1rem', cursor:'pointer', padding:0, lineHeight:1 },
  modalBody:    { padding:'1.5rem' },
  modalDesc:    { color:'#94a3b8', fontSize:'0.875rem', margin:'0 0 1.25rem', lineHeight:1.6 },
  modalFooter:  { display:'flex', justifyContent:'flex-end', gap:'0.75rem', padding:'1rem 1.5rem', borderTop:'1px solid #334155' },
  dangerIcon:   { fontSize:'2.2rem', textAlign:'center', marginBottom:'1rem' },
  formGroup:    { marginBottom:'1.25rem' },
  formLabel:    { display:'block', fontSize:'0.72rem', letterSpacing:'1px', color:'#64748b', marginBottom:'0.4rem' },
  input:        { width:'100%', background:'#0f172a', border:'1px solid #334155', borderRadius:'4px', padding:'0.6rem 0.75rem', color:'#e2e8f0', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' },
  formHint:     { fontSize:'0.72rem', color:'#475569', marginTop:'0.35rem', display:'block' },
  formHintWarning:{ fontSize:'0.72rem', color:'#f59e0b', marginTop:'0.35rem', display:'block' },
  keyBox:       { display:'flex', alignItems:'center', gap:'0.5rem', background:'#0f172a', border:'1px solid #334155', borderRadius:'4px', padding:'0.6rem 0.75rem' },
  keyFull:      { flex:1, fontSize:'0.78rem', color:'#22d3ee', wordBreak:'break-all', fontFamily:'monospace' },
  btnCopy:      { background:'transparent', border:'1px solid #334155', color:'#94a3b8', padding:'0.25rem 0.6rem', borderRadius:'3px', fontSize:'0.72rem', cursor:'pointer', whiteSpace:'nowrap' },
  errorBox:     { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'4px', color:'#fca5a5', fontSize:'0.8rem', padding:'0.6rem 0.75rem', marginTop:'0.5rem' },
  btnCancel:    { background:'transparent', border:'1px solid #334155', color:'#94a3b8', padding:'0.5rem 1.25rem', borderRadius:'4px', fontSize:'0.85rem', cursor:'pointer' },
  btnConfirm:   { background:'#22d3ee', border:'1px solid #22d3ee', color:'#0f172a', padding:'0.5rem 1.25rem', borderRadius:'4px', fontSize:'0.85rem', fontWeight:700, cursor:'pointer' },
  btnDelete:    { background:'#ef4444', border:'1px solid #ef4444', color:'#fff', padding:'0.5rem 1.25rem', borderRadius:'4px', fontSize:'0.85rem', fontWeight:700 },
};
