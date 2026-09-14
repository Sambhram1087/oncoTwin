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
    Query,
)
from fastapi.responses import StreamingResponse
import io
import numpy as np
from PIL import Image
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
    job = (
        db.query(Job)
        .join(Scan, Job.scan_id == Scan.id)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Job.id == job_id, Patient.owner_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/preview")
def get_scan_preview(
    job_id: int,
    axis: str = Query(default="axial"),
    slice_position: int = Query(default=50, ge=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(Job)
        .join(Scan, Job.scan_id == Scan.id)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Job.id == job_id, Patient.owner_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    try:
        import nibabel as nib

        data = np.asarray(nib.load(job.scan.storage_path).dataobj, dtype=np.float32)
        if data.ndim == 4:
            data = data[..., 0]
        if data.ndim != 3:
            raise ValueError("Expected a 3D NIfTI volume")

        axis_map = {"sagittal": 0, "coronal": 1, "axial": 2}
        if axis not in axis_map:
            raise ValueError("Axis must be axial, coronal, or sagittal")
        axis_index = axis_map[axis]
        source_index = round((data.shape[axis_index] - 1) * slice_position / 100)
        slice_data = np.take(data, source_index, axis=axis_index)
        slice_data = np.rot90(slice_data)
        finite = slice_data[np.isfinite(slice_data)]
        if finite.size == 0:
            raise ValueError("Scan contains no finite voxel values")
        low, high = np.percentile(finite, [1, 99])
        if high <= low:
            high = low + 1
        normalized = np.clip((slice_data - low) / (high - low), 0, 1)
        image = Image.fromarray((normalized * 255).astype(np.uint8), mode="L")
        output = io.BytesIO()
        image.save(output, format="PNG", optimize=True)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="image/png",
            headers={
                "Cache-Control": "no-store",
                "X-Volume-Shape": "x".join(str(d) for d in data.shape),
                "X-Slice-Axis": axis,
                "X-Slice-Position": str(slice_position),
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Unable to render NIfTI preview: {exc}") from exc


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
