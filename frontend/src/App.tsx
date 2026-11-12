import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { MainLayout } from './layouts/MainLayout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { AgentMonitoring } from './pages/AgentMonitoring';
import { ThreatDetectionCenter } from './pages/ThreatDetectionCenter';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { ProvenanceExplorer } from './pages/ProvenanceExplorer';
import { DataLeakageMonitor } from './pages/DataLeakageMonitor';
import { AgentSimulator } from './pages/AgentSimulator';
import { PolicyManagement } from './pages/PolicyManagement';
import { IncidentManagement } from './pages/IncidentManagement';
import { AuditLogs } from './pages/AuditLogs';
import { MultiAgentPipeline } from './pages/MultiAgentPipeline';
import { TrustScoreAnalytics } from './pages/TrustScoreAnalytics';
import { RAGSecurityInspector } from './pages/RAGSecurityInspector';
import { SecurityTestingPlayground } from './pages/SecurityTestingPlayground';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { NotificationsCenter } from './pages/NotificationsCenter';
import { UserProfile } from './pages/UserProfile';
import { AdminSettings } from './pages/AdminSettings';
import { LoadingSpinner } from './components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Verifying session credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes wrapped in MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewDashboard />} />
        <Route path="overview" element={<OverviewDashboard />} />
        <Route path="agents" element={<AgentMonitoring />} />
        <Route path="threats" element={<ThreatDetectionCenter />} />
        <Route path="approvals" element={<ApprovalCenter />} />
        <Route path="provenance" element={<ProvenanceExplorer />} />
        <Route path="data-leakage" element={<DataLeakageMonitor />} />
        <Route path="simulator" element={<AgentSimulator />} />
        <Route path="policies" element={<PolicyManagement />} />
        <Route path="incidents" element={<IncidentManagement />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="orchestrator" element={<MultiAgentPipeline />} />
        <Route path="trust-scores" element={<TrustScoreAnalytics />} />
        <Route path="rag" element={<RAGSecurityInspector />} />
        <Route path="playground" element={<SecurityTestingPlayground />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="notifications" element={<NotificationsCenter />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
