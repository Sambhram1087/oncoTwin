from pydantic import BaseModel
from datetime import datetime


class PatientCreate(BaseModel):
    mrn: str
    full_name: str
    date_of_birth: str | None = None
    sex: str | None = None
    diagnosis: str | None = None
    notes: str | None = None


class PatientUpdate(BaseModel):
    full_name: str | None = None
    date_of_birth: str | None = None
    sex: str | None = None
    diagnosis: str | None = None
    notes: str | None = None


class PatientResponse(BaseModel):
    id: int
    mrn: str
    full_name: str
    date_of_birth: str | None
    sex: str | None
    diagnosis: str | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True
