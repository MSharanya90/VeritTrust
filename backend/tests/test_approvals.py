import datetime
from app.core.database import SessionLocal
from app.models.models import Agent, AgentAction, ApprovalRequest, User
from app.services.approval_service import approval_service
from app.schemas.schemas import ApprovalDecisionRequest

def test_approval_workflow():
    db = SessionLocal()
    agent = db.query(Agent).first()
    reviewer = db.query(User).filter(User.role == "admin").first()
    
    # 1. Create a test action
    action = AgentAction(
        agent_id=agent.id,
        action_type="FINANCIAL_TRANSFER",
        target_resource="ACH Vendor Account",
        payload='{"amount": 8500.0}',
        status="AWAITING_APPROVAL",
        risk_score=75.0,
        simulated=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    
    # 2. Dispatch approval request
    req = approval_service.create_approval_request(
        db=db,
        action_id=action.id,
        agent_id=agent.id,
        risk_score=75.0,
        expiry_minutes=30
    )
    assert req.status == "PENDING"
    
    # 3. Approve action
    decision_payload = ApprovalDecisionRequest(
        decision="APPROVED",
        notes="Authorized for cloud infrastructure deployment."
    )
    result = approval_service.resolve_approval(
        db=db,
        approval_id=req.id,
        reviewer_user=reviewer,
        decision_data=decision_payload
    )
    assert result["status"] == "APPROVED"
    assert result["decision"] == "APPROVED"
    
    # Verify action is marked approved
    db.refresh(action)
    assert action.status == "APPROVED"
    db.close()

