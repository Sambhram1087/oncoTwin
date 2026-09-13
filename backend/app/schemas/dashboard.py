from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class DashboardStats(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    total_patients: int
    total_scans: int
    completed_jobs: int
    pending_jobs: int
    failed_jobs: int
    avg_processing_time_ms: int | None
    model_version: str | None


class RecentActivityItem(BaseModel):
    id: int
    patient_id: int
    patient_mrn: str
    patient_name: str
    modality: str
    status: str
    volume_ml: float | None
    confidence: float | None
    created_at: datetime


class RecentActivityResponse(BaseModel):
    activities: list[RecentActivityItem]


class ChartDataPoint(BaseModel):
    name: str
    value: int


class AnalyticsData(BaseModel):
    volume_distribution: list[ChartDataPoint]
    modality_breakdown: list[ChartDataPoint]
    confidence_histogram: list[ChartDataPoint]
