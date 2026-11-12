from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import SecurityPolicyCreate, SecurityPolicyUpdate, SecurityPolicyResponse
from app.services.policy_service import policy_service
from app.api.deps import get_current_user, require_admin

router = APIRouter(prefix="/policies", tags=["Security Policies"])

@router.get("", response_model=List[SecurityPolicyResponse])
def list_policies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return policy_service.get_all_policies(db)

@router.post("", response_model=SecurityPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: SecurityPolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = policy_service.get_policy_code = policy_service.get_policy_by_code(db, policy_in.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Policy code '{policy_in.code}' already exists")
    return policy_service.create_policy(db, policy_in, actor_username=current_user.username)

@router.get("/{policy_id}", response_model=SecurityPolicyResponse)
def get_policy(policy_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pol = policy_service.get_policy_by_id(db, policy_id)
    if not pol:
        raise HTTPException(status_code=404, detail="Policy not found")
    return pol

@router.put("/{policy_id}", response_model=SecurityPolicyResponse)
def update_policy(
    policy_id: int,
    policy_in: SecurityPolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    pol = policy_service.update_policy(db, policy_id, policy_in, actor_username=current_user.username)
    if not pol:
        raise HTTPException(status_code=404, detail="Policy not found")
    return pol

@router.delete("/{policy_id}")
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    success = policy_service.delete_policy(db, policy_id, actor_username=current_user.username)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"message": "Policy successfully removed", "id": policy_id}

