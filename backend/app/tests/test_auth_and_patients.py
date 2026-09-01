import os
import sys
import io

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

os.environ["DATABASE_URL"] = "sqlite:///./test_oncotwin.db"

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def cleanup():
    yield
    if os.path.exists("./test_oncotwin.db"):
        try:
            os.remove("./test_oncotwin.db")
        except OSError:
            pass


def _signup_and_login(email="doctor@example.com", password="supersecret123"):
    client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "full_name": "Dr. Test"},
    )
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_signup_and_login():
    token = _signup_and_login("signup_test@example.com")
    assert token

    res = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["email"] == "signup_test@example.com"


def test_login_wrong_password():
    client.post(
        "/api/v1/auth/signup",
        json={"email": "wrongpass@example.com", "password": "correctpass123"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "incorrect"},
    )
    assert res.status_code == 401


def test_patient_crud_flow():
    token = _signup_and_login("patient_flow@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/patients",
        json={"mrn": "MRN-001", "full_name": "Jane Doe", "sex": "F"},
        headers=headers,
    )
    assert create_res.status_code == 201
    patient_id = create_res.json()["id"]

    list_res = client.get("/api/v1/patients", headers=headers)
    assert list_res.status_code == 200
    assert any(p["id"] == patient_id for p in list_res.json())

    update_res = client.put(
        f"/api/v1/patients/{patient_id}",
        json={"diagnosis": "Glioblastoma"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["diagnosis"] == "Glioblastoma"

    delete_res = client.delete(f"/api/v1/patients/{patient_id}", headers=headers)
    assert delete_res.status_code == 204

    get_res = client.get(f"/api/v1/patients/{patient_id}", headers=headers)
    assert get_res.status_code == 404


def test_patients_require_auth():
    res = client.get("/api/v1/patients")
    assert res.status_code == 401


def test_scan_upload_and_job_flow():
    token = _signup_and_login("upload_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a patient
    p_res = client.post(
        "/api/v1/patients",
        json={"mrn": "MRN-UPLOAD-01", "full_name": "Upload Patient", "sex": "M"},
        headers=headers,
    )
    assert p_res.status_code == 201
    patient_id = p_res.json()["id"]

    # 2. Upload scan
    fake_nii_content = b"Simulated NIfTI header and data"
    file_obj = io.BytesIO(fake_nii_content)

    upload_res = client.post(
        f"/api/v1/patients/{patient_id}/scans",
        headers=headers,
        data={"modality": "FLAIR", "visit_label": "Baseline"},
        files={"file": ("test_brain.nii", file_obj, "application/octet-stream")},
    )
    assert upload_res.status_code == 201
    job = upload_res.json()
    assert job["id"] is not None
    job_id = job["id"]

    # 3. Get job details
    job_res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert job_res.status_code == 200
    assert job_res.json()["scan_id"] is not None

    # 4. List scans for patient
    scans_res = client.get(f"/api/v1/patients/{patient_id}/scans", headers=headers)
    assert scans_res.status_code == 200
    scans = scans_res.json()
    assert len(scans) == 1
    assert scans[0]["original_filename"] == "test_brain.nii"

    # 5. Invalid file type validation
    invalid_file = io.BytesIO(b"text data")
    invalid_res = client.post(
        f"/api/v1/patients/{patient_id}/scans",
        headers=headers,
        data={"modality": "T1"},
        files={"file": ("report.pdf", invalid_file, "application/pdf")},
    )
    assert invalid_res.status_code == 400
    assert "Unsupported file type" in invalid_res.json()["detail"]
