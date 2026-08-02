import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import User, Incident, RawEvent, NormalizedEvent, Correlation, Hypothesis, HypothesisVersion, Evidence, Mitigation, RootCause, AuditLog
from app.core.security import hash_password

async def seed_initial_data(db: AsyncSession):
    # Check if user exists
    res = await db.execute(select(User).where(User.email == "admin@incidentiq.ai"))
    admin_user = res.scalars().first()
    
    if not admin_user:
        admin_user = User(
            email="admin@incidentiq.ai",
            password_hash=hash_password("admin123"),
            full_name="Alex Vance (Lead SRE)",
            role="ADMIN",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        db.add(admin_user)
        await db.flush()

        investigator = User(
            email="sre@incidentiq.ai",
            password_hash=hash_password("sre123"),
            full_name="Elena Rostova (Incident Commander)",
            role="INVESTIGATOR",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        )
        db.add(investigator)
        await db.flush()

        # Create Demo Incident
        now = datetime.now(timezone.utc)
        demo_inc = Incident(
            incident_number="INC-8092",
            title="Payment Gateway Gateway Connection Timeout & HTTP 500 Cascade",
            description="Intermittent checkout failures impacting production checkout flow in US-East region. DB pool exhaustion suspected.",
            severity="CRITICAL",
            priority="P1",
            status="INVESTIGATING",
            environment="production",
            affected_services=["payment-api", "checkout-service", "postgres-primary", "auth-service"],
            owner_id=admin_user.id,
            reporter_id=investigator.id,
            started_at=now - timedelta(hours=2)
        )
        db.add(demo_inc)
        await db.flush()

        # Seed Raw & Normalized Events
        events_spec = [
            {
                "service": "deployment-manager",
                "severity": "INFO",
                "event_type": "DEPLOYMENT",
                "message": "Deployment release v2.4.12 initiated for service 'payment-api' by CI/CD pipeline",
                "deployment_id": "dep-9941a",
                "source": "GitHub Actions",
                "mins_ago": 110
            },
            {
                "service": "payment-api",
                "severity": "WARNING",
                "event_type": "LOG",
                "message": "DB Pool Usage reached 85% capacity (170/200 active connections)",
                "request_id": "req-7710a",
                "deployment_id": "dep-9941a",
                "source": "Datadog APM",
                "mins_ago": 95
            },
            {
                "service": "postgres-primary",
                "severity": "CRITICAL",
                "event_type": "DB_ALERT",
                "message": "fatal: remaining connection slots are reserved for non-replication superuser connections (max_connections=200)",
                "request_id": "req-7710a",
                "source": "PostgreSQL Telemetry",
                "mins_ago": 90
            },
            {
                "service": "payment-api",
                "severity": "ERROR",
                "event_type": "API_FAILURE",
                "message": "HTTP 500 Internal Server Error on POST /v1/charge - asyncpg.exceptions.TooManyConnectionsError",
                "request_id": "req-7710a",
                "deployment_id": "dep-9941a",
                "source": "Application Log",
                "mins_ago": 88
            },
            {
                "service": "checkout-service",
                "severity": "CRITICAL",
                "event_type": "ALERT",
                "message": "High Error Rate Alert: checkout-service HTTP 5xx error rate exceeded 18.5% over 5m window",
                "request_id": "req-7710a",
                "source": "PagerDuty",
                "mins_ago": 85
            },
            {
                "service": "user-support",
                "severity": "WARNING",
                "event_type": "USER_REPORT",
                "message": "User ticket #4091: 'Payment failed at final confirmation step during checkout'",
                "user_id": "usr-8812",
                "source": "ServiceNow",
                "mins_ago": 80
            }
        ]

        normalized_objs = []
        for spec in events_spec:
            raw_ev = RawEvent(
                incident_id=demo_inc.id,
                source=spec["source"],
                original_message=spec["message"],
                original_payload={
                    "service": spec["service"],
                    "severity": spec["severity"],
                    "event_type": spec["event_type"],
                    "deployment_id": spec.get("deployment_id"),
                    "request_id": spec.get("request_id"),
                    "user_id": spec.get("user_id"),
                    "raw_text": spec["message"]
                },
                original_timestamp=(now - timedelta(minutes=spec["mins_ago"])).isoformat()
            )
            db.add(raw_ev)
            await db.flush()

            norm_ev = NormalizedEvent(
                raw_event_id=raw_ev.id,
                incident_id=demo_inc.id,
                timestamp=now - timedelta(minutes=spec["mins_ago"]),
                service=spec["service"],
                environment="production",
                severity=spec["severity"],
                event_type=spec["event_type"],
                request_id=spec.get("request_id"),
                deployment_id=spec.get("deployment_id"),
                user_id=spec.get("user_id"),
                message=spec["message"],
                source=spec["source"],
                raw_event_reference=raw_ev.id,
                validation_status="VALIDATED"
            )
            db.add(norm_ev)
            await db.flush()
            normalized_objs.append(norm_ev)

        # Seed Correlations
        corr1 = Correlation(
            incident_id=demo_inc.id,
            source_event_id=normalized_objs[0].id,
            target_event_id=normalized_objs[1].id,
            correlation_type="deployment_id",
            correlation_score=0.92,
            metadata_info={"description": "DB usage spike followed deployment release v2.4.12"}
        )
        corr2 = Correlation(
            incident_id=demo_inc.id,
            source_event_id=normalized_objs[1].id,
            target_event_id=normalized_objs[2].id,
            correlation_type="request_id",
            correlation_score=0.98,
            metadata_info={"description": "Direct request ID match between payment API & DB connection failure"}
        )
        db.add(corr1)
        db.add(corr2)

        # Seed Evidence Items (6 Tiers)
        ev1 = Evidence(
            incident_id=demo_inc.id,
            normalized_event_id=normalized_objs[2].id,
            category="CONFIRMED_EVIDENCE",
            title="PostgreSQL Connection Exhaustion Log",
            summary="fatal: remaining connection slots are reserved for non-replication superuser connections (max_connections=200)",
            confidence=0.98,
            source="PostgreSQL Telemetry",
            timestamp=(now - timedelta(minutes=90)).isoformat()
        )
        ev2 = Evidence(
            incident_id=demo_inc.id,
            normalized_event_id=normalized_objs[0].id,
            category="OBSERVED_FACT",
            title="Release v2.4.12 Deployment Event",
            summary="Deployment release v2.4.12 initiated for service 'payment-api'",
            confidence=0.95,
            source="GitHub Actions",
            timestamp=(now - timedelta(minutes=110)).isoformat()
        )
        db.add(ev1)
        db.add(ev2)
        await db.flush()

        # Seed Hypotheses
        hypo1 = Hypothesis(
            incident_id=demo_inc.id,
            title="Database Connection Pool Exhaustion from Unclosed Async Transactions",
            description="Release v2.4.12 introduced an unclosed DB session context manager in POST /v1/charge endpoint, draining connection pool under load.",
            confidence_score=0.91,
            status="PROPOSED",
            version=1,
            created_by_id=admin_user.id
        )
        db.add(hypo1)
        await db.flush()

        ver1 = HypothesisVersion(
            hypothesis_id=hypo1.id,
            version=1,
            title=hypo1.title,
            description=hypo1.description,
            confidence_score=0.91,
            reason_for_change="Initial LangGraph AI Investigation execution",
            supporting_evidence_ids=[ev1.id, ev2.id],
            missing_evidence=[
                {"category": "DB Metrics", "title": "pg_stat_activity query snapshot", "description": "Verify long-running IDLE transactions.", "suggested_action": "Run SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"}
            ]
        )
        db.add(ver1)

        # Seed Mitigation
        mit1 = Mitigation(
            incident_id=demo_inc.id,
            mitigation_name="Increase PostgreSQL max_connections & Restart payment-api replicas",
            description="Temporarily bump max_connections from 200 to 400 and perform rolling restart of payment-api pods.",
            status="IN_PROGRESS",
            impact="Reduces error rate immediately while root cause patch is verified.",
            owner_id=admin_user.id
        )
        db.add(mit1)

        # Seed Audit Log
        audit1 = AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT_SEED",
            entity_type="SYSTEM",
            entity_id=demo_inc.id,
            payload={"message": "Demo incident INC-8092 seeded successfully"}
        )
        db.add(audit1)

        await db.commit()
