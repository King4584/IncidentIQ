from app.agent.investigation_agent import IncidentInvestigationWorkflow, AgentState

def test_investigation_graph():
    state: AgentState = {
        "incident_id": "inc-test",
        "incident_title": "Test DB Outage",
        "events": [
            {
                "id": "e1",
                "service": "postgres-primary",
                "severity": "CRITICAL",
                "event_type": "DB_ALERT",
                "message": "fatal: remaining connection slots are reserved for non-replication superuser connections (max_connections=200)",
                "source": "PostgreSQL"
            }
        ],
        "correlations": [],
        "evidence": [],
        "hypotheses": [],
        "contradictions": [],
        "missing_evidence": [],
        "investigator_feedback": [],
        "step": "INIT",
        "summary": ""
    }

    final_state = IncidentInvestigationWorkflow.run_investigation_graph(state)

    assert final_state["step"] == "INVESTIGATION_COMPLETE"
    assert len(final_state["hypotheses"]) > 0
    assert len(final_state["evidence"]) > 0
    assert final_state["evidence"][0]["category"] == "CONFIRMED_EVIDENCE"
