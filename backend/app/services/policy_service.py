import json
import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import SecurityPolicy
from app.schemas.schemas import SecurityPolicyCreate, SecurityPolicyUpdate
from app.security.audit_chain import audit_chain

class PolicyService:
    @staticmethod
    def get_all_policies(db: Session) -> List[SecurityPolicy]:
        return db.query(SecurityPolicy).order_by(SecurityPolicy.id.asc()).all()

    @staticmethod
    def get_active_policies(db: Session) -> List[SecurityPolicy]:
        return db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()

    @staticmethod
    def get_policy_by_id(db: Session, policy_id: int) -> Optional[SecurityPolicy]:
        return db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()

    @staticmethod
    def get_policy_by_code(db: Session, code: str) -> Optional[SecurityPolicy]:
        return db.query(SecurityPolicy).filter(SecurityPolicy.code == code).first()

    @staticmethod
    def create_policy(db: Session, policy_in: SecurityPolicyCreate, actor_username: str = "admin") -> SecurityPolicy:
        rules_str = json.dumps(policy_in.rules_json) if isinstance(policy_in.rules_json, dict) else str(policy_in.rules_json)
        policy = SecurityPolicy(
            name=policy_in.name,
            code=policy_in.code,
            category=policy_in.category,
            severity=policy_in.severity,
            description=policy_in.description,
            rules_json=rules_str,
            enforcement_mode=policy_in.enforcement_mode,
            risk_penalty=policy_in.risk_penalty,
            is_active=policy_in.is_active
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)

        audit_chain.record_event(
            db=db,
            event_type="POLICY_CREATED",
            actor_type="USER",
            actor_id=actor_username,
            resource_type="POLICY",
            resource_id=str(policy.id),
            action_summary=f"Created Security Policy '{policy.name}' [{policy.code}]",
            payload={"name": policy.name, "category": policy.category, "severity": policy.severity}
        )
        return policy

    @staticmethod
    def update_policy(
        db: Session,
        policy_id: int,
        policy_in: SecurityPolicyUpdate,
        actor_username: str = "admin"
    ) -> Optional[SecurityPolicy]:
        policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
        if not policy:
            return None

        update_data = policy_in.model_dump(exclude_unset=True)
        if "rules_json" in update_data and isinstance(update_data["rules_json"], dict):
            update_data["rules_json"] = json.dumps(update_data["rules_json"])

        for field, value in update_data.items():
            setattr(policy, field, value)

        policy.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(policy)

        audit_chain.record_event(
            db=db,
            event_type="POLICY_UPDATED",
            actor_type="USER",
            actor_id=actor_username,
            resource_type="POLICY",
            resource_id=str(policy.id),
            action_summary=f"Modified Security Policy '{policy.name}' [{policy.code}]",
            payload=update_data
        )
        return policy

    @staticmethod
    def delete_policy(db: Session, policy_id: int, actor_username: str = "admin") -> bool:
        policy = db.query(SecurityPolicy).filter(SecurityPolicy.id == policy_id).first()
        if not policy:
            return False

        name = policy.name
        code = policy.code
        db.delete(policy)
        db.commit()

        audit_chain.record_event(
            db=db,
            event_type="POLICY_DELETED",
            actor_type="USER",
            actor_id=actor_username,
            resource_type="POLICY",
            resource_id=str(policy_id),
            action_summary=f"Deleted Security Policy '{name}' [{code}]",
            payload={"id": policy_id, "code": code}
        )
        return True

policy_service = PolicyService()

