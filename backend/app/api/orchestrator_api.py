from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import MultiAgentRunRequest, MultiAgentRunResponse
from app.agents.orchestrator import orchestrator
from app.api.deps import get_current_user

router = APIRouter(prefix="/orchestrator", tags=["Multi-Agent Orchestration"])

@router.post("/run", response_model=MultiAgentRunResponse)
def run_multi_agent_pipeline(
    req: MultiAgentRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return orchestrator.run_pipeline(
        db=db,
        user_task=req.user_task,
        target_system=req.target_system or "Production Internal Network",
        require_strict_compliance=req.require_strict_compliance
    )

