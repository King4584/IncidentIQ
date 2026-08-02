from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import Setting, User
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Setting))
    settings = res.scalars().all()
    return {s.key: s.value for s in settings}

@router.put("/{key}")
async def update_setting(
    key: str,
    value: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Setting).where(Setting.key == key))
    s = res.scalars().first()
    if s:
        s.value = value
    else:
        s = Setting(key=key, value=value)
        db.add(s)

    await db.commit()
    await db.refresh(s)

    await AuditService.log_action(db, current_user.id, "SETTING_UPDATED", "SETTING", key, {"value": value})
    return {"key": key, "value": value}
