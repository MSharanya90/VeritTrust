from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import ProvenanceRecordResponse, ProvenanceRecordCreate
from app.services.provenance_service import provenance_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/provenance", tags=["Provenance & Source Tracking"])

@router.get("", response_model=List[ProvenanceRecordResponse])
def get_provenance_records(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return provenance_service.get_all_records(db, limit)

@router.get("/{record_id}", response_model=ProvenanceRecordResponse)
def get_provenance_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = provenance_service.get_record_by_id(db, record_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Provenance record not found")
    return rec

@router.get("/action/{action_id}")
def get_action_lineage(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lineage = provenance_service.get_action_lineage(db, action_id)
    return lineage

@router.post("", response_model=ProvenanceRecordResponse)
def create_provenance_record(
    record_in: ProvenanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return provenance_service.record_provenance(db, record_in)

