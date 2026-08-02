import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from app.core.database import get_db
from app.models.models import Incident, User
from app.schemas.schemas import IncidentCreate, IncidentUpdate, IncidentResponse
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    environment: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Incident).order_by(desc(Incident.created_at))
    if status:
        query = query.where(Incident.status == status)
    if severity:
        query = query.where(Incident.severity == severity)
    if environment:
        query = query.where(Incident.environment == environment)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=IncidentResponse)
async def create_incident(
    incident_in: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    inc_num = f"INC-{random.randint(1000, 9999)}"
    new_inc = Incident(
        incident_number=inc_num,
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,
        priority=incident_in.priority,
        environment=incident_in.environment,
        affected_services=incident_in.affected_services,
        reporter_id=current_user.id,
        owner_id=current_user.id
    )
    db.add(new_inc)
    await db.commit()
    await db.refresh(new_inc)

    await AuditService.log_action(db, current_user.id, "INCIDENT_CREATED", "INCIDENT", new_inc.id, {"number": inc_num})
    return new_inc

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    inc = result.scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    inc_update: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    inc = result.scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_dict = inc_update.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(inc, field, val)

    db.add(inc)
    await db.commit()
    await db.refresh(inc)

    await AuditService.log_action(db, current_user.id, "INCIDENT_UPDATED", "INCIDENT", inc.id, update_dict)
    return inc
