import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Agent, AgentTask, AgentAction, TrustScoreHistory
from app.schemas.schemas import AgentCreate, AgentUpdate
from app.security.audit_chain import audit_chain

class AgentService:
    @staticmethod
    def get_all_agents(db: Session) -> List[Agent]:
        return db.query(Agent).order_by(Agent.id.asc()).all()

    @staticmethod
    def get_agent_by_id(db: Session, agent_id: int) -> Optional[Agent]:
        return db.query(Agent).filter(Agent.id == agent_id).first()

    @staticmethod
    def get_agent_by_code(db: Session, code: str) -> Optional[Agent]:
        return db.query(Agent).filter(Agent.code == code).first()

    @staticmethod
    def create_agent(db: Session, agent_in: AgentCreate) -> Agent:
        agent = Agent(
            name=agent_in.name,
            code=agent_in.code,
            description=agent_in.description,
            role_type=agent_in.role_type,
            status=agent_in.status,
            current_trust_score=85.0,
            tasks_count=0,
            threat_count=0
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        # Initial trust history entry
        history_entry = TrustScoreHistory(
            agent_id=agent.id,
            score=agent.current_trust_score,
            delta=0.0,
            reason="Initial baseline trust score assignment upon agent provisioning"
        )
        db.add(history_entry)
        db.commit()
        
        audit_chain.record_event(
            db=db,
            event_type="AGENT_CREATED",
            actor_type="SYSTEM",
            actor_id="admin",
            resource_type="AGENT",
            resource_id=str(agent.id),
            action_summary=f"Provisioned AI Agent {agent.name} ({agent.code})",
            payload={"name": agent.name, "role_type": agent.role_type, "code": agent.code}
        )
        return agent

    @staticmethod
    def update_agent(db: Session, agent_id: int, agent_in: AgentUpdate) -> Optional[Agent]:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return None
        
        update_data = agent_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(agent, field, value)
        
        agent.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def update_trust_score(db: Session, agent_id: int, delta: float, reason: str) -> Optional[Agent]:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return None
        
        old_score = agent.current_trust_score
        new_score = round(max(0.0, min(100.0, old_score + delta)), 2)
        agent.current_trust_score = new_score
        
        # If trust score plummets severely, place agent under review or block
        if new_score < 40.0 and agent.status == "ACTIVE":
            agent.status = "UNDER_REVIEW"
        elif new_score < 25.0:
            agent.status = "BLOCKED"
            
        history_entry = TrustScoreHistory(
            agent_id=agent.id,
            score=new_score,
            delta=delta,
            reason=reason
        )
        db.add(history_entry)
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def get_agent_activities(db: Session, agent_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        actions = db.query(AgentAction).filter(AgentAction.agent_id == agent_id).order_by(AgentAction.id.desc()).limit(limit).all()
        activities = []
        for action in actions:
            activities.append({
                "action_id": action.id,
                "action_type": action.action_type,
                "target_resource": action.target_resource,
                "status": action.status,
                "risk_score": action.risk_score,
                "simulated": action.simulated,
                "created_at": action.created_at,
                "risk_level": action.risk_assessment.risk_level if action.risk_assessment else "LOW"
            })
        return activities

agent_service = AgentService()

