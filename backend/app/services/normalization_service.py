from datetime import datetime, timezone
from typing import Dict, Any, Tuple

def parse_iso_or_now(dt_str: str | None) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        # Standard library ISO parsing in Python 3.11+
        clean_str = dt_str.replace('Z', '+00:00')
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)

class NormalizationEngine:
    @staticmethod
    def normalize_event(
        raw_event_id: str,
        source: str,
        original_message: str,
        payload: Dict[str, Any],
        original_ts: str | None = None,
        incident_id: str | None = None
    ) -> Tuple[Dict[str, Any], str]:
        """
        Transforms heterogeneous incoming payloads (logs, alerts, db events, user reports)
        into a standardized NormalizedEvent structure while preserving raw references.
        """
        # Extract fields directly or from nested JSON payload
        service = payload.get("service") or payload.get("app") or payload.get("service_name") or "unknown-service"
        environment = payload.get("environment") or payload.get("env") or payload.get("stage") or "production"
        severity = payload.get("severity") or payload.get("level") or payload.get("log_level") or "INFO"
        severity = severity.upper()
        if severity not in ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]:
            severity = "INFO"
            
        event_type = payload.get("event_type") or payload.get("type") or payload.get("kind") or "LOG"
        
        request_id = payload.get("request_id") or payload.get("req_id") or payload.get("x_request_id")
        deployment_id = payload.get("deployment_id") or payload.get("deploy_id") or payload.get("build_id")
        user_id = payload.get("user_id") or payload.get("account_id") or payload.get("uid")
        trace_id = payload.get("trace_id") or payload.get("traceId") or payload.get("span_id")
        
        timestamp_val = parse_iso_or_now(original_ts or payload.get("timestamp") or payload.get("time"))

        # Validation rules
        validation_status = "VALIDATED"
        if not service or service == "unknown-service":
            validation_status = "WARNING"
        if severity in ["CRITICAL", "ERROR"] and not (request_id or deployment_id or trace_id):
            validation_status = "WARNING"

        normalized_data = {
            "raw_event_id": raw_event_id,
            "incident_id": incident_id,
            "timestamp": timestamp_val,
            "service": str(service),
            "environment": str(environment),
            "severity": str(severity),
            "event_type": str(event_type),
            "request_id": str(request_id) if request_id else None,
            "deployment_id": str(deployment_id) if deployment_id else None,
            "user_id": str(user_id) if user_id else None,
            "trace_id": str(trace_id) if trace_id else None,
            "message": str(original_message),
            "source": str(source),
            "raw_event_reference": raw_event_id,
            "validation_status": validation_status
        }

        return normalized_data, validation_status
