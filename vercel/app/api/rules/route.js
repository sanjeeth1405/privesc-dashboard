import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const RULES = [
  { rule_id:'RULE-001', name:'Direct UID to Root',              severity:'CRITICAL' },
  { rule_id:'RULE-002', name:'SUID Exec from Writable Path',    severity:'CRITICAL' },
  { rule_id:'RULE-003', name:'GTFOBin Root Shell Escape',       severity:'CRITICAL' },
  { rule_id:'RULE-004', name:'Sudoers Tampering',               severity:'CRITICAL' },
  { rule_id:'RULE-005', name:'Sudo Root Shell',                 severity:'CRITICAL' },
  { rule_id:'RULE-006', name:'Credential File Modified',        severity:'CRITICAL' },
  { rule_id:'RULE-007', name:'Root SSH Key Injection',          severity:'CRITICAL' },
  { rule_id:'RULE-008', name:'LD_PRELOAD Hijack',               severity:'CRITICAL' },
  { rule_id:'RULE-009', name:'Kernel Module Abuse',             severity:'CRITICAL' },
  { rule_id:'RULE-010', name:'Process Memory Injection',        severity:'CRITICAL' },
  { rule_id:'RULE-011', name:'Docker Socket Abuse',             severity:'CRITICAL' },
  { rule_id:'RULE-012', name:'PATH Hijacking',                  severity:'CRITICAL' },
  { rule_id:'RULE-013', name:'Capability Abuse',                severity:'CRITICAL' },
  { rule_id:'RULE-014', name:'Confirmed Privilege Escalation',  severity:'CRITICAL' },
]

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ rules: RULES })
}
