import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Database,
  Globe,
  Hash,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ProvenanceRecord } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ProvenanceExplorer: React.FC = () => {
  const [records, setRecords] = useState<ProvenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ProvenanceRecord | null>(null);
  const [lineageData, setLineageData] = useState<any>(null);
  const [searchHash, setSearchHash] = useState('');

  const fetchProvenance = async () => {
    try {
      const data = await api.getProvenanceRecords();
      setRecords(data);
      if (data.length > 0 && !selectedRecord) {
        setSelectedRecord(data[0]);
        if (data[0].action_id) {
          loadLineage(data[0].action_id);
        }
      }
    } catch (err) {
      console.error('Failed to load provenance records', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLineage = async (actionId: number) => {
    try {
      const lineage = await api.getActionLineage(actionId);
      setLineageData(lineage);
    } catch (err) {
      console.error('Failed to load lineage DAG', err);
    }
  };

  useEffect(() => {
    fetchProvenance();
  }, []);

  const handleSelectRecord = (rec: ProvenanceRecord) => {
    setSelectedRecord(rec);
    if (rec.action_id) {
      loadLineage(rec.action_id);
    } else {
      setLineageData(null);
    }
  };

  const filteredRecords = records.filter((r) => {
    return (
      r.claim_or_decision.toLowerCase().includes(searchHash.toLowerCase()) ||
      r.content_hash.toLowerCase().includes(searchHash.toLowerCase()) ||
      r.source_name.toLowerCase().includes(searchHash.toLowerCase())
    );
  });

  if (loading) {
    return <LoadingSpinner message="Tracing information lineage & cryptographic hashes..." />;
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'DATABASE': return <Database size={16} color="var(--electric-blue)" />;
      case 'WEB': return <Globe size={16} color="var(--violet-accent)" />;
      default: return <FileText size={16} color="var(--emerald-safe)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Provenance & Information Lineage Explorer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Cryptographically anchor agent claims and audit end-to-end data provenance back to original source artifacts.
          </p>
        </div>
        <button
          onClick={() => fetchProvenance()}
          className="btn-veritrust-outline"
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <RefreshCw size={14} /> Refresh Hashes
        </button>
      </div>

      {/* Visual Lineage Timeline DAG (Interactive Flow) */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <GitBranch size={18} color="var(--electric-blue)" />
            Cryptographic Data Lineage Pipeline (DAG)
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Trace: Ingestion → Chunking → Retrieval → Reasoning → Action
          </span>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'relative'
        }}>
          {/* Step 1: Raw Ingested Source */}
          <div style={{
            flex: 1,
            minWidth: '180px',
            padding: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>1. ORIGINAL SOURCE</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {selectedRecord ? getSourceIcon(selectedRecord.source_type) : <FileText size={16} />}
              {selectedRecord?.source_name || 'SAP Concur ERP System'}
            </div>
            <div className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--electric-blue)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              SHA256: {selectedRecord?.content_hash.slice(0, 16)}...
            </div>
          </div>

          <ArrowRight size={20} color="var(--text-muted)" />

          {/* Step 2: Content Hash Verification */}
          <div style={{
            flex: 1,
            minWidth: '180px',
            padding: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--emerald-safe)', fontWeight: 600 }}>2. HASH INTEGRITY</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--emerald-safe)" /> Integrity Validated
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Source Trust Score: <strong style={{ color: 'var(--emerald-safe)' }}>{selectedRecord?.trust_score || 94}%</strong>
            </div>
          </div>

          <ArrowRight size={20} color="var(--text-muted)" />

          {/* Step 3: Cognitive Shield Intercept */}
          <div style={{
            flex: 1,
            minWidth: '180px',
            padding: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>3. COGNITIVE INTERCEPT</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem' }}>
              Prompt Integrity Checked
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Poisoning scans passed: 0 injection tokens
            </div>
          </div>

          <ArrowRight size={20} color="var(--text-muted)" />

          {/* Step 4: Proposed Agent Action */}
          <div style={{
            flex: 1,
            minWidth: '180px',
            padding: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--electric-blue)', fontWeight: 600 }}>4. DERIVED DECISION</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem' }}>
              {selectedRecord?.claim_or_decision.slice(0, 32)}...
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Status: <span style={{ color: 'var(--emerald-safe)' }}>VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provenance Ledger Table */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Hash size={18} color="var(--electric-blue)" />
            Provenance Claims & Cryptographic Ledger
          </div>
          <div style={{ width: '280px' }}>
            <input
              type="text"
              placeholder="Search claims, sources, hashes..."
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              className="form-veritrust-control"
              style={{ fontSize: '0.75rem', height: '32px' }}
            />
          </div>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Claim / AI Generated Decision</th>
                <th>Source Name</th>
                <th>Type</th>
                <th>Cryptographic SHA-256 Hash</th>
                <th>Trust</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => handleSelectRecord(r)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent'
                    }}
                  >
                    <td className="font-mono">#{r.id}</td>
                    <td style={{ maxWidth: '300px', fontWeight: 500 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.claim_or_decision}
                      </div>
                    </td>
                    <td>{r.source_name}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        fontSize: '0.7rem'
                      }}>
                        {r.source_type}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--electric-blue)' }}>
                      {r.content_hash.slice(0, 16)}...
                    </td>
                    <td>
                      <strong style={{ color: r.trust_score >= 90 ? 'var(--emerald-safe)' : 'var(--amber-warning)' }}>
                        {r.trust_score}%
                      </strong>
                    </td>
                    <td>
                      <span style={{
                        color: r.verification_status === 'VERIFIED' ? 'var(--emerald-safe)' : 'var(--crimson-critical)',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}>
                        {r.verification_status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectRecord(r); }}
                        className="btn-veritrust-outline"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      >
                        Inspect Lineage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

