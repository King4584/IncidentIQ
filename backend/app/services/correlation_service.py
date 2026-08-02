from typing import List, Dict, Any
from app.models.models import NormalizedEvent, Correlation

class CorrelationEngine:
    @staticmethod
    def calculate_correlations(events: List[NormalizedEvent]) -> List[Dict[str, Any]]:
        """
        Correlates events using 8 distinct vectors:
        - Request ID match
        - Deployment ID match
        - User ID match
        - Trace ID match
        - Service dependency & temporal proximity
        """
        correlations = []
        n = len(events)
        for i in range(n):
            for j in range(i + 1, n):
                e1 = events[i]
                e2 = events[j]
                
                if e1.incident_id and e2.incident_id and e1.incident_id != e2.incident_id:
                    continue

                c_type = None
                score = 0.0

                # 1. Request ID match (Strongest correlation)
                if e1.request_id and e2.request_id and e1.request_id == e2.request_id:
                    c_type = "request_id"
                    score = 0.98
                # 2. Trace ID match
                elif e1.trace_id and e2.trace_id and e1.trace_id == e2.trace_id:
                    c_type = "trace_id"
                    score = 0.95
                # 3. Deployment ID match
                elif e1.deployment_id and e2.deployment_id and e1.deployment_id == e2.deployment_id:
                    c_type = "deployment_id"
                    score = 0.88
                # 4. User ID match
                elif e1.user_id and e2.user_id and e1.user_id == e2.user_id:
                    c_type = "user_id"
                    score = 0.80
                # 5. Service match & Temporal window (< 10 mins apart)
                elif e1.service == e2.service:
                    time_diff = abs((e1.timestamp - e2.timestamp).total_seconds())
                    if time_diff <= 600: # 10 mins
                        c_type = "temporal_service"
                        score = max(0.4, 0.75 - (time_diff / 600) * 0.35)

                if c_type:
                    correlations.append({
                        "incident_id": e1.incident_id or e2.incident_id,
                        "source_event_id": e1.id,
                        "target_event_id": e2.id,
                        "correlation_type": c_type,
                        "correlation_score": round(score, 2),
                        "metadata_info": {
                            "e1_service": e1.service,
                            "e2_service": e2.service,
                            "e1_severity": e1.severity,
                            "e2_severity": e2.severity
                        }
                    })
        return correlations

    @staticmethod
    def build_react_flow_graph(events: List[NormalizedEvent], correlations: List[Correlation]) -> Dict[str, Any]:
        """Generates visual node/edge topology for React Flow."""
        nodes = []
        edges = []

        # Group/position nodes nicely
        y_spacing = 100
        x_spacing = 280

        # Sort events by timestamp
        sorted_events = sorted(events, key=lambda x: x.timestamp)
        
        for idx, event in enumerate(sorted_events):
            col = idx % 4
            row = idx // 4
            
            nodes.append({
                "id": event.id,
                "type": "customEvent",
                "position": {"x": col * x_spacing + 50, "y": row * y_spacing + 50},
                "data": {
                    "label": f"[{event.service}] {event.event_type}",
                    "service": event.service,
                    "severity": event.severity,
                    "message": event.message,
                    "timestamp": event.timestamp.isoformat() if event.timestamp else "",
                    "source": event.source,
                    "request_id": event.request_id,
                    "deployment_id": event.deployment_id
                }
            })

        for corr in correlations:
            edges.append({
                "id": f"e-{corr.source_event_id}-{corr.target_event_id}",
                "source": corr.source_event_id,
                "target": corr.target_event_id,
                "label": f"{corr.correlation_type} ({int(corr.correlation_score * 100)}%)",
                "animated": True
            })

        return {"nodes": nodes, "edges": edges}
