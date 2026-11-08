-- =============================================================================
-- ClassTrace Supabase PostgreSQL Database Schema
-- Provides tables, relationships, indexes, pgvector embeddings, and RLS policies.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. LECTURES TABLE
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    duration_seconds NUMERIC(10, 2) DEFAULT 0.0,
    file_size_bytes BIGINT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    language_detected TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TRANSCRIPT SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.transcript_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    start_time NUMERIC(10, 2) NOT NULL,
    end_time NUMERIC(10, 2) NOT NULL,
    transcript TEXT NOT NULL,
    speaker TEXT DEFAULT 'Teacher',
    sequence_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. LECTURE EMBEDDINGS (pgvector for semantic search)
CREATE TABLE IF NOT EXISTS public.lecture_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id UUID NOT NULL REFERENCES public.transcript_segments(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL, -- 384 dimensions for all-MiniLM / BGE multilingual
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROCESSING JOBS TABLE
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    job_id TEXT PRIMARY KEY,
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('CREATED', 'STARTING', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    message TEXT,
    progress_percentage INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_lectures_status ON public.lectures(status);
CREATE INDEX IF NOT EXISTS idx_segments_lecture_id ON public.transcript_segments(lecture_id);
CREATE INDEX IF NOT EXISTS idx_segments_start_time ON public.transcript_segments(lecture_id, start_time);
CREATE INDEX IF NOT EXISTS idx_jobs_lecture_id ON public.processing_jobs(lecture_id);

-- HNSW Vector Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON public.lecture_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- VECTOR SIMILARITY SEARCH STORED PROCEDURE
-- =============================================================================
CREATE OR REPLACE FUNCTION match_transcript_segments (
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_lecture_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    lecture_id UUID,
    start_time NUMERIC,
    end_time NUMERIC,
    transcript TEXT,
    speaker TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.lecture_id,
        s.start_time,
        s.end_time,
        s.transcript,
        s.speaker,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.lecture_embeddings e
    JOIN public.transcript_segments s ON e.segment_id = s.id
    WHERE 
        (filter_lecture_id IS NULL OR s.lecture_id = filter_lecture_id)
        AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to lectures and segments
CREATE POLICY "Allow public read access to lectures" 
    ON public.lectures FOR SELECT USING (true);

CREATE POLICY "Allow public read access to segments" 
    ON public.transcript_segments FOR SELECT USING (true);

CREATE POLICY "Allow public read access to embeddings" 
    ON public.lecture_embeddings FOR SELECT USING (true);

CREATE POLICY "Allow public read access to processing jobs" 
    ON public.processing_jobs FOR SELECT USING (true);

-- Backend Service Role has full write access via service_role key

