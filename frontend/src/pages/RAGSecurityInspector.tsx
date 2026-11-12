import React, { useEffect, useState } from 'react';
import {
  FileSearch,
  Upload,
  Search,
  ShieldCheck,
  ShieldAlert,
  Flame,
  FileText,
  AlertTriangle,
  Play,
  RefreshCw,
  Hash
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, RAGQueryResponse } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const RAGSecurityInspector: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('What are the rules regarding financial transactions exceeding five thousand dollars?');
  const [queryResult, setQueryResult] = useState<RAGQueryResponse | null>(null);
  const [querying, setQuerying] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleQuery = async () => {
    if (!queryText.trim()) return;
    setQuerying(true);
    try {
      const res = await api.queryRAG(queryText, 4);
      setQueryResult(res);
    } catch (err) {
      console.error('RAG query failed', err);
    } finally {
      setQuerying(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadTitle) formData.append('title', uploadTitle);
      await api.uploadDocument(formData);
      setUploadFile(null);
      setUploadTitle('');
      fetchDocs();
      alert('Document ingested and scanned for poisoned instructions successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Scanning RAG document repository & embeddings..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            RAG Knowledge & Retrieval Security Inspector
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Inspect vectorized knowledge chunks for indirect prompt injections, poisoned embeddings, and citation influence weights.
          </p>
        </div>
        <button onClick={fetchDocs} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh Docs
        </button>
      </div>

      {/* Main Grid: Left Ingestion & Doc Table, Right Retrieval Sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '1.5rem' }}>
        {/* Left Column: Upload & Ingested Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upload Card */}
          <div className="veritrust-card">
            <div className="veritrust-card-header">
              <div className="veritrust-card-title">
                <Upload size={18} color="var(--electric-blue)" />
                Ingest Document with Safety Inspection
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Cloud Security Specification"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="form-veritrust-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Select File (.txt, .md, .json, .pdf)
                </label>
                <input
                  type="file"
                  required
                  accept=".txt,.md,.json,.pdf,.csv"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="form-veritrust-control"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="btn-veritrust-primary"
                style={{ justifyContent: 'center' }}
              >
                {uploading ? 'Ingesting & Chunking...' : 'Ingest & Scan Chunks'}
              </button>
            </form>
          </div>

          {/* Ingested Documents List */}
          <div className="veritrust-card">
            <div className="veritrust-card-header">
              <div className="veritrust-card-title">
                <FileText size={18} color="var(--electric-blue)" />
                Knowledge Base Documents ({documents.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${doc.is_poisoned ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>{doc.title}</div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {doc.filename} • {doc.chunks_count} chunks • SHA: {doc.content_hash.slice(0, 10)}...
                      </div>
                    </div>
                    {doc.is_poisoned ? (
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        border: '1px solid var(--crimson-critical)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        POISONED SAMPLE
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--emerald-safe)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}>
                        CLEAN
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: RAG Query & Citation Influence Sandbox */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <FileSearch size={18} color="var(--electric-blue)" />
              RAG Retrieval & Citation Defense Sandbox
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Query Ingested Knowledge Base
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="form-veritrust-control"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleQuery}
                  disabled={querying}
                  className="btn-veritrust-primary"
                  style={{ padding: '0.45rem 1rem' }}
                >
                  <Play size={14} /> {querying ? 'Retrieving...' : 'Query'}
                </button>
              </div>
            </div>

            {queryResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Security Verdict Banner */}
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: queryResult.contains_poisoned_source ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${queryResult.contains_poisoned_source ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {queryResult.contains_poisoned_source ? (
                    <Flame size={24} color="var(--crimson-critical)" />
                  ) : (
                    <ShieldCheck size={24} color="var(--emerald-safe)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: queryResult.contains_poisoned_source ? '#fca5a5' : '#6ee7b7' }}>
                      RAG SECURITY VERDICT: {queryResult.security_verdict}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Provenance Anchor: <span className="font-mono">{queryResult.provenance_hash.slice(0, 16)}...</span>
                    </div>
                  </div>
                </div>

                {/* Synthesized Answer */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    GROUNDED SYNTHESIZED RESPONSE
                  </div>
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: '#fff',
                    lineHeight: 1.5
                  }}>
                    {queryResult.synthesized_answer}
                  </div>
                </div>

                {/* Retrieved Citations & Influence Weights */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    RETRIEVED CHUNKS & INFLUENCE WEIGHTS ({queryResult.citations.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {queryResult.citations.map((cite, i) => (
                      <div key={i} style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: `1px solid ${cite.is_poisoned ? 'var(--crimson-critical)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 600, color: cite.is_poisoned ? 'var(--rose-high)' : 'var(--electric-blue)' }}>
                            {cite.document_title} (Chunk #{cite.chunk_id})
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Influence: <strong style={{ color: '#fff' }}>{(cite.influence_weight * 100).toFixed(1)}%</strong> • Sim: {cite.similarity_score}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          "{cite.snippet}"
                        </div>
                        {cite.is_poisoned && (
                          <div style={{ color: '#fca5a5', marginTop: '0.35rem', fontWeight: 600, fontSize: '0.72rem' }}>
                            ⚠ POISON WARNING: {cite.poison_warning || 'Hostile override payload detected in chunk'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

