from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mrn = Column(String, unique=True, index=True, nullable=False)  # medical record no.
    full_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    sex = Column(String, nullable=True)
    diagnosis = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    scans = relationship("Scan", back_populates="patient", cascade="all, delete-orphan")
