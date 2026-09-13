from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.scan import Scan, Job
from app.models.patient import Patient
from app.schemas.dashboard import DashboardStats, RecentActivityResponse, RecentActivityItem
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get overall statistics for the current clinician's dashboard."""
    # Count only this clinician's patients
    total_patients = (
        db.query(func.count(Patient.id))
        .filter(Patient.owner_id == current_user.id)
        .scalar() or 0
    )

    # Count scans belonging to this clinician's patients
    total_scans = (
        db.query(func.count(Scan.id))
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.owner_id == current_user.id)
        .scalar() or 0
    )

    # Job status breakdown for this clinician's jobs only
    jobs = (
        db.query(Job.status, func.count(Job.id))
        .join(Scan, Job.scan_id == Scan.id)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.owner_id == current_user.id)
        .group_by(Job.status)
        .all()
    )
    status_counts = {status: count for status, count in jobs}

    completed_jobs = status_counts.get("complete", 0)
    pending_jobs = status_counts.get("queued", 0) + status_counts.get("running", 0)
    failed_jobs = status_counts.get("failed", 0)

    # Average processing time for completed jobs
    avg_processing_time = (
        db.query(func.avg(Job.processing_duration_ms))
        .join(Scan, Job.scan_id == Scan.id)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.owner_id == current_user.id, Job.status == "complete", Job.processing_duration_ms.isnot(None))
        .scalar()
    )

    # Latest model version from the most recent completed job
    latest_job = (
        db.query(Job)
        .join(Scan, Job.scan_id == Scan.id)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.owner_id == current_user.id, Job.status == "complete")
        .order_by(Job.updated_at.desc())
        .first()
    )
    model_version = None
    if latest_job and latest_job.result:
        model_version = latest_job.result.get("model_version")

    return DashboardStats(
        total_patients=total_patients,
        total_scans=total_scans,
        completed_jobs=completed_jobs,
        pending_jobs=pending_jobs,
        failed_jobs=failed_jobs,
        avg_processing_time_ms=int(avg_processing_time) if avg_processing_time else None,
        model_version=model_version or "oncotwin-v1.0"
    )


@router.get("/recent-activity", response_model=RecentActivityResponse)
def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent scan analysis activity for the current clinician only."""
    recent_jobs = (
        db.query(Job, Scan, Patient)
        .join(Scan, Job.scan_id == Scan.id)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.owner_id == current_user.id)
        .order_by(Job.created_at.desc())
        .limit(limit)
        .all()
    )

    activities = []
    for job, scan, patient in recent_jobs:
        volume = None
        confidence = None
        if job.result:
            volume = job.result.get("tumor_volume_ml")
            confidence = job.result.get("confidence")

        activities.append(
            RecentActivityItem(
                id=job.id,
                patient_id=patient.id,
                patient_mrn=patient.mrn,
                patient_name=patient.full_name,
                modality=scan.modality,
                status=job.status,
                volume_ml=volume,
                confidence=confidence,
                created_at=job.created_at
            )
        )

    return RecentActivityResponse(activities=activities)

