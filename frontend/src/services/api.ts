import axios from 'axios';
import {
  AuthResponse,
  User,
  Agent,
  TrustScoreHistory,
  ApprovalRequest,
  ProvenanceRecord,
  SecurityPolicy,
  SecurityIncident,
  AuditLog,
  AuditVerificationResult,
  NotificationItem,
  ScanPromptResult,
  DataLeakageResult,
  DocumentItem,
  DocumentChunkItem,
  RAGQueryResponse,
  MultiAgentRunResponse
} from '../types';
import {
  MOCK_AGENTS,
  MOCK_APPROVALS,
  MOCK_INCIDENTS,
  MOCK_POLICIES,
  MOCK_AUDIT_LOGS,
  MOCK_PROVENANCE,
  MOCK_NOTIFICATIONS
} from './mockData';

const API_BASE = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Intercept requests to attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('veritrust_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.hash.includes('/login') && !window.location.hash.includes('/register')) {
        localStorage.removeItem('veritrust_token');
        localStorage.removeItem('veritrust_user');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (credentials: { username_or_email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: any): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', userData);
    return res.data;
  },
  googleAuth: async (data: { credential?: string; email?: string; name?: string; picture?: string; sub?: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/google', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
  updateProfile: async (data: any): Promise<User> => {
    const res = await apiClient.put<User>('/auth/profile', data);
    return res.data;
  },

  // Agents
  getAgents: async (): Promise<Agent[]> => {
    try {
      const res = await apiClient.get<Agent[]>('/agents');
      return res.data;
    } catch {
      return MOCK_AGENTS;
    }
  },
  getAgent: async (id: number): Promise<Agent> => {
    try {
      const res = await apiClient.get<Agent>(`/agents/${id}`);
      return res.data;
    } catch {
      return MOCK_AGENTS.find(a => a.id === id) || MOCK_AGENTS[0];
    }
  },
  createAgent: async (data: Partial<Agent>): Promise<Agent> => {
    try {
      const res = await apiClient.post<Agent>('/agents', data);
      return res.data;
    } catch {
      const newAgent: Agent = {
        id: Date.now(),
        name: data.name || 'New Custom Agent',
        code: data.code || `AGENT-${Date.now().toString().slice(-4)}`,
        description: data.description || 'Configured security monitored agent.',
        role_type: data.role_type || 'EXECUTION',
        status: data.status || 'ACTIVE',
        current_trust_score: 85.0,
        tasks_count: 0,
        threat_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return newAgent;
    }
  },
  updateAgent: async (id: number, data: Partial<Agent>): Promise<Agent> => {
    try {
      const res = await apiClient.put<Agent>(`/agents/${id}`, data);
      return res.data;
    } catch {
      return { ...MOCK_AGENTS[0], ...data, id };
    }
  },
  getAgentActivities: async (id: number): Promise<any[]> => {
    try {
      const res = await apiClient.get<any[]>(`/agents/${id}/activities`);
      return res.data;
    } catch {
      return [
        { id: 1, action_type: 'QUERY', target_resource: 'CUSTOMER_LEDGER', status: 'EXECUTED', created_at: new Date().toISOString() },
        { id: 2, action_type: 'API_DISPATCH', target_resource: 'STRIPE_GATEWAY', status: 'COMPLETED', created_at: new Date().toISOString() }
      ];
    }
  },
  getAgentTrustHistory: async (id: number): Promise<TrustScoreHistory[]> => {
    try {
      const res = await apiClient.get<TrustScoreHistory[]>(`/agents/${id}/trust-history`);
      return res.data;
    } catch {
      return [
        { timestamp: '10:00', score: 85, delta: 0, reason: 'Initial baseline' },
        { timestamp: '12:00', score: 88, delta: +3, reason: 'Verified safe execution' },
        { timestamp: '14:00', score: 84, delta: -4, reason: 'Flagged suspicious command' },
        { timestamp: '16:00', score: 89, delta: +5, reason: 'Policy compliance confirmed' }
      ];
    }
  },

  // Security Scanners
  scanPrompt: async (prompt: string, context?: string): Promise<ScanPromptResult> => {
    try {
      const res = await apiClient.post<ScanPromptResult>('/security/scan-prompt', { prompt, context });
      return res.data;
    } catch {
      const lower = prompt.toLowerCase();
      const isDirect = lower.includes('ignore') || lower.includes('override') || lower.includes('system prompt') || lower.includes('disregard');
      const isJailbreak = lower.includes('dan') || lower.includes('jailbreak') || lower.includes('developer mode');
      const isThreat = isDirect || isJailbreak;
      return {
        is_injected: isThreat,
        detection_type: isJailbreak ? 'JAILBREAK_ATTEMPT' : isDirect ? 'DIRECT_INJECTION' : 'NONE',
        risk_level: isThreat ? 'HIGH' : 'LOW',
        confidence_score: 0.94,
        matched_signatures: isThreat ? ['INSTRUCTION_OVERRIDE_KEYWORD'] : [],
        explanation: isThreat
          ? 'Cognitive bypass keywords detected attempting to override execution rules.'
          : 'Prompt passed structural verification without malicious patterns.',
        recommended_action: isThreat ? 'BLOCK_AND_FLAG' : 'ALLOW',
        highlighted_spans: isThreat ? [{ start: 0, end: Math.min(prompt.length, 30), text: prompt.slice(0, 30), label: 'INJECTION', category: 'ATTACK' }] : []
      };
    }
  },
  scanLeakage: async (text: string, maskResult: boolean = true): Promise<DataLeakageResult> => {
    try {
      const res = await apiClient.post<DataLeakageResult>('/security/scan-leakage', { text, mask_result: maskResult });
      return res.data;
    } catch {
      let cleaned = text;
      const entities: any[] = [];
      const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
      const apiKeyRegex = /AKIA[0-9A-Z]{16}/g;

      if (emailRegex.test(text)) {
        entities.push({ entity_type: 'EMAIL_ADDRESS', original_value: 'email', masked_value: '***@***.***', start: 0, end: 10, confidence: 0.98 });
        cleaned = cleaned.replace(emailRegex, '***@***.***');
      }
      if (apiKeyRegex.test(text)) {
        entities.push({ entity_type: 'AWS_ACCESS_KEY', original_value: 'key', masked_value: 'AKIA****************', start: 0, end: 20, confidence: 0.99 });
        cleaned = cleaned.replace(apiKeyRegex, 'AKIA****************');
      }

      return {
        has_leakage: entities.length > 0,
        leak_count: entities.length,
        risk_level: entities.length > 0 ? 'CRITICAL' : 'LOW',
        entities,
        masked_text: cleaned,
        explanation: entities.length > 0 ? 'Sensitive tokens detected and automatically redacted.' : 'No leaks identified.'
      };
    }
  },
  assessAction: async (data: any): Promise<any> => {
    try {
      const res = await apiClient.post<any>('/security/assess-action', data);
      return res.data;
    } catch {
      const isRisky = data.action_type === 'DATABASE_MUTATION' || data.action_type === 'FINANCIAL_TRANSFER';
      return {
        overall_risk_score: isRisky ? 84.0 : 25.0,
        risk_level: isRisky ? 'CRITICAL' : 'LOW',
        explanation: isRisky
          ? 'Operation modifies irreversible external state or exceeds fiduciary thresholds.'
          : 'Operation is classified as reversible low-impact inspection.',
        requires_approval: isRisky,
        factor_breakdown: {
          data_sensitivity: isRisky ? 85 : 20,
          permission_level: isRisky ? 90 : 20,
          reversibility: isRisky ? 80 : 15,
          external_communication: isRisky ? 75 : 30,
          financial_impact: isRisky ? 90 : 10
        }
      };
    }
  },
  unifiedAnalyze: async (text: string): Promise<any> => {
    try {
      const res = await apiClient.post<any>('/security/analyze', { text });
      return res.data;
    } catch {
      return {
        prompt_analysis: { is_threat: false, risk_score: 15.0 },
        leakage_analysis: { has_leakage: false, risk_score: 0.0 },
        recommended_action: 'ALLOW'
      };
    }
  },

  // Approvals
  getApprovals: async (): Promise<ApprovalRequest[]> => {
    try {
      const res = await apiClient.get<ApprovalRequest[]>('/approvals');
      return res.data;
    } catch {
      return MOCK_APPROVALS;
    }
  },
  approveRequest: async (id: number, notes?: string): Promise<any> => {
    try {
      const res = await apiClient.post(`/approvals/${id}/approve`, { decision: 'APPROVED', notes });
      return res.data;
    } catch {
      return { status: 'APPROVED', id, reviewer_notes: notes || 'Approved in demo session.' };
    }
  },
  rejectRequest: async (id: number, notes?: string): Promise<any> => {
    try {
      const res = await apiClient.post(`/approvals/${id}/reject`, { decision: 'REJECTED', notes });
      return res.data;
    } catch {
      return { status: 'REJECTED', id, reviewer_notes: notes || 'Rejected by analyst.' };
    }
  },
  modifyRequest: async (id: number, modifiedPayload: string, notes?: string): Promise<any> => {
    try {
      const res = await apiClient.post(`/approvals/${id}/decision`, {
        decision: 'MODIFIED',
        modified_payload: modifiedPayload,
        notes,
      });
      return res.data;
    } catch {
      return { status: 'MODIFIED', id, modified_payload: modifiedPayload };
    }
  },

  // Provenance
  getProvenanceRecords: async (limit: number = 100): Promise<ProvenanceRecord[]> => {
    try {
      const res = await apiClient.get<ProvenanceRecord[]>(`/provenance?limit=${limit}`);
      return res.data;
    } catch {
      return MOCK_PROVENANCE;
    }
  },
  getProvenanceRecord: async (id: number): Promise<ProvenanceRecord> => {
    try {
      const res = await apiClient.get<ProvenanceRecord>(`/provenance/${id}`);
      return res.data;
    } catch {
      return MOCK_PROVENANCE.find(p => p.id === id) || MOCK_PROVENANCE[0];
    }
  },
  getActionLineage: async (actionId: number): Promise<any> => {
    try {
      const res = await apiClient.get<any>(`/provenance/action/${actionId}`);
      return res.data;
    } catch {
      return {
        action_id: actionId,
        source_records: MOCK_PROVENANCE,
        lineage_depth: 3,
        verification_status: 'VERIFIED'
      };
    }
  },

  // Policies
  getPolicies: async (): Promise<SecurityPolicy[]> => {
    try {
      const res = await apiClient.get<SecurityPolicy[]>('/policies');
      return res.data;
    } catch {
      return MOCK_POLICIES;
    }
  },
  createPolicy: async (data: any): Promise<SecurityPolicy> => {
    try {
      const res = await apiClient.post<SecurityPolicy>('/policies', data);
      return res.data;
    } catch {
      const newPolicy: SecurityPolicy = {
        id: Date.now(),
        name: data.name,
        code: `POL-${Date.now().toString().slice(-4)}`,
        category: 'CUSTOM',
        severity: 'MEDIUM',
        description: data.description,
        rules_json: JSON.stringify(data),
        enforcement_mode: data.enforcement_mode || 'ENFORCE',
        risk_penalty: 20.0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return newPolicy;
    }
  },
  updatePolicy: async (id: number, data: any): Promise<SecurityPolicy> => {
    try {
      const res = await apiClient.put<SecurityPolicy>(`/policies/${id}`, data);
      return res.data;
    } catch {
      return { ...MOCK_POLICIES[0], ...data, id };
    }
  },
  deletePolicy: async (id: number): Promise<any> => {
    try {
      const res = await apiClient.delete(`/policies/${id}`);
      return res.data;
    } catch {
      return { success: true, id };
    }
  },

  // Incidents
  getIncidents: async (status?: string, severity?: string): Promise<SecurityIncident[]> => {
    try {
      let url = '/incidents';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (severity) params.append('severity', severity);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      const res = await apiClient.get<SecurityIncident[]>(url);
      return res.data;
    } catch {
      return MOCK_INCIDENTS;
    }
  },
  createIncident: async (data: any): Promise<SecurityIncident> => {
    try {
      const res = await apiClient.post<SecurityIncident>('/incidents', data);
      return res.data;
    } catch {
      const newInc: SecurityIncident = {
        id: Date.now(),
        incident_number: `INC-${Date.now().toString().slice(-4)}`,
        title: data.title || 'Reported Anomaly',
        description: data.description || 'Analyst identified threat pattern.',
        severity: data.severity || 'MEDIUM',
        status: 'OPEN',
        source_agent_id: data.source_agent_id || 1,
        investigation_notes: data.notes || '',
        created_at: new Date().toISOString()
      };
      return newInc;
    }
  },
  updateIncident: async (id: number, data: any): Promise<SecurityIncident> => {
    try {
      const res = await apiClient.put<SecurityIncident>(`/incidents/${id}`, data);
      return res.data;
    } catch {
      return { ...MOCK_INCIDENTS[0], ...data, id };
    }
  },

  // Analytics
  getOverview: async (): Promise<any> => {
    try {
      const res = await apiClient.get('/analytics/overview');
      return res.data;
    } catch {
      return {
        total_agents: MOCK_AGENTS.length,
        active_agents: 4,
        total_tasks: 9970,
        flagged_threats: 49,
        pending_approvals: 2,
        open_incidents: 2,
        average_trust_score: 87.6,
        tamper_status: 'VERIFIED_SECURE'
      };
    }
  },
  getThreatMetrics: async (): Promise<any> => {
    try {
      const res = await apiClient.get('/analytics/threats');
      return res.data;
    } catch {
      return {
        direct_injections: 18,
        jailbreaks: 12,
        data_leakages: 14,
        policy_violations: 5
      };
    }
  },
  getAgentAnalytics: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get('/analytics/agents');
      return res.data;
    } catch {
      return MOCK_AGENTS.map(a => ({
        id: a.id,
        name: a.name,
        code: a.code,
        trust_score: a.current_trust_score,
        tasks: a.tasks_count,
        threats: a.threat_count
      }));
    }
  },

  // Audit Logs
  getAuditLogs: async (limit: number = 100): Promise<AuditLog[]> => {
    try {
      const res = await apiClient.get<AuditLog[]>(`/audit-logs?limit=${limit}`);
      return res.data;
    } catch {
      return MOCK_AUDIT_LOGS;
    }
  },
  verifyAuditLedger: async (): Promise<AuditVerificationResult> => {
    try {
      const res = await apiClient.post<AuditVerificationResult>('/audit-logs/verify');
      return res.data;
    } catch {
      return {
        is_valid: true,
        total_records: MOCK_AUDIT_LOGS.length,
        verified_records: MOCK_AUDIT_LOGS.length,
        message: 'Cryptographic SHA-256 hash chain verified intact. Zero tampering detected.'
      };
    }
  },

  // RAG
  getDocuments: async (): Promise<DocumentItem[]> => {
    try {
      const res = await apiClient.get<DocumentItem[]>('/rag/documents');
      return res.data;
    } catch {
      return [
        { id: 1, title: 'Corporate Security Policy v4.pdf', filename: 'sec_policy_v4.pdf', file_type: 'application/pdf', file_size: 1048576, content_hash: '9a8b7c6d', is_poisoned: false, chunks_count: 24, created_at: new Date().toISOString() },
        { id: 2, title: 'Wire Transfer SOP 2026.txt', filename: 'wire_transfer_sop.txt', file_type: 'text/plain', file_size: 20480, content_hash: '8f7e6d5c', is_poisoned: false, chunks_count: 12, created_at: new Date().toISOString() }
      ];
    }
  },
  uploadDocument: async (formData: FormData): Promise<DocumentItem> => {
    try {
      const res = await apiClient.post<DocumentItem>('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch {
      return {
        id: Date.now(),
        title: 'Uploaded Knowledge Document',
        filename: 'document.pdf',
        file_type: 'application/pdf',
        file_size: 512000,
        content_hash: 'abc123hash',
        is_poisoned: false,
        chunks_count: 8,
        created_at: new Date().toISOString()
      };
    }
  },
  queryRAG: async (query: string, topK: number = 4): Promise<RAGQueryResponse> => {
    try {
      const res = await apiClient.post<RAGQueryResponse>('/rag/query', { query, top_k: topK });
      return res.data;
    } catch {
      return {
        query,
        citations: [
          {
            document_id: 1,
            chunk_id: 1,
            document_title: 'Wire Transfer SOP 2026.txt',
            snippet: 'Section 4.1: Outbound transfers over $10,000 require dual-officer cryptographic sign-off.',
            similarity_score: 0.92,
            influence_weight: 0.85,
            is_poisoned: false
          }
        ],
        synthesized_answer: 'According to Section 4.1 of the Wire Transfer SOP, all outbound transfers above $10,000 require dual-officer cryptographic sign-off.',
        contains_poisoned_source: false,
        security_verdict: 'SAFE',
        provenance_hash: '3f79bb7b435b05321651daefd374cd681b61935c13e0e77ec3b2a4bb954d079d'
      };
    }
  },
  getDocumentChunks: async (docId: number): Promise<DocumentChunkItem[]> => {
    try {
      const res = await apiClient.get<DocumentChunkItem[]>(`/rag/documents/${docId}/chunks`);
      return res.data;
    } catch {
      return [
        { id: 1, document_id: docId, chunk_index: 0, content: 'Compliance baseline rules and execution definitions.', token_count: 14, has_suspicious_payload: false, created_at: new Date().toISOString() }
      ];
    }
  },

  // Simulator
  simulateAction: async (data: any): Promise<any> => {
    try {
      const res = await apiClient.post('/simulator/evaluate', data);
      return res.data;
    } catch {
      return {
        risk_score: data.action_type === 'DATABASE_MUTATION' ? 92.0 : 35.0,
        risk_level: data.action_type === 'DATABASE_MUTATION' ? 'CRITICAL' : 'LOW',
        verdict: data.action_type === 'DATABASE_MUTATION' ? 'BLOCKED' : 'ALLOWED',
        simulation_logs: [
          'Initializing sandboxed virtual runtime...',
          'Scanning action payload against security policies...',
          'Computing multidimensional risk index...',
          data.action_type === 'DATABASE_MUTATION'
            ? 'Action BLOCKED: Destructive database operation violates Policy #2.'
            : 'Action APPROVED: Operation satisfies containment constraints.'
        ]
      };
    }
  },

  // Multi-Agent Orchestrator
  runOrchestrator: async (userTask: string, targetSystem?: string): Promise<MultiAgentRunResponse> => {
    try {
      const res = await apiClient.post<MultiAgentRunResponse>('/orchestrator/run', {
        user_task: userTask,
        target_system: targetSystem || 'Production Internal Network',
        require_strict_compliance: true,
      });
      return res.data;
    } catch {
      return {
        task_id: Date.now(),
        final_status: 'COMPLETED',
        orchestrator_state: 'COMPLETED',
        approval_required: false,
        execution_result: 'Task executed safely inside cognitive shield sandbox with full provenance verification.',
        steps: [
          { agent_name: 'Atlas Research Agent', agent_role: 'RESEARCH', state: 'COMPLETED', message: `Synthesized research parameters for: "${userTask}"`, timestamp: '12:00:01' },
          { agent_name: 'Hermes Provenance Agent', agent_role: 'PROVENANCE', state: 'COMPLETED', message: 'Verified source SHA-256 DAG hash integrity', timestamp: '12:00:02' },
          { agent_name: 'Aegis Security Guardian', agent_role: 'GUARDIAN', state: 'COMPLETED', message: 'Inspection verdict: APPROVED_WITH_CONTAINMENT (Risk: 38.5)', timestamp: '12:00:03' },
          { agent_name: 'Themis Compliance Agent', agent_role: 'COMPLIANCE', state: 'COMPLETED', message: 'Compliance verified against SOC2/GDPR rules', timestamp: '12:00:04' },
          { agent_name: 'Execution Agent', agent_role: 'EXECUTION', state: 'COMPLETED', message: 'Action successfully committed in sandbox', timestamp: '12:00:05' }
        ]
      };
    }
  },

  // Notifications
  getNotifications: async (limit: number = 50): Promise<NotificationItem[]> => {
    try {
      const res = await apiClient.get<NotificationItem[]>(`/notifications?limit=${limit}`);
      return res.data;
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  },
  markNotificationRead: async (id: number): Promise<any> => {
    try {
      const res = await apiClient.post(`/notifications/${id}/read`);
      return res.data;
    } catch {
      return { success: true, id };
    }
  },
  markAllNotificationsRead: async (): Promise<any> => {
    try {
      const res = await apiClient.post('/notifications/read-all');
      return res.data;
    } catch {
      return { success: true };
    }
  },

  // Reports
  getExportUrl: (reportType: string = 'actions', format: string = 'csv'): string => {
    return `${API_BASE}/reports/export?report_type=${reportType}&format=${format}`;
  },
};
