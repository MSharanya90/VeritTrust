from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import ApprovalRequestResponse, ApprovalDecisionRequest
from app.services.approval_service import approval_service
from app.api.deps import get_current_user, require_analyst

router = APIRouter(prefix="/approvals", tags=["Human-in-the-Loop Approvals"])

@router.get("", response_model=List[ApprovalRequestResponse])
def list_approvals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return approval_service.get_pending_approvals(db)

@router.post("/{approval_id}/approve")
def approve_request(
    approval_id: int,
    decision_in: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    try:
        decision_in.decision = "APPROVED"
        return approval_service.resolve_approval(db, approval_id, current_user, decision_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{approval_id}/reject")
def reject_request(
    approval_id: int,
    decision_in: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    try:
        decision_in.decision = "REJECTED"
        return approval_service.resolve_approval(db, approval_id, current_user, decision_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{approval_id}/decision")
def generic_decision(
    approval_id: int,
    decision_in: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    try:
        return approval_service.resolve_approval(db, approval_id, current_user, decision_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

