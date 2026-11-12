import hashlib
import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import ProvenanceRecord, AgentAction
from app.schemas.schemas import ProvenanceRecordCreate
from app.security.audit_chain import audit_chain

class ProvenanceService:
    @staticmethod
    def calculate_hash(content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    @staticmethod
    def record_provenance(db: Session, record_in: ProvenanceRecordCreate) -> ProvenanceRecord:
        content_hash = record_in.content_hash or ProvenanceService.calculate_hash(record_in.claim_or_decision)
        rec = ProvenanceRecord(
            action_id=record_in.action_id,
            claim_or_decision=record_in.claim_or_decision,
            source_name=record_in.source_name,
            source_url=record_in.source_url,
            source_type=record_in.source_type,
            content_hash=content_hash,
            trust_score=record_in.trust_score,
            verification_status=record_in.verification_status,
            metadata_json=record_in.metadata_json,
            created_at=datetime.datetime.utcnow()
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def get_all_records(db: Session, limit: int = 100) -> List[ProvenanceRecord]:
        return db.query(ProvenanceRecord).order_by(ProvenanceRecord.id.desc()).limit(limit).all()

    @staticmethod
    def get_record_by_id(db: Session, record_id: int) -> Optional[ProvenanceRecord]:
        return db.query(ProvenanceRecord).filter(ProvenanceRecord.id == record_id).first()

    @staticmethod
    def get_action_lineage(db: Session, action_id: int) -> Dict[str, Any]:
        """
        Builds a multi-stage provenance lineage DAG for a specific action.
        """
        action = db.query(AgentAction).filter(AgentAction.id == action_id).first()
        if not action:
            return {"nodes": [], "edges": []}
            
        records = db.query(ProvenanceRecord).filter(ProvenanceRecord.action_id == action_id).all()
        
        nodes = []
        edges = []
        
        # 1. Source Nodes
        for idx, rec in enumerate(records):
            source_node_id = f"source-{rec.id}"
            nodes.append({
                "id": source_node_id,
                "label": rec.source_name,
                "type": "ORIGINAL_SOURCE",
                "source_type": rec.source_type,
                "trust_score": rec.trust_score,
                "content_hash": rec.content_hash,
                "verification_status": rec.verification_status,
                "details": rec.claim_or_decision
            })
            
            # Grounding node
            ground_node_id = f"ground-{rec.id}"
            nodes.append({
                "id": ground_node_id,
                "label": f"Retrieval & Hash Check #{rec.id}",
                "type": "RETRIEVAL_VERIFICATION",
                "verified": rec.verification_status == "VERIFIED"
            })
            edges.append({"source": source_node_id, "target": ground_node_id})
            
            # Link to action
            action_node_id = f"action-{action.id}"
            edges.append({"source": ground_node_id, "target": action_node_id})

        # Action Node
        action_node_id = f"action-{action.id}"
        nodes.append({
            "id": action_node_id,
            "label": f"Action: {action.action_type}",
            "type": "PROPOSED_ACTION",
            "target": action.target_resource,
            "status": action.status,
            "risk_score": action.risk_score
        })
        
        # Final Execution Node
        final_node_id = f"final-{action.id}"
        nodes.append({
            "id": final_node_id,
            "label": "Authorized Outcome" if action.status == "APPROVED" else "Execution Blocked",
            "type": "EXECUTION_OUTCOME",
            "status": action.status
        })
        edges.append({"source": action_node_id, "target": final_node_id})

        return {
            "action_id": action.id,
            "action_type": action.action_type,
            "target_resource": action.target_resource,
            "status": action.status,
            "nodes": nodes,
            "edges": edges,
            "records": [
                {
                    "id": r.id,
                    "claim": r.claim_or_decision,
                    "source": r.source_name,
                    "type": r.source_type,
                    "hash": r.content_hash,
                    "trust": r.trust_score,
                    "status": r.verification_status,
                    "timestamp": r.created_at.isoformat()
                } for r in records
            ]
        }

provenance_service = ProvenanceService()

