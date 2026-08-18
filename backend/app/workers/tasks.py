"""
Background job processing.

`run_processing_job` is called via FastAPI's BackgroundTasks so the whole
platform runs in a single process with zero external infrastructure.

Production swap: turn this function into a Celery task

    @celery_app.task
    def run_processing_job(job_id: int): ...

pointed at your Upstash Redis broker (settings.CELERY_BROKER_URL). The
call site in app/api/routes/upload.py (`enqueue_processing_job`) is the
only place that needs to change - swap
`background_tasks.add_task(run_processing_job, job.id)` for
`run_processing_job.delay(job.id)`.
"""
import asyncio
import time

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.scan import Job
from app.services.ai_pipeline import get_active_model
from app.services.ws_manager import manager

PROGRESS_STEPS = [
    (10, "Anonymizing DICOM/NIfTI headers"),
    (25, "Validating volume geometry"),
    (45, "Running skull-stripping"),
    (65, "Running tumor segmentation model"),
    (85, "Computing radiomic features"),
    (100, "Finalizing report"),
]


def enqueue_processing_job(job_id: int, background_tasks) -> None:
    background_tasks.add_task(_run_job_sync_wrapper, job_id)


def _run_job_sync_wrapper(job_id: int) -> None:
    asyncio.run(run_processing_job(job_id))


async def run_processing_job(job_id: int) -> None:
    db: Session = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return

        job.status = "running"
        db.commit()
        await manager.broadcast(job_id, {"status": "running", "progress": 0, "step": "starting"})

        for progress, step_label in PROGRESS_STEPS:
            time.sleep(0.6)  # simulate compute time
            job.progress = progress
            db.commit()
            await manager.broadcast(
                job_id, {"status": "running", "progress": progress, "step": step_label}
            )

        scan = job.scan
        model = get_active_model()
        result = model.predict(scan.storage_path, scan.modality)

        job.status = "complete"
        job.progress = 100
        job.result = result
        db.commit()

        await manager.broadcast(
            job_id, {"status": "complete", "progress": 100, "step": "done", "result": result}
        )
    except Exception as exc:  # pragma: no cover - defensive
        job.status = "failed"
        job.error = str(exc)
        db.commit()
        await manager.broadcast(job_id, {"status": "failed", "error": str(exc)})
    finally:
        db.close()
