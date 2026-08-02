from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import Incident, NormalizedEvent, Hypothesis, RootCause, Mitigation, Evidence, Report, User
from app.schemas.schemas import ReportResponse
from app.services.report_service import ReportGeneratorService
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter()

async def fetch_or_build_report_record(incident_id_or_number: str, user_id: str | None, db: AsyncSession) -> Report:
    inc_res = await db.execute(
        select(Incident).where(
            (Incident.id == incident_id_or_number) | (Incident.incident_number == incident_id_or_number)
        )
    )
    inc = inc_res.scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    events = (await db.execute(select(NormalizedEvent).where(
        (NormalizedEvent.incident_id == inc.id) | (NormalizedEvent.incident_id == inc.incident_number)
    ))).scalars().all()

    hypotheses = (await db.execute(select(Hypothesis).where(
        (Hypothesis.incident_id == inc.id) | (Hypothesis.incident_id == inc.incident_number)
    ))).scalars().all()

    evidence_list = (await db.execute(select(Evidence).where(
        (Evidence.incident_id == inc.id) | (Evidence.incident_id == inc.incident_number)
    ))).scalars().all()

    mitigations = (await db.execute(select(Mitigation).where(
        (Mitigation.incident_id == inc.id) | (Mitigation.incident_id == inc.incident_number)
    ))).scalars().all()

    root_cause = (await db.execute(select(RootCause).where(
        (RootCause.incident_id == inc.id) | (RootCause.incident_id == inc.incident_number)
    ))).scalars().first()

    report_payload = ReportGeneratorService.build_post_mortem_data(
        inc, events, hypotheses, evidence_list, mitigations, root_cause
    )

    rep_res = await db.execute(
        select(Report).where(
            (Report.incident_id == inc.id) | (Report.incident_id == inc.incident_number)
        )
    )
    existing_rep = rep_res.scalars().first()

    if existing_rep:
        existing_rep.content = report_payload
        existing_rep.title = f"Post-Mortem: {inc.incident_number} - {inc.title}"
        db.add(existing_rep)
        await db.commit()
        await db.refresh(existing_rep)
        return existing_rep
    else:
        new_report = Report(
            incident_id=inc.id,
            title=f"Post-Mortem: {inc.incident_number} - {inc.title}",
            content=report_payload,
            generated_by_id=user_id or inc.owner_id or "system"
        )
        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)
        await AuditService.log_action(db, user_id, "POST_MORTEM_REPORT_GENERATED", "REPORT", new_report.id)
        return new_report

@router.get("/{incident_id}", response_model=ReportResponse)
async def get_or_generate_report(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await fetch_or_build_report_record(incident_id, current_user.id, db)

@router.get("/{incident_id}/export/html", response_class=HTMLResponse)
async def export_report_html(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    report = await fetch_or_build_report_record(incident_id, None, db)
    html_content = ReportGeneratorService.export_html_report(report.content)
    return HTMLResponse(content=html_content)
