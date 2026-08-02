# IncidentIQ AI - Agent Usage & AI Workflow Documentation

This document outlines the tools, representative prompts, delegated tasks, agent mistakes/adjustments, and output verification workflows used in building **IncidentIQ AI**.

---

## 🛠️ 1. Tools & Frameworks Used

- **Google Antigravity SDK**: Autonomous agent orchestration framework used to plan, construct, and debug full-stack modules.
- **LangGraph & LangChain**: Used for constructing the 10-node sequential state machine (`backend/app/agent/investigation_agent.py`).
- **Azure OpenAI `gpt-4o`**: Primary LLM deployment (`https://genesis-az-llm.openai.azure.com/`) utilized for root cause reasoning over heterogeneous telemetry streams.
- **FastAPI & Async SQLAlchemy**: Async Python backend providing API routing and database persistence.
- **Next.js 15 App Router & React 19**: Modern frontend interface rendering live execution steppers, topology graphs, and interactive evidence modals.

---

## 💬 2. Representative System Prompts

Below is the representative system prompt used by the 10-Node LangGraph Agent when reasoning over operational telemetry:

```text
You are Principal Staff SRE and AI Incident Investigator.
Analyze these operational events and extracted evidence items:

OPERATIONAL EVENTS:
[
  {
    "event_id": "ev-101",
    "source": "Datadog APM",
    "service": "payment-api",
    "severity": "CRITICAL",
    "message": "fatal: remaining connection slots are reserved for non-replication superuser connections (max_connections=200)",
    "request_id": "req-7710a",
    "deployment_id": "dep-release-v2.4.12"
  }
]

Perform root cause analysis and output a JSON array of hypotheses.
For each hypothesis, adhere to these strict rules:
1. Generate ranked cause hypotheses based on technical log evidence.
2. Cite the exact supporting event/evidence IDs.
3. Identify any contradicting evidence IDs or conflicting telemetry.
4. Categorize missing evidence needed (DB metrics, commit diffs, distributed traces) with suggested SRE actions.

OUTPUT JSON FORMAT (ONLY OUTPUT VALID JSON ARRAY, NO MARKDOWN TRIPLE BACKTICKS):
[
  {
    "title": "Technical Root Cause Title",
    "description": "Detailed explanation referencing exact services, error messages, request IDs, and deployment releases.",
    "confidence_score": 0.92,
    "supporting_evidence_ids": ["ev-101"],
    "contradicting_evidence_ids": [],
    "missing_evidence": [
      {
        "category": "Database Metrics",
        "title": "PostgreSQL Active Connections Metric",
        "description": "Need connection utilization timeline graph vs max_connections ceiling.",
        "suggested_action": "Fetch pg_stat_activity connection state breakdown."
      }
    ]
  }
]
```

---

## 🤖 3. Work Delegated to AI Agents

1. **State Machine Execution**:
   - Delegates event parsing, cross-vector correlation analysis, and confidence scoring to the 10-node state machine.
2. **6-Tier Evidence Categorization**:
   - Enforces non-overlapping classifications (`Confirmed Evidence`, `Observed Fact`, `Inference`, `Assumption`, `Hypothesis`, `Confirmed Root Cause`).
3. **Telemetry Gap Analysis**:
   - Evaluates timeline gaps to generate actionable SRE telemetry request cards.
4. **Post-Mortem Executive Summaries**:
   - Compiles executive post-mortems combining timeline event highlights, confirmed root cause summaries, and mitigation actions.

---

## ⚠️ 4. Agent Mistakes & Rejected Suggestions (Refinements Made)

1. **Initial Issue - Synthetic Fallback Event Overwrite**:
   - *Mistake*: Early iterations inserted synthetic fallback events when an incident had 0 events.
   - *Correction*: Refactored `backend/app/api/agent.py` to strictly require real ingested events. If no events exist, the agent prompts the user to ingest log events first via `/ingestion`.

2. **Initial Issue - Browser Alert for Raw JSON**:
   - *Mistake*: Early frontend code displayed a browser `alert("Raw Evidence ID: ...")` when clicking "View Raw JSON".
   - *Correction*: Replaced `alert()` with a syntax-highlighted `RawJsonModal` component fetching the true raw payload directly from PostgreSQL `JSONB`.

3. **Initial Issue - Secret Protection Violation**:
   - *Mistake*: Hardcoded API keys inside `config.py` triggered GitHub Push Protection.
   - *Correction*: Sanitized `config.py` to strictly load credentials from environment variables (`.env`).

---

## 🧪 5. Output Verification & Validation Methodology

1. **Empirical Integration Script (`system_health_check.py`)**:
   - Runs automated HTTP requests against all 15 backend API endpoints, verifying status 200 responses, hypothesis generation, root cause lockdown, and HTML export.
2. **Playwright End-to-End Suite (`tests/e2e`)**:
   - Simulates real user browser interactions: logging in, uploading log files, triggering the 10-node stepper, accepting hypotheses, and exporting reports.
3. **Zero-Warning Production Builds**:
   - Executed `npx rimraf .next ; npm run build` across all 15 routes to confirm 0 TypeScript / Next.js compilation errors.
