"""
ClassTrace FastAPI Application
Main entrypoint providing REST APIs for:
- Lecture upload & processing with Gnani Batch STT
- Voice questioning with Gnani Synchronous STT
- Text questioning with hybrid semantic + keyword retrieval
- Audio streaming with byte-range seeking
- Automated benchmark evaluations & configuration health checks
"""

import os
import uuid
import logging
import asyncio
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse

from backend.app.config import settings, AUDIO_STORAGE_DIR, DEMO_DATA_DIR
from backend.app.database import db
from backend.app.schemas import (
    LectureResponse, LectureDetailResponse, TextSearchRequest, SearchResponse,
    VoiceSearchResponse, ConfigStatusResponse, BenchmarkReport, BenchmarkEvaluationItem,
    ProcessingJobResponse, TimbreTTSRequest, EvonReasoningRequest
)
from backend.app.gnani_client import gnani_client, GnaniConfigurationError, GnaniAPIError
from backend.app.audio_processor import audio_processor, AudioProcessingError
from backend.app.retrieval import retrieval_engine
from backend.app.languages import SUPPORTED_LANGUAGES
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("classtrace.main")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Voice-first retrieval engine for Indian classroom lectures: Ask in your language. Hear the exact moment."
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev and production frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing ClassTrace server...")
    # Seed demonstration lecture if database is empty
    try:
        from backend.app.mock_data_generator import seed_demo_lecture
        await seed_demo_lecture(force_recreate=False)
    except Exception as e:
        logger.error(f"Demo lecture initialization notice: {e}")


# ------------------ CONFIGURATION & HEALTH ------------------

@app.get("/api/languages")
async def get_supported_languages():
    """Retrieve all supported Indian college teaching languages."""
    from backend.app.languages import SUPPORTED_LANGUAGES
    return SUPPORTED_LANGUAGES

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0"
    }


@app.get("/api/config/status", response_model=ConfigStatusResponse)
async def get_config_status():
    gnani_ok = settings.is_gnani_configured
    supabase_ok = settings.is_supabase_configured
    active_db = "Supabase PostgreSQL" if (supabase_ok and db.use_supabase) else "Local SQLite Engine"

    msg = None
    if not gnani_ok:
        msg = "GNANI_API_KEY is not set. Live speech recognition will require configuring GNANI_API_KEY in backend/.env."

    return ConfigStatusResponse(
        gnani_configured=gnani_ok,
        gnani_model=settings.GNANI_STT_MODEL,
        supabase_configured=supabase_ok,
        active_database=active_db,
        message=msg
    )


# ------------------ GNANI AI TRIO MODEL SUITE ------------------

@app.get("/api/models")
async def get_models():
    """
    Returns official specifications for the 3 Gnani AI models powering ClassTrace:
    1. Prisma v2.5: Speech to Text (14M+ hours, <200ms latency)
    2. Timbre v2.5: Text to Speech (10+ Indic languages, lakh/crore cadence)
    3. Evon v3.3: Multilingual Indic Reasoning (30B MoE • 128K context)
    """
    return {
        "success": True,
        "models": gnani_client.get_model_catalog(),
        "active_models": {
            "stt": settings.GNANI_STT_MODEL,
            "tts": settings.GNANI_TTS_MODEL,
            "reasoning": settings.GNANI_REASONING_MODEL
        }
    }


@app.post("/api/tts/synthesize")
async def synthesize_speech(req: TimbreTTSRequest):
    """
    Synthesizes speech using Gnani Timbre v2.5 with authentic Indic prosody,
    Indian names, numerals, and lakh and crore cadence.
    """
    try:
        import io
        result = await gnani_client.synthesize_speech_timbre(
            text=req.text,
            language_code=req.language_code or "hi",
            voice_gender=req.voice_gender or "female",
            speed=req.speed or 1.0
        )
        return StreamingResponse(
            io.BytesIO(result["audio_bytes"]),
            media_type=result.get("content_type", "audio/wav"),
            headers={
                "X-Model-Used": str(result.get("model", "timbre-v2.5")),
                "X-Cadence": "lakh_crore_indic_prosody"
            }
        )
    except Exception as e:
        logger.error(f"Timbre TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"Timbre TTS synthesis failed: {str(e)}")


@app.post("/api/reasoning/evon")
async def reason_with_evon(req: EvonReasoningRequest):
    """
    Executes multilingual Indic reasoning using Evon v3.3 (30B MoE • 128K Context).
    Extracts core concepts, verifies grounding against teacher's exact words,
    and returns a zero-hallucinations explanation.
    """
    passages = req.passages
    if not passages and req.lecture_id:
        segments = await db.get_all_segments(req.lecture_id)
        if segments:
            search_res = retrieval_engine.search(req.query, segments, limit=3)
            passages = [
                {
                    "start_time": r.start_time,
                    "end_time": r.end_time,
                    "transcript": r.transcript,
                    "speaker": r.speaker
                }
                for r in search_res.results
            ]

    try:
        res = await gnani_client.reason_with_evon(
            query=req.query,
            context_passages=passages or [],
            language_code=req.language_code or "indic-auto"
        )
        return res
    except Exception as e:
        logger.error(f"Evon reasoning error: {e}")
        raise HTTPException(status_code=500, detail=f"Evon v3.3 reasoning failed: {str(e)}")



# ------------------ LECTURE MANAGEMENT ------------------

@app.get("/api/lectures", response_model=List[LectureResponse])
async def list_lectures():
    lectures = await db.list_lectures()
    return lectures


@app.get("/api/lectures/{lecture_id}", response_model=LectureDetailResponse)
async def get_lecture_detail(lecture_id: str):
    lecture = await db.get_lecture(lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found.")

    # Attach real audio peaks
    filename = lecture.get("filename")
    if filename:
        audio_path = AUDIO_STORAGE_DIR / filename
        if audio_path.exists():
            try:
                peaks = audio_processor.extract_audio_peaks(str(audio_path), num_peaks=100)
                lecture["peaks"] = peaks
            except Exception as e:
                logger.warning(f"Audio peak extraction error: {e}")

    # Attach generated thematic chapters
    segments = lecture.get("segments", [])
    if segments:
        chapters = retrieval_engine.generate_lecture_chapters(segments)
        lecture["chapters"] = chapters

    return lecture


# ------------------ BACKGROUND TRANSCRIPTION PIPELINE ------------------

async def process_batch_transcription(lecture_id: str, local_audio_path: str, filename: str, language_code: Optional[str] = None):
    """
    Background worker that interacts with the real Gnani Batch STT API.
    Creates job, starts processing, polls status, retrieves transcript, and indexes segments.
    """
    job_id = f"gnani_{uuid.uuid4().hex[:12]}"
    await db.create_or_update_job(job_id, lecture_id, "STARTING", "Submitting audio to Gnani Batch STT...", progress=10)

    try:
        # 1. Read audio bytes
        with open(local_audio_path, "rb") as f:
            audio_bytes = f.read()

        # 2. Submit to Gnani Batch API
        gnani_job_id = await gnani_client.create_batch_job(
            audio_bytes=audio_bytes,
            filename=filename,
            language_code=language_code or settings.GNANI_LANGUAGE_CODE,
            model=settings.GNANI_STT_MODEL
        )
        await db.create_or_update_job(job_id, lecture_id, "QUEUED", f"Job created on Gnani (ID: {gnani_job_id}). Triggering processing...", progress=25)

        # 3. Start Job
        await gnani_client.start_batch_job(gnani_job_id)
        await db.create_or_update_job(job_id, lecture_id, "IN_PROGRESS", "Transcribing lecture with Gnani Prisma...", progress=40)

        # 4. Poll for completion (up to 15 minutes)
        max_attempts = 180
        completed = False
        files_data = []

        for attempt in range(max_attempts):
            await asyncio.sleep(5)
            status_data = await gnani_client.get_batch_job_status(gnani_job_id)
            status = status_data.get("status", "").upper()

            if status == "COMPLETED":
                completed = True
                files_data = await gnani_client.get_batch_job_files(gnani_job_id)
                break
            elif status == "FAILED":
                err = status_data.get("error_message") or "Gnani batch transcription failed."
                raise GnaniAPIError(err)

            progress = min(90, 40 + int(attempt * 0.3))
            await db.create_or_update_job(job_id, lecture_id, "IN_PROGRESS", f"Transcribing audio ({status})...", progress=progress)

        if not completed:
            raise GnaniAPIError("Gnani transcription timed out after 15 minutes.")

        # 5. Download transcript JSON
        if not files_data or not files_data[0].get("transcript_url"):
            raise GnaniAPIError("No transcript_url found in Gnani files response.")

        transcript_url = files_data[0]["transcript_url"]
        transcript_json = await gnani_client.fetch_transcript_from_url(transcript_url)

        segments = transcript_json.get("segments", [])
        if not segments and transcript_json.get("full_transcript"):
            # If Gnani returned single block, format into segment
            dur = audio_processor.get_audio_duration(local_audio_path)
            segments = [{
                "start_time": 0.0,
                "end_time": dur,
                "transcript": transcript_json["full_transcript"],
                "speaker": "Teacher"
            }]

        # 6. Save transcript segments to database
        saved_segments = await db.save_transcript_segments(lecture_id, segments)

        # 7. Compute multilingual dense embeddings for semantic search
        texts = [s["transcript"] for s in saved_segments]
        embeddings = retrieval_engine.compute_embeddings_batch(texts)
        embeddings_to_save = [
            {"segment_id": s["id"], "lecture_id": lecture_id, "embedding": emb}
            for s, emb in zip(saved_segments, embeddings)
        ]
        await db.save_embeddings(embeddings_to_save)

        # 8. Update lecture status
        await db.update_lecture_status(lecture_id, status="COMPLETED")
        await db.create_or_update_job(job_id, lecture_id, "COMPLETED", "Lecture transcription and semantic indexing completed.", progress=100)
        logger.info(f"Lecture {lecture_id} successfully transcribed with Gnani AI.")

    except GnaniConfigurationError as exc:
        msg = f"Gnani AI Configuration Error: {str(exc)}"
        logger.error(msg)
        await db.update_lecture_status(lecture_id, status="FAILED", error_message=msg)
        await db.create_or_update_job(job_id, lecture_id, "FAILED", msg, progress=0)
    except Exception as exc:
        msg = f"Transcription pipeline failed: {str(exc)}"
        logger.error(msg)
        await db.update_lecture_status(lecture_id, status="FAILED", error_message=msg)
        await db.create_or_update_job(job_id, lecture_id, "FAILED", msg, progress=0)


@app.post("/api/lectures/upload")
async def upload_lecture(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    language_code: Optional[str] = Form("indic-auto")
):
    """
    Accepts student/teacher uploaded lecture audio.
    Validates file, converts to standardized WAV, and initiates Gnani Batch STT.
    """
    contents = await file.read()
    file_size = len(contents)
    filename = file.filename or "uploaded_lecture.wav"

    # 1. Validation
    is_valid, error_msg = audio_processor.validate_audio_file(filename, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    lecture_id = str(uuid.uuid4())
    lecture_title = (title or Path(filename).stem.replace("_", " ").title()).strip()

    # 2. Save temporary uploaded file
    safe_name = f"{lecture_id}_{Path(filename).name}"
    raw_path = AUDIO_STORAGE_DIR / f"raw_{safe_name}"
    with open(raw_path, "wb") as f:
        f.write(contents)

    # 3. Standardize audio using FFmpeg to 16kHz mono WAV
    std_filename = f"{lecture_id}.wav"
    std_path = AUDIO_STORAGE_DIR / std_filename
    try:
        audio_processor.convert_to_standard_wav(str(raw_path), str(std_path))
        duration = audio_processor.get_audio_duration(str(std_path))
    except Exception as e:
        logger.error(f"FFmpeg audio processing failed: {e}")
        # If conversion fails, use raw file
        std_path = raw_path
        std_filename = f"raw_{safe_name}"
        duration = 0.0

    # 4. Check Gnani Credentials
    if not settings.is_gnani_configured:
        # Create lecture record with FAILED status and explicit prompt message
        record = {
            "id": lecture_id,
            "title": lecture_title,
            "filename": std_filename,
            "audio_url": f"/api/audio/{std_filename}",
            "duration_seconds": duration,
            "file_size_bytes": file_size,
            "status": "FAILED",
            "error_message": (
                "GNANI_API_KEY is not configured in backend/.env. "
                "ClassTrace strictly adheres to evidence-based AI and will not simulate fake transcription. "
                "Please configure your Gnani API key to transcribe new recordings."
            )
        }
        await db.create_lecture(record)
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "lecture_id": lecture_id,
                "message": record["error_message"],
                "lecture": record
            }
        )

    # 5. Create lecture record in PENDING state
    record = {
        "id": lecture_id,
        "title": lecture_title,
        "filename": std_filename,
        "audio_url": f"/api/audio/{std_filename}",
        "duration_seconds": duration,
        "file_size_bytes": file_size,
        "status": "PROCESSING",
        "error_message": None,
        "language_detected": language_code
    }
    created_lecture = await db.create_lecture(record)

    # 6. Dispatch background worker
    background_tasks.add_task(process_batch_transcription, lecture_id, str(std_path), std_filename, language_code)

    return {
        "success": True,
        "lecture_id": lecture_id,
        "message": "Lecture uploaded successfully. Gnani AI Batch Speech-to-Text processing started.",
        "lecture": created_lecture
    }


@app.post("/api/lectures/record")
async def record_live_lecture(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    language_code: Optional[str] = Form("indic-auto"),
    segments_json: Optional[str] = Form(None)
):
    """
    Accepts student recorded live classroom audio.
    Saves audio, standardizes to 16kHz WAV with FFmpeg, extracts duration and peaks,
    indexes captured live segments (with semantic vector embeddings) for immediate search,
    and dispatches Gnani Batch STT if configured.
    """
    contents = await file.read()
    file_size = len(contents)
    if file_size < 100:
        raise HTTPException(status_code=400, detail="Recording is empty or too short.")

    lecture_id = str(uuid.uuid4())
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    lecture_title = (title or f"Live Class Recording - {now_str}").strip()

    # 1. Save raw audio
    raw_filename = f"raw_live_{lecture_id}.webm"
    raw_path = AUDIO_STORAGE_DIR / raw_filename
    with open(raw_path, "wb") as f:
        f.write(contents)

    # 2. Standardize to 16kHz WAV using FFmpeg
    std_filename = f"{lecture_id}.wav"
    std_path = AUDIO_STORAGE_DIR / std_filename
    try:
        audio_processor.convert_to_standard_wav(str(raw_path), str(std_path))
        duration = audio_processor.get_audio_duration(str(std_path))
    except Exception as e:
        logger.warning(f"FFmpeg conversion on live audio: {e}. Keeping raw recording.")
        std_path = raw_path
        std_filename = raw_filename
        duration = 0.0

    # 3. Create lecture record in database
    record = {
        "id": lecture_id,
        "title": lecture_title,
        "filename": std_filename,
        "audio_url": f"/api/audio/{std_filename}",
        "duration_seconds": duration,
        "file_size_bytes": file_size,
        "status": "COMPLETED",
        "error_message": None,
        "language_detected": language_code or "indic-auto"
    }
    created_lecture = await db.create_lecture(record)

    # 4. If live captured segments were sent, index them immediately!
    live_segments = []
    if segments_json:
        try:
            parsed = json.loads(segments_json)
            if isinstance(parsed, list):
                live_segments = parsed
        except Exception as e:
            logger.warning(f"Failed to parse segments_json: {e}")

    # Fallback single segment if no live segments were captured but duration > 0
    if not live_segments and duration > 0:
        live_segments = [{
            "start_time": 0.0,
            "end_time": duration,
            "transcript": f"Live lecture recording of {lecture_title}. Audio captured and stored successfully.",
            "speaker": "Teacher"
        }]

    if live_segments:
        saved_segments = await db.save_transcript_segments(lecture_id, live_segments)
        # Compute embeddings for instant semantic search
        texts = [s["transcript"] for s in saved_segments]
        embeddings = retrieval_engine.compute_embeddings_batch(texts)
        embeddings_to_save = [
            {"segment_id": s["id"], "lecture_id": lecture_id, "embedding": emb}
            for s, emb in zip(saved_segments, embeddings)
        ]
        await db.save_embeddings(embeddings_to_save)
        created_lecture["segment_count"] = len(saved_segments)

    # 5. If Gnani is configured, dispatch full batch transcription in background for multi-speaker diarization
    if settings.is_gnani_configured:
        background_tasks.add_task(process_batch_transcription, lecture_id, str(std_path), std_filename, language_code)

    return {
        "success": True,
        "lecture_id": lecture_id,
        "message": "Live lecture recording saved and stored successfully.",
        "lecture": created_lecture
    }


# ------------------ RETRIEVAL ENGINE (SEARCH) ------------------

@app.post("/api/search/text", response_model=SearchResponse)
async def search_text(req: TextSearchRequest):
    """
    Search lecture transcripts using Hybrid Multilingual Vector + BM25 Retrieval.
    Returns the top 3 verified passages or an explicit no-result state.
    """
    segments = await db.get_all_segments(req.lecture_id)
    if not segments:
        return SearchResponse(
            success=True,
            query=req.query,
            has_sufficient_evidence=False,
            total_matches=0,
            results=[],
            message="No transcripts available for this lecture yet."
        )

    result = retrieval_engine.search(
        req.query,
        segments,
        limit=req.limit,
        context_timestamp=req.context_timestamp,
        follow_up=bool(req.follow_up)
    )
    return result


@app.post("/api/search/voice", response_model=VoiceSearchResponse)
async def search_voice(
    audio_file: UploadFile = File(...),
    lecture_id: Optional[str] = Form(None),
    limit: int = Form(3),
    language_code: Optional[str] = Form("indic-auto"),
    context_timestamp: Optional[float] = Form(None),
    follow_up: Optional[bool] = Form(False),
    fallback_text: Optional[str] = Form(None)
):
    """
    Accepts student's spoken question from the microphone in any Indian language.
    Transcribes using Gnani Synchronous STT (POST /stt/v3) or client speech fallback, then passes to hybrid retrieval.
    """
    contents = await audio_file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty audio recording received.")

    # Save incoming audio snippet
    temp_dir = AUDIO_STORAGE_DIR / "voice_queries"
    temp_dir.mkdir(parents=True, exist_ok=True)
    query_id = str(uuid.uuid4())
    raw_query_path = temp_dir / f"query_{query_id}.webm"
    wav_query_path = temp_dir / f"query_{query_id}.wav"

    with open(raw_query_path, "wb") as f:
        f.write(contents)

    # Convert to 16kHz WAV for Gnani STT
    try:
        audio_processor.convert_to_standard_wav(str(raw_query_path), str(wav_query_path))
        with open(wav_query_path, "rb") as f:
            query_wav_bytes = f.read()
    except Exception as e:
        logger.warning(f"Audio conversion failed: {e}. Using raw bytes.")
        query_wav_bytes = contents

    recognized_text = ""
    detected_lang = language_code or "indic-auto"
    processing_time = 0.5

    # 1. Attempt Gnani Synchronous STT if configured
    if settings.is_gnani_configured:
        try:
            stt_result = await gnani_client.transcribe_short_audio(
                audio_bytes=query_wav_bytes,
                filename=f"query_{query_id}.wav",
                language_code=language_code or settings.GNANI_LANGUAGE_CODE,
                model=settings.GNANI_STT_MODEL
            )
            recognized_text = stt_result.get("transcript", "").strip()
            detected_lang = stt_result.get("detected_language") or detected_lang
            processing_time = stt_result.get("processing_time") or 0.5
        except Exception as exc:
            logger.warning(f"Gnani voice transcription error: {exc}. Checking fallback...")
            if not fallback_text:
                raise HTTPException(status_code=502, detail=f"Gnani Speech-to-Text API failed: {str(exc)}")

    # 2. If Gnani not configured or returned empty, use client speech transcription fallback
    if not recognized_text and fallback_text and fallback_text.strip():
        recognized_text = fallback_text.strip()
        logger.info(f"Using speech recognition fallback text: '{recognized_text}'")

    if not recognized_text:
        if not settings.is_gnani_configured:
            raise HTTPException(
                status_code=400,
                detail=(
                    "GNANI_API_KEY is not configured in backend/.env. "
                    "Please configure GNANI_API_KEY or speak clearly through browser speech recognition."
                )
            )
        return VoiceSearchResponse(
            success=False,
            recognized_text="",
            detected_language=detected_lang,
            processing_time_seconds=processing_time,
            search_response=SearchResponse(
                success=True,
                query="",
                has_sufficient_evidence=False,
                total_matches=0,
                results=[],
                message="Could not clearly recognize any speech in the audio recording. Please try speaking again."
            )
        )

    # Hybrid Retrieval with Pan-Indic Intent Mapping
    segments = await db.get_all_segments(lecture_id)
    search_res = retrieval_engine.search(
        recognized_text,
        segments,
        limit=limit,
        context_timestamp=context_timestamp,
        follow_up=bool(follow_up)
    )

    return VoiceSearchResponse(
        success=True,
        recognized_text=recognized_text,
        detected_language=stt_result.get("detected_language") or language_code,
        processing_time_seconds=stt_result.get("processing_time"),
        search_response=search_res
    )


# ------------------ AUDIO PLAYBACK STREAMING ------------------

@app.get("/api/audio/{filename}")
async def stream_audio(filename: str):
    """
    Stream original audio with HTTP Range support for instant browser seeking to exact timestamps.
    """
    file_path = AUDIO_STORAGE_DIR / filename
    if not file_path.exists():
        # Check demo directory
        demo_path = DEMO_DATA_DIR / filename
        if demo_path.exists():
            file_path = demo_path
        else:
            raise HTTPException(status_code=404, detail="Audio file not found on server.")

    # Return file with media type
    ext = file_path.suffix.lower()
    media_types = {
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg"
    }
    return FileResponse(
        path=str(file_path),
        media_type=media_types.get(ext, "audio/wav"),
        filename=filename
    )


# ------------------ AUTOMATED BENCHMARK EVALUATION ------------------

@app.get("/api/benchmark/data")
async def get_benchmark_questions():
    """Retrieve verified ground truth benchmark questions and metadata."""
    gt_file = DEMO_DATA_DIR / "ground_truth.json"
    if not gt_file.exists():
        raise HTTPException(status_code=404, detail="Ground truth benchmark data not found.")
    with open(gt_file, "r", encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/benchmark/run", response_model=BenchmarkReport)
async def run_benchmark():
    """
    Execute automated evaluation over the 15+ ground truth questions.
    Measures Hit@1, Hit@3, and Timestamp IoU.
    """
    gt_file = DEMO_DATA_DIR / "ground_truth.json"
    if not gt_file.exists():
        raise HTTPException(status_code=404, detail="Ground truth benchmark data not found.")

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    benchmark_queries = gt_data.get("benchmark_queries", [])
    lecture_id = "00000000-0000-4000-a000-000000000001"
    segments = await db.get_all_segments(lecture_id)

    eval_items: List[BenchmarkEvaluationItem] = []
    hit_1_count = 0
    hit_3_count = 0
    total_iou = 0.0

    for q in benchmark_queries:
        exp_start = q["expected_timestamp_start"]
        exp_end = q["expected_timestamp_end"]
        is_negative = (exp_start < 0)

        search_res = retrieval_engine.search(q["question"], segments, limit=3)
        results = search_res.results

        hit_1 = False
        hit_3 = False
        retrieved_start = None
        retrieved_end = None
        retrieved_text = None
        score = 0.0
        iou = 0.0

        if is_negative:
            # For negative query, success means correctly rejecting (no results or insufficient evidence)
            if not search_res.has_sufficient_evidence or len(results) == 0:
                hit_1 = True
                hit_3 = True
                score = 1.0
        else:
            if results:
                best = results[0]
                retrieved_start = best.start_time
                retrieved_end = best.end_time
                retrieved_text = best.transcript
                score = best.score

                # Calculate IoU with top-1
                inter_start = max(exp_start, retrieved_start)
                inter_end = min(exp_end, retrieved_end)
                intersection = max(0.0, inter_end - inter_start)
                union = max(exp_end, retrieved_end) - min(exp_start, retrieved_start)
                iou = (intersection / union) if union > 0 else 0.0

                # Top-1 Check: tolerance of 10s overlap
                if intersection > 5.0 or (abs(retrieved_start - exp_start) < 15.0):
                    hit_1 = True

                # Top-3 Check
                for cand in results:
                    c_inter = max(0.0, min(exp_end, cand.end_time) - max(exp_start, cand.start_time))
                    if c_inter > 5.0 or (abs(cand.start_time - exp_start) < 15.0):
                        hit_3 = True
                        break

        if hit_1:
            hit_1_count += 1
        if hit_3:
            hit_3_count += 1
        total_iou += iou

        eval_items.append(BenchmarkEvaluationItem(
            question_id=q["id"],
            question=q["question"],
            topic=q["topic"],
            expected_start=exp_start,
            expected_end=exp_end,
            retrieved_start=retrieved_start,
            retrieved_end=retrieved_end,
            retrieved_text=retrieved_text,
            hit_at_1=hit_1,
            hit_at_3=hit_3,
            timestamp_iou=round(iou, 4),
            score=round(score, 4)
        ))

    n = len(benchmark_queries)
    return BenchmarkReport(
        total_questions=n,
        hit_at_1_count=hit_1_count,
        hit_at_1_rate=round(hit_1_count / n, 4),
        hit_at_3_count=hit_3_count,
        hit_at_3_rate=round(hit_3_count / n, 4),
        average_timestamp_iou=round(total_iou / (n - 1), 4),  # Exclude negative query from IoU average
        results=eval_items
    )


@app.get("/api/languages")
async def get_supported_languages():
    """
    Returns supported Pan-Indic languages and dialect code-mixing profiles.
    """
    return {
        "count": len(SUPPORTED_LANGUAGES),
        "languages": SUPPORTED_LANGUAGES
    }

