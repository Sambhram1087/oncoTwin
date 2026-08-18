from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.scan import Scan, Job
from app.schemas.scan import ScanResponse, JobResponse
from app.services.storage import save_upload, validate_upload_filename
from app.services.ws_manager import manager
from app.workers.tasks import enqueue_processing_job

router = APIRouter(prefix="/api/v1", tags=["upload"])


@router.post("/patients/{patient_id}/scans", response_model=JobResponse, status_code=201)
async def upload_scan(
    patient_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    modality: str = Form(default="T1"),
    visit_label: str = Form(default="Baseline"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.owner_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not validate_upload_filename(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: .nii, .nii.gz, .zip",
        )

    storage_path = await save_upload(file, patient_id)

    scan = Scan(
        patient_id=patient_id,
        modality=modality,
        original_filename=file.filename,
        storage_path=storage_path,
        visit_label=visit_label,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    job = Job(scan_id=scan.id, status="queued", progress=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    enqueue_processing_job(job.id, background_tasks)

    return job


@router.get("/patients/{patient_id}/scans", response_model=list[ScanResponse])
def list_scans(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.owner_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    scans = (
        db.query(Scan)
        .filter(Scan.patient_id == patient_id)
        .order_by(Scan.created_at.asc())
        .all()
    )
    results = []
    for scan in scans:
        item = ScanResponse.model_validate(scan)
        item.job_id = scan.job.id if scan.job else None
        results.append(item)
    return results


@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.websocket("/ws/jobs/{job_id}")
async def job_progress_ws(websocket: WebSocket, job_id: int):
    await manager.connect(job_id, websocket)
    try:
        while True:
            # Client doesn't need to send anything; this just keeps the
            # connection alive and lets the server push updates.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(job_id, websocket)
