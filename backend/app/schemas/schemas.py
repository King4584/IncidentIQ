from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# --- AUTH & USER ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "INVESTIGATOR"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    avatar_url: Optional[str] = None
    preferences: Dict[str, Any] = {}
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


# --- INCIDENT ---
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "HIGH"
    priority: str = "P2"
    environment: str = "production"
    affected_services: List[str] = []

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    environment: Optional[str] = None
    affected_services: Optional[List[str]] = None
    owner_id: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: str
    incident_number: str
    status: str
    owner_id: Optional[str] = None
    reporter_id: Optional[str] = None
    started_at: datetime
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- EVENT INGESTION & NORMALIZATION ---
class EventIngestItem(BaseModel):
    source: str = "Manual"
    service: str = "unknown-service"
    environment: str = "production"
    severity: str = "INFO"
    event_type: str = "LOG"
    message: str
    timestamp: Optional[str] = None
    request_id: Optional[str] = None
    deployment_id: Optional[str] = None
    user_id: Optional[str] = None
    trace_id: Optional[str] = None
    payload: Dict[str, Any] = {}

class EventIngestPayload(BaseModel):
    incident_id: Optional[str] = None
    events: List[EventIngestItem]

class NormalizedEventResponse(BaseModel):
    id: str
    raw_event_id: str
    incident_id: Optional[str] = None
    timestamp: datetime
    service: str
    environment: str
    severity: str
    event_type: str
    request_id: Optional[str] = None
    deployment_id: Optional[str] = None
    user_id: Optional[str] = None
    trace_id: Optional[str] = None
    message: str
    source: str
    raw_event_reference: str
    validation_status: str

    class Config:
        from_attributes = True

class RawEventResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    source: str
    original_message: str
    original_payload: Dict[str, Any]
    original_timestamp: Optional[str] = None
    original_metadata: Dict[str, Any]
    ingested_at: datetime

    class Config:
        from_attributes = True


# --- CORRELATION & GRAPH ---
class CorrelationResponse(BaseModel):
    id: str
    incident_id: str
    source_event_id: str
    target_event_id: str
    correlation_type: str
    correlation_score: float
    metadata_info: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class GraphNode(BaseModel):
    id: str
    type: str = "customEvent"
    data: Dict[str, Any]
    position: Dict[str, float]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    animated: bool = True

class EventGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


# --- HYPOTHESIS & EVIDENCE ---
class EvidenceResponse(BaseModel):
    id: str
    incident_id: str
    normalized_event_id: Optional[str] = None
    raw_event_id: Optional[str] = None
    category: str  # CONFIRMED_EVIDENCE, OBSERVED_FACT, INFERENCE, ASSUMPTION, HYPOTHESIS, CONFIRMED_ROOT_CAUSE
    title: str
    summary: str
    confidence: float
    source: str
    timestamp: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MissingEvidenceCard(BaseModel):
    category: str
    title: str
    description: str
    suggested_action: str

class HypothesisVersionResponse(BaseModel):
    id: str
    hypothesis_id: str
    version: int
    title: str
    description: str
    confidence_score: float
    reason_for_change: Optional[str] = None
    supporting_evidence_ids: List[str] = []
    contradicting_evidence_ids: List[str] = []
    missing_evidence: List[Dict[str, Any]] = []
    investigator_notes: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True

class HypothesisResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    description: str
    confidence_score: float
    status: str
    version: int
    created_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    supporting_evidence: List[EvidenceResponse] = []
    contradicting_evidence: List[EvidenceResponse] = []
    missing_evidence: List[MissingEvidenceCard] = []
    versions: List[HypothesisVersionResponse] = []

    class Config:
        from_attributes = True

class HypothesisAction(BaseModel):
    action: str # ACCEPT, REJECT, ANNOTATE, ESCALATE
    notes: Optional[str] = None


# --- INVESTIGATOR ACTION ---
class InvestigatorActionCreate(BaseModel):
    action_type: str
    target_id: Optional[str] = None
    details: Dict[str, Any] = {}

class InvestigatorActionResponse(BaseModel):
    id: str
    incident_id: str
    user_id: str
    action_type: str
    target_id: Optional[str] = None
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# --- MITIGATION & ROOT CAUSE ---
class MitigationCreate(BaseModel):
    mitigation_name: str
    description: str
    status: str = "PLANNED"
    impact: Optional[str] = None

class MitigationResponse(BaseModel):
    id: str
    incident_id: str
    mitigation_name: str
    owner_id: Optional[str] = None
    description: str
    status: str
    impact: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RootCauseCreate(BaseModel):
    category: str
    summary: str
    supporting_evidence_ids: List[str]
    lessons_learned: List[str] = []
    reference_docs: List[str] = []

class RootCauseResponse(BaseModel):
    id: str
    incident_id: str
    category: str
    summary: str
    supporting_evidence_ids: List[str]
    lessons_learned: List[str] = []
    reference_docs: List[str] = []
    confirmed_by_id: str
    confirmed_at: datetime

    class Config:
        from_attributes = True


# --- REPORT ---
class ReportResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    content: Dict[str, Any]
    generated_by_id: str
    generated_at: datetime

    class Config:
        from_attributes = True


# --- AUDIT LOG & NOTIFICATIONS ---
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    payload: Dict[str, Any]
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- ANALYTICS OVERVIEW ---
class AnalyticsOverviewResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    critical_incidents: int
    resolved_incidents: int
    mttr_minutes: float
    mttd_minutes: float
    evidence_count: int
    ai_hypotheses_count: int
    hypothesis_accuracy_pct: float
    top_failure_categories: List[Dict[str, Any]]
    top_affected_services: List[Dict[str, Any]]
    incident_trend: List[Dict[str, Any]]
