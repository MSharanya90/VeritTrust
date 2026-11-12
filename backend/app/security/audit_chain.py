import hashlib
import json
import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import AuditLog

class AuditChainService:
    """
    Tamper-Evident Immutable Audit Log with Cryptographic Hash Chaining.
    Each entry links cryptographically to its predecessor, guaranteeing that
    any retrospective modification, deletion, or insertion breaks the chain.
    """
    
    GENESIS_HASH = "0" * 64

    @staticmethod
    def _compute_hash(data_str: str) -> str:
        return hashlib.sha256(data_str.encode("utf-8")).hexdigest()

    @classmethod
    def record_event(
        cls,
        db: Session,
        event_type: str,
        actor_type: str,
        actor_id: str,
        resource_type: str,
        resource_id: str,
        action_summary: str,
        payload: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        # 1. Fetch latest audit log to obtain its hash
        latest_entry = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
        previous_hash = latest_entry.entry_hash if latest_entry else cls.GENESIS_HASH
        
        # 2. Canonical JSON representation of payload
        payload_data = payload or {"summary": action_summary}
        payload_canonical = json.dumps(payload_data, sort_keys=True, default=str)
        payload_hash = cls._compute_hash(payload_canonical)
        
        # 3. Create entry timestamp
        now = datetime.datetime.utcnow()
        timestamp_str = now.isoformat()
        
        # 4. Construct entry hash preimage
        preimage = (
            f"{timestamp_str}|{event_type}|{actor_type}|{actor_id}|"
            f"{resource_type}|{resource_id}|{action_summary}|{payload_hash}|{previous_hash}"
        )
        entry_hash = cls._compute_hash(preimage)
        
        # 5. Persist
        log_entry = AuditLog(
            timestamp=now,
            event_type=event_type,
            actor_type=actor_type,
            actor_id=str(actor_id),
            resource_type=resource_type,
            resource_id=str(resource_id),
            action_summary=action_summary,
            payload_hash=payload_hash,
            previous_hash=previous_hash,
            entry_hash=entry_hash
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @classmethod
    def verify_chain(cls, db: Session) -> Dict[str, Any]:
        """
        Traverses the entire ledger from genesis to head and verifies all cryptographic linkages.
        """
        logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
        total_records = len(logs)
        
        if total_records == 0:
            return {
                "is_valid": True,
                "total_records": 0,
                "verified_records": 0,
                "broken_chain_index": None,
                "message": "Audit ledger is empty. Chain is intact."
            }

        expected_prev_hash = cls.GENESIS_HASH

        for idx, entry in enumerate(logs):
            # Check linkage to previous entry
            if entry.previous_hash != expected_prev_hash:
                return {
                    "is_valid": False,
                    "total_records": total_records,
                    "verified_records": idx,
                    "broken_chain_index": entry.id,
                    "message": f"Cryptographic link broken at record #{entry.id}. Expected previous hash {expected_prev_hash[:16]}..., but found {entry.previous_hash[:16]}..."
                }

            # Check self-integrity: recompute hash
            preimage = (
                f"{entry.timestamp.isoformat()}|{entry.event_type}|{entry.actor_type}|{entry.actor_id}|"
                f"{entry.resource_type}|{entry.resource_id}|{entry.action_summary}|{entry.payload_hash}|{entry.previous_hash}"
            )
            recalculated_hash = cls._compute_hash(preimage)
            if recalculated_hash != entry.entry_hash:
                return {
                    "is_valid": False,
                    "total_records": total_records,
                    "verified_records": idx,
                    "broken_chain_index": entry.id,
                    "message": f"Hash mismatch at record #{entry.id}. Content was altered. Entry hash {entry.entry_hash[:16]}... vs computed {recalculated_hash[:16]}..."
                }

            expected_prev_hash = entry.entry_hash

        return {
            "is_valid": True,
            "total_records": total_records,
            "verified_records": total_records,
            "broken_chain_index": None,
            "message": f"Audit ledger successfully verified. All {total_records} records exhibit cryptographically unbroken hash continuity."
        }

audit_chain = AuditChainService()
