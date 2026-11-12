from app.security.leakage_detector import leakage_detector

def test_detect_and_mask_api_key():
    text = "Connecting with client key sk-proj-1234567890abcdef1234567890 to OpenAI server."
    result = leakage_detector.scan(text, mask_result=True)
    assert result.has_leakage is True
    assert result.risk_level in ["CRITICAL", "HIGH"]
    assert "sk-" in result.masked_text
    assert "••••" in result.masked_text
    assert "1234567890abcdef1234567890" not in result.masked_text

def test_detect_aws_credentials():
    text = "Deploying to AWS using access key AKIAIOSFODNN7EXAMPLE and secret."
    result = leakage_detector.scan(text)
    assert result.has_leakage is True
    assert any(e.entity_type == "API_KEY_AWS" for e in result.entities)

def test_detect_pii_email_and_ssn():
    text = "Customer record: email john.doe@example.com and SSN 123-45-6789."
    result = leakage_detector.scan(text)
    assert result.has_leakage is True
    assert result.leak_count >= 2
    assert "j•••@example.com" in result.masked_text or "•••" in result.masked_text

def test_clean_text_no_leakage():
    text = "The quarterly system uptime was 99.98% across all cloud availability regions."
    result = leakage_detector.scan(text)
    assert result.has_leakage is False
    assert result.risk_level == "LOW"
    assert result.masked_text == text

