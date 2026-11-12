from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.services.analytics_service import analytics_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/export")
def export_report(
    report_type: str = "actions",
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if format == "csv":
        csv_data = analytics_service.export_csv_report(db, report_type)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=veritrust_{report_type}_report.csv"}
        )
    else:
        overview = analytics_service.get_overview(db)
        return {"report_type": report_type, "generated_at": overview}
