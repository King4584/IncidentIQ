# IncidentIQ AI - "Incident Investigation & Evidence Agent"

IncidentIQ AI is an enterprise-grade, AI-native incident investigation platform designed for SREs, DevOps, Platform Engineers, and Incident Response teams. It ingests operational events across 10+ sources, normalizes them while preserving immutable raw evidence in PostgreSQL `JSONB`, performs multi-vector correlation, and executes a 10-node LangGraph AI agent pipeline powered by Azure OpenAI `gpt-4o` to generate evidence-backed hypotheses, missing telemetry requests, and post-mortem post-incident reports.

---

## 🏗️ Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │                   IncidentIQ AI UI                     │
                          │          (Next.js 15 App Router + React 19)            │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ REST APIs
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │                 FastAPI Core Engine                    │
                          │        (Python 3.12 + Async SQLAlchemy + JWT)          │
                          └─────┬─────────────────────┬──────────────────────┬─────┘
                                │                     │                      │
                                ▼                     ▼                      ▼
                    ┌──────────────────────┐ ┌─────────────────┐   ┌─────────────────┐
                    │ Multi-Vector Engine  │ │ 10-Node Agent   │   │  PostgreSQL /   │
                    │ Correlation & Norm   │ │ (Azure OpenAI)  │   │  SQLite (JSONB) │
                    └──────────────────────┘ └─────────────────┘   └─────────────────┘
```

---

## 🌟 Key Capabilities & Requirements Coverage

- [x] **Usable Frontend & Working Backend**: Next.js 15 App Router + Tailwind CSS + Lucide icons paired with FastAPI + Async SQLAlchemy backend.
- [x] **Basic Data Persistence**: Relational storage for Users, Incidents, Raw Events (`JSONB`), Normalized Events, Correlations, Hypotheses, Hypothesis Versions, Evidence, Mitigations, Root Causes, and Audit Logs.
- [x] **Functional AI Agent & LLM Workflow**: 10-Node LangGraph state machine powered by Azure OpenAI `gpt-4o`.
- [x] **Human Review & Approval (HITL)**: Investigators can **Accept as Confirmed**, **Reject**, or **Annotate** hypotheses. Root Cause Lockdown strictly requires human approval.
- [x] **Clear Loading, Empty, Validation & Failure States**: 10-Node animated stepper, empty state cards, form validation alerts, and status banners.
- [x] **Structured Application & AI Logs**: Comprehensive `AuditLog` table and Python `logging` module tracing system, investigator, and AI actions.
- [x] **Focused Tests**: Pytest backend suite, Playwright E2E suite, and automated `system_health_check.py` script.

---

## 📋 Completed & Intentionally Excluded Scope

### Completed Scope
- **Event Engine**: Multi-source normalization (JSON/CSV/TXT), immutable raw evidence storage, multi-vector correlation graph (`request_id`, `deployment_id`, time windows).
- **LangGraph AI Agent**: 10-node state machine (`EventAnalyzer` -> `EvidenceExtractor` -> `CorrelationEngine` -> `HypothesisGenerator` -> `HypothesisValidator` -> `ContradictionDetector` -> `TelemetryRequestor` -> `HypothesisRanker` -> `InvestigatorReview` -> `ReportGenerator`).
- **Investigator Actions**: Hypothesis acceptance/rejection, version history tracking, mitigation action tracker (`IN_PROGRESS` / `COMPLETED`), evidence-bound root cause lockdown.
- **Reporting**: Automated post-mortem report generation with one-click HTML export / PDF printing.
- **Security & UX**: JWT authentication, route protection (`AppShell`), fullscreen login page at `/`, SRE Control Room Dashboard at `/dashboard`, SRE Analytics, and Audit Trail.

### Intentionally Excluded Scope
- **Live Cloud Telemetry Ingestion Adapters**: Live streaming Kafka/Prometheus socket collectors (simulated via file upload, REST API, and sample JSON payloads).
- **Multi-Tenant SSO / SAML 2.0**: Enterprise Okta/Auth0 SAML integration (simulated via JWT RBAC authentication).

---

## ⚠️ Known Limitations
- **SQLite Fallback**: When PostgreSQL is unavailable locally, SQLite is used out-of-the-box. SQLite converts `JSONB` fields to JSON text strings.
- **LLM Rate Limits**: If Azure OpenAI API rate limits occur during heavy batch evaluation, the agent seamlessly falls back to dynamic event fact pattern extraction.

---

## 🚀 Setup & Launch Instructions

### 1. Launch FastAPI Backend
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python start_backend.py
```
*Backend API runs at `http://127.0.0.1:8000`. Database tables and demo SRE data (`INC-8092`) are automatically initialized and seeded!*

### 2. Launch Next.js 15 Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend application opens at `http://localhost:3000`.*

---

## 🐳 Deployment Details (Docker & Cloud)

### Docker Compose
```bash
cd docker
docker-compose up --build -d
```

### Vercel / Render / Railway Deployment
- **Frontend (Vercel)**: Set Root Directory to `frontend/`, Build Command `npm run build`, Output Directory `.next`.
- **Backend (Render)**: Set Build Command `pip install -r requirements.txt`, Start Command `python start_backend.py`. Set Environment Variables from `.env.example`.

---

## 🧪 Tests & Automated Verification
```bash
# 1. Automated Integration Health Check
cd backend
python system_health_check.py

# 2. Backend Pytest Suite
cd backend
pytest

# 3. Playwright E2E Test Suite
cd tests/e2e
npx playwright test
```
