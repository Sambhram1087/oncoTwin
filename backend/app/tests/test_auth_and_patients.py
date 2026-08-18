import os
import sys

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
        os.remove("./test_oncotwin.db")


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
