from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class Scan(Base):
    """A single uploaded MRI timepoint for a patient (a Digital Twin timepoint)."""

    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    modality = Column(String, default="T1")  # T1 | T1ce | T2 | FLAIR
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    visit_label = Column(String, nullable=True)  # e.g. "Baseline", "3-month follow-up"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="scans")
    job = relationship("Job", back_populates="scan", uselist=False, cascade="all, delete-orphan")


class Job(Base):
    """Background AI-processing job created for a Scan upload."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    status = Column(String, default="queued")  # queued | running | complete | failed
    progress = Column(Integer, default=0)  # 0-100
    result = Column(JSON, nullable=True)  # segmentation/volume/confidence/radiomics
    error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    scan = relationship("Scan", back_populates="job")
