from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog, Notification

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: Optional[str],
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        payload: Dict[str, Any] = None,
        ip_address: str = "127.0.0.1"
    ) -> AuditLog:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload or {},
            ip_address=ip_address
        )
        db.add(log_entry)
        await db.flush()
        return log_entry

    @staticmethod
    async def notify_user(
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        link: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link
        )
        db.add(notif)
        await db.flush()
        return notif
