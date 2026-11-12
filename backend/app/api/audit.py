from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogResponse, AuditVerificationResponse
from app.security.audit_chain import audit_chain
from app.api.deps import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Ledger"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()

@router.post("/verify", response_model=AuditVerificationResponse)
def verify_audit_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verification_result = audit_chain.verify_chain(db)
    return AuditVerificationResponse(**verification_result)

