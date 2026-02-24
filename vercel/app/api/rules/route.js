import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const RULES = [
  { rule_id:'RULE-001', name:'Direct UID to Root',                     severity:'CRITICAL' },
  { rule_id:'RULE-002', name:'Suspicious GID Change',                  severity:'HIGH'     },
  { rule_id:'RULE-003', name:'SUID Exec from Writable Path',           severity:'CRITICAL' },
  { rule_id:'RULE-004', name:'SUID Binary Created in Writable Path',   severity:'HIGH'     },
  { rule_id:'RULE-005', name:'GTFOBin Shell Escape',                   severity:'CRITICAL' },
  { rule_id:'RULE-006', name:'Interpreter Running as Root',            severity:'HIGH'     },
  { rule_id:'RULE-007', name:'Sudoers File Tampered',                  severity:'CRITICAL' },
  { rule_id:'RULE-008', name:'Sudo Spawned Root Shell',                severity:'CRITICAL' },
  { rule_id:'RULE-009', name:'Shadow File Read',                       severity:'HIGH'     },
  { rule_id:'RULE-010', name:'Credential File Write',                  severity:'CRITICAL' },
  { rule_id:'RULE-011', name:'SSH Key Injection',                      severity:'HIGH'     },
  { rule_id:'RULE-012', name:'LD_PRELOAD Hijack',                      severity:'CRITICAL' },
  { rule_id:'RULE-013', name:'Shared Library Written to System Path',  severity:'HIGH'     },
  { rule_id:'RULE-014', name:'Kernel Module Load by Non-Root',         severity:'CRITICAL' },
  { rule_id:'RULE-015', name:'Process Memory Write via /proc/pid/mem', severity:'CRITICAL' },
  { rule_id:'RULE-016', name:'Docker Socket Access',                   severity:'CRITICAL' },
  { rule_id:'RULE-017', name:'Namespace Escape Tool Executed',         severity:'HIGH'     },
  { rule_id:'RULE-018', name:'Systemd Unit Tampered',                  severity:'HIGH'     },
  { rule_id:'RULE-019', name:'Cron Job Modified',                      severity:'MEDIUM'   },
  { rule_id:'RULE-020', name:'PATH Hijacking',                         severity:'HIGH'     },
  { rule_id:'RULE-021', name:'Python Site-Packages Tampered',          severity:'HIGH'     },
  { rule_id:'RULE-022', name:'Capability Manipulation',                severity:'HIGH'     },
  { rule_id:'RULE-023', name:'Sensitive File Recon',                   severity:'LOW'      },
  { rule_id:'RULE-024', name:'SUID Binary Enumeration',                severity:'LOW'      },
  { rule_id:'RULE-025', name:'Confirmed Privilege Escalation',         severity:'CRITICAL' },
]

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ rules: RULES })
}
