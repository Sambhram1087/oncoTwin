"""
Seed the local database with a demo clinician, a couple of patients, and
sample genomic JSON data for manual testing / demos.

Run with:  python -m app.seed
"""
import json
import os
import random
from datetime import datetime, timedelta

from app.db.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.patient import Patient
from app.models.scan import Scan, Job
from app.core.security import hash_password
from app.ml.train import train_model
from app.ml.model import _model_exists
import app.models  # noqa: F401


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Ensure a trained model exists
        if not _model_exists():
            print("No trained ML model found. Training a fresh model for the demo...")
            train_model(n_samples=200, seed=42)
            print("Model training complete.")

        # 2. Create demo user
        demo_user = db.query(User).filter(User.email == "demo@oncotwin.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@oncotwin.ai",
                hashed_password=hash_password("demopassword123"),
                full_name="Dr. Demo Clinician",
                role="clinician",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("Created demo user: demo@oncotwin.ai / demopassword123")

        # 3. Create patients
        sample_patients = [
            {
                "mrn": "MRN-DEMO-001",
                "full_name": "Alex Rivera",
                "date_of_birth": "1978-04-12",
                "sex": "M",
                "diagnosis": "Glioblastoma, WHO Grade IV",
                "notes": "Post-surgical resection, undergoing radiotherapy.",
            },
            {
                "mrn": "MRN-DEMO-002",
                "full_name": "Priya Nair",
                "date_of_birth": "1990-11-02",
                "sex": "F",
                "diagnosis": "Low-grade astrocytoma, WHO Grade II",
                "notes": "Under active surveillance, imaging every 3 months.",
            },
            {
                "mrn": "MRN-DEMO-003",
                "full_name": "Robert Chen",
                "date_of_birth": "1965-08-23",
                "sex": "M",
                "diagnosis": "Oligodendroglioma, IDH-mutant",
                "notes": "Responding well to temozolomide.",
            },
            {
                "mrn": "MRN-DEMO-004",
                "full_name": "Sarah Jenkins",
                "date_of_birth": "1982-01-15",
                "sex": "F",
                "diagnosis": "Meningioma, Grade I",
                "notes": "Asymptomatic, incidental finding.",
            },
            {
                "mrn": "MRN-DEMO-005",
                "full_name": "David Miller",
                "date_of_birth": "1955-06-30",
                "sex": "M",
                "diagnosis": "Glioblastoma, IDH-wildtype",
                "notes": "Recurrent disease, evaluating clinical trial options.",
            },
        ]

        patients_created = []
        for p in sample_patients:
            existing = db.query(Patient).filter(Patient.mrn == p["mrn"]).first()
            if not existing:
                patient = Patient(**p, owner_id=demo_user.id)
                db.add(patient)
                db.flush()
                patients_created.append(patient)
            else:
                patients_created.append(existing)
                
        db.commit()
        print(f"Ensured {len(sample_patients)} demo patients exist.")

        # 4. Create sample scans and jobs for dashboard stats
        existing_scans = db.query(Scan).count()
        if existing_scans < 3:
            print("Creating sample scans and jobs for dashboard...")
            modalities = ["T1", "T1ce", "T2", "FLAIR"]
            
            # Use the active model to generate realistic mock results
            from app.services.ai_pipeline import get_active_model
            model = get_active_model()
            
            for i, patient in enumerate(patients_created):
                # 1-3 scans per patient
                num_scans = random.randint(1, 3)
                for j in range(num_scans):
                    scan = Scan(
                        patient_id=patient.id,
                        modality=random.choice(modalities),
                        original_filename=f"brain_mri_{patient.mrn}_{j}.nii.gz",
                        storage_path="/dev/null",  # dummy path
                        file_size_bytes=random.randint(5_000_000, 25_000_000),
                        visit_label=f"Month {j*3} Follow-up" if j > 0 else "Baseline",
                        created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90))
                    )
                    db.add(scan)
                    db.flush()
                    
                    # Create job
                    is_complete = random.random() > 0.1  # 90% complete
                    status = "complete" if is_complete else "queued"
                    
                    result = None
                    if is_complete:
                        # Generate result using the pipeline
                        result = model.predict("dummy.nii.gz", scan.modality)
                        
                    job = Job(
                        scan_id=scan.id,
                        status=status,
                        progress=100 if is_complete else 0,
                        result=result,
                        processing_duration_ms=random.randint(2500, 8000) if is_complete else None,
                        created_at=scan.created_at,
                        updated_at=scan.created_at + timedelta(minutes=random.randint(1, 10))
                    )
                    db.add(job)
                    
            db.commit()
            print("Created sample scans and jobs.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
