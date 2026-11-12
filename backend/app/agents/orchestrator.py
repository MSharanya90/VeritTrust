import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Agent, AgentTask, AgentAction, RiskAssessment, ApprovalRequest,
    ProvenanceRecord, SecurityPolicy
)
from app.schemas.schemas import MultiAgentRunResponse, AgentStepLog, RiskAssessmentResponse
from app.security.injection_detector import injection_detector
from app.security.leakage_detector import leakage_detector
from app.security.risk_engine import risk_engine
from app.security.audit_chain import audit_chain
from app.services.provenance_service import provenance_service
from app.services.approval_service import approval_service

class MultiAgentOrchestrator:
    """
    Central Orchestrator enforcing the Cognitive Shield Architecture.
    Coordinates Research, Provenance, Security Guardian, Compliance, and Execution Agents.
    The Security Guardian acts as a mandatory non-bypassable barrier before Execution.
    """

    @classmethod
    def run_pipeline(
        cls,
        db: Session,
        user_task: str,
        target_system: str = "Production Internal Network",
        require_strict_compliance: bool = True
    ) -> MultiAgentRunResponse:
        steps: List[AgentStepLog] = []
        now = datetime.datetime.utcnow()
        
        def add_step(agent: str, role: str, state: str, msg: str, details: Dict[str, Any] = None):
            steps.append(
                AgentStepLog(
                    agent_name=agent,
                    agent_role=role,
                    state=state,
                    message=msg,
                    details=details,
                    timestamp=datetime.datetime.utcnow().strftime("%H:%M:%S.%f")[:-3]
                )
            )

        # 0. Initialize Task
        execution_agent = db.query(Agent).filter(Agent.role_type == "EXECUTION").first()
        if not execution_agent:
            execution_agent = Agent(name="Primary Autonomous Worker", code="AGENT-EXEC-01", role_type="EXECUTION", status="ACTIVE")
            db.add(execution_agent)
            db.commit()
            db.refresh(execution_agent)

        task = AgentTask(
            agent_id=execution_agent.id,
            title=f"Task: {user_task[:40]}...",
            prompt=user_task,
            status="IN_PROGRESS",
            orchestrator_state="RESEARCHING",
            started_at=now
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        add_step("Orchestrator Core", "COORDINATOR", "INITIALIZED", f"Dispatched new workflow task #{task.id}: '{user_task}'")

        # Step 1: Research Agent
        add_step("Research Agent", "RESEARCH", "RESEARCHING", "Querying internal document indexes and synthesizing grounding context.")
        # Detect if task itself has adversarial hints
        scan_prompt_res = injection_detector.scan(user_task)
        has_prompt_threat = scan_prompt_res.is_injected
        
        research_context = f"Internal enterprise knowledge base checked for: {user_task}."
        if has_prompt_threat:
            add_step("Research Agent", "RESEARCH", "WARNING", f"Suspicious tokens observed in prompt context: {scan_prompt_res.detection_type}")

        # Step 2: Provenance Agent
        add_step("Provenance Agent", "PROVENANCE", "ANALYZING_PROVENANCE", "Establishing cryptographic content provenance and lineage hashes.")
        source_hash = provenance_service.calculate_hash(research_context)
        add_step(
            "Provenance Agent", "PROVENANCE", "VERIFIED",
            f"Grounding content anchored with SHA-256 hash: {source_hash[:16]}...",
            {"content_hash": source_hash, "trust_score": 92.0}
        )

        # Determine proposed action based on user task
        action_type = "API_CALL"
        target_res = target_system
        payload = {"instruction": user_task, "target": target_system}
        
        task_lower = user_task.lower()
        if any(w in task_lower for w in ["email", "send mail", "dispatch message"]):
            action_type = "SEND_EMAIL"
            target_res = "external-partner@corp-partner.com"
            payload = {"recipient": target_res, "subject": "Automated Summary", "body": user_task}
        elif any(w in task_lower for w in ["transfer", "wire", "pay", "send money", "dollar", "$"]):
            action_type = "FINANCIAL_TRANSFER"
            target_res = "Swift/ACH Gateway (US-FEDWIRE-9821)"
            payload = {"amount": 7500.0, "recipient_account": "ACC-99281726", "memo": user_task}
        elif any(w in task_lower for w in ["database", "sql", "select", "drop", "update", "table"]):
            action_type = "DATABASE_MODIFICATION" if any(w in task_lower for w in ["drop", "delete", "update", "truncate"]) else "DATABASE_QUERY"
            target_res = "prod-customer-db.internal:5432"
            payload = {"query": f"/* Task Generated */ {user_task}"}
        elif any(w in task_lower for w in ["file", "disk", "write", "save", "overwrite"]):
            action_type = "FILE_SYSTEM_WRITE"
            target_res = "/var/data/enterprise_export.json"
            payload = {"file_path": target_res, "mode": "write_overwrite"}

        # Record proposed action in DB
        action = AgentAction(
            task_id=task.id,
            agent_id=execution_agent.id,
            action_type=action_type,
            target_resource=target_res,
            payload=json.dumps(payload),
            status="PROPOSED",
            risk_score=0.0,
            simulated=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        # Attach provenance record
        prov_record = ProvenanceRecord(
            action_id=action.id,
            claim_or_decision=f"Agent planned {action_type} on {target_res} based on prompt '{user_task}'",
            source_name="MultiAgent Orchestrator Pipeline",
            source_type="SYSTEM_PROMPT",
            content_hash=source_hash,
            trust_score=90.0,
            verification_status="VERIFIED"
        )
        db.add(prov_record)
        db.commit()

        # Step 3: Security Guardian Agent Interception
        add_step("Security Guardian Agent", "GUARDIAN", "GUARDIAN_INSPECTION", f"Intercepted proposed action {action_type}. Performing cognitive shielding checks.")
        
        # Guardian runs Risk Engine
        active_policies = db.query(SecurityPolicy).filter(SecurityPolicy.is_active == True).all()
        risk_result = risk_engine.evaluate_action(
            action_type=action_type,
            target_resource=target_res,
            payload=payload,
            prompt_context=user_task,
            active_policies=active_policies
        )
        
        action.risk_score = risk_result["overall_risk_score"]
        
        # Persist RiskAssessment
        assessment = RiskAssessment(
            action_id=action.id,
            overall_risk_score=risk_result["overall_risk_score"],
            risk_level=risk_result["risk_level"],
            data_sensitivity_score=risk_result["data_sensitivity_score"],
            permission_level_score=risk_result["permission_level_score"],
            reversibility_score=risk_result["reversibility_score"],
            external_comm_score=risk_result["external_comm_score"],
            financial_impact_score=risk_result["financial_impact_score"],
            policy_violation_score=risk_result["policy_violation_score"],
            factor_breakdown=risk_result["factor_breakdown"],
            explanation=risk_result["explanation"],
            recommendations=risk_result["recommendations"]
        )
        db.add(assessment)
        db.commit()

        add_step(
            "Security Guardian Agent", "GUARDIAN", "RISK_ASSESSED",
            f"Risk Score: {risk_result['overall_risk_score']}/100 [{risk_result['risk_level']}]. Reason: {risk_result['explanation'][:160]}...",
            {"risk_score": risk_result["overall_risk_score"], "risk_level": risk_result["risk_level"]}
        )

        # Step 4: Compliance Agent
        add_step("Compliance Agent", "COMPLIANCE", "POLICY_AUDITING", "Validating operation against enterprise baseline policies.")
        if risk_result["policy_violation_score"] > 0:
            add_step("Compliance Agent", "COMPLIANCE", "NON_COMPLIANT", "Identified policy friction points or restriction matches.")
        else:
            add_step("Compliance Agent", "COMPLIANCE", "COMPLIANT", "Operation aligns with data governance and authorization policies.")

        # Step 5: Decision Gate (Human-In-The-Loop vs Autonomous Execution)
        requires_approval = risk_result["requires_approval"]
        
        if requires_approval:
            task.orchestrator_state = "AWAITING_APPROVAL"
            task.status = "AWAITING_APPROVAL"
            action.status = "AWAITING_APPROVAL"
            db.commit()
            
            # Dispatch approval request
            app_req = approval_service.create_approval_request(
                db=db,
                action_id=action.id,
                agent_id=execution_agent.id,
                risk_score=risk_result["overall_risk_score"]
            )
            
            add_step(
                "Cognitive Shield Barrier", "BARRIER", "HALTED",
                f"Action HALTED! Risk score ({risk_result['overall_risk_score']}/100) requires mandatory Human Authorization. Pending Approval Request #{app_req.id}.",
                {"approval_request_id": app_req.id, "action_id": action.id}
            )
            
            final_status = "AWAITING_APPROVAL"
            exec_res = f"Execution blocked pending human approval (Request #{app_req.id})."
        elif has_prompt_threat and risk_result["risk_level"] == "CRITICAL":
            task.orchestrator_state = "BLOCKED"
            task.status = "BLOCKED"
            action.status = "BLOCKED"
            db.commit()
            
            add_step("Security Guardian Agent", "GUARDIAN", "BLOCKED", "Hostile prompt injection payload detected. Execution permanently blocked and quarantined.")
            final_status = "BLOCKED"
            exec_res = "Execution blocked by Cognitive Shield: hostile injection quarantined."
        else:
            # Low / Medium risk: Allowed autonomous execution
            task.orchestrator_state = "EXECUTING"
            add_step("Execution Agent", "EXECUTION", "EXECUTING", f"Autonomous execution authorized for safe action {action_type}.")
            
            action.status = "EXECUTED"
            action.executed_at = datetime.datetime.utcnow()
            action.execution_result = f"Simulated execution of {action_type} against {target_res} succeeded within sandbox constraints."
            
            task.orchestrator_state = "COMPLETED"
            task.status = "COMPLETED"
            task.completed_at = datetime.datetime.utcnow()
            
            execution_agent.tasks_count += 1
            db.commit()
            
            add_step("Execution Agent", "EXECUTION", "COMPLETED", f"Operation successfully dispatched: {action.execution_result}")
            final_status = "COMPLETED"
            exec_res = action.execution_result

        audit_chain.record_event(
            db=db,
            event_type="ORCHESTRATION_PIPELINE_RUN",
            actor_type="AGENT",
            actor_id=str(execution_agent.id),
            resource_type="TASK",
            resource_id=str(task.id),
            action_summary=f"Orchestration pipeline finished with status '{final_status}' (Action #{action.id}, Risk: {action.risk_score})",
            payload={"task_id": task.id, "action_id": action.id, "status": final_status, "risk_score": action.risk_score}
        )

        return MultiAgentRunResponse(
            task_id=task.id,
            final_status=final_status,
            orchestrator_state=task.orchestrator_state,
            action_proposed={
                "id": action.id,
                "type": action.action_type,
                "target": action.target_resource,
                "payload": payload
            },
            risk_assessment=RiskAssessmentResponse.model_validate(assessment),
            approval_required=requires_approval,
            execution_result=exec_res,
            steps=steps
        )

orchestrator = MultiAgentOrchestrator()

