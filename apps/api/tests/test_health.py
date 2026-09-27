from fastapi.testclient import TestClient
from app.main import app


def test_health():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_provider_catalog_is_extensible():
    response = TestClient(app).get("/api/v1/providers")
    ids = {item["id"] for item in response.json()["providers"]}
    assert {"youtube", "zdf", "ard", "arte"} <= ids
