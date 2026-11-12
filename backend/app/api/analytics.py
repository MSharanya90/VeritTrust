from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.services.analytics_service import analytics_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Security Analytics"])

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_overview(db)

@router.get("/threats")
def get_threat_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_threat_metrics(db)

@router.get("/agents")
def get_agent_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_agent_analytics(db)

