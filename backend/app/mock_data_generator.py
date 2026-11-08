"""
Demonstration Data & Synthetic Lecture Generator.
Generates the fictional 5-minute Hinglish DSA lecture audio and seeds the database with
verified transcripts, timestamps, and dense embeddings.
"""

import os
import json
import asyncio
import logging
from pathlib import Path
from backend.app.config import settings, DEMO_DATA_DIR, AUDIO_STORAGE_DIR
from backend.app.database import db
from backend.app.retrieval import retrieval_engine
from backend.app.audio_processor import audio_processor, FFMPEG_PATH

logger = logging.getLogger("classtrace.seed")


def synthesize_speech_offline_process(text: str, output_wav_path: str):
    """Synthesizes speech in an isolated Python process to avoid COM message pump locks."""
    import sys
    import subprocess
    code = f'''
import pyttsx3
engine = pyttsx3.init()
engine.setProperty("rate", 150)
engine.save_to_file({repr(text)}, {repr(str(output_wav_path))})
engine.runAndWait()
'''
    subprocess.run([sys.executable, "-c", code], check=True, timeout=20)


async def generate_synthetic_audio(segments: list, output_wav_path: str):
    """
    Generate audio for each transcript segment using real speech synthesis
    (edge-tts Indian English/Hindi voice or pyttsx3 offline native TTS)
    and concatenate them into a continuous lecture recording.
    Does NOT substitute tone-only audio.
    """
    import subprocess
    temp_dir = DEMO_DATA_DIR / "temp_segments"
    temp_dir.mkdir(parents=True, exist_ok=True)

    segment_files = []

    # Check if edge-tts works online with quick timeout
    use_edge_tts = False
    try:
        import edge_tts
        test_mp3 = temp_dir / "_test.mp3"
        await asyncio.wait_for(
            edge_tts.Communicate("test", voice="en-IN-PrabhatNeural").save(str(test_mp3)),
            timeout=2.0
        )
        if os.path.exists(test_mp3) and os.path.getsize(test_mp3) > 100:
            use_edge_tts = True
        if os.path.exists(test_mp3):
            os.remove(test_mp3)
    except Exception:
        use_edge_tts = False
        logger.info("edge-tts unavailable or blocked. Using local offline speech synthesis (pyttsx3)...")

    for idx, seg in enumerate(segments):
        seg_mp3 = temp_dir / f"seg_{idx:03d}.mp3"
        seg_raw_wav = temp_dir / f"seg_{idx:03d}_raw.wav"
        seg_wav = temp_dir / f"seg_{idx:03d}.wav"
        text = seg["transcript"]
        target_duration = seg["end_time"] - seg["start_time"]
        source_audio = None

        if use_edge_tts:
            try:
                import edge_tts
                communicate = edge_tts.Communicate(text, voice="en-IN-PrabhatNeural", rate="+5%")
                await communicate.save(str(seg_mp3))
                if os.path.exists(seg_mp3) and os.path.getsize(seg_mp3) > 1000:
                    source_audio = str(seg_mp3)
            except Exception as e:
                logger.warning(f"edge-tts segment {idx} failed: {e}")

        if not source_audio:
            try:
                synthesize_speech_offline_process(text, str(seg_raw_wav))
                if os.path.exists(seg_raw_wav) and os.path.getsize(seg_raw_wav) > 1000:
                    source_audio = str(seg_raw_wav)
            except Exception as e:
                logger.error(f"pyttsx3 segment {idx} failed: {e}")

        if not source_audio:
            raise RuntimeError(
                f"Failed to synthesize intelligible speech for segment {idx} ('{text[:30]}...'). "
                "ClassTrace strictly refuses to substitute fake tone beeps for authentic lecture audio. "
                "Ensure pyttsx3 or edge-tts is operational."
            )

        # Normalize to exact target duration with ffmpeg (atempo filter or padding)
        dur = audio_processor.get_audio_duration(source_audio)
        if dur > 0:
            speed_factor = dur / target_duration
            speed_factor = max(0.5, min(2.0, speed_factor))
            cmd = [
                FFMPEG_PATH, "-y",
                "-i", source_audio,
                "-filter:a", f"atempo={speed_factor:.3f}",
                "-ar", "16000", "-ac", "1",
                str(seg_wav)
            ]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            segment_files.append(str(seg_wav))
        else:
            raise RuntimeError(f"Synthesized audio for segment {idx} has invalid duration: {dur}")

    # Concatenate all segment WAV files into continuous lecture audio
    concat_list_file = temp_dir / "concat_list.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for seg_file in segment_files:
            # Escape path for ffmpeg concat demuxer
            safe_path = Path(seg_file).as_posix()
            f.write(f"file '{safe_path}'\n")

    cmd = [
        FFMPEG_PATH, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_file),
        "-c", "copy",
        output_wav_path
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    logger.info(f"Synthetic continuous lecture generated at {output_wav_path}")


async def seed_demo_lecture(force_recreate: bool = False):
    """Seed the database with the verified 5-minute Hinglish DSA lecture."""
    gt_file = DEMO_DATA_DIR / "ground_truth.json"
    if not gt_file.exists():
        logger.error(f"Ground truth file missing at {gt_file}")
        return None

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    meta = gt_data["lecture_meta"]
    segments = gt_data["segments"]

    lecture_id = "00000000-0000-4000-a000-000000000001"
    existing = await db.get_lecture(lecture_id)
    if existing and not force_recreate:
        logger.info(f"Demo lecture already seeded with {existing.get('segment_count', 0)} segments.")
        return existing

    audio_filename = meta["filename"]
    audio_path = AUDIO_STORAGE_DIR / audio_filename

    # Generate synthetic audio if missing
    if not audio_path.exists() or force_recreate:
        logger.info(f"Generating synthetic demonstration audio at {audio_path}...")
        await generate_synthetic_audio(segments, str(audio_path))

    duration = audio_processor.get_audio_duration(str(audio_path))
    if duration <= 0:
        duration = meta["duration_seconds"]

    file_size = os.path.getsize(audio_path) if audio_path.exists() else 1024 * 500

    lecture_record = {
        "id": lecture_id,
        "title": meta["title"],
        "filename": audio_filename,
        "audio_url": f"/api/audio/{audio_filename}",
        "duration_seconds": duration,
        "file_size_bytes": file_size,
        "status": "COMPLETED",
        "language_detected": "Hinglish (hi-IN / en-IN)",
        "error_message": None
    }

    await db.create_lecture(lecture_record)

    # Compute dense embeddings for each segment
    texts = [s["transcript"] for s in segments]
    embeddings = retrieval_engine.compute_embeddings_batch(texts)

    saved_segments = []
    embeddings_to_save = []

    for idx, (seg, emb) in enumerate(zip(segments, embeddings)):
        seg_record = {
            "id": f"seg_{lecture_id[:8]}_{idx+1:03d}",
            "lecture_id": lecture_id,
            "start_time": seg["start_time"],
            "end_time": seg["end_time"],
            "transcript": seg["transcript"],
            "speaker": seg.get("speaker", "Prof. Sharma")
        }
        saved_segments.append(seg_record)
        embeddings_to_save.append({
            "segment_id": seg_record["id"],
            "lecture_id": lecture_id,
            "embedding": emb
        })

    await db.save_transcript_segments(lecture_id, saved_segments)
    await db.save_embeddings(embeddings_to_save)

    logger.info(f"Successfully seeded demo lecture '{meta['title']}' with {len(saved_segments)} verified segments.")
    return await db.get_lecture(lecture_id)


if __name__ == "__main__":
    asyncio.run(seed_demo_lecture(force_recreate=True))

