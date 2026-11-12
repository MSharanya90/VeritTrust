import json
from typing import Dict, Any, List, Tuple
from app.security.injection_detector import injection_detector
from app.security.leakage_detector import leakage_detector

class RiskScoringEngine:
    """
    Configurable Multi-Factor Risk Assessment & Explainable AI Engine.
    Scores proposed AI agent actions from 0-100 across 6 security dimensions.
    """
    
    ACTION_PERMISSION_MAP = {
        "DATABASE_QUERY": 30.0,
        "DATABASE_MODIFICATION": 80.0,
        "SEND_EMAIL": 75.0,
        "API_CALL": 65.0,
        "FILE_SYSTEM_WRITE": 85.0,
        "FINANCIAL_TRANSFER": 95.0,
        "DOCUMENT_SHARE": 60.0,
        "SYSTEM_COMMAND": 95.0
    }
    
    ACTION_REVERSIBILITY_MAP = {
        "DATABASE_QUERY": 10.0,
        "DATABASE_MODIFICATION": 75.0,
        "SEND_EMAIL": 95.0, # Emails cannot be unsent
        "API_CALL": 60.0,
        "FILE_SYSTEM_WRITE": 70.0,
        "FINANCIAL_TRANSFER": 95.0, # Wire transfers are hard to reverse
        "DOCUMENT_SHARE": 85.0,
        "SYSTEM_COMMAND": 90.0
    }
    
    ACTION_EXTERNAL_COMM_MAP = {
        "DATABASE_QUERY": 15.0,
        "DATABASE_MODIFICATION": 15.0,
        "SEND_EMAIL": 90.0,
        "API_CALL": 80.0,
        "FILE_SYSTEM_WRITE": 20.0,
        "FINANCIAL_TRANSFER": 85.0,
        "DOCUMENT_SHARE": 85.0,
        "SYSTEM_COMMAND": 50.0
    }

    def evaluate_action(
        self,
        action_type: str,
        target_resource: str,
        payload: Dict[str, Any],
        prompt_context: str = None,
        active_policies: List[Any] = None
    ) -> Dict[str, Any]:
        
        payload_str = json.dumps(payload) if isinstance(payload, dict) else str(payload)
        
        # 1. Permission Level Score
        base_perm = self.ACTION_PERMISSION_MAP.get(action_type, 50.0)
        if any(keyword in target_resource.lower() for keyword in ["prod", "production", "root", "admin", "master", "finance"]):
            base_perm = min(100.0, base_perm + 20.0)
        permission_score = base_perm
        
        # 2. Action Reversibility Score
        reversibility_score = self.ACTION_REVERSIBILITY_MAP.get(action_type, 50.0)
        is_destructive_db = any(w in payload_str.lower() for w in ["drop", "truncate", "delete from", "cascade"])
        if is_destructive_db:
            reversibility_score = 100.0
            permission_score = max(permission_score, 95.0)

        # 3. External Communication Score
        external_comm_score = self.ACTION_EXTERNAL_COMM_MAP.get(action_type, 20.0)
        if "external" in target_resource.lower() or "@" in target_resource or "http" in target_resource:
            external_comm_score = max(external_comm_score, 85.0)

        # 4. Data Sensitivity Score (Scanning for leakage & high-risk keywords)
        leakage_result = leakage_detector.scan(payload_str)
        sensitivity_score = 10.0
        if leakage_result.has_leakage:
            if leakage_result.risk_level == "CRITICAL":
                sensitivity_score = 95.0
            elif leakage_result.risk_level == "HIGH":
                sensitivity_score = 80.0
            else:
                sensitivity_score = 55.0
        elif any(term in payload_str.lower() for term in ["ssn", "password", "salary", "balance", "credit_card", "secret"]):
            sensitivity_score = 65.0

        # 5. Financial Impact Score
        financial_amount = 0.0
        for key in ["amount", "value", "cost", "sum", "funds", "transfer_amount"]:
            if isinstance(payload, dict) and key in payload:
                try:
                    financial_amount = float(payload[key])
                except (ValueError, TypeError):
                    pass
        
        if action_type == "FINANCIAL_TRANSFER" or financial_amount > 0:
            if financial_amount > 5000:
                financial_score = 95.0
            elif financial_amount > 1000:
                financial_score = 75.0
            elif financial_amount > 100:
                financial_score = 50.0
            else:
                financial_score = 30.0
        else:
            financial_score = 5.0

        # 6. Prompt Injection Check on Prompt Context & Payload
        injection_result = injection_detector.scan(prompt_context or "", context=payload_str)
        injection_penalty = 0.0
        if injection_result.is_injected:
            injection_penalty = 80.0 if injection_result.risk_level in ["CRITICAL", "HIGH"] else 45.0

        # 7. Policy Violations Check
        policy_violation_score = 0.0
        violated_policies = []
        if is_destructive_db:
            policy_violation_score += 65.0
            violated_policies.append("BASELINE_LOCK: Destructive DDL command (DROP/TRUNCATE) detected")
        if active_policies:
            for pol in active_policies:
                if not getattr(pol, "is_active", True):
                    continue
                rules = getattr(pol, "rules_json", "{}")
                if isinstance(rules, str):
                    try:
                        rules = json.loads(rules)
                    except Exception:
                        rules = {}
                
                # Check restricted operations rule
                restricted_ops = rules.get("restricted_operations", [])
                if action_type in restricted_ops:
                    policy_violation_score += getattr(pol, "risk_penalty", 30.0)
                    violated_policies.append(f"{pol.code}: {pol.name} (Restricted Action {action_type})")
                    
                # Check max financial transfer rule
                max_allowed = rules.get("max_financial_amount", None)
                if max_allowed is not None and financial_amount > float(max_allowed):
                    policy_violation_score += getattr(pol, "risk_penalty", 30.0)
                    violated_policies.append(f"{pol.code}: {pol.name} (Exceeds max allowed ${max_allowed})")
                    
                # Check forbidden target patterns
                forbidden_targets = rules.get("forbidden_targets", [])
                for ft in forbidden_targets:
                    if ft.lower() in target_resource.lower():
                        policy_violation_score += getattr(pol, "risk_penalty", 35.0)
                        violated_policies.append(f"{pol.code}: {pol.name} (Target matches {ft})")
                        
        policy_violation_score = min(100.0, policy_violation_score + injection_penalty)

        # Weighted calculation
        overall_risk_score = (
            0.20 * sensitivity_score +
            0.15 * permission_score +
            0.20 * reversibility_score +
            0.15 * external_comm_score +
            0.15 * financial_score +
            0.15 * policy_violation_score
        )
        
        if is_destructive_db:
            overall_risk_score = max(overall_risk_score, 85.0)

        overall_risk_score = round(min(100.0, max(0.0, overall_risk_score)), 2)

        # Categorize
        if overall_risk_score >= 80.0:
            risk_level = "CRITICAL"
        elif overall_risk_score >= 60.0:
            risk_level = "HIGH"
        elif overall_risk_score >= 30.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Explainability & Recommendations
        reasons = []
        recommendations = []

        if sensitivity_score >= 60:
            reasons.append(f"High data sensitivity: contains {leakage_result.leak_count} detected confidential artifacts or sensitive keywords.")
            recommendations.append("Apply automated data masking or redact sensitive fields before proceeding.")

        if financial_score >= 50:
            reasons.append(f"Substantial financial impact: transaction involves ${financial_amount:,.2f}.")
            recommendations.append("Mandate multi-party cryptographic authorization for financial disbursements exceeding threshold.")

        if reversibility_score >= 70:
            reasons.append(f"Irreversible operational impact: '{action_type}' cannot be cleanly rolled back once executed.")
            recommendations.append("Require designated human reviewer sign-off and generate verified pre-state backup snapshot.")

        if external_comm_score >= 70:
            reasons.append(f"External perimeter communication towards '{target_resource}'.")
            recommendations.append("Verify recipient whitelist and validate TLS certificate pin before dispatch.")

        if injection_result.is_injected:
            reasons.append(f"Prompt injection alert: {injection_result.explanation}")
            recommendations.append("Isolate session, purge conversation history, and alert security operations.")

        if violated_policies:
            reasons.append(f"Violated enterprise security policies: {'; '.join(violated_policies)}.")
            recommendations.append("Align operation payload with organization compliance guidelines.")

        if not reasons:
            explanation = f"Standard {action_type} operation within safe baseline limits. Low risk to enterprise integrity."
            recommendations.append("Proceed under standard autonomous execution policy with routine audit logging.")
        else:
            explanation = " | ".join(reasons)

        factor_breakdown = {
            "data_sensitivity": sensitivity_score,
            "permission_level": permission_score,
            "reversibility": reversibility_score,
            "external_communication": external_comm_score,
            "financial_impact": financial_score,
            "policy_violation": policy_violation_score
        }

        return {
            "overall_risk_score": overall_risk_score,
            "risk_level": risk_level,
            "data_sensitivity_score": sensitivity_score,
            "permission_level_score": permission_score,
            "reversibility_score": reversibility_score,
            "external_comm_score": external_comm_score,
            "financial_impact_score": financial_score,
            "policy_violation_score": policy_violation_score,
            "factor_breakdown": json.dumps(factor_breakdown),
            "explanation": explanation,
            "recommendations": json.dumps(recommendations),
            "requires_approval": overall_risk_score >= 60.0,
            "requires_critical_quarantine": overall_risk_score >= 80.0
        }

risk_engine = RiskScoringEngine()
