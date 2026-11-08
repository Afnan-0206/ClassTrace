"""
Pydantic schemas and data models for ClassTrace.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptSegmentBase(BaseModel):
    start_time: float = Field(..., description="Start timestamp in seconds")
    end_time: float = Field(..., description="End timestamp in seconds")
    transcript: str = Field(..., description="Original transcript text")
    speaker: Optional[str] = Field(None, description="Speaker identification label")
    words: Optional[List[dict]] = Field(None, description="Word-level timestamps for synchronized karaoke highlighting")


class TranscriptSegmentCreate(TranscriptSegmentBase):
    sequence_order: int = 0


class TranscriptSegmentSchema(TranscriptSegmentBase):
    id: str
    lecture_id: str
    sequence_order: int

    class Config:
        from_attributes = True


class LectureBase(BaseModel):
    title: str
    filename: str
    duration_seconds: float = 0.0
    file_size_bytes: int = 0


class LectureCreate(LectureBase):
    audio_path: str


class LectureResponse(LectureBase):
    id: str
    audio_url: str
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    language_detected: Optional[str] = None
    error_message: Optional[str] = None
    segment_count: int = 0
    created_at: str
    updated_at: str
    peaks: Optional[List[float]] = Field(None, description="Normalized real audio amplitude peaks (0.0 to 1.0) for waveform rendering")
    chapters: Optional[List[dict]] = Field(None, description="Thematic lecture chapters with timestamp boundaries and labels")

    class Config:
        from_attributes = True


class LectureDetailResponse(LectureResponse):
    segments: List[TranscriptSegmentSchema] = []


class TextSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Spoken or typed student question")
    lecture_id: Optional[str] = Field(None, description="Specific lecture ID to query, or None for all")
    limit: int = Field(3, ge=1, le=10, description="Maximum number of matches to return (default 3)")
    context_timestamp: Optional[float] = Field(None, description="Timestamp anchor for follow-up conversational questioning")
    follow_up: Optional[bool] = Field(False, description="Whether this query is a follow-up to the preceding retrieved moment")
    language_code: Optional[str] = Field("indic-auto", description="Indic language hint (e.g. hi-IN, ta-IN, te-IN, bn-IN) or indic-auto")


class SearchResultSegment(TranscriptSegmentBase):
    id: str
    lecture_id: str
    lecture_title: str
    score: float = Field(..., description="Combined hybrid relevance score (0.0 - 1.0)")
    semantic_score: float = Field(..., description="Dense vector semantic similarity")
    keyword_score: float = Field(..., description="BM25 keyword relevance score")
    audio_url: str = Field(..., description="URL to the original full recording")
    snippet_audio_url: Optional[str] = Field(None, description="Pre-sliced segment audio URL if available")
    context_before: Optional[str] = Field(None, description="Preceding sentence context for complete understanding")
    context_after: Optional[str] = Field(None, description="Subsequent sentence context for complete understanding")


class SearchResponse(BaseModel):
    success: bool
    query: str
    has_sufficient_evidence: bool = True
    total_matches: int = 0
    results: List[SearchResultSegment] = []
    message: Optional[str] = None


class VoiceSearchResponse(BaseModel):
    success: bool
    recognized_text: str
    detected_language: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    search_response: SearchResponse


class ProcessingJobResponse(BaseModel):
    job_id: str
    lecture_id: str
    status: str  # CREATED, STARTING, QUEUED, IN_PROGRESS, COMPLETED, FAILED
    message: str
    progress_percentage: int = 0


class ConfigStatusResponse(BaseModel):
    gnani_configured: bool
    gnani_model: str
    supabase_configured: bool
    active_database: str
    message: Optional[str] = None


class BenchmarkQuestion(BaseModel):
    id: str
    question: str
    expected_timestamp_start: float
    expected_timestamp_end: float
    topic: str
    description: str


class BenchmarkEvaluationItem(BaseModel):
    question_id: str
    question: str
    topic: str
    expected_start: float
    expected_end: float
    retrieved_start: Optional[float] = None
    retrieved_end: Optional[float] = None
    retrieved_text: Optional[str] = None
    hit_at_1: bool = False
    hit_at_3: bool = False
    timestamp_iou: float = 0.0
    score: float = 0.0


class BenchmarkReport(BaseModel):
    total_questions: int
    hit_at_1_count: int
    hit_at_1_rate: float
    hit_at_3_count: int
    hit_at_3_rate: float
    average_timestamp_iou: float
    results: List[BenchmarkEvaluationItem]


class TimbreTTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize with Timbre v2.5")
    language_code: Optional[str] = Field("hi", description="ISO language code (hi, ta, te, kn, mr, bn, en)")
    voice_gender: Optional[str] = Field("female", description="female or male voice")
    speed: Optional[float] = Field(1.0, description="Playback speed modifier (0.8 to 1.4)")


class EvonReasoningRequest(BaseModel):
    query: str = Field(..., description="Student doubt or concept question")
    lecture_id: Optional[str] = Field(None, description="Target lecture ID")
    passages: Optional[List[dict]] = Field(None, description="Optional custom context passages")
    language_code: Optional[str] = Field("indic-auto", description="Code-mixed query language")


