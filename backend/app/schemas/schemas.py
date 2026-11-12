import datetime
from typing import List, Optional, Dict, Any, Union
import pydantic
from pydantic import BaseModel, EmailStr, Field

# Ensure backward/forward compatibility between Pydantic v1 and v2
if not hasattr(pydantic.BaseModel, "model_dump"):
    pydantic.BaseModel.model_dump = pydantic.BaseModel.dict
if not hasattr(pydantic.BaseModel, "model_validate"):
    pydantic.BaseModel.model_validate = classmethod(
        lambda cls, obj: cls.from_orm(obj) if hasattr(obj, "__dict__") and not isinstance(obj, dict) else cls.parse_obj(obj)
    )

# ----------------- User & Auth Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "analyst"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

# ----------------- Agent Schemas -----------------
class AgentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    role_type: str = "EXECUTION"
    status: str = "ACTIVE"

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    role_type: Optional[str] = None

class TrustScoreHistoryItem(BaseModel):
    timestamp: datetime.datetime
    score: float
    delta: float
    reason: str
    
    class Config:
        orm_mode = True

class AgentResponse(AgentBase):
    id: int
    current_trust_score: float
    tasks_count: int
    threat_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    class Config:
        orm_mode = True

# ----------------- Agent Task & Action Schemas -----------------
class AgentTaskCreate(BaseModel):
    agent_id: int
    title: str
    prompt: str

class AgentTaskResponse(BaseModel):
    id: int
    agent_id: int
    title: str
    prompt: str
    status: str
    orchestrator_state: str
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    
    class Config:
        orm_mode = True

class AgentActionCreate(BaseModel):
    agent_id: int
    task_id: Optional[int] = None
    action_type: str
    target_resource: str
    payload: Union[str, Dict[str, Any]]
    simulated: bool = True

class RiskAssessmentResponse(BaseModel):
    id: int
    action_id: int
    overall_risk_score: float
    risk_level: str
    data_sensitivity_score: float
    permission_level_score: float
    reversibility_score: float
    external_comm_score: float
    financial_impact_score: float
    policy_violation_score: float
    factor_breakdown: Optional[str] = None
    explanation: str
    recommendations: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class ApprovalRequestResponse(BaseModel):
    id: int
    action_id: int
    status: str
    requested_by_agent_id: int
    reviewer_id: Optional[int] = None
    reviewer_notes: Optional[str] = None
    risk_score: float
    expires_at: datetime.datetime
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    action_type: Optional[str] = None
    target_resource: Optional[str] = None
    agent_name: Optional[str] = None
    payload: Optional[str] = None
    
    class Config:
        orm_mode = True

class ApprovalDecisionRequest(BaseModel):
    decision: str = "APPROVED"
    notes: Optional[str] = ""
    modified_payload: Optional[str] = None

class AgentActionResponse(BaseModel):
    id: int
    task_id: Optional[int] = None
    agent_id: int
    action_type: str
    target_resource: str
    payload: str
    status: str
    risk_score: float
    execution_result: Optional[str] = None
    simulated: bool
    created_at: datetime.datetime
    executed_at: Optional[datetime.datetime] = None
    risk_assessment: Optional[RiskAssessmentResponse] = None
    approval_request: Optional[ApprovalRequestResponse] = None
    
    class Config:
        orm_mode = True

# ----------------- Provenance Schemas -----------------
class ProvenanceRecordCreate(BaseModel):
    action_id: Optional[int] = None
    claim_or_decision: str
    source_name: str
    source_url: Optional[str] = None
    source_type: str = "DOCUMENT"
    content_hash: Optional[str] = None
    trust_score: float = 90.0
    verification_status: str = "VERIFIED"
    metadata_json: Optional[str] = None

class ProvenanceRecordResponse(BaseModel):
    id: int
    action_id: Optional[int] = None
    claim_or_decision: str
    source_name: str
    source_url: Optional[str] = None
    source_type: str
    content_hash: str
    trust_score: float
    verification_status: str
    metadata_json: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

# ----------------- Security Scanning Schemas -----------------
class HighlightSpan(BaseModel):
    start: int
    end: int
    text: str
    label: str
    category: str

class ScanPromptRequest(BaseModel):
    prompt: str
    agent_id: Optional[int] = None
    context: Optional[str] = None

class ScanPromptResponse(BaseModel):
    is_injected: bool
    risk_level: str
    confidence_score: float
    detection_type: str
    matched_signatures: List[str]
    highlighted_spans: List[HighlightSpan]
    explanation: str
    recommended_action: str

class DataLeakageScanRequest(BaseModel):
    text: str
    mask_result: bool = True

class LeakedEntity(BaseModel):
    entity_type: str
    original_value: str
    masked_value: str
    start: int
    end: int
    confidence: float

class DataLeakageScanResponse(BaseModel):
    has_leakage: bool
    leak_count: int
    risk_level: str
    entities: List[LeakedEntity]
    masked_text: str
    explanation: str

class AssessActionRequest(BaseModel):
    agent_id: int
    action_type: str
    target_resource: str
    payload: Dict[str, Any]
    prompt_context: Optional[str] = None

# ----------------- Policies Schemas -----------------
class SecurityPolicyCreate(BaseModel):
    name: str
    code: str
    category: str
    severity: str = "HIGH"
    description: Optional[str] = None
    rules_json: Union[str, Dict[str, Any]]
    enforcement_mode: str = "ENFORCE"
    risk_penalty: float = 25.0
    is_active: bool = True

class SecurityPolicyUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    rules_json: Optional[Union[str, Dict[str, Any]]] = None
    enforcement_mode: Optional[str] = None
    risk_penalty: Optional[float] = None
    is_active: Optional[bool] = None

class SecurityPolicyResponse(BaseModel):
    id: int
    name: str
    code: str
    category: str
    severity: str
    description: Optional[str] = None
    rules_json: str
    enforcement_mode: str
    risk_penalty: float
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    class Config:
        orm_mode = True

# ----------------- Incidents Schemas -----------------
class SecurityIncidentCreate(BaseModel):
    title: str
    description: str
    severity: str = "HIGH"
    source_agent_id: Optional[int] = None
    action_id: Optional[int] = None
    assigned_analyst_id: Optional[int] = None
    investigation_notes: Optional[str] = None

class SecurityIncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_analyst_id: Optional[int] = None
    investigation_notes: Optional[str] = None

class SecurityIncidentResponse(BaseModel):
    id: int
    incident_number: str
    title: str
    description: str
    severity: str
    status: str
    source_agent_id: Optional[int] = None
    action_id: Optional[int] = None
    assigned_analyst_id: Optional[int] = None
    investigation_notes: Optional[str] = None
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    
    class Config:
        orm_mode = True

# ----------------- Audit Schemas -----------------
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    event_type: str
    actor_type: str
    actor_id: str
    resource_type: str
    resource_id: str
    action_summary: str
    payload_hash: str
    previous_hash: str
    entry_hash: str
    
    class Config:
        orm_mode = True

class AuditVerificationResponse(BaseModel):
    is_valid: bool
    total_records: int
    verified_records: int
    broken_chain_index: Optional[int] = None
    message: str

# ----------------- RAG Schemas -----------------
class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    token_count: int
    has_suspicious_payload: bool
    suspicious_details: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_type: str
    file_size: int
    content_hash: str
    is_poisoned: bool
    chunks_count: Optional[int] = 0
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 4
    agent_id: Optional[int] = None

class RAGQueryCitation(BaseModel):
    document_id: int
    chunk_id: int
    document_title: str
    snippet: str
    similarity_score: float
    influence_weight: float
    is_poisoned: bool
    poison_warning: Optional[str] = None

class RAGQueryResponse(BaseModel):
    query: str
    synthesized_answer: str
    citations: List[RAGQueryCitation]
    contains_poisoned_source: bool
    security_verdict: str
    provenance_hash: str

# ----------------- Notifications -----------------
class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    notification_type: str
    severity: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

# ----------------- Simulator Schemas -----------------
class SimulatorRequest(BaseModel):
    agent_id: int
    action_type: str
    target_resource: str
    parameters: Dict[str, Any]
    user_prompt: Optional[str] = None

class SimulatorResponse(BaseModel):
    action_id: int
    risk_assessment: RiskAssessmentResponse
    approval_required: bool
    simulated_outcome: str
    pre_execution_checks: Dict[str, Any]
    safety_verdict: str
    allowed_to_proceed: bool

# ----------------- Multi-Agent Orchestration Schemas -----------------
class MultiAgentRunRequest(BaseModel):
    user_task: str
    target_system: Optional[str] = "Production Internal Network"
    require_strict_compliance: bool = True

class AgentStepLog(BaseModel):
    agent_name: str
    agent_role: str
    state: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str

class MultiAgentRunResponse(BaseModel):
    task_id: int
    final_status: str
    orchestrator_state: str
    action_proposed: Optional[Dict[str, Any]] = None
    risk_assessment: Optional[RiskAssessmentResponse] = None
    approval_required: bool
    execution_result: Optional[str] = None
    steps: List[AgentStepLog]
