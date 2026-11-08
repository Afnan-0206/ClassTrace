"""
FastAPI Endpoint and Integration Tests for ClassTrace.
"""

import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "ClassTrace"


def test_config_status():
    response = client.get("/api/config/status")
    assert response.status_code == 200
    data = response.json()
    assert "gnani_configured" in data
    assert "supabase_configured" in data
    assert "active_database" in data


def test_list_lectures():
    response = client.get("/api/lectures")
    assert response.status_code == 200
    lectures = response.json()
    assert len(lectures) >= 1
    assert lectures[0]["title"] == "DSA Lecture 14: Recursion, Call Stack & Binary Tree Inorder Traversal"
    assert lectures[0]["segment_count"] == 8


def test_get_lecture_detail():
    lecture_id = "00000000-0000-4000-a000-000000000001"
    response = client.get(f"/api/lectures/{lecture_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == lecture_id
    assert len(data["segments"]) == 8
    assert data["segments"][0]["start_time"] == 0.0


def test_text_search_positive():
    payload = {
        "query": "Sir ne recursion ka base case kaise explain kiya tha?",
        "limit": 3
    }
    response = client.post("/api/search/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["has_sufficient_evidence"] is True
    assert len(data["results"]) > 0
    # Top result must be around the base case segment (32.0s - 65.0s)
    top_result = data["results"][0]
    assert top_result["start_time"] == 32.0
    assert "Base Case ya Base Condition" in top_result["transcript"]


def test_text_search_negative_control():
    payload = {
        "query": "Dynamic programming memoization table and bottom-up grid fill approach",
        "lecture_id": "00000000-0000-4000-a000-000000000001",
        "limit": 3
    }
    response = client.post("/api/search/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["has_sufficient_evidence"] is False
    assert len(data["results"]) == 0
    assert "No sufficiently relevant explanation" in data["message"]


def test_audio_stream():
    filename = "dsa_recursion_trees_lecture.wav"
    response = client.get(f"/api/audio/{filename}")
    assert response.status_code == 200
    assert response.headers["content-type"] in ["audio/wav", "audio/x-wav"]
    assert len(response.content) > 100000


def test_benchmark_endpoint():
    response = client.post("/api/benchmark/run")
    assert response.status_code == 200
    data = response.json()
    assert data["total_questions"] >= 15
    assert data["hit_at_1_rate"] >= 0.70
    assert data["hit_at_3_rate"] >= 0.90

