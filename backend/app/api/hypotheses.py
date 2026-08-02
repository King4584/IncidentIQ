from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import Hypothesis, HypothesisVersion, Evidence, InvestigatorAction, User
from app.schemas.schemas import HypothesisResponse, HypothesisAction, InvestigatorActionResponse
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/{incident_id}", response_model=List[HypothesisResponse])
async def list_hypotheses(incident_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Hypothesis)
        .where(Hypothesis.incident_id == incident_id)
        .order_by(desc(Hypothesis.confidence_score))
    )
    hypotheses = res.scalars().all()
    
    output = []
    for h in hypotheses:
        # Load versions
        v_res = await db.execute(
            select(HypothesisVersion)
            .where(HypothesisVersion.hypothesis_id == h.id)
            .order_by(desc(HypothesisVersion.version))
        )
        versions = v_res.scalars().all()

        # Load evidence
        ev_res = await db.execute(select(Evidence).where(Evidence.incident_id == incident_id))
        all_ev = ev_res.scalars().all()

        latest_version = versions[0] if versions else None
        supp_ids = latest_version.supporting_evidence_ids if latest_version else []
        cont_ids = latest_version.contradicting_evidence_ids if latest_version else []
        missing = latest_version.missing_evidence if latest_version else []

        supp_ev = [ev for ev in all_ev if ev.id in supp_ids]
        cont_ev = [ev for ev in all_ev if ev.id in cont_ids]

        output.append({
            "id": h.id,
            "incident_id": h.incident_id,
            "title": h.title,
            "description": h.description,
            "confidence_score": h.confidence_score,
            "status": h.status,
            "version": h.version,
            "created_by_id": h.created_by_id,
            "created_at": h.created_at,
            "updated_at": h.updated_at,
            "supporting_evidence": supp_ev,
            "contradicting_evidence": cont_ev,
            "missing_evidence": missing,
            "versions": versions
        })

    return output

@router.post("/{hypothesis_id}/action")
async def execute_investigator_action(
    hypothesis_id: str,
    action_in: HypothesisAction,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    h_res = await db.execute(select(Hypothesis).where(Hypothesis.id == hypothesis_id))
    hypo = h_res.scalars().first()
    if not hypo:
        raise HTTPException(status_code=404, detail="Hypothesis not found")

    old_status = hypo.status
    old_version = hypo.version
    new_version = old_version + 1

    if action_in.action == "ACCEPT":
        hypo.status = "CONFIRMED"
        hypo.confidence_score = 1.0
        reason = f"Confirmed by investigator {current_user.full_name}. Notes: {action_in.notes or 'None'}"
    elif action_in.action == "REJECT":
        hypo.status = "REJECTED"
        hypo.confidence_score = 0.0
        reason = f"Rejected by investigator {current_user.full_name}. Notes: {action_in.notes or 'None'}"
    elif action_in.action == "ANNOTATE":
        reason = f"Annotated by {current_user.full_name}: {action_in.notes}"
    else: # ESCALATE
        hypo.status = "ESCALATED"
        reason = f"Escalated to senior incident commander by {current_user.full_name}."

    hypo.version = new_version
    db.add(hypo)

    # Save version history (NEVER DELETE OLD HYPOTHESES)
    new_ver_rec = HypothesisVersion(
        hypothesis_id=hypo.id,
        version=new_version,
        title=hypo.title,
        description=hypo.description,
        confidence_score=hypo.confidence_score,
        reason_for_change=reason,
        investigator_notes=action_in.notes
    )
    db.add(new_ver_rec)

    # Audit Action
    inv_action = InvestigatorAction(
        incident_id=hypo.incident_id,
        user_id=current_user.id,
        action_type=f"{action_in.action}_HYPOTHESIS",
        target_id=hypo.id,
        details={"notes": action_in.notes, "old_status": old_status, "new_status": hypo.status}
    )
    db.add(inv_action)

    await db.commit()
    await db.refresh(hypo)

    await AuditService.log_action(db, current_user.id, f"HYPOTHESIS_{action_in.action}", "HYPOTHESIS", hypo.id)
    return {"message": f"Action {action_in.action} recorded successfully", "hypothesis_id": hypo.id, "version": new_version}
