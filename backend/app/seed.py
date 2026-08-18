"""
Seed the local database with a demo clinician, a couple of patients, and
sample genomic JSON data for manual testing / demos.

Run with:  python -m app.seed
"""
import json
import os

from app.db.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.patient import Patient
from app.core.security import hash_password
import app.models  # noqa: F401

SAMPLE_GENOMIC_JSON = {
    "patient_mrn": "MRN-DEMO-001",
    "sequencing_platform": "Illumina NovaSeq 6000",
    "variants": [
        {"gene": "IDH1", "mutation": "R132H", "vaf": 0.42, "significance": "pathogenic"},
        {"gene": "TP53", "mutation": "R273H", "vaf": 0.38, "significance": "pathogenic"},
        {"gene": "MGMT", "mutation": "promoter_methylated", "vaf": None, "significance": "prognostic"},
        {"gene": "EGFR", "mutation": "amplification", "vaf": 0.15, "significance": "likely_pathogenic"},
    ],
    "tumor_mutational_burden": 4.2,
    "microsatellite_status": "stable",
}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
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
        ]

        for p in sample_patients:
            existing = db.query(Patient).filter(Patient.mrn == p["mrn"]).first()
            if not existing:
                db.add(Patient(**p, owner_id=demo_user.id))
        db.commit()
        print(f"Seeded {len(sample_patients)} demo patients.")

        os.makedirs("./sample_data", exist_ok=True)
        genomic_path = "./sample_data/sample_genomic.json"
        with open(genomic_path, "w") as f:
            json.dump(SAMPLE_GENOMIC_JSON, f, indent=2)
        print(f"Wrote sample genomic JSON to {genomic_path}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
