import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="analyst", nullable=False) # admin, analyst, compliance_officer, operator
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    approvals_reviewed = relationship("ApprovalRequest", back_populates="reviewer")
    incidents_assigned = relationship("SecurityIncident", back_populates="assigned_analyst")

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, index=True, nullable=False) # e.g. AGENT-FIN-01
    description = Column(Text, nullable=True)
    role_type = Column(String(50), default="EXECUTION") # RESEARCH, EXECUTION, GUARDIAN, PROVENANCE, COMPLIANCE
    status = Column(String(50), default="ACTIVE") # ACTIVE, IDLE, BLOCKED, UNDER_REVIEW
    current_trust_score = Column(Float, default=85.0)
    tasks_count = Column(Integer, default=0)
    threat_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    tasks = relationship("AgentTask", back_populates="agent", cascade="all, delete-orphan")
    actions = relationship("AgentAction", back_populates="agent")
    trust_history = relationship("TrustScoreHistory", back_populates="agent", cascade="all, delete-orphan")

class AgentTask(Base):
    __tablename__ = "agent_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, IN_PROGRESS, AWAITING_APPROVAL, COMPLETED, BLOCKED, FAILED
    orchestrator_state = Column(String(50), default="IDLE") # IDLE, RESEARCHING, ANALYZING_PROVENANCE, GUARDIAN_INSPECTION, AWAITING_APPROVAL, EXECUTING, COMPLETED
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    agent = relationship("Agent", back_populates="tasks")
    actions = relationship("AgentAction", back_populates="task")

class AgentAction(Base):
    __tablename__ = "agent_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("agent_tasks.id"), nullable=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    action_type = Column(String(100), nullable=False) # SEND_EMAIL, DATABASE_QUERY, DATABASE_MODIFICATION, API_CALL, FILE_SYSTEM_WRITE, FINANCIAL_TRANSFER, DOCUMENT_SHARE, SYSTEM_COMMAND
    target_resource = Column(String(255), nullable=False)
    payload = Column(Text, nullable=False)
    status = Column(String(50), default="PROPOSED") # PROPOSED, ASSESSED, AWAITING_APPROVAL, APPROVED, REJECTED, EXECUTED, BLOCKED
    risk_score = Column(Float, default=0.0)
    execution_result = Column(Text, nullable=True)
    simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)
    
    agent = relationship("Agent", back_populates="actions")
    task = relationship("AgentTask", back_populates="actions")
    risk_assessment = relationship("RiskAssessment", back_populates="action", uselist=False, cascade="all, delete-orphan")
    approval_request = relationship("ApprovalRequest", back_populates="action", uselist=False, cascade="all, delete-orphan")
    provenance_records = relationship("ProvenanceRecord", back_populates="action")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("agent_actions.id"), nullable=False, unique=True)
    overall_risk_score = Column(Float, nullable=False) # 0 - 100
    risk_level = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    data_sensitivity_score = Column(Float, default=0.0)
    permission_level_score = Column(Float, default=0.0)
    reversibility_score = Column(Float, default=0.0)
    external_comm_score = Column(Float, default=0.0)
    financial_impact_score = Column(Float, default=0.0)
    policy_violation_score = Column(Float, default=0.0)
    factor_breakdown = Column(Text, nullable=True) # JSON
    explanation = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=True) # JSON array
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    action = relationship("AgentAction", back_populates="risk_assessment")

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("agent_actions.id"), nullable=False, unique=True)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, MODIFIED, EXPIRED
    requested_by_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    risk_score = Column(Float, default=0.0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    action = relationship("AgentAction", back_populates="approval_request")
    reviewer = relationship("User", back_populates="approvals_reviewed")

class ProvenanceRecord(Base):
    __tablename__ = "provenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("agent_actions.id"), nullable=True)
    claim_or_decision = Column(Text, nullable=False)
    source_name = Column(String(255), nullable=False)
    source_url = Column(String(512), nullable=True)
    source_type = Column(String(100), default="DOCUMENT") # DOCUMENT, WEB, DATABASE, API, SYSTEM_PROMPT, USER_INPUT
    content_hash = Column(String(64), nullable=False) # SHA-256
    trust_score = Column(Float, default=90.0)
    verification_status = Column(String(50), default="VERIFIED") # VERIFIED, UNVERIFIED, POISONED_SUSPECT
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    action = relationship("AgentAction", back_populates="provenance_records")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="txt") # pdf, txt, md, json
    file_size = Column(Integer, default=0)
    content_hash = Column(String(64), nullable=False)
    is_poisoned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True) # vector stored as JSON array of floats
    token_count = Column(Integer, default=0)
    has_suspicious_payload = Column(Boolean, default=False)
    suspicious_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("Document", back_populates="chunks")

class SecurityPolicy(Base):
    __tablename__ = "security_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False) # DATA_PROTECTION, FINANCIAL_CONTROLS, SYSTEM_OPERATIONS, PROMPT_SAFETY, COMMUNICATION_RESTRICTION
    severity = Column(String(50), default="HIGH") # INFO, LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    rules_json = Column(Text, nullable=False) # structured JSON condition rules
    enforcement_mode = Column(String(50), default="ENFORCE") # ENFORCE, MONITOR_ONLY, DISABLED
    risk_penalty = Column(Float, default=25.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class SecurityIncident(Base):
    __tablename__ = "security_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN") # OPEN, INVESTIGATING, CONTAINED, RESOLVED, FALSE_POSITIVE
    source_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    action_id = Column(Integer, ForeignKey("agent_actions.id"), nullable=True)
    assigned_analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    investigation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    assigned_analyst = relationship("User", back_populates="incidents_assigned")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String(100), index=True, nullable=False)
    actor_type = Column(String(50), nullable=False) # USER, AGENT, SYSTEM
    actor_id = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False)
    action_summary = Column(Text, nullable=False)
    payload_hash = Column(String(64), nullable=False)
    previous_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False, unique=True, index=True)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(100), default="SECURITY_ALERT") # SECURITY_ALERT, APPROVAL_REQUIRED, INCIDENT_CREATED, POLICY_VIOLATION, AGENT_STATUS_CHANGE
    severity = Column(String(50), default="INFO") # INFO, WARNING, CRITICAL
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TrustScoreHistory(Base):
    __tablename__ = "trust_score_history"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Float, nullable=False)
    delta = Column(Float, default=0.0)
    reason = Column(String(255), nullable=False)
    
    agent = relationship("Agent", back_populates="trust_history")

class SecurityDetection(Base):
    __tablename__ = "security_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_type = Column(String(100), nullable=False) # PROMPT_INJECTION, DATA_LEAKAGE, JAILBREAK, RAG_POISONING
    input_text_snippet = Column(Text, nullable=False)
    is_detected = Column(Boolean, default=False)
    detection_type = Column(String(100), nullable=False)
    confidence_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="LOW")
    matched_patterns = Column(Text, nullable=True) # JSON
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

