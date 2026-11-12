export type UserRole = 'admin' | 'analyst' | 'compliance_officer' | 'operator';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export type AgentRoleType = 'RESEARCH' | 'EXECUTION' | 'GUARDIAN' | 'PROVENANCE' | 'COMPLIANCE';
export type AgentStatus = 'ACTIVE' | 'IDLE' | 'BLOCKED' | 'UNDER_REVIEW';

export interface Agent {
  id: number;
  name: string;
  code: string;
  description: string | null;
  role_type: AgentRoleType;
  status: AgentStatus;
  current_trust_score: number;
  tasks_count: number;
  threat_count: number;
  created_at: string;
  updated_at: string;
}

export interface TrustScoreHistory {
  timestamp: string;
  score: number;
  delta: number;
  reason: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAssessment {
  id: number;
  action_id: number;
  overall_risk_score: number;
  risk_level: RiskLevel;
  data_sensitivity_score: number;
  permission_level_score: number;
  reversibility_score: number;
  external_comm_score: number;
  financial_impact_score: number;
  policy_violation_score: number;
  factor_breakdown: string | null;
  explanation: string;
  recommendations: string | null;
  created_at: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'EXPIRED';

export interface ApprovalRequest {
  id: number;
  action_id: number;
  status: ApprovalStatus;
  requested_by_agent_id: number;
  agent_name?: string;
  action_type?: string;
  target_resource?: string;
  payload?: string;
  reviewer_id?: number | null;
  reviewer_notes?: string | null;
  risk_score: number;
  expires_at: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface ProvenanceRecord {
  id: number;
  action_id: number | null;
  claim_or_decision: string;
  source_name: string;
  source_url: string | null;
  source_type: string;
  content_hash: string;
  trust_score: number;
  verification_status: string;
  metadata_json?: string | null;
  created_at: string;
}

export interface SecurityPolicy {
  id: number;
  name: string;
  code: string;
  category: string;
  severity: RiskLevel;
  description: string | null;
  rules_json: string;
  enforcement_mode: 'ENFORCE' | 'MONITOR_ONLY' | 'DISABLED';
  risk_penalty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface SecurityIncident {
  id: number;
  incident_number: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source_agent_id?: number | null;
  action_id?: number | null;
  assigned_analyst_id?: number | null;
  investigation_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  actor_type: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  action_summary: string;
  payload_hash: string;
  previous_hash: string;
  entry_hash: string;
}

export interface AuditVerificationResult {
  is_valid: boolean;
  total_records: number;
  verified_records: number;
  broken_chain_index?: number | null;
  message: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number | null;
  title: string;
  message: string;
  notification_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ScanPromptResult {
  is_injected: boolean;
  risk_level: RiskLevel;
  confidence_score: number;
  detection_type: string;
  matched_signatures: string[];
  highlighted_spans: Array<{
    start: number;
    end: number;
    text: string;
    label: string;
    category: string;
  }>;
  explanation: string;
  recommended_action: string;
}

export interface LeakedEntity {
  entity_type: string;
  original_value: string;
  masked_value: string;
  start: number;
  end: number;
  confidence: number;
}

export interface DataLeakageResult {
  has_leakage: boolean;
  leak_count: number;
  risk_level: RiskLevel;
  entities: LeakedEntity[];
  masked_text: string;
  explanation: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  content_hash: string;
  is_poisoned: boolean;
  chunks_count: number;
  created_at: string;
}

export interface DocumentChunkItem {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  token_count: number;
  has_suspicious_payload: boolean;
  suspicious_details?: string | null;
  created_at: string;
}

export interface RAGQueryCitation {
  document_id: number;
  chunk_id: number;
  document_title: string;
  snippet: string;
  similarity_score: number;
  influence_weight: number;
  is_poisoned: boolean;
  poison_warning?: string | null;
}

export interface RAGQueryResponse {
  query: string;
  synthesized_answer: string;
  citations: RAGQueryCitation[];
  contains_poisoned_source: boolean;
  security_verdict: string;
  provenance_hash: string;
}

export interface MultiAgentStepLog {
  agent_name: string;
  agent_role: string;
  state: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface MultiAgentRunResponse {
  task_id: number;
  final_status: string;
  orchestrator_state: string;
  action_proposed?: any;
  risk_assessment?: RiskAssessment;
  approval_required: boolean;
  execution_result?: string;
  steps: MultiAgentStepLog[];
}

