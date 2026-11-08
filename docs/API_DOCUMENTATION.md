# ClassTrace — REST API Documentation

Base URL: `http://localhost:8000` (Local) / `https://classtrace-backend.onrender.com` (Production)

---

## 1. System & Configuration

### `GET /api/health`
Checks server status.
* **Response (200 OK):**
```json
{
  "status": "healthy",
  "app": "ClassTrace",
  "environment": "development",
  "version": "1.0.0"
}
```

### `GET /api/config/status`
Checks whether Gnani AI credentials and Supabase database are connected.
* **Response (200 OK):**
```json
{
  "gnani_configured": true,
  "gnani_model": "prisma-v2.5",
  "supabase_configured": true,
  "active_database": "Supabase PostgreSQL",
  "message": null
}
```

---

## 2. Lecture Management

### `GET /api/lectures`
Returns all uploaded and processed classroom lectures.
* **Response (200 OK):**
```json
[
  {
    "id": "00000000-0000-4000-a000-000000000001",
    "title": "DSA Lecture 14: Recursion, Call Stack & Binary Tree Inorder Traversal",
    "filename": "dsa_recursion_trees_lecture.wav",
    "audio_url": "/api/audio/dsa_recursion_trees_lecture.wav",
    "duration_seconds": 308.0,
    "file_size_bytes": 9856078,
    "status": "COMPLETED",
    "language_detected": "Hinglish (hi-IN / en-IN)",
    "error_message": null,
    "segment_count": 8,
    "created_at": "2026-11-07T10:27:46.000000Z",
    "updated_at": "2026-11-07T10:27:46.000000Z"
  }
]
```

### `GET /api/lectures/{lecture_id}`
Returns details for a specific lecture along with all its timestamped transcript segments.
* **Response (200 OK):**
```json
{
  "id": "00000000-0000-4000-a000-000000000001",
  "title": "DSA Lecture 14: Recursion, Call Stack & Binary Tree Inorder Traversal",
  "audio_url": "/api/audio/dsa_recursion_trees_lecture.wav",
  "duration_seconds": 308.0,
  "status": "COMPLETED",
  "segments": [
    {
      "id": "seg_00000000_002",
      "lecture_id": "00000000-0000-4000-a000-000000000001",
      "start_time": 32.0,
      "end_time": 65.0,
      "transcript": "Ab sabse zaroori concept hai: Base Case ya Base Condition...",
      "speaker": "Prof. Sharma",
      "sequence_order": 1
    }
  ]
}
```

### `POST /api/lectures/upload`
Uploads a lecture audio recording for batch transcription via Gnani AI Prisma Batch STT.
* **Content-Type:** `multipart/form-data`
* **Parameters:**
  * `file`: Audio file (`.wav`, `.mp3`, `.m4a`, `.flac`, `.webm`, max 150MB)
  * `title`: Optional custom title string
* **Response (200 OK):**
```json
{
  "success": true,
  "lecture_id": "4a7f05b1-e23a-4958-86d1-4475518b5efb",
  "message": "Lecture uploaded successfully. Gnani AI Batch Speech-to-Text processing started.",
  "lecture": {
    "id": "4a7f05b1-e23a-4958-86d1-4475518b5efb",
    "status": "PROCESSING"
  }
}
```

---

## 3. Retrieval & Search

### `POST /api/search/text`
Performs hybrid semantic and keyword retrieval over lecture transcripts.
* **Content-Type:** `application/json`
* **Request Body:**
```json
{
  "query": "Sir ne recursion ka base case kaise explain kiya tha?",
  "lecture_id": "00000000-0000-4000-a000-000000000001",
  "limit": 3
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "query": "Sir ne recursion ka base case kaise explain kiya tha?",
  "has_sufficient_evidence": true,
  "total_matches": 3,
  "results": [
    {
      "id": "seg_00000000_002",
      "lecture_id": "00000000-0000-4000-a000-000000000001",
      "lecture_title": "DSA Lecture 14: Recursion, Call Stack & Binary Tree Inorder Traversal",
      "start_time": 32.0,
      "end_time": 65.0,
      "transcript": "Ab sabse zaroori concept hai: Base Case ya Base Condition. Dhyan se suniye students, bina base condition ke recursion kabhi complete nahi ho sakta...",
      "speaker": "Prof. Sharma",
      "score": 0.9024,
      "semantic_score": 0.812,
      "keyword_score": 1.0,
      "audio_url": "/api/audio/dsa_recursion_trees_lecture.wav"
    }
  ],
  "message": "Relevant teacher explanations retrieved with verified timestamps."
}
```

### `POST /api/search/voice`
Transcribes student spoken audio question using Gnani Synchronous STT (`POST /stt/v3`) and returns the exact matching audio timestamp.
* **Content-Type:** `multipart/form-data`
* **Parameters:**
  * `audio_file`: Audio recording blob from browser microphone
  * `lecture_id`: Optional target lecture ID
  * `limit`: Number of passages (default 3)
* **Response (200 OK):**
```json
{
  "success": true,
  "recognized_text": "Sir ne recursion ka base case kaise explain kiya tha?",
  "detected_language": "hi-IN",
  "processing_time_seconds": 0.42,
  "search_response": {
    "success": true,
    "has_sufficient_evidence": true,
    "results": [ ... ]
  }
}
```

---

## 4. Audio Playback Streaming

### `GET /api/audio/{filename}`
Streams the original classroom recording with HTTP 206 Partial Content support (`Accept-Ranges: bytes`) for sub-second browser audio seeking.

---

## 5. Automated Benchmark Evaluation

### `POST /api/benchmark/run`
Executes automated QA evaluation across the 17 ground-truth test questions.
* **Response (200 OK):**
```json
{
  "total_questions": 17,
  "hit_at_1_count": 15,
  "hit_at_1_rate": 0.8824,
  "hit_at_3_count": 17,
  "hit_at_3_rate": 1.0,
  "average_timestamp_iou": 0.875,
  "results": [ ... ]
}
```

