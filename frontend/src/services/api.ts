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

const API_BASE = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
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
      // If unauthorized and not already on login, clean up
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('veritrust_token');
        localStorage.removeItem('veritrust_user');
        window.location.href = '/login';
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
    const res = await apiClient.get<Agent[]>('/agents');
    return res.data;
  },
  getAgent: async (id: number): Promise<Agent> => {
    const res = await apiClient.get<Agent>(`/agents/${id}`);
    return res.data;
  },
  createAgent: async (data: Partial<Agent>): Promise<Agent> => {
    const res = await apiClient.post<Agent>('/agents', data);
    return res.data;
  },
  updateAgent: async (id: number, data: Partial<Agent>): Promise<Agent> => {
    const res = await apiClient.put<Agent>(`/agents/${id}`, data);
    return res.data;
  },
  getAgentActivities: async (id: number): Promise<any[]> => {
    const res = await apiClient.get<any[]>(`/agents/${id}/activities`);
    return res.data;
  },
  getAgentTrustHistory: async (id: number): Promise<TrustScoreHistory[]> => {
    const res = await apiClient.get<TrustScoreHistory[]>(`/agents/${id}/trust-history`);
    return res.data;
  },

  // Security Scanners
  scanPrompt: async (prompt: string, context?: string): Promise<ScanPromptResult> => {
    const res = await apiClient.post<ScanPromptResult>('/security/scan-prompt', { prompt, context });
    return res.data;
  },
  scanLeakage: async (text: string, maskResult: boolean = true): Promise<DataLeakageResult> => {
    const res = await apiClient.post<DataLeakageResult>('/security/scan-leakage', { text, mask_result: maskResult });
    return res.data;
  },
  assessAction: async (data: any): Promise<any> => {
    const res = await apiClient.post<any>('/security/assess-action', data);
    return res.data;
  },
  unifiedAnalyze: async (text: string): Promise<any> => {
    const res = await apiClient.post<any>('/security/analyze', { text });
    return res.data;
  },

  // Approvals
  getApprovals: async (): Promise<ApprovalRequest[]> => {
    const res = await apiClient.get<ApprovalRequest[]>('/approvals');
    return res.data;
  },
  approveRequest: async (id: number, notes?: string): Promise<any> => {
    const res = await apiClient.post(`/approvals/${id}/approve`, { decision: 'APPROVED', notes });
    return res.data;
  },
  rejectRequest: async (id: number, notes?: string): Promise<any> => {
    const res = await apiClient.post(`/approvals/${id}/reject`, { decision: 'REJECTED', notes });
    return res.data;
  },
  modifyRequest: async (id: number, modifiedPayload: string, notes?: string): Promise<any> => {
    const res = await apiClient.post(`/approvals/${id}/decision`, {
      decision: 'MODIFIED',
      modified_payload: modifiedPayload,
      notes
    });
    return res.data;
  },

  // Provenance
  getProvenanceRecords: async (limit: number = 100): Promise<ProvenanceRecord[]> => {
    const res = await apiClient.get<ProvenanceRecord[]>(`/provenance?limit=${limit}`);
    return res.data;
  },
  getProvenanceRecord: async (id: number): Promise<ProvenanceRecord> => {
    const res = await apiClient.get<ProvenanceRecord>(`/provenance/${id}`);
    return res.data;
  },
  getActionLineage: async (actionId: number): Promise<any> => {
    const res = await apiClient.get<any>(`/provenance/action/${actionId}`);
    return res.data;
  },

  // Policies
  getPolicies: async (): Promise<SecurityPolicy[]> => {
    const res = await apiClient.get<SecurityPolicy[]>('/policies');
    return res.data;
  },
  createPolicy: async (data: any): Promise<SecurityPolicy> => {
    const res = await apiClient.post<SecurityPolicy>('/policies', data);
    return res.data;
  },
  updatePolicy: async (id: number, data: any): Promise<SecurityPolicy> => {
    const res = await apiClient.put<SecurityPolicy>(`/policies/${id}`, data);
    return res.data;
  },
  deletePolicy: async (id: number): Promise<any> => {
    const res = await apiClient.delete(`/policies/${id}`);
    return res.data;
  },

  // Incidents
  getIncidents: async (status?: string, severity?: string): Promise<SecurityIncident[]> => {
    let url = '/incidents';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    const res = await apiClient.get<SecurityIncident[]>(url);
    return res.data;
  },
  createIncident: async (data: any): Promise<SecurityIncident> => {
    const res = await apiClient.post<SecurityIncident>('/incidents', data);
    return res.data;
  },
  updateIncident: async (id: number, data: any): Promise<SecurityIncident> => {
    const res = await apiClient.put<SecurityIncident>(`/incidents/${id}`, data);
    return res.data;
  },

  // Analytics
  getOverview: async (): Promise<any> => {
    const res = await apiClient.get('/analytics/overview');
    return res.data;
  },
  getThreatMetrics: async (): Promise<any> => {
    const res = await apiClient.get('/analytics/threats');
    return res.data;
  },
  getAgentAnalytics: async (): Promise<any[]> => {
    const res = await apiClient.get('/analytics/agents');
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (limit: number = 100): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>(`/audit-logs?limit=${limit}`);
    return res.data;
  },
  verifyAuditLedger: async (): Promise<AuditVerificationResult> => {
    const res = await apiClient.post<AuditVerificationResult>('/audit-logs/verify');
    return res.data;
  },

  // RAG
  getDocuments: async (): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>('/rag/documents');
    return res.data;
  },
  uploadDocument: async (formData: FormData): Promise<DocumentItem> => {
    const res = await apiClient.post<DocumentItem>('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  queryRAG: async (query: string, topK: number = 4): Promise<RAGQueryResponse> => {
    const res = await apiClient.post<RAGQueryResponse>('/rag/query', { query, top_k: topK });
    return res.data;
  },
  getDocumentChunks: async (docId: number): Promise<DocumentChunkItem[]> => {
    const res = await apiClient.get<DocumentChunkItem[]>(`/rag/documents/${docId}/chunks`);
    return res.data;
  },

  // Simulator
  simulateAction: async (data: any): Promise<any> => {
    const res = await apiClient.post('/simulator/evaluate', data);
    return res.data;
  },

  // Multi-Agent Orchestrator
  runOrchestrator: async (userTask: string, targetSystem?: string): Promise<MultiAgentRunResponse> => {
    const res = await apiClient.post<MultiAgentRunResponse>('/orchestrator/run', {
      user_task: userTask,
      target_system: targetSystem || 'Production Internal Network',
      require_strict_compliance: true,
    });
    return res.data;
  },

  // Notifications
  getNotifications: async (limit: number = 50): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>(`/notifications?limit=${limit}`);
    return res.data;
  },
  markNotificationRead: async (id: number): Promise<any> => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },
  markAllNotificationsRead: async (): Promise<any> => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },

  // Reports
  getExportUrl: (reportType: string = 'actions', format: string = 'csv'): string => {
    return `${API_BASE}/reports/export?report_type=${reportType}&format=${format}`;
  },
};

