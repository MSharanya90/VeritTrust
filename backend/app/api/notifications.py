from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Returns global or user-specific notifications
    notifs = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    ).order_by(Notification.id.desc()).limit(limit).all()
    return notifs

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "success", "id": notification_id}

@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

