"""
Test Suite for Live Classroom Recording & Storage API (/api/lectures/record)
Verifies:
1. Acceptance of live-recorded classroom audio
2. Audio conversion and standardization with FFmpeg
3. Persistent storage into SQLite database
4. Real-time indexing of captured live speech segments with vector embeddings
5. Immediate queryability of the recorded lecture through hybrid retrieval
"""

import io
import json
import wave
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import db


def generate_test_wav_bytes(duration_seconds: float = 2.0, sample_rate: int = 16000) -> bytes:
    """Generate in-memory PCM 16kHz mono WAV audio bytes for testing."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        num_frames = int(duration_seconds * sample_rate)
        # 16-bit silence
        data = b"\x00\x00" * num_frames
        wf.writeframes(data)
    return buf.getvalue()


@pytest.mark.anyio
async def test_live_class_recording_pipeline():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        wav_bytes = generate_test_wav_bytes(duration_seconds=3.0)

        live_segments = [
            {
                "start_time": 0.0,
                "end_time": 1.5,
                "transcript": "Aaj hum dynamic programming me memoization table seekhenge.",
                "speaker": "Teacher",
            },
            {
                "start_time": 1.5,
                "end_time": 3.0,
                "transcript": "Subproblems ko cache karne se recursive calls exponential se linear time ho jaate hain.",
                "speaker": "Teacher",
            },
        ]

        files = {
            "file": ("live_class_lecture.wav", wav_bytes, "audio/wav")
        }
        data = {
            "title": "DSA Live: Dynamic Programming & Memoization",
            "language_code": "indic-auto",
            "segments_json": json.dumps(live_segments),
        }

        response = await client.post("/api/lectures/record", files=files, data=data)
        assert response.status_code == 200, f"Recording failed: {response.text}"

        res_json = response.json()
        assert res_json["success"] is True
        lecture = res_json["lecture"]
        lecture_id = lecture["id"]

        assert lecture["title"] == "DSA Live: Dynamic Programming & Memoization"
        assert lecture["status"] == "COMPLETED"
        assert lecture["duration_seconds"] > 0
        assert lecture["segment_count"] == 2

        # Verify segments exist in database
        saved_segs = await db.get_all_segments(lecture_id)
        assert len(saved_segs) == 2
        assert "memoization" in saved_segs[0]["transcript"].lower()

        # Verify that questions can immediately search and find this newly recorded class
        search_res = await client.post(
            "/api/search/text",
            json={
                "query": "Sir ne memoization table ke baare me kya bataya?",
                "lecture_id": lecture_id,
                "limit": 3,
            },
        )
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert search_data["success"] is True
        assert len(search_data["results"]) > 0
        top_match = search_data["results"][0]
        assert "memoization" in top_match["transcript"].lower()
        assert top_match["start_time"] == 0.0

