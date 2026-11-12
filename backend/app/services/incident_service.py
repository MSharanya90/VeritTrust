import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import SecurityIncident, Notification, User, Agent
from app.schemas.schemas import SecurityIncidentCreate, SecurityIncidentUpdate
from app.security.audit_chain import audit_chain

class IncidentService:
    @staticmethod
    def get_all_incidents(db: Session, status: str = None, severity: str = None) -> List[SecurityIncident]:
        query = db.query(SecurityIncident)
        if status:
            query = query.filter(SecurityIncident.status == status)
        if severity:
            query = query.filter(SecurityIncident.severity == severity)
        return query.order_by(SecurityIncident.id.desc()).all()

    @staticmethod
    def get_incident_by_id(db: Session, incident_id: int) -> Optional[SecurityIncident]:
        return db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()

    @staticmethod
    def create_incident(
        db: Session,
        incident_in: SecurityIncidentCreate,
        actor_username: str = "system"
    ) -> SecurityIncident:
        # Generate unique incident number: INC-YYYY-NNNN
        year = datetime.datetime.utcnow().year
        count = db.query(SecurityIncident).count() + 1
        incident_number = f"INC-{year}-{count:04d}"

        incident = SecurityIncident(
            incident_number=incident_number,
            title=incident_in.title,
            description=incident_in.description,
            severity=incident_in.severity,
            status="OPEN",
            source_agent_id=incident_in.source_agent_id,
            action_id=incident_in.action_id,
            assigned_analyst_id=incident_in.assigned_analyst_id,
            investigation_notes=incident_in.investigation_notes,
            created_at=datetime.datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # Notify analysts
        notif = Notification(
            title=f"New Security Incident: {incident_number}",
            message=f"[{incident.severity}] {incident.title}",
            notification_type="INCIDENT_CREATED",
            severity="CRITICAL" if incident.severity in ["CRITICAL", "HIGH"] else "WARNING",
            link_url=f"/incidents",
            is_read=False
        )
        db.add(notif)
        db.commit()

        audit_chain.record_event(
            db=db,
            event_type="INCIDENT_CREATED",
            actor_type="SYSTEM" if actor_username == "system" else "USER",
            actor_id=actor_username,
            resource_type="INCIDENT",
            resource_id=incident_number,
            action_summary=f"Opened Security Incident {incident_number}: {incident.title}",
            payload={"incident_number": incident_number, "severity": incident.severity, "agent_id": incident.source_agent_id}
        )
        return incident

    @staticmethod
    def update_incident(
        db: Session,
        incident_id: int,
        update_in: SecurityIncidentUpdate,
        actor_username: str = "analyst"
    ) -> Optional[SecurityIncident]:
        incident = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
        if not incident:
            return None

        update_data = update_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(incident, field, value)

        if incident.status in ["RESOLVED", "FALSE_POSITIVE"] and not incident.resolved_at:
            incident.resolved_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(incident)

        audit_chain.record_event(
            db=db,
            event_type="INCIDENT_UPDATED",
            actor_type="USER",
            actor_id=actor_username,
            resource_type="INCIDENT",
            resource_id=incident.incident_number,
            action_summary=f"Updated incident {incident.incident_number} to status '{incident.status}'",
            payload=update_data
        )
        return incident

incident_service = IncidentService()

