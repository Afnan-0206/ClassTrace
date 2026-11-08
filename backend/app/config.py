"""
ClassTrace Configuration Module
Manages environment variables, API endpoints, storage paths, and service configurations.
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
AUDIO_STORAGE_DIR = STORAGE_DIR / "audio"
DEMO_DATA_DIR = BASE_DIR / "demo_data"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
DEMO_DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "ClassTrace"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Gnani AI Model Suite Configuration
    # Official Gnani base endpoint: https://api.vachana.ai
    GNANI_API_KEY: str = ""
    GNANI_BASE_URL: str = "https://api.vachana.ai"
    GNANI_STT_MODEL: str = "prisma-v2.5"        # Speech-to-Text: 14M+ hrs, <200ms latency
    GNANI_TTS_MODEL: str = "timbre-v2.5"        # Text-to-Speech: 10+ Indic languages, lakh/crore cadence
    GNANI_REASONING_MODEL: str = "evon-v3.3"    # Reasoning: 30B MoE, 128K context, 11 Indic languages
    GNANI_LANGUAGE_CODE: str = "indic-auto"
    GNANI_TIMEOUT_SECONDS: int = 60

    # Hugging Face & Open-Weight Inference (Evon v3.3)
    HUGGINGFACE_API_KEY: str = ""
    EVON_HUGGINGFACE_REPO: str = "gnani-ai/evon-v3.3"

    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Audio Processing & Storage
    AUDIO_STORAGE_PATH: str = str(AUDIO_STORAGE_DIR)
    MAX_UPLOAD_SIZE_MB: int = 150
    ALLOWED_AUDIO_EXTENSIONS: List[str] = [".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac", ".webm"]

    # Hybrid Search Settings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    SEMANTIC_WEIGHT: float = 0.65
    BM25_WEIGHT: float = 0.35
    MIN_CONFIDENCE_THRESHOLD: float = 0.28  # Strict evidence floor - if below, return no-result state

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def is_gnani_configured(self) -> bool:
        """Check whether valid Gnani credentials are provided."""
        return bool(self.GNANI_API_KEY and self.GNANI_API_KEY.strip() and self.GNANI_API_KEY != "your_gnani_api_key_here")

    @property
    def is_supabase_configured(self) -> bool:
        """Check whether valid Supabase credentials are provided."""
        return bool(
            self.SUPABASE_URL 
            and self.SUPABASE_URL.startswith("http")
            and (self.SUPABASE_ANON_KEY or self.SUPABASE_SERVICE_ROLE_KEY)
            and "your-project" not in self.SUPABASE_URL
        )


settings = Settings()

