from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import SecurityIncidentCreate, SecurityIncidentUpdate, SecurityIncidentResponse
from app.services.incident_service import incident_service
from app.api.deps import get_current_user, require_analyst

router = APIRouter(prefix="/incidents", tags=["Security Incidents"])

@router.get("", response_model=List[SecurityIncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return incident_service.get_all_incidents(db, status=status, severity=severity)

@router.post("", response_model=SecurityIncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: SecurityIncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    return incident_service.create_incident(db, incident_in, actor_username=current_user.username)

@router.get("/{incident_id}", response_model=SecurityIncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inc = incident_service.get_incident_by_id(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.put("/{incident_id}", response_model=SecurityIncidentResponse)
def update_incident(
    incident_id: int,
    update_in: SecurityIncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    inc = incident_service.update_incident(db, incident_id, update_in, actor_username=current_user.username)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

