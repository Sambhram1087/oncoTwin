from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.scan import Scan, Job
from app.schemas.dashboard import ChartDataPoint
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/volume-distribution", response_model=list[ChartDataPoint])
def get_volume_distribution(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get tumor volume distribution data for charts."""
    # We'll pull all completed jobs and bucket them in Python for simplicity
    # In a real high-scale app, we'd do this in SQL
    completed_jobs = db.query(Job.result).filter(Job.status == "complete").all()
    
    # Define buckets
    buckets = {
        "< 5mL": 0,
        "5-15mL": 0,
        "15-30mL": 0,
        "30-50mL": 0,
        "> 50mL": 0
    }
    
    for (result,) in completed_jobs:
        if not result:
            continue
        vol = result.get("tumor_volume_ml")
        if vol is None:
            continue
            
        if vol < 5:
            buckets["< 5mL"] += 1
        elif vol < 15:
            buckets["5-15mL"] += 1
        elif vol < 30:
            buckets["15-30mL"] += 1
        elif vol < 50:
            buckets["30-50mL"] += 1
        else:
            buckets["> 50mL"] += 1
            
    return [ChartDataPoint(name=k, value=v) for k, v in buckets.items()]


@router.get("/modality-breakdown", response_model=list[ChartDataPoint])
def get_modality_breakdown(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get scan counts by modality."""
    results = db.query(Scan.modality, func.count(Scan.id)).group_by(Scan.modality).all()
    return [ChartDataPoint(name=modality, value=count) for modality, count in results]


@router.get("/confidence-histogram", response_model=list[ChartDataPoint])
def get_confidence_histogram(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get AI confidence score distribution."""
    completed_jobs = db.query(Job.result).filter(Job.status == "complete").all()
    
    buckets = {
        "< 80%": 0,
        "80-90%": 0,
        "90-95%": 0,
        "> 95%": 0
    }
    
    for (result,) in completed_jobs:
        if not result:
            continue
        conf = result.get("confidence")
        if conf is None:
            continue
            
        if conf < 0.80:
            buckets["< 80%"] += 1
        elif conf < 0.90:
            buckets["80-90%"] += 1
        elif conf < 0.95:
            buckets["90-95%"] += 1
        else:
            buckets["> 95%"] += 1
            
    return [ChartDataPoint(name=k, value=v) for k, v in buckets.items()]
