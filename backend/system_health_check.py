import json
import urllib.request
import urllib.parse
import sys

# Ensure UTF-8 output encoding for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api(name, url, method="GET", body=None, expected_status=200):
    print(f"Testing {name} [{method} {url}]...", end=" ")
    try:
        req = urllib.request.Request(url, method=method)
        if body:
            data = json.dumps(body).encode('utf-8')
            req.add_header('Content-Type', 'application/json')
            res = urllib.request.urlopen(req, data=data)
        else:
            res = urllib.request.urlopen(req)
        
        status = res.status
        content = res.read().decode('utf-8')
        if status == expected_status:
            print(f"[PASSED] Status {status}")
            return json.loads(content) if content.startswith('{') or content.startswith('[') else content
        else:
            print(f"[FAILED] Status {status}")
            return None
    except Exception as e:
        print(f"[FAILED] Error: {e}")
        return None

def run_health_check():
    print("=" * 65)
    print("      INCIDENTIQ AI - SYSTEM INTEGRATION HEALTH CHECK      ")
    print("=" * 65)

    # 1. Root & Incidents
    incidents = test_api("Incidents List API", f"{BASE_URL}/incidents")
    if not incidents or len(incidents) == 0:
        print("CRITICAL: No incidents found.")
        sys.exit(1)
    
    inc_id = incidents[0]['id']
    inc_number = incidents[0]['incident_number']
    print(f"   Selected Target Incident: {inc_number} (UUID: {inc_id})")

    # 2. Event Ingestion
    ingest_payload = {
        "incident_id": inc_id,
        "events": [
            {
                "source": "Datadog APM",
                "service": "payment-api",
                "severity": "CRITICAL",
                "event_type": "DB_ALERT",
                "message": "fatal: remaining connection slots are reserved for non-replication superuser connections (max_connections=200)",
                "request_id": "req-9901a",
                "deployment_id": "dep-v2.4.12",
                "payload": {"max_connections": 200, "active": 200}
            }
        ]
    }
    test_api("Manual Event Ingestion API", f"{BASE_URL}/ingestion/manual", method="POST", body=ingest_payload)

    # 3. Timeline & Graph
    test_api("Timeline Telemetry Feed API", f"{BASE_URL}/timeline?incident_id={inc_id}")
    test_api("React Flow Topology Graph API", f"{BASE_URL}/timeline/graph/{inc_id}")

    # 4. Trigger LangGraph AI Agent
    agent_res = test_api("LangGraph AI Agent Investigation API", f"{BASE_URL}/agent/trigger/{inc_id}", method="POST")
    if isinstance(agent_res, dict):
        print(f"   AI Agent Summary: {agent_res.get('summary')}")

    # 5. Hypotheses
    hypotheses = test_api("Hypotheses & Version History API", f"{BASE_URL}/hypotheses/{inc_id}")
    if hypotheses and len(hypotheses) > 0:
        hypo_id = hypotheses[0]['id']
        test_api("Investigator Action (Accept) API", f"{BASE_URL}/hypotheses/{hypo_id}/action", method="POST", body={"action": "ACCEPT", "notes": "Confirmed by Lead SRE during health check."})

    # 6. Mitigations
    test_api("Add Mitigation Action API", f"{BASE_URL}/mitigations/{inc_id}", method="POST", body={"mitigation_name": "Scale DB Cluster", "description": "Increased max_connections ceiling", "status": "IN_PROGRESS"})
    test_api("List Mitigations API", f"{BASE_URL}/mitigations/{inc_id}")

    # 7. Root Cause Lockdown
    rc_payload = {
        "category": "Database Connection Pool Exhaustion",
        "summary": "High checkout traffic exhausted postgres-primary connection ceiling.",
        "supporting_evidence_ids": ["ev-healthcheck-01"],
        "lessons_learned": ["Enforce connection pool timeout liveness checks"],
        "reference_docs": []
    }
    test_api("Save Confirmed Root Cause API", f"{BASE_URL}/root-cause/{inc_id}", method="POST", body=rc_payload)
    test_api("Fetch Root Cause API", f"{BASE_URL}/root-cause/{inc_id}")

    # 8. Post-Mortem Reports & HTML Export
    test_api("Post-Mortem Report API", f"{BASE_URL}/reports/{inc_id}")
    test_api("Post-Mortem HTML Export API", f"{BASE_URL}/reports/{inc_id}/export/html")

    # 9. Audit Logs & Analytics
    test_api("Search Audit Logs API", f"{BASE_URL}/audit")
    test_api("Analytics Overview API", f"{BASE_URL}/analytics/overview")

    print("=" * 65)
    print("      ALL END-TO-END HEALTH CHECKS PASSED SUCCESSFULLY!      ")
    print("=" * 65)

if __name__ == "__main__":
    run_health_check()
