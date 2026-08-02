import pytest
from app.services.normalization_service import NormalizationEngine

def test_normalize_event():
    raw_payload = {
        "service": "payment-api",
        "level": "ERROR",
        "request_id": "req-9912",
        "message": "Connection to DB timed out after 5000ms"
    }
    
    norm_data, status = NormalizationEngine.normalize_event(
        raw_event_id="raw-1",
        source="Datadog",
        original_message=raw_payload["message"],
        payload=raw_payload
    )

    assert norm_data["service"] == "payment-api"
    assert norm_data["severity"] == "ERROR"
    assert norm_data["request_id"] == "req-9912"
    assert norm_data["validation_status"] == "VALIDATED"
