from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import RootCause, Incident, User
from app.schemas.schemas import RootCauseCreate, RootCauseResponse
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/{incident_id}", response_model=RootCauseResponse)
async def get_root_cause(incident_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RootCause).where(RootCause.incident_id == incident_id))
    rc = res.scalars().first()
    if not rc:
        raise HTTPException(status_code=404, detail="Root cause not yet saved for this incident")
    return rc

@router.post("/{incident_id}", response_model=RootCauseResponse)
async def save_root_cause(
    incident_id: str,
    rc_in: RootCauseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Enforce mandatory evidence binding
    if not rc_in.supporting_evidence_ids or len(rc_in.supporting_evidence_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="ROOT CAUSE CANNOT BE SAVED WITHOUT LINKED SUPPORTING EVIDENCE."
        )

    # Check incident
    inc_res = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = inc_res.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    existing_rc = await db.execute(select(RootCause).where(RootCause.incident_id == incident_id))
    rc = existing_rc.scalars().first()

    if rc:
        rc.category = rc_in.category
        rc.summary = rc_in.summary
        rc.supporting_evidence_ids = rc_in.supporting_evidence_ids
        rc.lessons_learned = rc_in.lessons_learned
        rc.reference_docs = rc_in.reference_docs
        rc.confirmed_by_id = current_user.id
    else:
        rc = RootCause(
            incident_id=incident_id,
            category=rc_in.category,
            summary=rc_in.summary,
            supporting_evidence_ids=rc_in.supporting_evidence_ids,
            lessons_learned=rc_in.lessons_learned,
            reference_docs=rc_in.reference_docs,
            confirmed_by_id=current_user.id
        )
        db.add(rc)

    incident.status = "RESOLVED"
    db.add(incident)

    await db.commit()
    await db.refresh(rc)

    await AuditService.log_action(db, current_user.id, "ROOT_CAUSE_CONFIRMED", "ROOT_CAUSE", incident_id, {
        "category": rc_in.category,
        "evidence_count": len(rc_in.supporting_evidence_ids)
    })

    return rc
