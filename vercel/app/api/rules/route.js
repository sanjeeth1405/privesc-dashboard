import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const RULES = [
  { rule_id: 'RULE-01', name: 'Direct UID to Root',              severity: 'CRITICAL' },
  { rule_id: 'RULE-02', name: 'Credential File Tampering',       severity: 'CRITICAL' },
  { rule_id: 'RULE-03', name: 'Root SSH Key Injection',          severity: 'CRITICAL' },
  { rule_id: 'RULE-04', name: 'Process Memory Injection',        severity: 'CRITICAL' },
  { rule_id: 'RULE-05', name: 'Kernel Module Abuse',             severity: 'CRITICAL' },
  { rule_id: 'RULE-06', name: 'Docker Socket Abuse',             severity: 'CRITICAL' },
  { rule_id: 'RULE-07', name: 'SUID Binary from Writable Path',  severity: 'CRITICAL' },
  { rule_id: 'RULE-08', name: 'Capability Abuse',                severity: 'CRITICAL' },
  { rule_id: 'RULE-09', name: 'Sudoers Tampering',               severity: 'CRITICAL' },
  { rule_id: 'RULE-10', name: 'Confirmed Privilege Escalation',  severity: 'CRITICAL' },
]

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ rules: RULES })
}
