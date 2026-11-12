# VeriTrust
### A Human-in-the-Loop Cognitive Shield & Provenance Interface for High-Stakes Agentic Workflows

[![FastAPI](https://img.shields.io/badge/FastAPI-0.99.1-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite)](https://vitejs.dev)
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)]()

---

## 🛡️ Overview

**VeriTrust** is an enterprise-grade cognitive shield and provenance tracking platform for autonomous AI agents executing high-stakes tasks in production environments (finance, database ops, code execution, customer communications, confidential data processing).

It continuously monitors agent tasks, inspects inputs for direct/indirect prompt injection and jailbreaks, scans outputs for sensitive credential or PII leaks with automatic masking, scores operation risk from 0 to 100, enforces human authorization for sensitive actions, maintains an immutable cryptographic SHA-256 audit ledger, and visualizes the complete provenance chain of all AI claims.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **1. Multi-Agent Orchestrator** | 5-agent pipeline (Research, Provenance, Security Guardian, Compliance, Execution) with state machine transitions. |
| **2. Prompt Injection Shield** | Detection for direct injections, indirect document payloads, and behavioral jailbreak attempts with highlighted spans. |
| **3. AI Action Risk Engine** | Multidimensional risk scoring (0–100) assessing sensitivity, permissions, reversibility, external communication, and financial impact. |
| **4. HITL Approval Center** | Intercepts high-risk operations; provides Approve, Reject, or Modify workflows with audit trails and expiration. |
| **5. Provenance & Source Graph** | SHA-256 DAG tracking claim lineage from source documents, trust scores, and chunk citations. |
| **6. Data Leakage Detection** | Regex & Shannon entropy scanners identifying API keys, passwords, bearer tokens, connection strings, and PII with masking. |
| **7. Agent Action Simulator** | Safe virtual sandbox for testing DB modifications, emails, shell commands, and transactions without external side-effects. |
| **8. Explainable AI Engine** | Transparent decision factors, trigger rules, and policy citations for every flagged operation. |
| **9. Policy Management** | Granular rules engine for risk thresholds, blocked commands, and mandatory authorization controls. |
| **10. Immutable Audit Ledger** | Cryptographic append-only event log with SHA-256 hash chaining and tamper-verification. |
| **11. Agent Trust Scoring** | Dynamic scores (0–100) reflecting historical compliance, rejection rates, and violation frequency. |
| **12. RAG Security Inspector** | Vector document ingest with chunk-level prompt injection scanning and retrieval influence tracking. |
| **13. Real-Time Telemetry** | WebSocket stream (`/api/ws/monitoring`) broadcasting live agent events, security alerts, and risk metrics. |
| **14. Security Playground** | Pre-packaged attack vectors (DAN, SQLi, exfiltration, jailbreaks) for live defensive testing. |
| **15. Analytics & CSV Export** | Interactive metrics dashboard with severity distributions and one-click incident report generation. |
| **16. RBAC & JWT Security** | Bcrypt password hashing, role-based access control (Admin, Analyst), and short-lived JWT tokens. |

---

## 🔑 Default Credentials

The platform is pre-seeded with realistic enterprise agents, policies, incidents, and users:

| Role | Email | Password |
|---|---|---|
| **Security Administrator** | `admin@veritrust.io` | `Admin@123456` |
| **Security Analyst** | `analyst@veritrust.io` | `Analyst@123456` |

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, React Router 7, Recharts, Lucide React, Bootstrap 5 (Pure CSS3 Theme, **No Tailwind**).
- **Backend**: Python FastAPI, Pydantic, SQLAlchemy ORM, WebSockets, PyJWT, Bcrypt.
- **Database**: SQLite (local development) / PostgreSQL (production docker).
- **Security Engine**: Custom rule-based heuristics, Shannon entropy analysis, regex pattern banks, and hash-chain audit ledger.

---

## 🏃 Quick Start Guide

### 1. Backend Setup

```bash
# Set PYTHONPATH and run seed script
python backend/seed.py

# Run FastAPI server with Uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir backend
```
Backend API will be live at `http://localhost:8000`. Swagger API docs available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Frontend will be accessible at `http://localhost:5173`.

### 3. Running with Docker Compose

```bash
docker-compose up --build
```

### 4. Running Backend Automated Tests

```bash
python -m pytest backend/tests -v
```
All 18 tests across authentication, injection detection, data leakage masking, risk scoring, approvals, and audit ledger will pass.

---

## 📜 API Endpoints Overview

- `POST /api/auth/login` - Authenticate user & obtain JWT tokens
- `GET /api/agents` - List registered AI agents & trust metrics
- `POST /api/security/scan-prompt` - Scan prompt for injection & jailbreak attacks
- `POST /api/security/scan-data` - Detect sensitive credential leaks & return masked text
- `POST /api/security/assess-action` - Compute 0-100 risk score and explainability factors
- `GET /api/approvals` - List pending human-in-the-loop approval requests
- `POST /api/approvals/{id}/approve` - Authorize sensitive operation
- `POST /api/approvals/{id}/reject` - Reject sensitive operation
- `GET /api/provenance` - Query provenance lineage records
- `GET /api/audit/verify` - Cryptographically verify hash-chain integrity of audit ledger
- `POST /api/orchestrator/run` - Execute end-to-end multi-agent pipeline
- `GET /api/ws/monitoring` - WebSocket live telemetry feed

