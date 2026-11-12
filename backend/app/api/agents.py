from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Agent, User, TrustScoreHistory
from app.schemas.schemas import AgentCreate, AgentUpdate, AgentResponse, TrustScoreHistoryItem
from app.services.agent_service import agent_service
from app.api.deps import get_current_user, require_admin

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return agent_service.get_all_agents(db)

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = agent_service.get_agent_by_code(db, agent_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An agent with code '{agent_in.code}' already exists."
        )
    return agent_service.create_agent(db, agent_in)

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = agent_service.get_agent_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: int,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = agent_service.update_agent(db, agent_id, agent_in)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.get("/{agent_id}/activities")
def get_agent_activities(agent_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent = agent_service.get_agent_by_id(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent_service.get_agent_activities(db, agent_id)

@router.get("/{agent_id}/trust-history", response_model=List[TrustScoreHistoryItem])
def get_agent_trust_history(agent_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(TrustScoreHistory).filter(
        TrustScoreHistory.agent_id == agent_id
    ).order_by(TrustScoreHistory.id.desc()).limit(30).all()
    return history

