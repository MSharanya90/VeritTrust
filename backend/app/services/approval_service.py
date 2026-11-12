import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import ApprovalRequest, AgentAction, Agent, User, Notification
from app.schemas.schemas import ApprovalDecisionRequest
from app.security.audit_chain import audit_chain
from app.services.agent_service import agent_service
from app.core.config import settings

class ApprovalService:
    @staticmethod
    def get_pending_approvals(db: Session) -> List[Dict[str, Any]]:
        # Auto-expire outdated requests
        now = datetime.datetime.utcnow()
        expired = db.query(ApprovalRequest).filter(
            ApprovalRequest.status == "PENDING",
            ApprovalRequest.expires_at < now
        ).all()
        for exp in expired:
            exp.status = "EXPIRED"
            exp.resolved_at = now
            if exp.action:
                exp.action.status = "BLOCKED"
        if expired:
            db.commit()

        requests = db.query(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()).all()
        result = []
        for req in requests:
            action = req.action
            agent = db.query(Agent).filter(Agent.id == req.requested_by_agent_id).first()
            result.append({
                "id": req.id,
                "action_id": req.action_id,
                "status": req.status,
                "requested_by_agent_id": req.requested_by_agent_id,
                "agent_name": agent.name if agent else "Unknown Agent",
                "action_type": action.action_type if action else "UNKNOWN",
                "target_resource": action.target_resource if action else "UNKNOWN",
                "payload": action.payload if action else "",
                "reviewer_id": req.reviewer_id,
                "reviewer_notes": req.reviewer_notes,
                "risk_score": req.risk_score,
                "expires_at": req.expires_at,
                "created_at": req.created_at,
                "resolved_at": req.resolved_at
            })
        return result

    @staticmethod
    def create_approval_request(
        db: Session,
        action_id: int,
        agent_id: int,
        risk_score: float,
        expiry_minutes: int = 60
    ) -> ApprovalRequest:
        now = datetime.datetime.utcnow()
        expires_at = now + datetime.timedelta(minutes=expiry_minutes)
        approval_req = ApprovalRequest(
            action_id=action_id,
            status="PENDING",
            requested_by_agent_id=agent_id,
            risk_score=risk_score,
            expires_at=expires_at,
            created_at=now
        )
        db.add(approval_req)
        db.commit()
        db.refresh(approval_req)
        
        # Create in-app notification
        notification = Notification(
            title=f"Approval Required: Action #{action_id}",
            message=f"Agent #{agent_id} proposed a high-risk operation (Risk: {risk_score}/100) requiring human review.",
            notification_type="APPROVAL_REQUIRED",
            severity="WARNING" if risk_score < 80 else "CRITICAL",
            link_url=f"/approvals",
            is_read=False
        )
        db.add(notification)
        db.commit()

        audit_chain.record_event(
            db=db,
            event_type="APPROVAL_REQUESTED",
            actor_type="AGENT",
            actor_id=str(agent_id),
            resource_type="ACTION",
            resource_id=str(action_id),
            action_summary=f"Dispatched human approval gate for Action #{action_id} with risk score {risk_score}",
            payload={"action_id": action_id, "risk_score": risk_score, "expires_at": expires_at.isoformat()}
        )
        return approval_req

    @staticmethod
    def resolve_approval(
        db: Session,
        approval_id: int,
        reviewer_user: User,
        decision_data: ApprovalDecisionRequest
    ) -> Dict[str, Any]:
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
        if not req:
            raise ValueError(f"Approval request #{approval_id} not found")
        
        if req.status != "PENDING":
            raise ValueError(f"Approval request #{approval_id} is already resolved as {req.status}")
        
        now = datetime.datetime.utcnow()
        if req.expires_at < now:
            req.status = "EXPIRED"
            req.resolved_at = now
            if req.action:
                req.action.status = "BLOCKED"
            db.commit()
            raise ValueError("This approval request has expired and cannot be processed.")

        action = req.action
        decision = decision_data.decision.upper()
        req.reviewer_id = reviewer_user.id
        req.reviewer_notes = decision_data.notes
        req.resolved_at = now
        
        if decision == "APPROVED":
            req.status = "APPROVED"
            if action:
                action.status = "APPROVED"
                action.executed_at = now
                action.execution_result = (
                    f"Action authorized by {reviewer_user.full_name or reviewer_user.username} "
                    f"at {now.isoformat()}. Simulated execution succeeded: Target {action.target_resource} reached."
                )
            agent_service.update_trust_score(
                db=db,
                agent_id=req.requested_by_agent_id,
                delta=1.5,
                reason=f"Human reviewer authorized action #{action.id if action else ''}"
            )
        elif decision == "REJECTED":
            req.status = "REJECTED"
            if action:
                action.status = "REJECTED"
                action.execution_result = f"Action rejected by reviewer: {decision_data.notes}"
            agent_service.update_trust_score(
                db=db,
                agent_id=req.requested_by_agent_id,
                delta=-12.0,
                reason=f"High-risk action rejected by reviewer ({decision_data.notes or 'Unspecified hazard'})"
            )
        elif decision == "MODIFIED":
            req.status = "MODIFIED"
            if action:
                action.status = "APPROVED" # Approved with modified parameters
                if decision_data.modified_payload:
                    action.payload = decision_data.modified_payload
                action.executed_at = now
                action.execution_result = f"Action executed with human-modified parameters by {reviewer_user.username}."
            agent_service.update_trust_score(
                db=db,
                agent_id=req.requested_by_agent_id,
                delta=0.5,
                reason="Action adjusted with safe human modifications"
            )
        else:
            raise ValueError(f"Invalid decision '{decision}'. Choose APPROVED, REJECTED, or MODIFIED.")

        db.commit()
        db.refresh(req)

        audit_chain.record_event(
            db=db,
            event_type=f"APPROVAL_{decision}",
            actor_type="USER",
            actor_id=str(reviewer_user.id),
            resource_type="APPROVAL_REQUEST",
            resource_id=str(req.id),
            action_summary=f"Reviewer {reviewer_user.username} resolved request #{req.id} as {decision}",
            payload={"decision": decision, "notes": decision_data.notes, "action_id": req.action_id}
        )

        return {
            "id": req.id,
            "status": req.status,
            "decision": decision,
            "action_id": req.action_id,
            "reviewer": reviewer_user.username,
            "resolved_at": req.resolved_at
        }

approval_service = ApprovalService()

