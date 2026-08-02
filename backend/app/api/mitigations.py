from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import Mitigation, User
from app.schemas.schemas import MitigationCreate, MitigationResponse
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/{incident_id}", response_model=List[MitigationResponse])
async def list_mitigations(incident_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Mitigation).where(Mitigation.incident_id == incident_id))
    return res.scalars().all()

@router.post("/{incident_id}", response_model=MitigationResponse)
async def create_mitigation(
    incident_id: str,
    mit_in: MitigationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mit = Mitigation(
        incident_id=incident_id,
        mitigation_name=mit_in.mitigation_name,
        description=mit_in.description,
        status=mit_in.status,
        impact=mit_in.impact,
        owner_id=current_user.id
    )
    db.add(mit)
    await db.commit()
    await db.refresh(mit)

    await AuditService.log_action(db, current_user.id, "MITIGATION_ADDED", "MITIGATION", mit.id)
    return mit

@router.put("/item/{mitigation_id}", response_model=MitigationResponse)
async def update_mitigation_status(
    mitigation_id: str,
    status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Mitigation).where(Mitigation.id == mitigation_id))
    mit = res.scalars().first()
    if not mit:
        raise HTTPException(status_code=404, detail="Mitigation not found")
    
    mit.status = status
    db.add(mit)
    await db.commit()
    await db.refresh(mit)

    await AuditService.log_action(db, current_user.id, "MITIGATION_STATUS_CHANGED", "MITIGATION", mit.id, {"status": status})
    return mit
