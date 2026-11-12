import {
  Agent,
  ApprovalRequest,
  SecurityIncident,
  SecurityPolicy,
  AuditLog,
  ProvenanceRecord,
  NotificationItem
} from '../types';

export const MOCK_AGENTS: Agent[] = [
  {
    id: 1,
    name: 'Atlas Financial Transfer Engine',
    code: 'AGENT-FIN-01',
    description: 'Autonomous financial settlement, ledger balancing, and corporate wire transfer agent.',
    role_type: 'EXECUTION',
    status: 'ACTIVE',
    current_trust_score: 88.5,
    tasks_count: 1420,
    threat_count: 12,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Aegis Guardian Inspector',
    code: 'AGENT-GRD-01',
    description: 'Pre-execution safety gateway evaluating agent action proposals, tool calls, and API queries.',
    role_type: 'GUARDIAN',
    status: 'ACTIVE',
    current_trust_score: 98.2,
    tasks_count: 3890,
    threat_count: 1,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Sentinel Data Access Bridge',
    code: 'AGENT-SEC-02',
    description: 'Internal SQL execution and production customer database retrieval agent.',
    role_type: 'EXECUTION',
    status: 'UNDER_REVIEW',
    current_trust_score: 64.0,
    tasks_count: 840,
    threat_count: 28,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Hermes Provenance Tracker',
    code: 'AGENT-PRV-01',
    description: 'Maintains SHA-256 DAG provenance tree for LLM claims, citations, and ingested RAG documents.',
    role_type: 'PROVENANCE',
    status: 'ACTIVE',
    current_trust_score: 95.0,
    tasks_count: 2150,
    threat_count: 3,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Themis Compliance Auditor',
    code: 'AGENT-CMP-01',
    description: 'Regulatory check agent ensuring GDPR, SOC2, HIPAA, and corporate fiduciary compliance.',
    role_type: 'COMPLIANCE',
    status: 'ACTIVE',
    current_trust_score: 92.4,
    tasks_count: 1670,
    threat_count: 5,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 1,
    action_id: 101,
    status: 'PENDING',
    requested_by_agent_id: 1,
    agent_name: 'Atlas Financial Transfer Engine',
    action_type: 'FINANCIAL_TRANSFER',
    target_resource: 'SWIFT://CHASE-NYC-09281',
    payload: JSON.stringify({ amount: 150000, recipient: 'Acme Logistics Ltd', currency: 'USD' }),
    risk_score: 82.5,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 2,
    action_id: 102,
    status: 'PENDING',
    requested_by_agent_id: 3,
    agent_name: 'Sentinel Data Access Bridge',
    action_type: 'DATABASE_MUTATION',
    target_resource: 'POSTGRES://PROD-DB/USERS',
    payload: JSON.stringify({ query: 'ALTER TABLE users DROP COLUMN mfa_enforced' }),
    risk_score: 94.0,
    expires_at: new Date(Date.now() + 43200000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 3,
    action_id: 103,
    status: 'APPROVED',
    requested_by_agent_id: 1,
    agent_name: 'Atlas Financial Transfer Engine',
    action_type: 'API_CALL',
    target_resource: 'https://api.stripe.com/v1/refunds',
    payload: JSON.stringify({ charge_id: 'ch_9281923', amount: 450 }),
    risk_score: 45.0,
    reviewer_notes: 'Verified legitimate customer refund request.',
    expires_at: new Date(Date.now() - 10000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    resolved_at: new Date(Date.now() - 5400000).toISOString()
  }
];

export const MOCK_INCIDENTS: SecurityIncident[] = [
  {
    id: 1,
    incident_number: 'INC-2026-001',
    title: 'Prompt Injection / Jailbreak Attack Intercepted',
    description: 'Indirect prompt injection hidden inside customer PDF invoice attempting to override guardrails.',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    source_agent_id: 3,
    investigation_notes: 'Blocked by Aegis Guardian prior to execution.',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 2,
    incident_number: 'INC-2026-002',
    title: 'High-Volume PII Leakage Prevented',
    description: 'Agent output contained unmasked customer Social Security Numbers and passwords.',
    severity: 'CRITICAL',
    status: 'OPEN',
    source_agent_id: 3,
    investigation_notes: 'Data leakage filter automatically redacted sensitive tokens.',
    created_at: new Date(Date.now() - 14400000).toISOString()
  }
];

export const MOCK_POLICIES: SecurityPolicy[] = [
  {
    id: 1,
    name: 'Mandatory Human Sign-off for Wire Transfers > $10,000',
    code: 'POL-FIN-001',
    category: 'FINANCIAL_INTEGRITY',
    severity: 'HIGH',
    description: 'Any agent action initiating outbound bank wires exceeding threshold requires human approval.',
    rules_json: JSON.stringify({ threshold: 10000, require_approval: true }),
    enforcement_mode: 'ENFORCE',
    risk_penalty: 25.0,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Zero-Tolerance Production Schema Mutations',
    code: 'POL-DB-002',
    category: 'DATA_INTEGRITY',
    severity: 'CRITICAL',
    description: 'Prohibits DROP, TRUNCATE, or schema deletions on production databases without SecOps Admin consent.',
    rules_json: JSON.stringify({ blocked_commands: ['DROP', 'TRUNCATE'], require_approval: true }),
    enforcement_mode: 'ENFORCE',
    risk_penalty: 35.0,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Universal PII Redaction & API Key Shield',
    code: 'POL-SEC-003',
    category: 'CONFIDENTIALITY',
    severity: 'HIGH',
    description: 'Real-time regex and Shannon entropy masking on all outbound agent messages and tool calls.',
    rules_json: JSON.stringify({ mask_pii: true, mask_credentials: true }),
    enforcement_mode: 'ENFORCE',
    risk_penalty: 20.0,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    event_type: 'GUARDRAIL_TRIGGERED',
    actor_type: 'AGENT',
    actor_id: 'AGENT-GRD-01',
    resource_type: 'ACTION_PAYLOAD',
    resource_id: 'ACT-902',
    action_summary: 'Guardian blocked unauthorized shell command injection attempt',
    payload_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    entry_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b'
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    event_type: 'APPROVAL_GRANTED',
    actor_type: 'USER',
    actor_id: '1',
    resource_type: 'APPROVAL_REQUEST',
    resource_id: 'APR-103',
    action_summary: 'SecOps Lead Sarah Chen authorized Stripe customer refund',
    payload_hash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
    previous_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    entry_hash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2'
  }
];

export const MOCK_PROVENANCE: ProvenanceRecord[] = [
  {
    id: 1,
    action_id: 101,
    claim_or_decision: 'Corporate tax compliance report 2025 filing deadline is April 15, 2026.',
    source_name: 'IRS Publication 17',
    source_url: 'https://irs.gov/publications/p17.pdf',
    source_type: 'DOCUMENT',
    content_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    trust_score: 99.4,
    verification_status: 'VERIFIED',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    action_id: 102,
    claim_or_decision: 'Quarterly server infrastructure utilization dropped 14.2% following auto-scaling.',
    source_name: 'Datadog Production Metrics',
    source_url: 'DATADOG://METRICS/AWS-CLUSTER-PROD',
    source_type: 'METRICS',
    content_hash: '3f79bb7b435b05321651daefd374cd681b61935c13e0e77ec3b2a4bb954d079d',
    trust_score: 96.0,
    verification_status: 'VERIFIED',
    created_at: new Date(Date.now() - 43200000).toISOString()
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: 'High-Risk Operation Intercepted',
    message: 'Atlas Financial Transfer Engine proposed an outbound transfer of $150,000.',
    notification_type: 'APPROVAL_REQUIRED',
    severity: 'WARNING',
    is_read: false,
    link_url: '/approvals',
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 2,
    title: 'Security Incident Created',
    message: 'Indirect prompt injection detected in RAG ingestion pipeline.',
    notification_type: 'THREAT_DETECTED',
    severity: 'CRITICAL',
    is_read: false,
    link_url: '/incidents',
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];
