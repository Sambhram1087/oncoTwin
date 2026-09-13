from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any


class ScanResponse(BaseModel):
    id: int
    patient_id: int
    modality: str
    original_filename: str
    visit_label: str | None
    file_size_bytes: int | None = None
    created_at: datetime
    job_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class JobResponse(BaseModel):
    id: int
    scan_id: int
    status: str
    progress: int
    result: dict[str, Any] | None
    error: str | None
    processing_duration_ms: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
