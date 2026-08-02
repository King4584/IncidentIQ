import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="INVESTIGATOR")  # ADMIN, INVESTIGATOR, VIEWER, SRE
    avatar_url = Column(Text, nullable=True)
    preferences = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), nullable=False, default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    priority = Column(String(50), nullable=False, default="P2")    # P1, P2, P3, P4
    status = Column(String(50), nullable=False, default="OPEN")    # OPEN, INVESTIGATING, AWAITING_EVIDENCE, MITIGATING, RESOLVED, CLOSED
    environment = Column(String(100), nullable=False, default="production")
    affected_services = Column(JSON, default=[])
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    owner = relationship("User", foreign_keys=[owner_id])
    reporter = relationship("User", foreign_keys=[reporter_id])
    raw_events = relationship("RawEvent", back_populates="incident", cascade="all, delete-orphan")
    normalized_events = relationship("NormalizedEvent", back_populates="incident", cascade="all, delete-orphan")
    hypotheses = relationship("Hypothesis", back_populates="incident", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="incident", cascade="all, delete-orphan")
    mitigations = relationship("Mitigation", back_populates="incident", cascade="all, delete-orphan")
    root_cause = relationship("RootCause", back_populates="incident", uselist=False, cascade="all, delete-orphan")


class RawEvent(Base):
    __tablename__ = "raw_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=True, index=True)
    source = Column(String(100), nullable=False)
    original_message = Column(Text, nullable=False)
    original_payload = Column(JSON, nullable=False)  # Immutable raw storage
    original_timestamp = Column(String(100), nullable=True)
    original_metadata = Column(JSON, default={})
    ingested_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="raw_events")
    normalized_event = relationship("NormalizedEvent", back_populates="raw_event", uselist=False)


class NormalizedEvent(Base):
    __tablename__ = "normalized_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_event_id = Column(String(36), ForeignKey("raw_events.id"), nullable=False, unique=True)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)
    service = Column(String(100), nullable=False, index=True)
    environment = Column(String(100), nullable=False, default="production")
    severity = Column(String(50), nullable=False, default="INFO")
    event_type = Column(String(100), nullable=False)
    request_id = Column(String(100), nullable=True, index=True)
    deployment_id = Column(String(100), nullable=True, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    trace_id = Column(String(100), nullable=True, index=True)
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    raw_event_reference = Column(String(36), nullable=False)
    validation_status = Column(String(50), default="VALIDATED")  # VALIDATED, WARNING, INVALID

    incident = relationship("Incident", back_populates="normalized_events")
    raw_event = relationship("RawEvent", back_populates="normalized_event")


class Correlation(Base):
    __tablename__ = "correlations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    source_event_id = Column(String(36), ForeignKey("normalized_events.id"), nullable=False)
    target_event_id = Column(String(36), ForeignKey("normalized_events.id"), nullable=False)
    correlation_type = Column(String(100), nullable=False)  # request_id, deployment_id, user_id, trace_id, temporal
    correlation_score = Column(Float, default=1.0)
    metadata_info = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.5)  # 0.0 to 1.0
    status = Column(String(50), default="PROPOSED") # PROPOSED, CONFIRMED, REJECTED, SUPERSEDED
    version = Column(Integer, default=1)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    incident = relationship("Incident", back_populates="hypotheses")
    versions = relationship("HypothesisVersion", back_populates="hypothesis", cascade="all, delete-orphan")


class HypothesisVersion(Base):
    __tablename__ = "hypothesis_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hypothesis_id = Column(String(36), ForeignKey("hypotheses.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    reason_for_change = Column(Text, nullable=True)
    supporting_evidence_ids = Column(JSON, default=[])
    contradicting_evidence_ids = Column(JSON, default=[])
    missing_evidence = Column(JSON, default=[])
    investigator_notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=utc_now)

    hypothesis = relationship("Hypothesis", back_populates="versions")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    normalized_event_id = Column(String(36), ForeignKey("normalized_events.id"), nullable=True)
    raw_event_id = Column(String(36), ForeignKey("raw_events.id"), nullable=True)
    # STRICT 6-TIER CATEGORIZATION
    category = Column(String(50), nullable=False) 
    # CONFIRMED_EVIDENCE, OBSERVED_FACT, INFERENCE, ASSUMPTION, HYPOTHESIS, CONFIRMED_ROOT_CAUSE
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0)
    source = Column(String(100), nullable=False)
    timestamp = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="evidence_items")


class InvestigatorAction(Base):
    __tablename__ = "investigator_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action_type = Column(String(100), nullable=False) 
    # ACCEPT_HYPOTHESIS, REJECT_HYPOTHESIS, ANNOTATE_HYPOTHESIS, FLAG_EVIDENCE, ADD_EVIDENCE, REQUEST_EVIDENCE, ASSIGN_INVESTIGATOR, ESCALATE
    target_id = Column(String(100), nullable=True)
    details = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Mitigation(Base):
    __tablename__ = "mitigations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    mitigation_name = Column(String(255), nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="PLANNED") # PLANNED, IN_PROGRESS, COMPLETED, FAILED
    impact = Column(String(100), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="mitigations")


class RootCause(Base):
    __tablename__ = "root_causes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, unique=True)
    category = Column(String(100), nullable=False) # Infrastructure, Application Code, Database, Third Party, Configuration, Human Error
    summary = Column(Text, nullable=False)
    supporting_evidence_ids = Column(JSON, nullable=False) # MANDATORY evidence binding
    lessons_learned = Column(JSON, default=[])
    reference_docs = Column(JSON, default=[])
    confirmed_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="root_cause")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(JSON, nullable=False) # Executive summary, timeline, evidence, hypotheses, mitigations, root cause
    generated_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime(timezone=True), default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    payload = Column(JSON, default={})
    ip_address = Column(String(100), default="127.0.0.1")
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO") # INFO, WARNING, CRITICAL, SUCCESS
    read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Setting(Base):
    __tablename__ = "settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
