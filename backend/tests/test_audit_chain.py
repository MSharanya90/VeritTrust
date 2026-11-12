from app.core.database import SessionLocal
from app.security.audit_chain import audit_chain
from app.models.models import AuditLog

def test_audit_ledger_verification_intact():
    db = SessionLocal()
    # Verify the chain in its initial state
    res = audit_chain.verify_chain(db)
    assert res["is_valid"] is True
    assert res["total_records"] > 0
    assert res["broken_chain_index"] is None
    db.close()

def test_audit_ledger_detects_tampering():
    db = SessionLocal()
    
    # Insert a legitimate test record
    entry = audit_chain.record_event(
        db=db,
        event_type="TEST_EVENT",
        actor_type="USER",
        actor_id="test_admin",
        resource_type="TEST",
        resource_id="123",
        action_summary="Original legitimate action summary",
        payload={"field": "original_value"}
    )
    
    # Verify chain passes before tampering
    res_before = audit_chain.verify_chain(db)
    assert res_before["is_valid"] is True
    
    # Tamper with the record (simulate an attacker modifying the action_summary in the database)
    entry.action_summary = "TAMPERED FRAUDULENT ACTION SUMMARY"
    db.commit()
    
    # Verify chain now fails and pinpoints the corrupted record!
    res_after = audit_chain.verify_chain(db)
    assert res_after["is_valid"] is False
    assert res_after["broken_chain_index"] == entry.id
    assert "mismatch" in res_after["message"].lower() or "altered" in res_after["message"].lower()

    # Revert tampering to restore integrity
    entry.action_summary = "Original legitimate action summary"
    db.commit()
    db.close()

