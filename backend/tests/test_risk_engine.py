from app.security.risk_engine import risk_engine

def test_low_risk_action():
    result = risk_engine.evaluate_action(
        action_type="SEND_EMAIL",
        target_resource="support@internal.corp.net",
        payload={"subject": "Meeting notes", "body": "Summary of today's sync."},
        prompt_context="Please send the meeting notes."
    )
    assert result["overall_risk_score"] < 60.0
    assert result["requires_approval"] is False

def test_high_risk_financial_transfer():
    result = risk_engine.evaluate_action(
        action_type="FINANCIAL_TRANSFER",
        target_resource="ACH Gateway 9928172",
        payload={"amount": 15000.0, "currency": "USD", "recipient": "External Vendor Corp"},
        prompt_context="Transfer fifteen thousand dollars to vendor."
    )
    assert result["overall_risk_score"] >= 60.0
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
    assert result["requires_approval"] is True
    assert result["financial_impact_score"] >= 80.0

def test_critical_database_destruction():
    result = risk_engine.evaluate_action(
        action_type="DATABASE_MODIFICATION",
        target_resource="prod-postgres-primary.corp",
        payload={"query": "DROP TABLE production_customers CASCADE;"},
        prompt_context="Remove legacy customer table from production."
    )
    assert result["overall_risk_score"] >= 75.0
    assert result["reversibility_score"] >= 90.0
    assert result["requires_approval"] is True

