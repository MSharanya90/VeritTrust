import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SecurityDetection, SecurityPolicy, User
from app.schemas.schemas import (
    ScanPromptRequest, ScanPromptResponse,
    DataLeakageScanRequest, DataLeakageScanResponse,
    AssessActionRequest, RiskAssessmentResponse
)
from app.security.injection_detector import injection_detector
from app.security.leakage_detector import leakage_detector
from app.security.risk_engine import risk_engine
from app.api.deps import get_current_user

router = APIRouter(prefix="/security", tags=["Security Cognitive Shield"])

@router.post("/scan-prompt", response_model=ScanPromptResponse)
def scan_prompt(
    req: ScanPromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = injection_detector.scan(req.prompt, context=req.context)
    
    # Record detection event
    detection = SecurityDetection(
        scan_type="PROMPT_INJECTION",
        input_text_snippet=req.prompt[:250],
        is_detected=result.is_injected,
        detection_type=result.detection_type,
        confidence_score=result.confidence_score,
        risk_level=result.risk_level,
        matched_patterns=json.dumps(result.matched_signatures),
        explanation=result.explanation
    )
    db.add(detection)
    db.commit()
    
    return result

@router.post("/scan-leakage", response_model=DataLeakageScanResponse)
def scan_leakage(
    req: DataLeakageScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = leakage_detector.scan(req.text, mask_result=req.mask_result)
    
    if result.has_leakage:
        detection = SecurityDetection(
            scan_type="DATA_LEAKAGE",
            input_text_snippet=result.masked_text[:250],
            is_detected=True,
            detection_type="DATA_LEAKAGE",
            confidence_score=95.0,
            risk_level=result.risk_level,
            matched_patterns=json.dumps([e.entity_type for e in result.entities]),
            explanation=result.explanation
        )
        db.add(detection)
        db.commit()
        
    return result

@router.post("/assess-action")
def assess_action(
    req: AssessActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active_policies = db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()
    assessment = risk_engine.evaluate_action(
        action_type=req.action_type,
        target_resource=req.target_resource,
        payload=req.payload,
        prompt_context=req.prompt_context,
        active_policies=active_policies
    )
    return assessment

@router.post("/analyze")
def unified_analyze(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = payload.get("text", "")
    injection_res = injection_detector.scan(text)
    leakage_res = leakage_detector.scan(text)
    
    combined_risk = max(injection_res.confidence_score, 85.0 if leakage_res.has_leakage else 0.0)
    verdict = "BLOCK" if combined_risk >= 70 else ("WARN" if combined_risk >= 30 else "PASS")
    
    return {
        "verdict": verdict,
        "combined_risk_score": round(combined_risk, 1),
        "prompt_injection": injection_res.model_dump(),
        "data_leakage": leakage_res.model_dump()
    }

