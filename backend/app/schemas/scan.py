from pydantic import BaseModel
from datetime import datetime
from typing import Any


class ScanResponse(BaseModel):
    id: int
    patient_id: int
    modality: str
    original_filename: str
    visit_label: str | None
    created_at: datetime
    job_id: int | None = None

    class Config:
        from_attributes = True


class JobResponse(BaseModel):
    id: int
    scan_id: int
    status: str
    progress: int
    result: dict[str, Any] | None
    error: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
