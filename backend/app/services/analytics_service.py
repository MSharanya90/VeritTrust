import datetime
import io
import csv
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import (
    Agent, AgentTask, AgentAction, RiskAssessment, ApprovalRequest,
    SecurityIncident, AuditLog, SecurityDetection, TrustScoreHistory
)

class AnalyticsService:
    @staticmethod
    def get_overview(db: Session) -> Dict[str, Any]:
        total_agents = db.query(Agent).count()
        active_agents = db.query(Agent).filter(Agent.status == "ACTIVE").count()
        blocked_agents = db.query(Agent).filter(Agent.status.in_(["BLOCKED", "UNDER_REVIEW"])).count()
        
        total_tasks = db.query(AgentTask).count()
        total_actions = db.query(AgentAction).count()
        high_risk_actions = db.query(AgentAction).filter(AgentAction.risk_score >= 60.0).count()
        
        total_approvals = db.query(ApprovalRequest).count()
        pending_approvals = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()
        approved_count = db.query(ApprovalRequest).filter(ApprovalRequest.status == "APPROVED").count()
        rejected_count = db.query(ApprovalRequest).filter(ApprovalRequest.status == "REJECTED").count()
        
        total_incidents = db.query(SecurityIncident).count()
        open_incidents = db.query(SecurityIncident).filter(SecurityIncident.status.in_(["OPEN", "INVESTIGATING"])).count()
        critical_incidents = db.query(SecurityIncident).filter(SecurityIncident.severity == "CRITICAL").count()
        
        total_detections = db.query(SecurityDetection).count()
        injections_detected = db.query(SecurityDetection).filter(SecurityDetection.scan_type == "PROMPT_INJECTION", SecurityDetection.is_detected == True).count()
        leakages_detected = db.query(SecurityDetection).filter(SecurityDetection.scan_type == "DATA_LEAKAGE", SecurityDetection.is_detected == True).count()
        
        # Average Trust Score across agents
        avg_trust = db.query(func.avg(Agent.current_trust_score)).scalar() or 85.0
        
        # Approval approval rate
        resolved_approvals = approved_count + rejected_count
        approval_rate = round((approved_count / resolved_approvals * 100), 1) if resolved_approvals > 0 else 100.0

        return {
            "total_agents": total_agents,
            "active_agents": active_agents,
            "blocked_agents": blocked_agents,
            "total_tasks": total_tasks,
            "total_actions": total_actions,
            "high_risk_actions": high_risk_actions,
            "total_approvals": total_approvals,
            "pending_approvals": pending_approvals,
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "approval_rate_percent": approval_rate,
            "total_incidents": total_incidents,
            "open_incidents": open_incidents,
            "critical_incidents": critical_incidents,
            "total_detections": total_detections,
            "injections_detected": injections_detected,
            "leakages_detected": leakages_detected,
            "average_trust_score": round(float(avg_trust), 1)
        }

    @staticmethod
    def get_threat_metrics(db: Session) -> Dict[str, Any]:
        # Detections by scan type
        detections_by_type = db.query(
            SecurityDetection.detection_type,
            func.count(SecurityDetection.id)
        ).group_by(SecurityDetection.detection_type).all()
        
        # Incident severity distribution
        incident_severities = db.query(
            SecurityIncident.severity,
            func.count(SecurityIncident.id)
        ).group_by(SecurityIncident.severity).all()
        
        # Risk levels of actions
        risk_levels = db.query(
            RiskAssessment.risk_level,
            func.count(RiskAssessment.id)
        ).group_by(RiskAssessment.risk_level).all()

        # Monthly / Recent trend data points
        actions_by_type = db.query(
            AgentAction.action_type,
            func.count(AgentAction.id),
            func.avg(AgentAction.risk_score)
        ).group_by(AgentAction.action_type).all()

        return {
            "detections_by_type": [{"type": item[0], "count": item[1]} for item in detections_by_type],
            "incidents_by_severity": [{"severity": item[0], "count": item[1]} for item in incident_severities],
            "actions_by_risk_level": [{"level": item[0], "count": item[1]} for item in risk_levels],
            "actions_by_type": [{"action": item[0], "count": item[1], "avg_risk": round(float(item[2] or 0), 1)} for item in actions_by_type]
        }

    @staticmethod
    def get_agent_analytics(db: Session) -> List[Dict[str, Any]]:
        agents = db.query(Agent).all()
        results = []
        for agent in agents:
            # Fetch recent trust history
            history = db.query(TrustScoreHistory).filter(
                TrustScoreHistory.agent_id == agent.id
            ).order_by(TrustScoreHistory.id.desc()).limit(10).all()
            
            results.append({
                "id": agent.id,
                "name": agent.name,
                "code": agent.code,
                "role_type": agent.role_type,
                "status": agent.status,
                "trust_score": agent.current_trust_score,
                "tasks_count": agent.tasks_count,
                "threat_count": agent.threat_count,
                "history": [
                    {
                        "timestamp": h.timestamp.isoformat(),
                        "score": h.score,
                        "delta": h.delta,
                        "reason": h.reason
                    } for h in reversed(history)
                ]
            })
        return results

    @staticmethod
    def export_csv_report(db: Session, report_type: str = "actions") -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == "actions":
            writer.writerow(["Action ID", "Agent ID", "Action Type", "Target Resource", "Status", "Risk Score", "Simulated", "Created At"])
            actions = db.query(AgentAction).order_by(AgentAction.id.desc()).all()
            for a in actions:
                writer.writerow([a.id, a.agent_id, a.action_type, a.target_resource, a.status, a.risk_score, a.simulated, a.created_at])
        elif report_type == "incidents":
            writer.writerow(["Incident Number", "Title", "Severity", "Status", "Source Agent ID", "Created At", "Resolved At"])
            incidents = db.query(SecurityIncident).order_by(SecurityIncident.id.desc()).all()
            for inc in incidents:
                writer.writerow([inc.incident_number, inc.title, inc.severity, inc.status, inc.source_agent_id, inc.created_at, inc.resolved_at])
        elif report_type == "audit":
            writer.writerow(["Log ID", "Timestamp", "Event Type", "Actor Type", "Actor ID", "Resource Type", "Resource ID", "Summary", "Entry Hash"])
            logs = db.query(AuditLog).order_by(AuditLog.id.desc()).all()
            for l in logs:
                writer.writerow([l.id, l.timestamp, l.event_type, l.actor_type, l.actor_id, l.resource_type, l.resource_id, l.action_summary, l.entry_hash])
        else: # agents
            writer.writerow(["Agent ID", "Name", "Code", "Role", "Status", "Trust Score", "Tasks", "Threats"])
            agents = db.query(Agent).all()
            for ag in agents:
                writer.writerow([ag.id, ag.name, ag.code, ag.role_type, ag.status, ag.current_trust_score, ag.tasks_count, ag.threat_count])

        return output.getvalue()

analytics_service = AnalyticsService()

