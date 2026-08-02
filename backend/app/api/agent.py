from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import Incident, NormalizedEvent, Hypothesis, HypothesisVersion, Evidence, Correlation, User
from app.agent.investigation_agent import IncidentInvestigationWorkflow, AgentState
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/trigger/{incident_id}")
async def trigger_ai_investigation(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch incident by UUID or Incident Number (e.g. INC-8092)
    inc_res = await db.execute(
        select(Incident).where(
            (Incident.id == incident_id) | (Incident.incident_number == incident_id)
        )
    )
    incident = inc_res.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Fetch events by Incident UUID or Incident Number
    ev_res = await db.execute(
        select(NormalizedEvent).where(
            (NormalizedEvent.incident_id == incident.id) | 
            (NormalizedEvent.incident_id == incident.incident_number)
        )
    )
    events = ev_res.scalars().all()

    # Require real ingested events for analysis
    if not events:
        raise HTTPException(
            status_code=400,
            detail=f"No ingested events found for incident {incident.incident_number}. Please upload a log file or ingest events first via the Event Ingestion page."
        )

    # Fetch correlations
    corr_res = await db.execute(
        select(Correlation).where(
            (Correlation.incident_id == incident.id) | (Correlation.incident_id == incident.incident_number)
        )
    )
    correlations = corr_res.scalars().all()

    # Form initial state with REAL event data
    events_data = [{
        "id": e.id,
        "service": e.service,
        "severity": e.severity,
        "event_type": e.event_type,
        "message": e.message,
        "source": e.source,
        "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        "request_id": e.request_id,
        "deployment_id": e.deployment_id
    } for e in events]

    corrs_data = [{
        "source_event_id": c.source_event_id,
        "target_event_id": c.target_event_id,
        "correlation_type": c.correlation_type,
        "correlation_score": c.correlation_score
    } for c in correlations]

    initial_state: AgentState = {
        "incident_id": incident.id,
        "incident_title": incident.title,
        "events": events_data,
        "correlations": corrs_data,
        "evidence": [],
        "hypotheses": [],
        "contradictions": [],
        "missing_evidence": [],
        "investigator_feedback": [],
        "step": "INIT",
        "summary": "Starting investigation"
    }

    # Run LangGraph Agent 10-node workflow
    final_state = IncidentInvestigationWorkflow.run_investigation_graph(initial_state)

    # Persist extracted Evidence (STRICT 6 TIERS)
    saved_evidence = []
    for ev in final_state.get("evidence", []):
        new_ev = Evidence(
            incident_id=incident.id,
            normalized_event_id=ev.get("normalized_event_id"),
            category=ev["category"],
            title=ev["title"],
            summary=ev["summary"],
            confidence=ev["confidence"],
            source=ev["source"],
            timestamp=ev.get("timestamp")
        )
        db.add(new_ev)
        await db.flush()
        saved_evidence.append(new_ev)

    # Persist generated Hypotheses & Versions
    saved_hypotheses = []
    for h in final_state.get("hypotheses", []):
        hypo = Hypothesis(
            incident_id=incident.id,
            title=h["title"],
            description=h["description"],
            confidence_score=h["confidence_score"],
            status=h["status"],
            version=1,
            created_by_id=current_user.id
        )
        db.add(hypo)
        await db.flush()

        # Version 1 record
        ver = HypothesisVersion(
            hypothesis_id=hypo.id,
            version=1,
            title=hypo.title,
            description=hypo.description,
            confidence_score=hypo.confidence_score,
            reason_for_change="Initial AI Investigation Graph Execution",
            supporting_evidence_ids=[e.id for e in saved_evidence[:3]],
            missing_evidence=h.get("missing_evidence", [])
        )
        db.add(ver)
        saved_hypotheses.append(hypo)

    # Update incident status
    incident.status = "INVESTIGATING"
    db.add(incident)

    await db.commit()

    await AuditService.log_action(db, current_user.id, "AI_INVESTIGATION_TRIGGERED", "AGENT", incident.id, {
        "hypotheses_count": len(saved_hypotheses),
        "evidence_count": len(saved_evidence)
    })

    return {
        "status": "SUCCESS",
        "step": final_state["step"],
        "summary": final_state["summary"],
        "hypotheses_generated": len(saved_hypotheses),
        "evidence_extracted": len(saved_evidence),
        "missing_evidence_requests": len(final_state.get("missing_evidence", []))
    }
