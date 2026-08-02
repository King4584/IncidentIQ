from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, asc
from app.core.database import get_db
from app.models.models import NormalizedEvent, Correlation
from app.schemas.schemas import NormalizedEventResponse, EventGraphResponse
from app.services.correlation_service import CorrelationEngine

router = APIRouter()

@router.get("", response_model=List[NormalizedEventResponse])
async def get_timeline(
    incident_id: Optional[str] = None,
    service: Optional[str] = None,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    request_id: Optional[str] = None,
    deployment_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    query = select(NormalizedEvent).order_by(asc(NormalizedEvent.timestamp))
    
    if incident_id:
        query = query.where(NormalizedEvent.incident_id == incident_id)
    if service:
        query = query.where(NormalizedEvent.service == service)
    if severity:
        query = query.where(NormalizedEvent.severity == severity)
    if source:
        query = query.where(NormalizedEvent.source == source)
    if request_id:
        query = query.where(NormalizedEvent.request_id == request_id)
    if deployment_id:
        query = query.where(NormalizedEvent.deployment_id == deployment_id)
    if search:
        query = query.where(NormalizedEvent.message.ilike(f"%{search}%"))

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/graph/{incident_id}", response_model=EventGraphResponse)
async def get_event_correlation_graph(incident_id: str, db: AsyncSession = Depends(get_db)):
    events_res = await db.execute(select(NormalizedEvent).where(NormalizedEvent.incident_id == incident_id))
    events = events_res.scalars().all()

    corr_res = await db.execute(select(Correlation).where(Correlation.incident_id == incident_id))
    correlations = corr_res.scalars().all()

    graph_data = CorrelationEngine.build_react_flow_graph(events, correlations)
    return graph_data
