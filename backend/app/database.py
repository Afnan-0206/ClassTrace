"""
ClassTrace Database Adapter
Supports Supabase PostgreSQL as primary production database, with an automatic
local SQLite fallback engine for offline development and local test evaluation.
"""

import os
import json
import uuid
import sqlite3
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.app.config import settings, STORAGE_DIR

logger = logging.getLogger("classtrace.db")

LOCAL_DB_PATH = STORAGE_DIR / "classtrace.db"


class DatabaseAdapter:
    def __init__(self):
        self.use_supabase = settings.is_supabase_configured
        self.supabase_client = None

        if self.use_supabase:
            try:
                from supabase import create_client, Client
                key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
                self.supabase_client: Client = create_client(settings.SUPABASE_URL, key)
                logger.info(f"Connected to Supabase PostgreSQL at {settings.SUPABASE_URL}")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}. Falling back to local database.")
                self.use_supabase = False

        if not self.use_supabase:
            logger.info(f"Using local SQLite storage at {LOCAL_DB_PATH}")
            self._init_sqlite()

    def _init_sqlite(self):
        """Initialize local SQLite schema matching Supabase PostgreSQL tables."""
        conn = sqlite3.connect(str(LOCAL_DB_PATH))
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS lectures (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            audio_url TEXT NOT NULL,
            duration_seconds REAL DEFAULT 0.0,
            file_size_bytes INTEGER DEFAULT 0,
            status TEXT DEFAULT 'PENDING',
            language_detected TEXT,
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS transcript_segments (
            id TEXT PRIMARY KEY,
            lecture_id TEXT NOT NULL,
            start_time REAL NOT NULL,
            end_time REAL NOT NULL,
            transcript TEXT NOT NULL,
            speaker TEXT,
            sequence_order INTEGER DEFAULT 0,
            FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS lecture_embeddings (
            id TEXT PRIMARY KEY,
            segment_id TEXT NOT NULL,
            lecture_id TEXT NOT NULL,
            embedding_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (segment_id) REFERENCES transcript_segments(id) ON DELETE CASCADE,
            FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS processing_jobs (
            job_id TEXT PRIMARY KEY,
            lecture_id TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT,
            progress_percentage INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_segments_lecture_id ON transcript_segments(lecture_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_segments_timestamps ON transcript_segments(lecture_id, start_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_lecture_id ON lecture_embeddings(lecture_id)")

        conn.commit()
        conn.close()

    def _get_sqlite_conn(self):
        conn = sqlite3.connect(str(LOCAL_DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    # ------------------ LECTURE OPERATIONS ------------------

    async def create_lecture(self, lecture_data: Dict[str, Any]) -> Dict[str, Any]:
        lecture_id = lecture_data.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        record = {
            "id": lecture_id,
            "title": lecture_data["title"],
            "filename": lecture_data["filename"],
            "audio_url": lecture_data["audio_url"],
            "duration_seconds": float(lecture_data.get("duration_seconds", 0.0)),
            "file_size_bytes": int(lecture_data.get("file_size_bytes", 0)),
            "status": lecture_data.get("status", "PENDING"),
            "language_detected": lecture_data.get("language_detected"),
            "error_message": lecture_data.get("error_message"),
            "created_at": now,
            "updated_at": now
        }

        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("lectures").insert(record).execute()
                return res.data[0] if res.data else record
            except Exception as e:
                logger.error(f"Supabase create_lecture failed: {e}. Writing to local database.")

        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO lectures 
            (id, title, filename, audio_url, duration_seconds, file_size_bytes, status, language_detected, error_message, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record["id"], record["title"], record["filename"], record["audio_url"],
            record["duration_seconds"], record["file_size_bytes"], record["status"],
            record["language_detected"], record["error_message"], record["created_at"], record["updated_at"]
        ))
        conn.commit()
        conn.close()
        return record

    async def update_lecture_status(
        self,
        lecture_id: str,
        status: str,
        error_message: Optional[str] = None,
        duration_seconds: Optional[float] = None,
        language_detected: Optional[str] = None
    ) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        updates = {"status": status, "updated_at": now}
        if error_message is not None:
            updates["error_message"] = error_message
        if duration_seconds is not None:
            updates["duration_seconds"] = duration_seconds
        if language_detected is not None:
            updates["language_detected"] = language_detected

        if self.use_supabase and self.supabase_client:
            try:
                self.supabase_client.table("lectures").update(updates).eq("id", lecture_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase update_lecture_status error: {e}")

        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        set_clauses = ["status = ?", "updated_at = ?"]
        params = [status, now]

        if error_message is not None:
            set_clauses.append("error_message = ?")
            params.append(error_message)
        if duration_seconds is not None:
            set_clauses.append("duration_seconds = ?")
            params.append(duration_seconds)
        if language_detected is not None:
            set_clauses.append("language_detected = ?")
            params.append(language_detected)

        params.append(lecture_id)
        cursor.execute(f"UPDATE lectures SET {', '.join(set_clauses)} WHERE id = ?", params)
        conn.commit()
        conn.close()
        return True

    async def list_lectures(self) -> List[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("lectures").select("*").order("created_at", desc=True).execute()
                lectures = res.data or []
                # Fetch segment counts
                for lec in lectures:
                    seg_res = self.supabase_client.table("transcript_segments").select("id", count="exact").eq("lecture_id", lec["id"]).execute()
                    lec["segment_count"] = seg_res.count if seg_res.count is not None else 0
                return lectures
            except Exception as e:
                logger.error(f"Supabase list_lectures error: {e}")

        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT l.*, COUNT(s.id) as segment_count
            FROM lectures l
            LEFT JOIN transcript_segments s ON l.id = s.lecture_id
            GROUP BY l.id
            ORDER BY l.created_at DESC
        """)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    async def get_lecture(self, lecture_id: str) -> Optional[Dict[str, Any]]:
        if self.use_supabase and self.supabase_client:
            try:
                res = self.supabase_client.table("lectures").select("*").eq("id", lecture_id).execute()
                if res.data:
                    lec = res.data[0]
                    seg_res = self.supabase_client.table("transcript_segments").select("*").eq("lecture_id", lecture_id).order("sequence_order").execute()
                    lec["segments"] = seg_res.data or []
                    lec["segment_count"] = len(lec["segments"])
                    return lec
            except Exception as e:
                logger.error(f"Supabase get_lecture error: {e}")

        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lectures WHERE id = ?", (lecture_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        lec = dict(row)
        cursor.execute("SELECT * FROM transcript_segments WHERE lecture_id = ? ORDER BY sequence_order ASC", (lecture_id,))
        lec["segments"] = [dict(s) for s in cursor.fetchall()]
        lec["segment_count"] = len(lec["segments"])
        conn.close()
        return lec

    # ------------------ SEGMENTS & EMBEDDINGS ------------------

    async def save_transcript_segments(
        self,
        lecture_id: str,
        segments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        records = []
        for idx, seg in enumerate(segments):
            seg_id = seg.get("id") or str(uuid.uuid4())
            records.append({
                "id": seg_id,
                "lecture_id": lecture_id,
                "start_time": float(seg["start_time"]),
                "end_time": float(seg["end_time"]),
                "transcript": seg["transcript"].strip(),
                "speaker": seg.get("speaker") or "Teacher",
                "sequence_order": idx
            })

        if self.use_supabase and self.supabase_client:
            try:
                self.supabase_client.table("transcript_segments").insert(records).execute()
                return records
            except Exception as e:
                logger.error(f"Supabase save_transcript_segments error: {e}")

        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.executemany("""
            INSERT OR REPLACE INTO transcript_segments 
            (id, lecture_id, start_time, end_time, transcript, speaker, sequence_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            (r["id"], r["lecture_id"], r["start_time"], r["end_time"], r["transcript"], r["speaker"], r["sequence_order"])
            for r in records
        ])
        conn.commit()
        conn.close()
        return records

    async def save_embeddings(self, embeddings_data: List[Dict[str, Any]]):
        """Store segment embeddings (JSON format for SQLite / vector for pgvector)."""
        now = datetime.now(timezone.utc).isoformat()
        records = []
        for item in embeddings_data:
            records.append({
                "id": str(uuid.uuid4()),
                "segment_id": item["segment_id"],
                "lecture_id": item["lecture_id"],
                "embedding_json": json.dumps(item["embedding"]),
                "created_at": now
            })

        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.executemany("""
            INSERT INTO lecture_embeddings (id, segment_id, lecture_id, embedding_json, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, [(r["id"], r["segment_id"], r["lecture_id"], r["embedding_json"], r["created_at"]) for r in records])
        conn.commit()
        conn.close()

    async def get_all_segments(self, lecture_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch all segments across specified lecture or all completed lectures."""
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()

        if lecture_id:
            cursor.execute("""
                SELECT s.*, l.title as lecture_title, l.audio_url
                FROM transcript_segments s
                JOIN lectures l ON s.lecture_id = l.id
                WHERE s.lecture_id = ?
                ORDER BY s.sequence_order ASC
            """, (lecture_id,))
        else:
            cursor.execute("""
                SELECT s.*, l.title as lecture_title, l.audio_url
                FROM transcript_segments s
                JOIN lectures l ON s.lecture_id = l.id
                WHERE l.status = 'COMPLETED'
                ORDER BY l.created_at DESC, s.sequence_order ASC
            """)

        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    # ------------------ PROCESSING JOBS ------------------

    async def create_or_update_job(self, job_id: str, lecture_id: str, status: str, message: str, progress: int = 0):
        now = datetime.now(timezone.utc).isoformat()
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO processing_jobs (job_id, lecture_id, status, message, progress_percentage, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                status = excluded.status,
                message = excluded.message,
                progress_percentage = excluded.progress_percentage,
                updated_at = excluded.updated_at
        """, (job_id, lecture_id, status, message, progress, now, now))
        conn.commit()
        conn.close()

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM processing_jobs WHERE job_id = ?", (job_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None


db = DatabaseAdapter()

