# ClassTrace — System Architecture & Technical Specifications

> **"Ask in your language. Hear the exact moment."**  
> Voice-First Retrieval Engine for Recorded Indian Classroom Lectures  
> **Core Philosophy:** Evidence, not hallucinations.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 STUDENT / USER                                    |
|   - Microphone voice query in Hinglish / Hindi / English                          |
|   - Interactive full-timeline audio player with second-accurate jumps             |
|   - Transparent transcript verification with speaker labels                       |
+-----------------------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------------------+
|                        FRONTEND (Next.js 14 + Tailwind CSS)                       |
|   - Web Audio & MediaRecorder for real-time microphone capture                    |
|   - VoiceSearch Component with volume visualizer & fallback text input            |
|   - SearchResults Component displaying Top-3 ranked moments + relevance badges    |
|   - AudioPlayer with byte-range seek, speed selector & snippet loop               |
|   - Live 17-Question Automated Benchmark Evaluation Modal                         |
+-----------------------------------------------------------------------------------+
                                   │  HTTP / REST APIs
                                   ▼
+-----------------------------------------------------------------------------------+
|                        BACKEND (FastAPI + Python 3.12)                            |
|                                                                                   |
|  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  |
|  │  Audio Preprocessor   │  │  Gnani AI STT Client  │  │ Hybrid Retrieval Core │  |
|  │  - FFmpeg 16kHz PCM   │  │  - Synchronous STT    │  │  - Fastembed ONNX     │  |
|  │  - Waveform validator │  │  - Asynchronous Batch │  │  - BM25Okapi Lexical  │  |
|  │  - Millisecond slicing│  │  - Status polling     │  │  - Bi-gram exact boost│  |
|  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘  |
+-----------------------------------------------------------------------------------+
         │                                                            │
         ▼                                                            ▼
+----------------------------------------+   +--------------------------------------+
|          GNANI AI CLOUD APIS           |   |       DATABASE & PERSISTENCE         |
|  https://api.vachana.ai                |   |  - Supabase PostgreSQL + pgvector    |
|  - POST /stt/v3 (Sync short audio)     |   |  - Dual-mode local SQLite fallback   |
|  - POST /stt/v3/batch/jobs (Batch)     |   |  - Tables: lectures, segments,       |
|  - GET  /stt/v3/batch/jobs/{id}/files  |   |    lecture_embeddings, jobs          |
+----------------------------------------+   +--------------------------------------+
```

---

## 2. Audio Processing & Conversion Pipeline

1. **Ingestion & Validation**:
   - Files are validated against `MAX_UPLOAD_SIZE_MB = 150MB`.
   - Allowed formats: `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`, `.aac`, `.webm`.
2. **Audio Standardization (`AudioProcessor`)**:
   - Uses `FFmpeg` (`imageio-ffmpeg` or system binary).
   - Audio is converted to **16,000 Hz, 16-bit Mono PCM WAV** (`-ac 1 -ar 16000 -c:a pcm_s16le`).
   - Guarantees maximum acoustic clarity for Gnani Prisma STT models.
3. **HTTP Range-Seekable Streaming**:
   - Audio files are served via `GET /api/audio/{filename}` with HTTP 206 Partial Content / `Accept-Ranges: bytes`.
   - Allows instant browser scrubbing to any timestamp without buffering the whole file.

---

## 3. Gnani AI Integration Architecture

### A. Synchronous STT (Voice Queries < 30s)
* **Endpoint:** `POST https://api.vachana.ai/stt/v3`
* **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`
* **Payload:** `multipart/form-data` with `audio_file`, `model="prisma-v2.5"`, `language_code="indic-auto"`, `format="transcribe"`.
* **Flow:** Browser records WebM via `MediaRecorder` -> Backend converts to 16kHz WAV -> Gnani returns transcript string -> Query dispatched to hybrid retrieval engine.

### B. Asynchronous Batch STT (Full Classroom Recordings)
* **Creation:** `POST https://api.vachana.ai/stt/v3/batch/jobs` with lecture audio.
* **Execution:** `POST https://api.vachana.ai/stt/v3/batch/jobs/{job_id}/start`.
* **Polling:** Background worker polls `GET /stt/v3/batch/jobs/{job_id}` every 5s until `COMPLETED`.
* **Result Fetch:** Calls `GET /stt/v3/batch/jobs/{job_id}/files` to get pre-signed `transcript_url`, then downloads segments with timestamps and speaker labels.

---

## 4. Hybrid Retrieval & Evidence Gate

Instead of invoking hallucination-prone Large Language Models, ClassTrace uses **strict evidence retrieval**:

$$\text{HybridScore} = w_{\text{dense}} \cdot S_{\text{semantic}} + w_{\text{sparse}} \cdot S_{\text{bm25}} + S_{\text{concept}} + S_{\text{phrase}}$$

Where:
* $w_{\text{dense}} = 0.30$ (Dense multilingual ONNX embedding similarity)
* $w_{\text{sparse}} = 0.35$ (BM25 lexical overlap on stopword-filtered tokens)
* $S_{\text{concept}} = +0.30$ (Domain concept signature boost for DSA terms)
* $S_{\text{phrase}} = +0.25$ (Exact bi-gram phrase match, e.g. `"base case"`, `"call stack"`)

### Strict Evidence Gate (Zero Hallucinations):
* Content keyword coverage check: If $\frac{|\text{Matched Content Tokens}|}{|\text{Query Content Tokens}|} < 0.35$ and no recognized concept matches, the system returns `has_sufficient_evidence = false`.
* Score floor: If $\max(\text{HybridScore}) < 0.28$, it explicitly returns:
  > *"No sufficiently relevant explanation was found in this lecture recording."*

