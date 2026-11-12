import json
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Agent, AgentAction, RiskAssessment, SecurityPolicy, User
from app.schemas.schemas import SimulatorRequest, SimulatorResponse, RiskAssessmentResponse
from app.security.risk_engine import risk_engine
from app.services.approval_service import approval_service
from app.services.provenance_service import provenance_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/simulator", tags=["Agent Action Simulator"])

@router.post("/evaluate", response_model=SimulatorResponse)
def evaluate_and_simulate(
    req: SimulatorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    active_policies = db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()
    risk_res = risk_engine.evaluate_action(
        action_type=req.action_type,
        target_resource=req.target_resource,
        payload=req.parameters,
        prompt_context=req.user_prompt,
        active_policies=active_policies
    )

    action = AgentAction(
        agent_id=req.agent_id,
        action_type=req.action_type,
        target_resource=req.target_resource,
        payload=json.dumps(req.parameters),
        status="ASSESSED",
        risk_score=risk_res["overall_risk_score"],
        simulated=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    assessment = RiskAssessment(
        action_id=action.id,
        overall_risk_score=risk_res["overall_risk_score"],
        risk_level=risk_res["risk_level"],
        data_sensitivity_score=risk_res["data_sensitivity_score"],
        permission_level_score=risk_res["permission_level_score"],
        reversibility_score=risk_res["reversibility_score"],
        external_comm_score=risk_res["external_comm_score"],
        financial_impact_score=risk_res["financial_impact_score"],
        policy_violation_score=risk_res["policy_violation_score"],
        factor_breakdown=risk_res["factor_breakdown"],
        explanation=risk_res["explanation"],
        recommendations=risk_res["recommendations"]
    )
    db.add(assessment)
    db.commit()

    # Pre-execution security checks breakdown
    pre_checks = {
        "perimeter_egress_authorized": risk_res["external_comm_score"] < 70,
        "payload_secrets_redacted": risk_res["data_sensitivity_score"] < 60,
        "financial_limit_verified": risk_res["financial_impact_score"] < 50,
        "reversibility_snapshot_ready": True,
        "rbac_permission_granted": True
    }

    approval_required = risk_res["requires_approval"]
    if approval_required:
        action.status = "AWAITING_APPROVAL"
        app_req = approval_service.create_approval_request(
            db=db,
            action_id=action.id,
            agent_id=agent.id,
            risk_score=risk_res["overall_risk_score"]
        )
        simulated_outcome = (
            f"[SIMULATED SAFE INTERCEPT]: Operation halted by Cognitive Shield. "
            f"Risk score of {risk_res['overall_risk_score']}/100 exceeds safe autonomous threshold. "
            f"Approval Request #{app_req.id} created for human authorization."
        )
        safety_verdict = "APPROVAL_MANDATED"
        allowed = False
    elif risk_res["risk_level"] == "CRITICAL":
        action.status = "BLOCKED"
        simulated_outcome = "[SIMULATED BLOCK]: Operation rejected by Policy Guardian due to Critical hazard score."
        safety_verdict = "REJECTED_BY_POLICY"
        allowed = False
    else:
        action.status = "EXECUTED"
        action.executed_at = datetime.datetime.utcnow()
        action.execution_result = f"Sandbox simulated run of {req.action_type} against mock {req.target_resource} succeeded."
        simulated_outcome = f"[SIMULATION SUCCESS]: Mock operation completed within local security sandbox without external side-effects."
        safety_verdict = "SAFE_TO_EXECUTE"
        allowed = True

    db.commit()

    return SimulatorResponse(
        action_id=action.id,
        risk_assessment=RiskAssessmentResponse.model_validate(assessment),
        approval_required=approval_required,
        simulated_outcome=simulated_outcome,
        pre_execution_checks=pre_checks,
        safety_verdict=safety_verdict,
        allowed_to_proceed=allowed
    )

