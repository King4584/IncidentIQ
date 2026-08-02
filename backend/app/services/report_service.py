from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.models import Incident, NormalizedEvent, Hypothesis, RootCause, Mitigation, Evidence

class ReportGeneratorService:
    @staticmethod
    def build_post_mortem_data(
        incident: Incident,
        events: List[NormalizedEvent],
        hypotheses: List[Hypothesis],
        evidence_list: List[Evidence],
        mitigations: List[Mitigation],
        root_cause: RootCause | None
    ) -> Dict[str, Any]:
        """Assembles a post-mortem incident report payload."""
        
        # Categorize evidence
        evidence_by_tier = {
            "CONFIRMED_EVIDENCE": [],
            "OBSERVED_FACT": [],
            "INFERENCE": [],
            "ASSUMPTION": [],
            "HYPOTHESIS": [],
            "CONFIRMED_ROOT_CAUSE": []
        }
        for ev in evidence_list:
            if ev.category in evidence_by_tier:
                evidence_by_tier[ev.category].append({
                    "id": ev.id,
                    "title": ev.title,
                    "summary": ev.summary,
                    "confidence": ev.confidence,
                    "source": ev.source
                })

        timeline_entries = []
        for e in sorted(events, key=lambda x: x.timestamp):
            timeline_entries.append({
                "timestamp": e.timestamp.isoformat() if e.timestamp else "",
                "service": e.service,
                "severity": e.severity,
                "message": e.message,
                "source": e.source
            })

        hypotheses_data = []
        for h in hypotheses:
            hypotheses_data.append({
                "id": h.id,
                "title": h.title,
                "description": h.description,
                "confidence_score": h.confidence_score,
                "status": h.status,
                "version": h.version
            })

        mitigations_data = []
        for m in mitigations:
            mitigations_data.append({
                "name": m.mitigation_name,
                "status": m.status,
                "description": m.description,
                "impact": m.impact
            })

        root_cause_data = None
        if root_cause:
            root_cause_data = {
                "category": root_cause.category,
                "summary": root_cause.summary,
                "supporting_evidence_ids": root_cause.supporting_evidence_ids,
                "lessons_learned": root_cause.lessons_learned,
                "reference_docs": root_cause.reference_docs,
                "confirmed_at": root_cause.confirmed_at.isoformat() if root_cause.confirmed_at else ""
            }

        executive_summary = (
            f"Incident {incident.incident_number} ({incident.title}) was rated as {incident.severity} severity "
            f"in environment '{incident.environment}'. Affected services included: {', '.join(incident.affected_services or [])}. "
            f"Status is currently {incident.status}."
        )

        return {
            "incident_number": incident.incident_number,
            "title": incident.title,
            "severity": incident.severity,
            "priority": incident.priority,
            "environment": incident.environment,
            "status": incident.status,
            "started_at": incident.started_at.isoformat() if incident.started_at else "",
            "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
            "executive_summary": executive_summary,
            "timeline": timeline_entries,
            "evidence_by_tier": evidence_by_tier,
            "hypotheses": hypotheses_data,
            "mitigations": mitigations_data,
            "root_cause": root_cause_data,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def export_html_report(report_data: Dict[str, Any]) -> str:
        """Generates clean HTML post-mortem document for printing/saving."""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Incident Post-Mortem: {report_data['incident_number']} - {report_data['title']}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; background: #f8fafc; }}
        .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }}
        .title {{ font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-right: 8px; }}
        .critical {{ background: #fee2e2; color: #991b1b; }}
        .high {{ background: #ffedd5; color: #9a3412; }}
        .section {{ background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .section-title {{ font-size: 18px; font-weight: 600; margin-top: 0; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
        th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
        th {{ background: #f8fafc; font-weight: 600; color: #475569; }}
        .evidence-tag {{ font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600; }}
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">{report_data['incident_number']}: {report_data['title']}</h1>
        <div>
            <span class="badge critical">Severity: {report_data['severity']}</span>
            <span class="badge high">Priority: {report_data['priority']}</span>
            <span class="badge">Status: {report_data['status']}</span>
            <span class="badge">Env: {report_data['environment']}</span>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">1. Executive Summary</h2>
        <p>{report_data['executive_summary']}</p>
    </div>

    <div class="section">
        <h2 class="section-title">2. Root Cause Analysis</h2>
        """
        rc = report_data.get("root_cause")
        if rc:
            html += f"""
            <p><strong>Category:</strong> {rc['category']}</p>
            <p><strong>Summary:</strong> {rc['summary']}</p>
            <p><strong>Lessons Learned:</strong></p>
            <ul>
                {"".join([f"<li>{item}</li>" for item in rc.get('lessons_learned', [])])}
            </ul>
            """
        else:
            html += "<p>Root cause investigation is currently ongoing.</p>"
            
        html += """
    </div>

    <div class="section">
        <h2 class="section-title">3. AI Hypotheses & Evidence</h2>
        <table>
            <thead>
                <tr>
                    <th>Hypothesis</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Version</th>
                </tr>
            </thead>
            <tbody>
        """
        for h in report_data.get("hypotheses", []):
            html += f"""
                <tr>
                    <td><strong>{h['title']}</strong><br><small>{h['description']}</small></td>
                    <td>{int(h['confidence_score'] * 100)}%</td>
                    <td>{h['status']}</td>
                    <td>v{h['version']}</td>
                </tr>
            """
        html += """
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">4. Mitigation Actions</h2>
        <table>
            <thead>
                <tr>
                    <th>Mitigation Name</th>
                    <th>Status</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
        """
        for m in report_data.get("mitigations", []):
            html += f"""
                <tr>
                    <td><strong>{m['name']}</strong></td>
                    <td>{m['status']}</td>
                    <td>{m['description']}</td>
                </tr>
            """
        html += """
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">5. Timeline</h2>
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Service</th>
                    <th>Severity</th>
                    <th>Event Message</th>
                </tr>
            </thead>
            <tbody>
        """
        for t in report_data.get("timeline", []):
            html += f"""
                <tr>
                    <td><small>{t['timestamp']}</small></td>
                    <td><code>{t['service']}</code></td>
                    <td>{t['severity']}</td>
                    <td>{t['message']}</td>
                </tr>
            """
        html += """
            </tbody>
        </table>
    </div>
</body>
</html>
"""
        return html
