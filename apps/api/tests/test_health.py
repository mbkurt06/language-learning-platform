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


def test_analyze_routes_through_platform_api(monkeypatch):
    expected = {"text": "Wir lernen Deutsch.", "sentence_meaning_tr": "Almanca öğreniyoruz."}

    def fake_analyze_text(source_language, text):
        assert source_language == "de"
        assert text == "Wir lernen Deutsch."
        return expected

    monkeypatch.setattr("app.main.analyze_text", fake_analyze_text)
    response = TestClient(app).post(
        "/api/v1/analyze",
        json={
            "source_language": "de",
            "target_language": "tr",
            "text": "Wir lernen Deutsch.",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"analysis": expected}
