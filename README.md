# IncidentIQ AI - "Incident Investigation & Evidence Agent"

IncidentIQ AI is an enterprise-grade AI-native incident investigation platform designed for SREs, DevOps, Platform Engineers, and Incident Response teams. It ingests operational events from 10+ sources, normalizes them while preserving immutable raw evidence in PostgreSQL JSONB, performs multi-vector correlation, and executes a 10-node LangGraph AI agent pipeline to generate evidence-backed hypotheses, missing telemetry requests, and post-mortem post-incident reports.

---

## 🌟 Key Capabilities

1. **Strict 6-Tier Evidence Categorization**:
   - `Confirmed Evidence`
   - `Observed Fact`
   - `Inference`
   - `Assumption`
   - `Hypothesis`
   - `Confirmed Root Cause`
   *Never merges these categories under any circumstance.*

2. **Immutable Raw Evidence Storage**:
   - Preserves untouched original payload, timestamp, message, and metadata in PostgreSQL `JSONB`.

3. **10-Node LangGraph Investigation Workflow**:
   - `EventAnalyzer` -> `EvidenceExtractor` -> `CorrelationAnalyzer` -> `HypothesisGenerator` -> `HypothesisValidator` -> `ContradictionDetector` -> `MissingEvidenceDetector` -> `HypothesisRanker` -> `InvestigatorReviewNode` -> `ReportGenerator`.

4. **Multi-Vector Correlation Engine**:
   - Correlates events across `request_id`, `deployment_id`, `user_id`, `trace_id`, `service`, `severity`, and temporal windows. Renders topology using React Flow.

5. **Mandatory Evidence-Bound Root Cause Lockdown**:
   - Prevents saving root cause conclusions without linked evidence IDs.

6. **Post-Mortem Executive Reports**:
   - Generates post-mortems with one-click HTML export / PDF printing.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL or SQLite (SQLite is enabled out-of-the-box for instant zero-config testing)

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
*Backend API will run at `http://127.0.0.1:8000`. Database tables and demo SRE data (`INC-8092`) are automatically created and seeded!*

### 2. Launch Next.js 15 Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend web application will open at `http://localhost:3000`.*

---

## 🐳 Docker Compose Deployment
```bash
cd docker
docker-compose up --build -d
```

---

## 🧪 Running Tests
```bash
# Backend Unit & Integration Tests (Pytest)
cd backend
pytest

# End-to-End Tests (Playwright)
cd tests/e2e
npx playwright test
```
