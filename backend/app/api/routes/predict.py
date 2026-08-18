from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.scan import Job
from app.services.ai_pipeline import simulate_growth

router = APIRouter(prefix="/api/v1/predict", tags=["predict"])


@router.get("/{job_id}")
def predict_growth(
    job_id: int,
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.result:
        raise HTTPException(status_code=404, detail="Completed job not found")

    current_volume = job.result.get("tumor_volume_ml", 0)
    return simulate_growth(current_volume, days)
